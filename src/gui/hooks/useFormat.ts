import { useMemo } from "react";
import {
  formatBytes,
  formatBytesPerSec,
  formatCount,
  formatEtaShort,
  formatRelativeMs,
} from "../../util/format";
import { useLocale } from "../i18n/LocaleProvider";

export function useFormat() {
  const { locale } = useLocale();
  return useMemo(
    () => ({
      bytes: (n?: number) => formatBytes(n, locale),
      bytesPerSec: (n?: number) => formatBytesPerSec(n, locale),
      relativeMs: (ts?: number) => formatRelativeMs(ts, locale),
      eta: (s?: number) => formatEtaShort(s, locale),
      count: formatCount,
    }),
    [locale],
  );
}
