import { useState } from "react";
import { TorrentProvider } from "./hooks/useTorrents";
import { Shell } from "./components/Shell";
import { SplashView } from "./views/SplashView";
import { markSplashSeen, shouldSkipSplash } from "./util/splash";

export type Section = "all" | "games" | "movies" | "tv" | "anime" | "downloads" | "seeding";

export function App() {
  const [showSplash, setShowSplash] = useState(() => !shouldSkipSplash());
  const [initialQuery, setInitialQuery] = useState("");

  const enterApp = (query: string): void => {
    markSplashSeen();
    setInitialQuery(query);
    setShowSplash(false);
  };

  if (showSplash) {
    return (
      <SplashView
        onBrowse={() => enterApp("")}
        onSearch={(q: string) => enterApp(q)}
      />
    );
  }

  return (
    <TorrentProvider>
      <Shell initialQuery={initialQuery} initialSection="all" />
    </TorrentProvider>
  );
}
