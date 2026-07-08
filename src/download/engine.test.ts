import { describe, it, expect } from "vitest";
import { TorrentEngine } from "./engine";

describe("TorrentEngine stub", () => {
  it("reports desktop-only on add", () => {
    let err: string | undefined;
    const engine = new TorrentEngine();
    engine.add(
      "test-id",
      "magnet:?xt=urn:btih:0000000000000000000000000000000000000000",
      "/downloads",
      { onError: (m) => { err = m; } },
    );
    expect(err).toMatch(/desktop/i);
  });

  it("returns null stats and port", () => {
    const engine = new TorrentEngine();
    expect(engine.listenPort()).toBeNull();
    expect(engine.stats("id")).toBeNull();
    engine.remove("id");
    engine.destroy();
  });
});
