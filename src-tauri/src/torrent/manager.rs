use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use anyhow::Context;
use librqbit::api::{Api, ApiTorrentListOpts, TorrentIdOrHash};
use librqbit::{AddTorrent, AddTorrentOptions, Session, SessionOptions};
use tauri::{AppHandle, Emitter};
use tokio::sync::Mutex;
use tracing::warn;

use crate::config::{ensure_dirs, load_config, save_config, AppConfig, Paths};
use crate::persistence::{
    load_history, load_queue, load_seeds, save_history, save_queue, save_seeds, save_torrent_meta,
    torrent_meta_path, DownloadStatus, HistoryItem, PieceMap, QueueItem, SeedItem, SeedRecord,
    SeedStatus,
};

const HISTORY_MAX: usize = 500;
const POLL_MS: u64 = 500;

#[derive(Clone, serde::Serialize)]
pub struct TorrentListResponse {
    pub downloads: Vec<QueueItem>,
    pub seeds: Vec<SeedItem>,
    pub history: Vec<HistoryItem>,
}

pub struct TorrentManager {
    paths: Paths,
    config: AppConfig,
    api: Api,
    queue: Vec<QueueItem>,
    seeds: HashMap<String, SeedItem>,
    history: Vec<HistoryItem>,
    search_port: u16,
}

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

fn torrent_id(id: &str) -> anyhow::Result<TorrentIdOrHash> {
    TorrentIdOrHash::parse(&norm_hash(id))
}

fn norm_hash(id: &str) -> String {
    id.trim().to_ascii_lowercase()
}

fn mbps_to_bytes(mbps: f64) -> u64 {
    (mbps * 1024.0 * 1024.0) as u64
}

fn parse_bitfield_dump(s: &str) -> Option<Vec<bool>> {
    if !s.contains("true") && !s.contains("false") {
        return None;
    }
    let mut out = Vec::new();
    for token in s.split(|c: char| c == ',' || c == '[' || c == ']' || c.is_whitespace()) {
        match token.trim() {
            "true" => out.push(true),
            "false" => out.push(false),
            _ => {}
        }
    }
    if out.is_empty() {
        None
    } else {
        Some(out)
    }
}

fn build_piece_map(api: &Api, hash: &str, downloading: bool) -> Option<PieceMap> {
    let id = torrent_id(hash).ok()?;
    let dump = api.api_dump_haves(id).ok()?;
    let have = parse_bitfield_dump(&dump)?;
    let total = have.len();
    if total == 0 {
        return None;
    }
    const MAX_BUCKETS: usize = 96;
    let buckets = total.min(MAX_BUCKETS);
    let mut states = Vec::with_capacity(buckets);
    let mut first_gap: Option<usize> = None;
    for b in 0..buckets {
        let start = (b * total) / buckets;
        let end = ((b + 1) * total) / buckets;
        let len = end.saturating_sub(start).max(1);
        let have_count = have[start..end].iter().filter(|&&h| h).count();
        let st = if have_count >= len {
            2u8
        } else if have_count > 0 {
            3u8
        } else {
            0u8
        };
        if st != 2 && first_gap.is_none() {
            first_gap = Some(b);
        }
        states.push(st);
    }
    if downloading {
        if let Some(b) = first_gap {
            states[b] = 1;
        }
    }
    Some(PieceMap {
        total: total as u32,
        states,
    })
}

impl TorrentManager {
    pub async fn boot(app: AppHandle, search_port: u16) -> anyhow::Result<Arc<Mutex<Self>>> {
        let paths = crate::config::resolve_paths();
        ensure_dirs(&paths)?;
        let config = load_config(&paths);

        let session = Session::new_with_opts(
            PathBuf::from(&config.download_dir),
            SessionOptions {
                fastresume: true,
                ..Default::default()
            },
        )
        .await
        .context("librqbit session init")?;

        let api = Api::new(session, None);

        let queue = load_queue(&paths);
        let seed_records = load_seeds(&paths);
        let history = load_history(&paths);

        let mut seeds = HashMap::new();
        for rec in &seed_records {
            if let Some(item) = queue.iter().find(|q| q.id == rec.id) {
                seeds.insert(
                    rec.id.clone(),
                    SeedItem {
                        id: item.id.clone(),
                        name: item.name.clone(),
                        source: item.source.clone(),
                        magnet: item.magnet.clone(),
                        dir: item.dir.clone(),
                        size_bytes: item.total_bytes,
                        status: if rec.status == "paused" {
                            SeedStatus::Paused
                        } else {
                            SeedStatus::Seeding
                        },
                        upload_speed: 0,
                        uploaded: 0,
                        peers: 0,
                    },
                );
            }
        }

        // Also restore seeds from history entries not in queue
        for rec in &seed_records {
            if seeds.contains_key(&rec.id) {
                continue;
            }
            if let Some(h) = history.iter().find(|h| h.id == rec.id) {
                seeds.insert(
                    rec.id.clone(),
                    SeedItem {
                        id: h.id.clone(),
                        name: h.name.clone(),
                        source: h.source.clone(),
                        magnet: h.magnet.clone(),
                        dir: h.dir.clone(),
                        size_bytes: h.size_bytes,
                        status: if rec.status == "paused" {
                            SeedStatus::Paused
                        } else {
                            SeedStatus::Seeding
                        },
                        upload_speed: 0,
                        uploaded: 0,
                        peers: 0,
                    },
                );
            }
        }

        let mut mgr = Self {
            paths,
            config,
            api,
            queue,
            seeds,
            history,
            search_port,
        };

        mgr.restore_active().await?;

        let shared = Arc::new(Mutex::new(mgr));
        let poll_ref = shared.clone();
        let handle = app.clone();
        tauri::async_runtime::spawn(async move {
            loop {
                tokio::time::sleep(Duration::from_millis(POLL_MS)).await;
                let list = {
                    let mut g = poll_ref.lock().await;
                    if let Err(e) = g.tick() {
                        warn!("tick error: {e:#}");
                    }
                    g.list()
                };
                let _ = handle.emit("torrent-progress", list);
            }
        });

        Ok(shared)
    }

    async fn restore_active(&mut self) -> anyhow::Result<()> {
        let items: Vec<QueueItem> = self.queue.clone();
        for item in items {
            if item.status == DownloadStatus::Downloading {
                self.start_torrent(&item.id, &item.magnet, &item.dir).await?;
            }
        }
        let seeds: Vec<SeedItem> = self.seeds.values().cloned().collect();
        for seed in seeds {
            if seed.status == SeedStatus::Seeding {
                let source = self.torrent_source(&seed.id, &seed.magnet);
                self.start_torrent(&seed.id, &source, &seed.dir).await?;
            }
        }
        Ok(())
    }

    fn torrent_source(&self, id: &str, magnet: &str) -> String {
        let meta = torrent_meta_path(&self.paths, id);
        if meta.exists() {
            meta.to_string_lossy().into_owned()
        } else {
            magnet.to_string()
        }
    }

    async fn start_torrent(&self, _id: &str, source: &str, dir: &str) -> anyhow::Result<()> {
        let mut opts = AddTorrentOptions::default();
        opts.output_folder = Some(dir.to_string());
        // Required for resume / re-add when files already exist on disk.
        opts.overwrite = true;
        if !self.config.trackers.is_empty() {
            opts.trackers = Some(self.config.trackers.clone());
        }
        self.api
            .api_add_torrent(AddTorrent::from_url(source), Some(opts))
            .await
            .map_err(|e| anyhow::anyhow!("{e}"))?;
        Ok(())
    }

    fn mark_queue_failed(&mut self, id: &str, err: impl std::fmt::Display) {
        if let Some(q) = self
            .queue
            .iter_mut()
            .find(|q| norm_hash(&q.id) == norm_hash(id))
        {
            q.status = DownloadStatus::Failed;
            q.error = Some(err.to_string());
        }
    }

    async fn start_queue_torrent(
        &mut self,
        id: &str,
        source: &str,
        dir: &str,
    ) -> anyhow::Result<()> {
        if let Err(e) = self.start_torrent(id, source, dir).await {
            self.mark_queue_failed(id, &e);
            self.persist_queue()?;
            return Err(e);
        }
        Ok(())
    }

    async fn forget_torrent(&self, id: &str) {
        if let Some(tid) = self.resolve_torrent(id) {
            let _ = self.api.api_torrent_action_forget(tid).await;
        }
    }

    fn remove_torrent_meta(&self, id: &str) {
        let meta = torrent_meta_path(&self.paths, id);
        if meta.exists() {
            let _ = std::fs::remove_file(meta);
        }
    }

    fn cache_torrent_meta_if_ready(&self, id: &str) {
        let meta = torrent_meta_path(&self.paths, id);
        if meta.exists() {
            return;
        }
        let Ok(tid) = torrent_id(id) else {
            return;
        };
        let Ok(handle) = self.api.mgr_handle(tid) else {
            return;
        };
        let Ok(bytes) = handle.with_metadata(|m| m.torrent_bytes.clone()) else {
            return;
        };
        let _ = save_torrent_meta(&self.paths, id, bytes.as_ref());
    }

    pub fn get_config(&self) -> AppConfig {
        self.config.clone()
    }

    pub fn set_config(&mut self, config: AppConfig) -> anyhow::Result<()> {
        self.config = config.clone();
        save_config(&self.paths, &config)?;
        Ok(())
    }

    pub fn search_port(&self) -> u16 {
        self.search_port
    }

    pub async fn add(
        &mut self,
        id: String,
        name: String,
        magnet: String,
        dir: String,
        source: Option<String>,
        size_bytes: Option<u64>,
    ) -> anyhow::Result<()> {
        let id = norm_hash(&id);
        std::fs::create_dir_all(&dir).ok();

        if self.seeds.remove(&id).is_some() {
            if let Ok(tid) = torrent_id(&id) {
                let _ = self.api.api_torrent_action_forget(tid).await;
            }
            self.persist_seeds()?;
        }

        if let Some(existing) = self.queue.iter().find(|q| q.id == id) {
            if existing.status != DownloadStatus::Failed {
                return Ok(());
            }
        }

        let item = QueueItem {
            id: id.clone(),
            name,
            source,
            magnet: magnet.clone(),
            dir: dir.clone(),
            status: DownloadStatus::Downloading,
            progress: 0,
            total_bytes: size_bytes.unwrap_or(0),
            downloaded_bytes: 0,
            speed: 0,
            peers: 0,
            eta: None,
            files: None,
            error: None,
            piece_map: None,
            added_at: now_ms(),
        };

        self.queue.retain(|q| q.id != id);
        self.queue.push(item);

        if let Err(e) = self.start_queue_torrent(&id, &magnet, &dir).await {
            return Err(e);
        }
        self.persist_queue()?;
        Ok(())
    }

    /// Remove from librqbit but keep queue entry and files on disk.
    pub async fn pause(&mut self, id: &str) -> anyhow::Result<()> {
        let id = norm_hash(id);

        let is_downloading = self
            .queue
            .iter()
            .any(|q| norm_hash(&q.id) == id && q.status == DownloadStatus::Downloading);
        if is_downloading {
            if let Some(tid) = self.resolve_torrent(&id) {
                self.api.api_torrent_action_forget(tid).await?;
            }
            if let Some(q) = self.queue.iter_mut().find(|q| norm_hash(&q.id) == id) {
                q.status = DownloadStatus::Paused;
                q.speed = 0;
                q.peers = 0;
                q.eta = None;
            }
            self.persist_queue()?;
            return Ok(());
        }

        let is_seeding = self
            .seeds
            .get(&id)
            .is_some_and(|s| s.status == SeedStatus::Seeding);
        if is_seeding {
            if let Some(tid) = self.resolve_torrent(&id) {
                self.api.api_torrent_action_forget(tid).await?;
            }
            if let Some(s) = self.seeds.get_mut(&id) {
                s.status = SeedStatus::Paused;
            }
            self.persist_seeds()?;
        }
        Ok(())
    }

    /// Re-add torrent to librqbit after pause.
    pub async fn resume(&mut self, id: &str) -> anyhow::Result<()> {
        let id = norm_hash(id);

        let paused_dl = self
            .queue
            .iter()
            .find(|q| norm_hash(&q.id) == id && q.status == DownloadStatus::Paused)
            .cloned();
        if let Some(item) = paused_dl {
            let source = self.torrent_source(&id, &item.magnet);
            self.start_torrent(&id, &source, &item.dir).await?;
            if let Some(q) = self.queue.iter_mut().find(|q| norm_hash(&q.id) == id) {
                q.status = DownloadStatus::Downloading;
            }
            self.persist_queue()?;
            return Ok(());
        }

        let paused_seed = self
            .seeds
            .get(&id)
            .filter(|s| s.status == SeedStatus::Paused)
            .cloned();
        if let Some(s) = paused_seed {
            let source = self.torrent_source(&id, &s.magnet);
            self.start_torrent(&id, &source, &s.dir).await?;
            if let Some(s) = self.seeds.get_mut(&id) {
                s.status = SeedStatus::Seeding;
            }
            self.persist_seeds()?;
        }
        Ok(())
    }

    pub async fn remove(&mut self, id: &str, delete_files: bool) -> anyhow::Result<()> {
        let id = norm_hash(id);
        self.queue.retain(|q| norm_hash(&q.id) != id);
        self.seeds.remove(&id);
        if let Some(tid) = self.resolve_torrent(&id) {
            if delete_files {
                let _ = self.api.api_torrent_action_delete(tid).await;
            } else {
                let _ = self.api.api_torrent_action_forget(tid).await;
            }
        }
        self.persist_queue()?;
        self.persist_seeds()?;
        Ok(())
    }

    pub async fn retry(&mut self, id: &str) -> anyhow::Result<()> {
        let id = norm_hash(id);
        let item = self
            .queue
            .iter()
            .find(|q| norm_hash(&q.id) == id && q.status == DownloadStatus::Failed)
            .cloned();
        let Some(item) = item else {
            return Ok(());
        };
        if let Some(q) = self.queue.iter_mut().find(|q| norm_hash(&q.id) == id) {
            q.status = DownloadStatus::Downloading;
            q.error = None;
            q.speed = 0;
            q.peers = 0;
            q.eta = None;
        }
        let source = self.torrent_source(&id, &item.magnet);
        if let Err(e) = self.start_queue_torrent(&id, &source, &item.dir).await {
            return Err(e);
        }
        self.persist_queue()?;
        Ok(())
    }

    pub async fn remove_history(&mut self, id: &str) -> anyhow::Result<()> {
        let id = norm_hash(id);
        self.history.retain(|h| norm_hash(&h.id) != id);
        if self.seeds.remove(&id).is_some() {
            self.forget_torrent(&id).await;
            self.persist_seeds()?;
        }
        self.remove_torrent_meta(&id);
        save_history(&self.paths, &self.history)?;
        Ok(())
    }

    pub async fn clear_history(&mut self) -> anyhow::Result<()> {
        for h in &self.history {
            let id = norm_hash(&h.id);
            self.forget_torrent(&id).await;
            self.remove_torrent_meta(&id);
        }
        self.history.clear();
        self.seeds.clear();
        save_history(&self.paths, &self.history)?;
        self.persist_seeds()?;
        Ok(())
    }

    pub fn list(&self) -> TorrentListResponse {
        TorrentListResponse {
            downloads: self.queue.clone(),
            seeds: self.seeds.values().cloned().collect(),
            history: self.history.clone(),
        }
    }

    pub fn tick(&mut self) -> anyhow::Result<()> {
        let list = self
            .api
            .api_torrent_list_ext(ApiTorrentListOpts { with_stats: true });

        let mut finished: Vec<String> = Vec::new();

        for torrent in list.torrents {
            let hash = torrent.info_hash;
            if hash.is_empty() {
                continue;
            }

            let Some(stats) = torrent.stats.as_ref() else {
                continue;
            };

            self.cache_torrent_meta_if_ready(&hash);

            let progress_pct = if stats.total_bytes > 0 {
                ((stats.progress_bytes as f64 / stats.total_bytes as f64) * 100.0).round() as u32
            } else {
                0
            };

            let (down_speed, up_speed, peers, eta) = if let Some(live) = &stats.live {
                let down = mbps_to_bytes(live.download_speed.mbps);
                let eta_secs = if down > 0 && stats.total_bytes > stats.progress_bytes {
                    Some((stats.total_bytes - stats.progress_bytes) as f64 / down as f64)
                } else {
                    None
                };
                (
                    down,
                    mbps_to_bytes(live.upload_speed.mbps),
                    live.snapshot.peer_stats.live as u32,
                    eta_secs,
                )
            } else {
                (0, 0, 0, None)
            };

            if let Some(q) = self
                .queue
                .iter_mut()
                .find(|q| norm_hash(&q.id) == norm_hash(&hash))
            {
                q.progress = progress_pct.min(100);
                q.downloaded_bytes = stats.progress_bytes;
                q.total_bytes = stats.total_bytes;
                q.speed = down_speed;
                q.peers = peers;
                q.eta = eta;
                if q.status == DownloadStatus::Downloading {
                    q.piece_map = build_piece_map(&self.api, &hash, down_speed > 0);
                } else {
                    q.piece_map = None;
                }
                if stats.finished && q.status == DownloadStatus::Downloading {
                    finished.push(hash.clone());
                }
            }

            if let Some(s) = self.seeds.get_mut(&norm_hash(&hash)) {
                s.upload_speed = up_speed;
                s.uploaded = stats.uploaded_bytes;
                s.peers = peers;
            }
        }

        for id in finished {
            self.complete_download(&id);
        }

        self.persist_queue().ok();
        self.persist_seeds().ok();
        Ok(())
    }

    fn complete_download(&mut self, id: &str) {
        let Some(item) = self.queue.iter().find(|q| q.id == id).cloned() else {
            return;
        };

        self.history.insert(
            0,
            HistoryItem {
                id: item.id.clone(),
                name: item.name.clone(),
                source: item.source.clone(),
                magnet: item.magnet.clone(),
                dir: item.dir.clone(),
                size_bytes: item.total_bytes,
                completed_at: now_ms(),
            },
        );
        self.history.truncate(HISTORY_MAX);

        self.queue.retain(|q| q.id != id);
        self.seeds.insert(
            id.to_string(),
            SeedItem {
                id: item.id,
                name: item.name,
                source: item.source,
                magnet: item.magnet,
                dir: item.dir,
                size_bytes: item.total_bytes,
                status: SeedStatus::Seeding,
                upload_speed: 0,
                uploaded: 0,
                peers: 0,
            },
        );

        let _ = save_history(&self.paths, &self.history);
        let _ = self.persist_queue();
        let _ = self.persist_seeds();
    }

    fn resolve_torrent(&self, id: &str) -> Option<TorrentIdOrHash> {
        let want = norm_hash(id);
        let list = self
            .api
            .api_torrent_list_ext(ApiTorrentListOpts { with_stats: false });
        for t in list.torrents {
            if norm_hash(&t.info_hash) == want {
                if let Some(nid) = t.id {
                    return Some(TorrentIdOrHash::from(nid));
                }
                return TorrentIdOrHash::parse(&t.info_hash).ok();
            }
        }
        TorrentIdOrHash::parse(&want).ok()
    }

    fn persist_queue(&self) -> anyhow::Result<()> {
        save_queue(&self.paths, &self.queue)
    }

    fn persist_seeds(&self) -> anyhow::Result<()> {
        let records: Vec<SeedRecord> = self
            .seeds
            .values()
            .map(|s| SeedRecord {
                id: s.id.clone(),
                status: match s.status {
                    SeedStatus::Paused => "paused".into(),
                    _ => "seeding".into(),
                },
            })
            .collect();
        save_seeds(&self.paths, &records)
    }
}
