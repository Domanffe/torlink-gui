import { describe, it, expect } from "vitest";
import { parseCliArgs } from "./args";

describe("parseCliArgs", () => {
  it("defaults to gui with no args", () => {
    expect(parseCliArgs([])).toEqual({ kind: "gui" });
  });
  it("parses version and help flags", () => {
    expect(parseCliArgs(["--version"])).toEqual({ kind: "version" });
    expect(parseCliArgs(["-v"])).toEqual({ kind: "version" });
    expect(parseCliArgs(["--help"])).toEqual({ kind: "help" });
    expect(parseCliArgs(["-h"])).toEqual({ kind: "help" });
  });
  it("parses --search", () => {
    expect(parseCliArgs(["--search"])).toEqual({ kind: "search" });
  });
  it("rejects removed --tui flag", () => {
    expect(parseCliArgs(["--tui"])).toEqual({ kind: "invalid", arg: "--tui" });
  });
  it("launches a magnet in gui mode", () => {
    expect(parseCliArgs(["magnet:?xt=urn:btih:abc"])).toEqual({ kind: "gui" });
  });
  it("launches a .torrent file", () => {
    expect(parseCliArgs(["./Foo.torrent"])).toEqual({ kind: "gui" });
  });
  it("launches a bare infohash as a magnet (DHT)", () => {
    const hash = "abcdef0123456789abcdef0123456789abcdef01";
    expect(parseCliArgs([hash])).toEqual({ kind: "gui" });
  });
  it("rejects unknown arguments", () => {
    expect(parseCliArgs(["--nope"])).toEqual({ kind: "invalid", arg: "--nope" });
  });
  it("rejects a non-hash bareword", () => {
    expect(parseCliArgs(["hello"])).toEqual({ kind: "invalid", arg: "hello" });
  });
});
