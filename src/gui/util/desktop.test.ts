import { afterEach, describe, expect, it, vi } from "vitest";
import { copyText } from "./desktop";

describe("gui desktop helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("copies text through the clipboard API", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    await expect(copyText("magnet:?xt=urn:btih:abc")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("magnet:?xt=urn:btih:abc");
  });

  it("returns false when clipboard write fails", async () => {
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });

    await expect(copyText("magnet:?xt=urn:btih:abc")).resolves.toBe(false);
  });
});
