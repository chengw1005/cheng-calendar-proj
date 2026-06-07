"use client";

import { createContext, useCallback, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { translations, presetActivityNames, type Locale } from "./i18n";

type I18nContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
  tActivity: (name: string) => string;
};

const I18nContext = createContext<I18nContextValue>({
  locale: "en",
  setLocale: () => {},
  t: (key) => key,
  tActivity: (name) => name,
});

let listeners: Array<() => void> = [];

function emitChange() {
  for (const fn of listeners) fn();
}

function subscribe(callback: () => void) {
  listeners = [...listeners, callback];
  return () => {
    listeners = listeners.filter((fn) => fn !== callback);
  };
}

function getSnapshot(): Locale {
  const saved = localStorage.getItem("locale");
  if (saved === "en" || saved === "zh") return saved;
  return "en";
}

function getServerSnapshot(): Locale {
  return "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
    document.title = locale === "zh" ? "日历打卡" : "Calendar Check-in";
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    localStorage.setItem("locale", l);
    emitChange();
  }, []);

  const t = useCallback(
    (key: string): string => translations[locale][key] ?? key,
    [locale]
  );

  const tActivity = useCallback(
    (name: string): string => presetActivityNames[name]?.[locale] ?? name,
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, tActivity }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
