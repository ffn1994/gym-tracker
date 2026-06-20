"use client";

import { useState, useMemo } from "react";

type ProgramDay = {
  id: number;
  day_number: number;
  day_name: string;
  day_of_week: string;
  duration_text: string;
  goal: string;
};

type ProgramExercise = {
  id: number;
  program_day_id: number;
  phase: string;
  exercise_name: string;
  muscle_group: string | null;
  sets: number | null;
  reps_min: number | null;
  reps_max: number | null;
  duration_seconds: number | null;
  notes: string | null;
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

const DAY_ICONS: Record<number, string> = {
  1: "💪",
  2: "🏃",
  3: "🦵",
  4: "🚴",
};

const DAY_COLORS: Record<number, { card: string; active: string; badge: string }> = {
  1: { card: "border-blue-800 hover:border-blue-600",   active: "border-blue-500 bg-blue-900/20",   badge: "bg-blue-900/50 text-blue-300" },
  2: { card: "border-green-800 hover:border-green-600", active: "border-green-500 bg-green-900/20", badge: "bg-green-900/50 text-green-300" },
  3: { card: "border-orange-800 hover:border-orange-600", active: "border-orange-500 bg-orange-900/20", badge: "bg-orange-900/50 text-orange-300" },
  4: { card: "border-purple-800 hover:border-purple-600", active: "border-purple-500 bg-purple-900/20", badge: "bg-purple-900/50 text-purple-300" },
};

const PHASE_LABELS: Record<string, string> = {
  warmup:   "الإحماء",
  main:     "التمرين الأساسي",
  core:     "الكور",
  finisher: "الخاتمة",
  cooldown: "التهدئة",
};

const PHASE_STYLE: Record<string, { border: string; bg: string; title: string }> = {
  warmup:   { border: "border-yellow-800",  bg: "bg-yellow-900/10",  title: "text-yellow-400" },
  main:     { border: "border-blue-800",    bg: "bg-blue-900/10",    title: "text-blue-400" },
  core:     { border: "border-purple-800",  bg: "bg-purple-900/10",  title: "text-purple-400" },
  finisher: { border: "border-orange-800",  bg: "bg-orange-900/10",  title: "text-orange-400" },
  cooldown: { border: "border-green-800",   bg: "bg-green-900/10",   title: "text-green-400" },
};

const PROGRESSION: Record<number, string[]> = {
  1: [
    "الأسبوع 1-2: ركز على الفورم الصحيح قبل الوزن",
    "الأسبوع 3+: زد 1-2 كيلو لما تكمل كل التكرارات بسهولة",
    "سجّل أوزانك في كل جلسة",
  ],
  2: [
    "الأسبوع 1-2: 5 جولات × 200م",
    "الأسبوع 3-4: 6 جولات × 200م",
    "الأسبوع 5-6: 5 جولات × 300م",
    "الأسبوع 7-8: 6 جولات × 400م",
  ],
  3: [
    "لا تستخدم وزن لا تقدر تتحكم به — الفورم أهم",
    "الركبة تتبع اتجاه أصابع القدم في السكوات دائماً",
    "لو حسيت ألم في الركبة (مو حرقة عضلة) — وقف فوراً",
  ],
  4: [
    "الأسبوع 1-2: 20 دقيقة كارديو",
    "الأسبوع 3-4: 25 دقيقة",
    "الأسبوع 5-6: 30 دقيقة",
    "الأسبوع 7-8: 35 دقيقة + جرب تجري أطول بدون توقف",
  ],
};

function formatTarget(ex: ProgramExercise): string {
  const parts: string[] = [];
  if (ex.sets) parts.push(`${ex.sets} مج`);
  if (ex.reps_min !== null && ex.reps_max !== null) {
    parts.push(ex.reps_min === ex.reps_max ? `× ${ex.reps_min}` : `× ${ex.reps_min}-${ex.reps_max}`);
  }
  if (ex.duration_seconds) {
    parts.push(ex.duration_seconds >= 60
      ? `${Math.round(ex.duration_seconds / 60)} دق`
      : `${ex.duration_seconds} ث`);
  }
  return parts.join(" ") || "—";
}

function findMatch(name: string, workouts: WorkoutSummary[]): WorkoutSummary | undefined {
  const n = name.toLowerCase().trim();
  return workouts.find(w => {
    const wn = w.exercise_name.toLowerCase().trim();
    return wn === n || wn.includes(n) || n.includes(wn);
  });
}

function getFeedback(ex: ProgramExercise, w: WorkoutSummary) {
  const msgs: { text: string; level: "warn" | "error" | "tip" }[] = [];
  if (ex.sets && w.sets < ex.sets)
    msgs.push({ text: `سجلت ${w.sets} مجموعات والبرنامج يقول ${ex.sets}`, level: "error" });
  else if (ex.sets && w.sets > ex.sets)
    msgs.push({ text: `سجلت ${w.sets} مجموعات والبرنامج يقول ${ex.sets}`, level: "warn" });
  if (ex.reps_min !== null && w.reps < ex.reps_min)
    msgs.push({ text: `تكرارات أقل من المطلوب: ${w.reps} < ${ex.reps_min}`, level: "error" });
  else if (ex.reps_max !== null && w.reps > ex.reps_max + 2)
    msgs.push({ text: `تكرارات أكثر من اللازم (${w.reps}) — الوزن خفيف، زده`, level: "tip" });
  return msgs;
}

export function ProgramTab({
  programDays,
  programExercises,
  workouts,
  onAdd,
}: {
  programDays: ProgramDay[];
  programExercises: ProgramExercise[];
  workouts: WorkoutSummary[];
  onAdd: () => void;
}) {
  const todayWeekDay = DAY_JS_TO_WEEK[new Date().getDay()];
  const todayProgram = programDays.find(d => d.day_of_week === todayWeekDay);
  const todayStr = new Date().toISOString().split("T")[0];

  const [selectedId, setSelectedId] = useState<number>(
    todayProgram?.id ?? programDays[0]?.id ?? 1
  );

  const todayWorkouts = useMemo(
    () => workouts.filter(w => w.date === todayStr),
    [workouts, todayStr]
  );

  const selected = programDays.find(d => d.id === selectedId);
  const exercises = useMemo(
    () => programExercises.filter(e => e.program_day_id === selectedId),
    [programExercises, selectedId]
  );

  const mainExercises = exercises.filter(e => e.phase === "main" || e.phase === "core");
  const done = mainExercises.filter(ex => findMatch(ex.exercise_name, todayWorkouts));
  const isToday = selected?.day_of_week === todayWeekDay;
  const pct = mainExercises.length > 0 ? Math.round((done.length / mainExercises.length) * 100) : 0;

  const phases = ["warmup", "main", "core", "finisher", "cooldown"] as const;

  if (programDays.length === 0) {
    return (
      <div className="text-center py-16 text-gray-600">
        <p>جاري تحميل البرنامج…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Day selector cards */}
      <div className="grid grid-cols-2 gap-3">
        {programDays.map(day => {
          const c = DAY_COLORS[day.day_number];
          const isActive = day.id === selectedId;
          const isTodayDay = day.day_of_week === todayWeekDay;
          return (
            <button
              key={day.id}
              onClick={() => setSelectedId(day.id)}
              className={`relative text-right p-4 rounded-2xl border transition-all ${
                isActive ? c.active : "border-gray-800 bg-gray-900 hover:border-gray-700"
              }`}
            >
              {isTodayDay && (
                <span className="absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                  اليوم
                </span>
              )}
              <div className="text-2xl mb-2">{DAY_ICONS[day.day_number]}</div>
              <p className="text-xs text-gray-500 mb-0.5">اليوم {day.day_number}</p>
              <p className="text-sm font-bold text-white leading-tight">{day.day_name}</p>
              <p className="text-xs text-gray-500 mt-1 truncate">{day.duration_text} دق</p>
            </button>
          );
        })}
      </div>

      {/* Selected day header */}
      {selected && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{DAY_ICONS[selected.day_number]}</span>
                <p className="text-xs text-gray-500">اليوم {selected.day_number} — {selected.day_of_week}</p>
              </div>
              <h3 className="text-lg font-bold text-white">{selected.day_name}</h3>
              <p className="text-sm text-gray-400 mt-0.5">{selected.goal}</p>
            </div>
            <div className="shrink-0 bg-gray-800 rounded-xl px-3 py-1.5 text-center">
              <p className="text-xs text-gray-500">المدة</p>
              <p className="text-sm font-bold text-white">{selected.duration_text} دق</p>
            </div>
          </div>

          {isToday && mainExercises.length > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                <span>تقدم اليوم</span>
                <span>{done.length}/{mainExercises.length} تمارين مسجّلة</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${pct === 100 ? "bg-green-500" : "bg-blue-500"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Exercise phases */}
      {phases.map(phase => {
        const list = exercises.filter(e => e.phase === phase);
        if (list.length === 0) return null;
        const s = PHASE_STYLE[phase];
        const isTracked = (phase === "main" || phase === "core") && isToday;

        return (
          <div key={phase} className={`border ${s.border} ${s.bg} rounded-2xl p-5`}>
            <h4 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${s.title}`}>
              {PHASE_LABELS[phase]}
            </h4>
            <div className="space-y-4">
              {list.map(ex => {
                const match = isTracked ? findMatch(ex.exercise_name, todayWorkouts) : undefined;
                const feedback = match ? getFeedback(ex, match) : [];
                const hasError = feedback.some(f => f.level === "error");
                let icon = "○";
                if (match) icon = hasError ? "❌" : feedback.length > 0 ? "⚠️" : "✅";

                return (
                  <div key={ex.id} className="space-y-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-sm shrink-0">{isTracked ? icon : "•"}</span>
                        <span className="text-sm font-medium text-white">{ex.exercise_name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {ex.muscle_group && (
                          <span className="text-xs text-gray-600 hidden sm:block">{ex.muscle_group}</span>
                        )}
                        <span className="text-xs font-mono text-gray-200 bg-gray-800 px-2 py-0.5 rounded-lg whitespace-nowrap">
                          {formatTarget(ex)}
                        </span>
                      </div>
                    </div>

                    {ex.notes && (
                      <p className="text-xs text-gray-500 pr-5">{ex.notes}</p>
                    )}

                    {match && feedback.length === 0 && (
                      <p className="text-xs text-green-500 pr-5 font-medium">
                        {match.sets}×{match.reps} @ {match.weight_kg} كيلو
                      </p>
                    )}

                    {feedback.map((f, i) => (
                      <p key={i} className={`text-xs font-medium pr-5 ${
                        f.level === "error" ? "text-red-400" :
                        f.level === "tip"   ? "text-sky-400" : "text-yellow-400"
                      }`}>
                        {f.level === "error" ? "❌" : f.level === "tip" ? "💡" : "⚠️"} {f.text}
                      </p>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Progression notes */}
      {selected && PROGRESSION[selected.day_number] && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            ملاحظات التدرج
          </h4>
          <ul className="space-y-2">
            {PROGRESSION[selected.day_number].map((note, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-400">
                <span className="text-gray-600 shrink-0 mt-0.5">→</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CTA */}
      {isToday && pct < 100 ? (
        <button
          onClick={onAdd}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition text-sm"
        >
          + سجّل تمرين من برنامج اليوم
        </button>
      ) : isToday && pct === 100 ? (
        <div className="text-center py-4 bg-green-900/20 border border-green-800 rounded-2xl">
          <p className="text-green-400 font-semibold text-sm">🎉 أكملت تمرين اليوم — عمل ممتاز!</p>
        </div>
      ) : (
        <button
          onClick={onAdd}
          className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition text-sm"
        >
          + سجّل تمرين
        </button>
      )}
    </div>
  );
}
