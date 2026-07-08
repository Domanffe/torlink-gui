import { useState } from "react";
import { Wordmark } from "../components/Wordmark";
import { useLocale } from "../i18n/LocaleProvider";
import { MagnifierIcon, UiIcon } from "../icons";

export function SplashView({
  onBrowse,
  onSearch,
}: {
  onBrowse: () => void;
  onSearch: (q: string) => void;
}) {
  const { t } = useLocale();
  const [query, setQuery] = useState("");

  const submit = (): void => {
    const q = query.trim();
    if (q) onSearch(q);
    else onBrowse();
  };

  return (
    <div className="splash">
      <Wordmark size="lg" />
      <p className="splash-tagline">{t("splash.tagline")}</p>
      <p className="splash-cats">{t("splash.categories")}</p>

      <div className="splash-search-card">
        <div className="splash-search-inner">
          <span className="splash-search-icon" aria-hidden>
            <UiIcon icon={MagnifierIcon} size={20} />
          </span>
          <input
            className="splash-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder={t("splash.searchPlaceholder")}
            autoFocus
          />
        </div>
      </div>

      <p className="splash-hints">
        <kbd>Enter</kbd> {t("splash.enterToSearch")}
        <span className="dot">·</span>
        {t("splash.emptyEnter")} <kbd>Enter</kbd> {t("splash.enterToBrowse")}
      </p>
    </div>
  );
}
