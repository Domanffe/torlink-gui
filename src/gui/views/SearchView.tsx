import { useEffect, useMemo, useState } from "react";
import type { Section } from "../App";
import { Card } from "../components/Card";
import { getSourceMeta } from "../../sources/meta";
import type { TorrentResult } from "../../sources/types";
import { formatBytes, formatCount, truncate } from "../../util/format";
import { sourceStyle } from "../../ui/theme";
import { CATEGORY_GROUP } from "../sections";
import { useSearch, useSearchPort } from "../hooks/useSearch";
import { useTorrents } from "../hooks/useTorrents";
import { useLocale } from "../i18n/LocaleProvider";
import { MagnifierIcon, UiIcon } from "../icons";

export function SearchView({
  category,
  initialQuery = "",
}: {
  category: Section;
  initialQuery?: string;
}) {
  const { t } = useLocale();
  const [input, setInput] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState<string | null>(initialQuery.trim() || null);
  const [selected, setSelected] = useState<TorrentResult | null>(null);
  const [sortSeeders, setSortSeeders] = useState(true);
  const port = useSearchPort();
  const search = useSearch(activeQuery, port);
  const { addDownload } = useTorrents();

  useEffect(() => {
    if (initialQuery.trim()) setActiveQuery(initialQuery.trim());
  }, [initialQuery]);

  const results = useMemo(() => {
    let list = search.results;
    const group = CATEGORY_GROUP[category];
    if (group) list = list.filter((r) => getSourceMeta(r.source).group === group);
    if (sortSeeders) {
      list = [...list].sort((a, b) => b.seeders - a.seeders);
    }
    return list;
  }, [search.results, category, sortSeeders]);

  const submit = (): void => {
    const q = input.trim();
    if (q) {
      setActiveQuery(q);
      setSelected(null);
    }
  };

  const download = (r: TorrentResult): void => {
    void addDownload({
      id: r.infoHash,
      name: r.name,
      magnet: r.magnet,
      source: r.source,
      sizeBytes: r.sizeBytes,
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        document.getElementById("main-search")?.focus();
      }
      if (e.key === "s" && document.activeElement?.tagName !== "INPUT") {
        setSortSeeders((v) => !v);
      }
      if (e.key === "d" && selected) download(selected);
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  if (selected) {
    const ss = sourceStyle(selected.source);
    return (
      <Card title={t("search.details")}>
        <div className="detail">
          <div className="detail-head">
            <h2>{selected.name}</h2>
            <span className="tag" style={{ color: ss.color }}>
              {ss.tag}
            </span>
          </div>
          <dl className="detail-grid">
            <dt>{t("search.size")}</dt>
            <dd>{formatBytes(selected.sizeBytes)}</dd>
            <dt>{t("search.health")}</dt>
            <dd>
              {t("search.seedersLeechers", {
                seeders: String(selected.seeders),
                leechers: String(selected.leechers),
              })}
            </dd>
            <dt>{t("search.hash")}</dt>
            <dd className="mono">{selected.infoHash}</dd>
          </dl>
          <div className="detail-actions">
            <button type="button" className="btn btn-primary" onClick={() => download(selected)}>
              {t("search.download")}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setSelected(null)}>
              {t("search.back")}
            </button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="search-view">
      <div className="search-bar">
        <span className="search-bar-icon" aria-hidden>
          <UiIcon icon={MagnifierIcon} size={18} />
        </span>
        <input
          id="main-search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={t("search.placeholder")}
        />
      </div>

      <Card
        title={t("search.results")}
        subtitle={
          results.length > 0
            ? t("search.found", { count: results.length })
            : activeQuery
              ? search.loading
                ? t("search.searching", { done: search.done, total: search.total })
                : undefined
              : undefined
        }
      >
        {activeQuery === null && <p className="empty">{t("search.emptyHint")}</p>}
        {search.loading && activeQuery && results.length === 0 && (
          <p className="status">
            {t("search.searching", { done: search.done, total: search.total })}
          </p>
        )}
        {activeQuery && !search.loading && results.length === 0 && (
          <p className="empty">{t("search.noResults")}</p>
        )}
        {results.length > 0 && (
          <table className="results-table">
            <thead>
              <tr>
                <th className="col-idx">#</th>
                <th className="col-name">{t("search.colName")}</th>
                <th className="col-size">{t("search.colSize")}</th>
                <th className="col-health">{t("search.colHealth")}</th>
                <th className="col-src">{t("search.colSrc")}</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => {
                const ss = sourceStyle(r.source);
                return (
                  <tr
                    key={`${r.source}-${r.infoHash}`}
                    className="result-row"
                    onClick={() => setSelected(r)}
                    onDoubleClick={() => download(r)}
                  >
                    <td className="col-idx">{i + 1}</td>
                    <td className="col-name">{truncate(r.name, 56)}</td>
                    <td className="col-size">{formatBytes(r.sizeBytes)}</td>
                    <td className="col-health">
                      <span className={r.seeders > 0 ? "good" : ""}>
                        {formatCount(r.seeders)}:{formatCount(r.leechers)}
                      </span>
                    </td>
                    <td className="col-src">
                      <span style={{ color: ss.color }}>{ss.tag}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
