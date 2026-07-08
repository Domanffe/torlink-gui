use std::path::Path;

use serde::{Deserialize, Serialize};

use crate::config::Paths;
use crate::fs::replace_file;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum DownloadStatus {
    Downloading,
    Paused,
    Completed,
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum SeedStatus {
    Seeding,
    Paused,
    Missing,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PieceMap {
    pub total: u32,
    pub states: Vec<u8>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueueItem {
    pub id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source: Option<String>,
    pub magnet: String,
    pub dir: String,
    pub status: DownloadStatus,
    pub progress: u32,
    #[serde(rename = "totalBytes")]
    pub total_bytes: u64,
    #[serde(rename = "downloadedBytes")]
    pub downloaded_bytes: u64,
    pub speed: u64,
    pub peers: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub eta: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub files: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    #[serde(rename = "pieceMap", skip_serializing_if = "Option::is_none")]
    pub piece_map: Option<PieceMap>,
    #[serde(rename = "addedAt")]
    pub added_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SeedItem {
    pub id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source: Option<String>,
    pub magnet: String,
    pub dir: String,
    #[serde(rename = "sizeBytes")]
    pub size_bytes: u64,
    pub status: SeedStatus,
    #[serde(rename = "uploadSpeed")]
    pub upload_speed: u64,
    pub uploaded: u64,
    pub peers: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SeedRecord {
    pub id: String,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryItem {
    pub id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source: Option<String>,
    pub magnet: String,
    pub dir: String,
    #[serde(rename = "sizeBytes")]
    pub size_bytes: u64,
    #[serde(rename = "completedAt")]
    pub completed_at: u64,
}

fn read_json<T: for<'de> Deserialize<'de>>(path: &Path) -> Vec<T> {
    let raw = match std::fs::read_to_string(path) {
        Ok(s) => s,
        Err(_) => return vec![],
    };
    serde_json::from_str(&raw).unwrap_or_default()
}

fn write_json_atomic<T: Serialize + ?Sized>(path: &Path, value: &T) -> anyhow::Result<()> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    let tmp = path.with_extension("json.tmp");
    std::fs::write(&tmp, serde_json::to_string_pretty(value)?)?;
    replace_file(&tmp, path)?;
    Ok(())
}

pub fn load_queue(paths: &Paths) -> Vec<QueueItem> {
    read_json(&paths.queue_file)
}

pub fn save_queue(paths: &Paths, items: &[QueueItem]) -> anyhow::Result<()> {
    write_json_atomic(&paths.queue_file, items)
}

pub fn load_seeds(paths: &Paths) -> Vec<SeedRecord> {
    read_json(&paths.seeds_file)
}

pub fn save_seeds(paths: &Paths, records: &[SeedRecord]) -> anyhow::Result<()> {
    write_json_atomic(&paths.seeds_file, records)
}

pub fn load_history(paths: &Paths) -> Vec<HistoryItem> {
    read_json(&paths.history_file)
}

pub fn save_history(paths: &Paths, items: &[HistoryItem]) -> anyhow::Result<()> {
    write_json_atomic(&paths.history_file, items)
}

pub fn torrent_meta_path(paths: &Paths, id: &str) -> std::path::PathBuf {
    paths.torrents_dir.join(format!("{id}.torrent"))
}

pub fn save_torrent_meta(paths: &Paths, id: &str, data: &[u8]) -> anyhow::Result<()> {
    let path = torrent_meta_path(paths, id);
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    let tmp = path.with_extension("torrent.tmp");
    std::fs::write(&tmp, data)?;
    replace_file(&tmp, &path)?;
    Ok(())
}
