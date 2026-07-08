import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Messages } from "./en";
import {
  format,
  getMessages,
  readLocalePref,
  resolveLocale,
  writeLocalePref,
  type Locale,
  type LocalePref,
} from "./locale";

type LocaleCtx = {
  locale: Locale;
  localePref: LocalePref;
  setLocalePref: (pref: LocalePref) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  messages: Messages;
};

const Ctx = createContext<LocaleCtx | null>(null);

function makeT(messages: Messages): LocaleCtx["t"] {
  return (key: string, vars?: Record<string, string | number>): string => {
    const parts = key.split(".");
    let node: unknown = messages;
    for (const part of parts) {
      if (node && typeof node === "object" && part in node) {
        node = (node as Record<string, unknown>)[part];
      } else {
        return key;
      }
    }
    const text = typeof node === "string" ? node : key;
    return vars ? format(text, vars) : text;
  };
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [localePref, setLocalePrefState] = useState<LocalePref>(readLocalePref);
  const locale = useMemo(() => resolveLocale(localePref), [localePref]);
  const messages = useMemo(() => getMessages(locale), [locale]);
  const t = useMemo(() => makeT(messages), [messages]);

  const setLocalePref = useCallback((pref: LocalePref) => {
    writeLocalePref(pref);
    setLocalePrefState(pref);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(
    () => ({ locale, localePref, setLocalePref, t, messages }),
    [locale, localePref, setLocalePref, t, messages],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLocale(): LocaleCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLocale requires LocaleProvider");
  return ctx;
}
