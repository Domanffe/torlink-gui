import { describe, it, expect } from "vitest";
import { SOURCE_IDS } from "../sources/meta";
import { startSearchServer } from "./search-server.js";

describe("search sidecar", () => {
  it("serves health and sources", async () => {
    const { port, close } = await startSearchServer(0);
    try {
      const health = await fetch(`http://127.0.0.1:${port}/health`);
      expect(health.ok).toBe(true);
      const sources = await fetch(`http://127.0.0.1:${port}/sources`);
      const body = (await sources.json()) as { sources: unknown[] };
      expect(body.sources.length).toBe(SOURCE_IDS.length);
    } finally {
      close();
    }
  });
});
