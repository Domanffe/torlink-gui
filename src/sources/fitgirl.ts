import { fetchWordpressRss } from "./rss";
import type { SearchOptions, TorrentResult } from "./types";

const HOME = "https://fitgirl-repacks.site";

export async function search(
  query: string,
  opts?: SearchOptions,
): Promise<TorrentResult[]> {
  return fetchWordpressRss(HOME, "fitgirl", query, opts);
}
