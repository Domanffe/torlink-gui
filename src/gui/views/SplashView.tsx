import { useState } from "react";
import { Wordmark } from "../components/Wordmark";

export function SplashView({
  onBrowse,
  onSearch,
}: {
  onBrowse: () => void;
  onSearch: (q: string) => void;
}) {
  const [query, setQuery] = useState("");

  const submit = (): void => {
    const q = query.trim();
    if (q) onSearch(q);
    else onBrowse();
  };

  return (
    <div className="splash">
      <Wordmark size="lg" />
      <p className="splash-tagline">Search curated sources. Download with native speed.</p>
      <p className="splash-cats">games · movies · tv · anime</p>

      <div className="splash-search-card">
        <div className="splash-search-inner">
          <span className="splash-search-icon" aria-hidden>
            ⌕
          </span>
          <input
            className="splash-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Search or paste a magnet link…"
            autoFocus
          />
        </div>
      </div>

      <p className="splash-hints">
        <kbd>Enter</kbd> to search
        <span className="dot">·</span>
        empty <kbd>Enter</kbd> to browse
      </p>
    </div>
  );
}
