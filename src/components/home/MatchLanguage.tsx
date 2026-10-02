"use client";

import { createContext, useContext, useState } from "react";

import type { BroadcastLanguage } from "@/lib/api/types";
import { formatBroadcastLanguage } from "@/lib/utils/format";

interface MatchLanguageValue {
  language: BroadcastLanguage | null;
  setLanguage: (language: BroadcastLanguage) => void;
}

const MatchLanguageContext = createContext<MatchLanguageValue>({
  language: null,
  setLanguage: () => {},
});

// The commentary language picked in the Match center is also shown on the
// hero player, so both read it from here.
export function MatchLanguageProvider({
  initial,
  children,
}: {
  initial: BroadcastLanguage | null;
  children: React.ReactNode;
}) {
  const [language, setLanguage] = useState(initial);
  return (
    <MatchLanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </MatchLanguageContext.Provider>
  );
}

export function useMatchLanguage(): MatchLanguageValue {
  return useContext(MatchLanguageContext);
}

export function MatchLanguageLabel() {
  const { language } = useMatchLanguage();
  return language ? <span>{formatBroadcastLanguage(language)}</span> : null;
}
