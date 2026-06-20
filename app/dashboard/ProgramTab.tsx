"use client";

import Link from "next/link";
import { useLang } from "@/app/lang";

type ProgramDay = {
  id: number;
  day_number: number;
  day_name: string;
  day_name_en: string | null;
  day_of_week: string;
  duration_text: string;
  goal: string;
  goal_en: string | null;
};

type ProgramExercise = {
  id: number;
  program_day_id: number;
  phase: string;
  exercise_name: string;
  exercise_name_en: string | null;
  muscle_group: string | null;
  sets: number | null;
  reps_min: number | null;
  reps_max: number | null;
  duration_seconds: number | null;
  notes: string | null;
  notes_en: string | null;
  order_index: number;
};

type WorkoutSummary = {
  exercise_name: string;
  sets: number;
  reps: number;
  weight_kg: number;
  date: string;
};

const DAY_ICONS: Record<number, string> = { 1: "💪", 2: "🏃", 3: "🦵", 4: "🚴" };

const DAY_COLORS: Record<number, {
  gradient: string;
  border: string;
  hoverBorder: string;
  glow: string;
  dimGradient: string;
  dimBorder: string;
  bar: string;
}> = {
  1: {
    gradient: "bg-gradient-to-br from-blue-700/40 via-blue-900/50 to-[#13111f]",
    border: "border-blue-600/50",
    hoverBorder: "hover:border-blue-500/70",
    glow: "shadow-[0_0_32px_rgba(59,130,246,0.3)]",
    dimGradient: "bg-gradient-to-br from-blue-900/50 to-[#13111f]",
    dimBorder: "border-blue-800/40",
    bar: "from-blue-500 to-blue-400",
  },
  2: {
    gradient: "bg-gradient-to-br from-emerald-700/40 via-emerald-900/50 to-[#13111f]",
    border: "border-emerald-600/50",
    hoverBorder: "hover:border-emerald-500/70",
    glow: "shadow-[0_0_32px_rgba(16,185,129,0.3)]",
    dimGradient: "bg-gradient-to-br from-emerald-900/50 to-[#13111f]",
    dimBorder: "border-emerald-800/40",
    bar: "from-emerald-500 to-emerald-400",
  },
  3: {
    gradient: "bg-gradient-to-br from-orange-700/40 via-orange-900/50 to-[#13111f]",
    border: "border-orange-600/50",
    hoverBorder: "hover:border-orange-500/70",
    glow: "shadow-[0_0_32px_rgba(249,115,22,0.3)]",
    dimGradient: "bg-gradient-to-br from-orange-900/50 to-[#13111f]",
    dimBorder: "border-orange-800/40",
    bar: "from-orange-500 to-orange-400",
  },
  4: {
    gradient: "bg-gradient-to-br from-violet-700/40 via-violet-900/50 to-[#13111f]",
    border: "border-violet-600/50",
    hoverBorder: "hover:border-violet-500/70",
    glow: "shadow-[0_0_32px_rgba(139,92,246,0.3)]",
    dimGradient: "bg-gradient-to-br from-violet-900/50 to-[#13111f]",
    dimBorder: "border-violet-800/40",
    bar: "from-violet-500 to-violet-400",
  },
};

function findMatch(ar: string, en: string | null, workouts: WorkoutSummary[]) {
  const names = [ar.toLowerCase().trim(), en?.toLowerCase().trim() ?? ""].filter(Boolean);
  return workouts.find(w => {
    const wn = w.exercise_name.toLowerCase().trim();
    return names.some(n => wn === n || wn.includes(n) || n.includes(wn));
  });
}

export function ProgramTab({
  programDays,
  programExercises,
  workouts,
}: {
  programDays: ProgramDay[];
  programExercises: ProgramExercise[];
  workouts: WorkoutSummary[];
}) {
  const { lang, t } = useLang();
  const isEn = lang === "en";
  const todayStr = new Date().toISOString().split("T")[0];
  const todayWorkouts = workouts.filter(w => w.date === todayStr);

  if (programDays.length === 0) {
    return (
      <div className="text-center py-16 text-gray-600">
        <p>{t.loadingProgram}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {programDays.map(day => {
        const c = DAY_COLORS[day.day_number];
        const dayName = isEn ? (day.day_name_en ?? day.day_name) : day.day_name;

        const mainExs = programExercises.filter(
          e => e.program_day_id === day.id && (e.phase === "main" || e.phase === "core")
        );
        const mainCount = mainExs.length;
        const doneCount = mainExs.filter(ex => findMatch(ex.exercise_name, ex.exercise_name_en, todayWorkouts)).length;
        const todayPct = mainCount > 0 ? Math.round((doneCount / mainCount) * 100) : 0;
        const hasProgress = doneCount > 0;

        return (
          <Link
            key={day.id}
            href={`/dashboard/program/${day.id}`}
            className={`relative block text-start p-5 rounded-2xl border transition-all duration-200 active:scale-[0.98] ${
              hasProgress
                ? `${c.gradient} ${c.border} ${c.hoverBorder} ${c.glow}`
                : `${c.dimGradient} ${c.dimBorder} ${c.hoverBorder}`
            }`}
          >
            {todayPct === 100 && (
              <span className="absolute top-2 end-2 text-xs font-bold px-2.5 py-1 rounded-full bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-sm">
                ✓
              </span>
            )}
            <div className="text-3xl mb-3">{DAY_ICONS[day.day_number]}</div>
            <p className="text-xs text-gray-500 mb-0.5">{t.day} {day.day_number}</p>
            <p className="text-sm font-bold text-white leading-tight">{dayName}</p>
            <p className="text-xs text-gray-500 mt-1">{day.duration_text} {t.min}</p>

            {hasProgress && mainCount > 0 && (
              <div className="mt-3">
                <div className="h-1 bg-black/20 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${todayPct === 100 ? "bg-green-400" : `bg-gradient-to-r ${c.bar ?? "from-blue-500 to-blue-400"}`}`}
                    style={{ width: `${todayPct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">{doneCount}/{mainCount} {t.exercises}</p>
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
