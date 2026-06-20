"use client";

import Link from "next/link";
import { useLang } from "@/app/lang";
import { LangToggle } from "@/app/LangToggle";

export function ProgramDayNav() {
  const { t } = useLang();
  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-400 hover:text-white transition text-sm">
            {t.back}
          </Link>
          <span className="text-white font-bold">{t.program}</span>
        </div>
        <LangToggle />
      </div>
    </nav>
  );
}
