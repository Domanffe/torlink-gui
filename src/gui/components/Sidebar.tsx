import type { Section } from "../App";

const FILTERS: { key: Section; label: string; icon: string }[] = [
  { key: "all", label: "All", icon: "◎" },
  { key: "games", label: "Games", icon: "🎮" },
  { key: "movies", label: "Movies", icon: "🎬" },
  { key: "tv", label: "TV", icon: "📺" },
  { key: "anime", label: "Anime", icon: "✦" },
];

const LIBRARY: { key: Section; label: string; icon: string }[] = [
  { key: "downloads", label: "Downloads", icon: "↓" },
  { key: "seeding", label: "Seeding", icon: "↑" },
];

export function Sidebar({
  section,
  onSection,
  downloadCount,
  seedCount,
}: {
  section: Section;
  onSection: (s: Section) => void;
  downloadCount: number;
  seedCount: number;
}) {
  const badge = (key: Section): number | null => {
    if (key === "downloads" && downloadCount > 0) return downloadCount;
    if (key === "seeding" && seedCount > 0) return seedCount;
    return null;
  };

  return (
    <nav className="sidebar" aria-label="Navigation">
      <span className="nav-label">Browse</span>
      <ul className="nav-group">
        {FILTERS.map((item) => (
          <li key={item.key}>
            <button
              type="button"
              className={`nav-item${section === item.key ? " active" : ""}`}
              onClick={() => onSection(item.key)}
            >
              <span className="nav-icon" aria-hidden>
                {item.icon}
              </span>
              {item.label}
            </button>
          </li>
        ))}
      </ul>
      <span className="nav-label">Library</span>
      <ul className="nav-group">
        {LIBRARY.map((item) => {
          const n = badge(item.key);
          return (
            <li key={item.key}>
              <button
                type="button"
                className={`nav-item${section === item.key ? " active" : ""}`}
                onClick={() => onSection(item.key)}
              >
                <span className="nav-icon" aria-hidden>
                  {item.icon}
                </span>
                {item.label}
                {n != null && <span className="nav-badge">{n}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
