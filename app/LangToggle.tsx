"use client";

import { useLang } from "./lang";

export function LangToggle({ className }: { className?: string }) {
  const { t, toggle } = useLang();
  return (
    <button
      onClick={toggle}
      className={`text-sm font-semibold px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition border border-gray-700 ${className ?? ""}`}
    >
      {t.langToggle}
    </button>
  );
}
