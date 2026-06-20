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

const DAY_JS_TO_WEEK: Record<number, string> = {
  6: "Saturday",
  1: "Monday",
  3: "Wednesday",
  5: "Friday",
};

const DAY_ICONS: Record<number, string> = { 1: "💪", 2: "🏃", 3: "🦵", 4: "🚴" };

const DAY_COLORS: Record<number, {
  gradient: string;
  border: string;
  hoverBorder: string;
  glow: string;
  dimGradient: string;
  dimBorder: string;
}> = {
  1: {
    gradient: "bg-gradient-to-br from-blue-950/80 to-gray-900",
    border: "border-blue-800/60",
    hoverBorder: "hover:border-blue-700/80",
    glow: "shadow-[0_0_24px_rgba(59,130,246,0.2)]",
    dimGradient: "bg-gradient-to-br from-blue-950/40 to-gray-900",
    dimBorder: "border-blue-900/40",
  },
  2: {
    gradient: "bg-gradient-to-br from-emerald-950/80 to-gray-900",
    border: "border-emerald-800/60",
    hoverBorder: "hover:border-emerald-700/80",
    glow: "shadow-[0_0_24px_rgba(16,185,129,0.2)]",
    dimGradient: "bg-gradient-to-br from-emerald-950/40 to-gray-900",
    dimBorder: "border-emerald-900/40",
  },
  3: {
    gradient: "bg-gradient-to-br from-orange-950/80 to-gray-900",
    border: "border-orange-800/60",
    hoverBorder: "hover:border-orange-700/80",
    glow: "shadow-[0_0_24px_rgba(249,115,22,0.2)]",
    dimGradient: "bg-gradient-to-br from-orange-950/40 to-gray-900",
    dimBorder: "border-orange-900/40",
  },
  4: {
    gradient: "bg-gradient-to-br from-purple-950/80 to-gray-900",
    border: "border-purple-800/60",
    hoverBorder: "hover:border-purple-700/80",
    glow: "shadow-[0_0_24px_rgba(139,92,246,0.2)]",
    dimGradient: "bg-gradient-to-br from-purple-950/40 to-gray-900",
    dimBorder: "border-purple-900/40",
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
  const todayWeekDay = DAY_JS_TO_WEEK[new Date().getDay()];
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
        const isToday = day.day_of_week === todayWeekDay;
        const c = DAY_COLORS[day.day_number];
        const dayName = isEn ? (day.day_name_en ?? day.day_name) : day.day_name;

        let doneCount = 0, mainCount = 0, todayPct = 0;
        if (isToday) {
          const mainExs = programExercises.filter(
            e => e.program_day_id === day.id && (e.phase === "main" || e.phase === "core")
          );
          mainCount = mainExs.length;
          doneCount = mainExs.filter(ex => findMatch(ex.exercise_name, ex.exercise_name_en, todayWorkouts)).length;
          todayPct = mainCount > 0 ? Math.round((doneCount / mainCount) * 100) : 0;
        }

        return (
          <Link
            key={day.id}
            href={`/dashboard/program/${day.id}`}
            className={`relative block text-start p-5 rounded-2xl border transition-all duration-200 active:scale-[0.98] ${
              isToday
                ? `${c.gradient} ${c.border} ${c.hoverBorder} ${c.glow}`
                : `${c.dimGradient} ${c.dimBorder} ${c.hoverBorder}`
            }`}
          >
            {isToday && (
              <span className="absolute top-2 end-2 text-xs font-bold px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm">
                {t.today}
              </span>
            )}
            <div className="text-3xl mb-3">{DAY_ICONS[day.day_number]}</div>
            <p className="text-xs text-gray-500 mb-0.5">{t.day} {day.day_number}</p>
            <p className="text-sm font-bold text-white leading-tight">{dayName}</p>
            <p className="text-xs text-gray-500 mt-1">{day.duration_text} {t.min}</p>

            {isToday && mainCount > 0 && (
              <div className="mt-3">
                <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${todayPct === 100 ? "bg-green-500" : "bg-blue-500"}`}
                    style={{ width: `${todayPct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{doneCount}/{mainCount} {t.exercises}</p>
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
