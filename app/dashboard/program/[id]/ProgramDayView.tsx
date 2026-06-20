"use client";

import { useState, useTransition } from "react";
import { useLang } from "@/app/lang";
import { logExercise } from "./actions";

/* ─── Types ─────────────────────────────────────────────────── */

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

type WorkoutEntry = {
  id: number;
  exercise_name: string;
  weight_kg: number;
  sets: number;
  reps: number;
  date: string;
  notes: string | null;
};

/* ─── Constants ──────────────────────────────────────────────── */

const DAY_ICONS: Record<number, string> = { 1: "💪", 2: "🏃", 3: "🦵", 4: "🚴" };

/* ─── Helpers ────────────────────────────────────────────────── */

function formatDate(d: string) {
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function formatTarget(ex: ProgramExercise) {
  const parts: string[] = [];
  if (ex.sets) parts.push(`${ex.sets}×`);
  if (ex.reps_min !== null && ex.reps_max !== null)
    parts.push(ex.reps_min === ex.reps_max ? `${ex.reps_min}` : `${ex.reps_min}-${ex.reps_max}`);
  if (ex.duration_seconds) {
    const val = ex.duration_seconds >= 60
      ? `${Math.round(ex.duration_seconds / 60)}m`
      : `${ex.duration_seconds}s`;
    parts.push(val);
  }
  return parts.join("") || "—";
}

/** Get history entries that match this exercise (fuzzy) */
function getHistory(ex: ProgramExercise, allWorkouts: WorkoutEntry[]): WorkoutEntry[] {
  const ar = ex.exercise_name.toLowerCase().trim();
  const en = ex.exercise_name_en?.toLowerCase().trim() ?? "";
  return allWorkouts.filter(w => {
    const wn = w.exercise_name.toLowerCase().trim();
    return wn === ar || wn === en ||
      (ar && (wn.includes(ar) || ar.includes(wn))) ||
      (en && (wn.includes(en) || en.includes(wn)));
  });
}

/** Compute week label (W1, W2…) relative to first-ever entry for this exercise */
function weekLabel(date: string, history: WorkoutEntry[], prefix: string): string {
  if (history.length === 0) return "";
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  const firstDate = sorted[0].date;
  const first = new Date(firstDate + "T00:00:00");
  const d = new Date(date + "T00:00:00");
  const diffDays = Math.floor((d.getTime() - first.getTime()) / (1000 * 60 * 60 * 24));
  return `${prefix}${Math.floor(diffDays / 7) + 1}`;
}

/* ─── Group helpers ──────────────────────────────────────────── */

function isAlternativeExercise(ex: ProgramExercise): boolean {
  const note = (ex.notes_en ?? ex.notes ?? "").toLowerCase();
  return note.includes("pick one") || note.includes("اختر واحد");
}

function groupExercises(exercises: ProgramExercise[]): Array<ProgramExercise | ProgramExercise[]> {
  const result: Array<ProgramExercise | ProgramExercise[]> = [];
  let group: ProgramExercise[] = [];
  for (const ex of exercises) {
    if (isAlternativeExercise(ex)) {
      group.push(ex);
    } else {
      if (group.length > 1) result.push(group);
      else if (group.length === 1) result.push(group[0]);
      group = [];
      result.push(ex);
    }
  }
  if (group.length > 1) result.push(group);
  else if (group.length === 1) result.push(group[0]);
  return result;
}

/* ─── Cardio Group Card (pick one of N alternatives) ─────────── */

function CardioGroupCard({
  exercises,
  allHistory,
  programDayId,
}: {
  exercises: ProgramExercise[];
  allHistory: WorkoutEntry[];
  programDayId: number;
}) {
  const { lang, t } = useLang();
  const isEn = lang === "en";
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [pending, startTransition] = useTransition();
  const [flash, setFlash] = useState<"idle" | "ok" | "err">("idle");

  const selected = exercises[selectedIdx];
  const isTimed = selected.duration_seconds !== null && selected.reps_min === null;
  const history = getHistory(selected, allHistory);
  const latest = history[0];
  const todayStr = new Date().toISOString().split("T")[0];
  const loggedToday = history.some(h => h.date === todayStr);

  const isLongDuration = (selected.duration_seconds ?? 0) >= 120;
  const [sets, setSets] = useState(
    latest ? String(latest.sets) : (selected.sets ? String(selected.sets) : "")
  );
  const [reps, setReps] = useState(
    latest ? String(latest.reps) : ""
  );

  function handleSelect(idx: number) {
    if (idx === selectedIdx) return;
    setSelectedIdx(idx);
    const ex = exercises[idx];
    const hist = getHistory(ex, allHistory);
    const last = hist[0];
    const timed = ex.duration_seconds !== null && ex.reps_min === null;
    setSets(last ? String(last.sets) : (ex.sets ? String(ex.sets) : ""));
    setReps(last ? String(last.reps) : "");
    setFlash("idle");
  }

  function submit() {
    const s = parseInt(sets) || 1;
    const r = parseInt(reps) || 0;
    startTransition(async () => {
      try {
        await logExercise({
          exercise_name: selected.exercise_name,
          muscle_group: selected.muscle_group,
          weight_kg: 0,
          sets: s,
          reps: r,
          notes: "",
          program_day_id: programDayId,
        });
        setFlash("ok");
        setTimeout(() => setFlash("idle"), 1800);
      } catch {
        setFlash("err");
        setTimeout(() => setFlash("idle"), 1800);
      }
    });
  }

  const rawNote = isEn ? (selected.notes_en ?? selected.notes) : selected.notes;
  const displayNote = rawNote
    ?.replace(/\s*[—–-]\s*(pick one of the three|اختر واحد[^.،]*)\.?/gi, "")
    .trim();

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {isEn ? "Choose one" : "اختر نوع التمرين"}
        </span>
        {loggedToday && (
          <span className="text-xs text-green-400 font-medium">{t.loggedToday} ✓</span>
        )}
      </div>

      {/* Selector tabs */}
      <div className="flex gap-2 p-3">
        {exercises.map((ex, idx) => {
          const name = isEn ? (ex.exercise_name_en ?? ex.exercise_name) : ex.exercise_name;
          const hist = getHistory(ex, allHistory);
          return (
            <button
              key={ex.id}
              onClick={() => handleSelect(idx)}
              className={`flex-1 py-2.5 px-1 text-xs font-semibold rounded-xl border transition text-center leading-tight ${
                selectedIdx === idx
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:border-gray-600"
              }`}
            >
              {name}
              {hist.length > 0 && (
                <span className={`block text-xs mt-0.5 ${selectedIdx === idx ? "opacity-70" : "opacity-50"}`}>
                  {hist.length} {isEn ? "sessions" : "جلسة"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* History for selected */}
      {history.length > 0 ? (
        <div className="border-t border-gray-800 divide-y divide-gray-800/60">
          {history.slice(0, 6).map((entry, idx) => {
            const wk = weekLabel(entry.date, history, t.weekLabel);
            return (
              <div key={entry.id} className="flex items-center gap-3 px-4 py-2 text-xs">
                <span className="w-7 text-gray-600 shrink-0 font-mono">{wk}</span>
                <span className="w-14 text-gray-500 shrink-0">{formatDate(entry.date)}</span>
                <span className="text-gray-300 flex-1">
                  {isTimed
                    ? `${entry.sets} × ${entry.reps}${isLongDuration ? "m" : "s"}`
                    : `${entry.sets}×${entry.reps}`}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-gray-700 px-4 pb-3 border-t border-gray-800 pt-2">{t.noHistory}</p>
      )}

      {/* Log form */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-800">
        <input
          type="number"
          inputMode="numeric"
          value={sets}
          onChange={e => setSets(e.target.value)}
          placeholder={t.sets}
          className="flex-1 bg-gray-800 text-white text-center text-sm rounded-lg px-2 py-2 border border-gray-700 focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder-gray-600"
        />
        <input
          type="number"
          inputMode="numeric"
          value={reps}
          onChange={e => setReps(e.target.value)}
          placeholder={isLongDuration ? t.min : isTimed ? t.seconds : t.reps}
          className="flex-1 bg-gray-800 text-white text-center text-sm rounded-lg px-2 py-2 border border-gray-700 focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder-gray-600"
        />
        <button
          onClick={submit}
          disabled={pending}
          className={`shrink-0 h-9 px-3 rounded-lg font-bold text-sm transition ${
            flash === "ok"  ? "bg-green-600 text-white" :
            flash === "err" ? "bg-red-600 text-white"   :
            "bg-blue-600 hover:bg-blue-500 text-white"
          } disabled:opacity-50`}
        >
          {pending ? "…" : flash === "ok" ? "✓" : flash === "err" ? "✗" : t.logEntry}
        </button>
      </div>

      {displayNote && (
        <p className="text-xs text-gray-600 px-4 pb-2.5">{displayNote}</p>
      )}
    </div>
  );
}

/* ─── Exercise Tracker Card ──────────────────────────────────── */

function ExerciseTrackerCard({
  ex,
  history,
  programDayId,
}: {
  ex: ProgramExercise;
  history: WorkoutEntry[];
  programDayId: number;
}) {
  const { lang, t } = useLang();
  const isEn = lang === "en";

  const exName  = isEn ? (ex.exercise_name_en ?? ex.exercise_name) : ex.exercise_name;
  const exNotes = isEn ? (ex.notes_en ?? ex.notes) : ex.notes;

  // Is this a timed exercise (Plank, Dead Bug…)?
  const isTimed = ex.duration_seconds !== null && ex.reps_min === null && ex.sets !== null;

  // Defaults from last entry or program target
  const latest = history[0];
  const [weight, setWeight] = useState(latest ? String(latest.weight_kg) : "");
  const [sets,   setSets]   = useState(latest ? String(latest.sets) : (ex.sets ? String(ex.sets) : ""));
  const [reps,   setReps]   = useState(
    latest
      ? String(latest.reps)
      : isTimed
        ? (ex.duration_seconds ? String(ex.duration_seconds) : "")
        : (ex.reps_max ? String(ex.reps_max) : "")
  );
  const [pending, startTransition] = useTransition();
  const [flash, setFlash] = useState<"idle" | "ok" | "err">("idle");

  const todayStr = new Date().toISOString().split("T")[0];
  const loggedToday = history.some(h => h.date === todayStr);

  function submit() {
    const w = parseFloat(weight) || 0;
    const s = parseInt(sets)   || 1;
    const r = parseInt(reps)   || 0;
    startTransition(async () => {
      try {
        await logExercise({
          exercise_name: ex.exercise_name,
          muscle_group: ex.muscle_group,
          weight_kg: w,
          sets: s,
          reps: r,
          notes: "",
          program_day_id: programDayId,
        });
        setFlash("ok");
        setTimeout(() => setFlash("idle"), 1800);
      } catch {
        setFlash("err");
        setTimeout(() => setFlash("idle"), 1800);
      }
    });
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-semibold text-white">{exName}</span>
        <div className="flex items-center gap-2">
          {loggedToday && (
            <span className="text-xs text-green-400 font-medium">{t.loggedToday} ✓</span>
          )}
          <span className="text-xs font-mono text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
            {formatTarget(ex)}
          </span>
        </div>
      </div>

      {/* ── History table ── */}
      {history.length > 0 ? (
        <div className="border-t border-gray-800 divide-y divide-gray-800/60">
          {history.slice(0, 8).map((entry, idx) => {
            const prev = history[idx + 1];
            const delta = prev && !isTimed ? entry.weight_kg - prev.weight_kg : null;
            const wk = weekLabel(entry.date, history, t.weekLabel);
            return (
              <div key={entry.id} className="flex items-center gap-3 px-4 py-2 text-xs">
                <span className="w-7 text-gray-600 shrink-0 font-mono">{wk}</span>
                <span className="w-14 text-gray-500 shrink-0">{formatDate(entry.date)}</span>
                {!isTimed && (
                  <span className="w-14 text-gray-300 shrink-0">
                    {entry.weight_kg > 0 ? `${entry.weight_kg} kg` : "BW"}
                  </span>
                )}
                <span className="text-gray-300 flex-1">
                  {isTimed
                    ? `${entry.sets} × ${entry.reps}s`
                    : `${entry.sets}×${entry.reps}`}
                </span>
                {delta !== null && delta !== 0 && (
                  <span className={`font-semibold shrink-0 ${delta > 0 ? "text-green-400" : "text-red-400"}`}>
                    {delta > 0 ? "↑" : "↓"}{Math.abs(delta)}
                  </span>
                )}
                {delta === 0 && <span className="text-gray-700 shrink-0">—</span>}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-gray-700 px-4 pb-3 border-t border-gray-800 pt-2">
          {t.noHistory}
        </p>
      )}

      {/* ── Quick-log form ── */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-900 border-t border-gray-800">
        {/* Weight — hide for timed or bodyweight cardio */}
        {!isTimed && ex.muscle_group !== "Cardio" && (
          <input
            type="number"
            inputMode="decimal"
            value={weight}
            onChange={e => setWeight(e.target.value)}
            placeholder={t.weightKg}
            className="w-0 flex-1 min-w-0 bg-gray-800 text-white text-center text-sm rounded-lg px-2 py-2 border border-gray-700 focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder-gray-600"
          />
        )}

        {/* Sets */}
        <input
          type="number"
          inputMode="numeric"
          value={sets}
          onChange={e => setSets(e.target.value)}
          placeholder={t.sets}
          className="w-0 flex-1 min-w-0 bg-gray-800 text-white text-center text-sm rounded-lg px-2 py-2 border border-gray-700 focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder-gray-600"
        />

        {/* Reps / Sec */}
        <input
          type="number"
          inputMode="numeric"
          value={reps}
          onChange={e => setReps(e.target.value)}
          placeholder={isTimed ? t.seconds : t.reps}
          className="w-0 flex-1 min-w-0 bg-gray-800 text-white text-center text-sm rounded-lg px-2 py-2 border border-gray-700 focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder-gray-600"
        />

        {/* Submit */}
        <button
          onClick={submit}
          disabled={pending}
          className={`shrink-0 h-9 px-3 rounded-lg font-bold text-sm transition ${
            flash === "ok"  ? "bg-green-600 text-white" :
            flash === "err" ? "bg-red-600 text-white"   :
            "bg-blue-600 hover:bg-blue-500 text-white"
          } disabled:opacity-50`}
        >
          {pending ? "…" : flash === "ok" ? "✓" : flash === "err" ? "✗" : t.logEntry}
        </button>
      </div>

      {exNotes && (
        <p className="text-xs text-gray-600 px-4 pb-2.5">{exNotes}</p>
      )}
    </div>
  );
}

/* ─── Simple exercise row (warmup / cooldown / finisher) ─────── */

function SimpleExRow({ ex, isEn }: { ex: ProgramExercise; isEn: boolean }) {
  const [checked, setChecked] = useState(false);
  const name  = isEn ? (ex.exercise_name_en ?? ex.exercise_name) : ex.exercise_name;
  const notes = isEn ? (ex.notes_en ?? ex.notes) : ex.notes;
  return (
    <div
      className="flex items-start gap-3 py-2.5 cursor-pointer select-none"
      onClick={() => setChecked(c => !c)}
    >
      <span className={`mt-0.5 text-base shrink-0 transition-opacity ${checked ? "opacity-30" : ""}`}>
        {checked ? "✅" : "○"}
      </span>
      <div className={`flex-1 transition-opacity ${checked ? "opacity-40" : ""}`}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-white">{name}</span>
          <span className="text-xs font-mono text-gray-600 shrink-0">{formatTarget(ex)}</span>
        </div>
        {notes && <p className="text-xs text-gray-600 mt-0.5">{notes}</p>}
      </div>
    </div>
  );
}

/* ─── Section wrapper ─────────────────────────────────────────── */

function Section({ title, color, children }: {
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${color}`}>{title}</p>
      {children}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */

export function ProgramDayView({ day, exercises, workoutHistory }: {
  day: ProgramDay;
  exercises: ProgramExercise[];
  workoutHistory: WorkoutEntry[];
}) {
  const { lang, t } = useLang();
  const isEn = lang === "en";

  const dayName = isEn ? (day.day_name_en ?? day.day_name) : day.day_name;
  const dayGoal = isEn ? (day.goal_en ?? day.goal) : day.goal;

  const todayWeekDay = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date().getDay()];
  const isToday = day.day_of_week === todayWeekDay;

  // Progress: count main+core exercises that have a history entry today
  const todayStr = new Date().toISOString().split("T")[0];
  const mainExercises = exercises.filter(e => e.phase === "main" || e.phase === "core");
  const doneToday = mainExercises.filter(ex => {
    const hist = getHistory(ex, workoutHistory);
    return hist.some(h => h.date === todayStr);
  });
  const pct = mainExercises.length > 0 ? Math.round((doneToday.length / mainExercises.length) * 100) : 0;

  const warmup   = exercises.filter(e => e.phase === "warmup");
  const main     = exercises.filter(e => e.phase === "main");
  const core     = exercises.filter(e => e.phase === "core");
  const finisher = exercises.filter(e => e.phase === "finisher");
  const cooldown = exercises.filter(e => e.phase === "cooldown");

  return (
    <div className="space-y-6">

      {/* ── Day header ── */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{DAY_ICONS[day.day_number]}</span>
              <span className="text-xs text-gray-500">{t.day} {day.day_number}</span>
              {isToday && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                  {t.today}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-white">{dayName}</h1>
            <p className="text-sm text-gray-400 mt-1">{dayGoal}</p>
          </div>
          <div className="shrink-0 bg-gray-800 rounded-xl px-3 py-2 text-center">
            <p className="text-xs text-gray-500">{t.duration}</p>
            <p className="text-base font-bold text-white">{day.duration_text} {t.min}</p>
          </div>
        </div>

        {isToday && mainExercises.length > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span>{t.dayProgress}</span>
              <span>{doneToday.length} / {mainExercises.length} {t.exercisesLogged}</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? "bg-green-500" : "bg-blue-500"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Warmup ── */}
      {warmup.length > 0 && (
        <Section title={t.warmupTitle} color="text-yellow-500">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl px-4 divide-y divide-gray-800/60">
            {warmup.map(ex => <SimpleExRow key={ex.id} ex={ex} isEn={isEn} />)}
          </div>
        </Section>
      )}

      {/* ── Main workout tracker ── */}
      {main.length > 0 && (
        <Section title={t.mainTitle} color="text-blue-400">
          <div className="space-y-3">
            {groupExercises(main).map((item, i) =>
              Array.isArray(item) ? (
                <CardioGroupCard
                  key={`group-${i}`}
                  exercises={item}
                  allHistory={workoutHistory}
                  programDayId={day.id}
                />
              ) : (
                <ExerciseTrackerCard
                  key={item.id}
                  ex={item}
                  history={getHistory(item, workoutHistory)}
                  programDayId={day.id}
                />
              )
            )}
          </div>
        </Section>
      )}

      {/* ── Core tracker ── */}
      {core.length > 0 && (
        <Section title={t.coreTitle} color="text-purple-400">
          <div className="space-y-3">
            {groupExercises(core).map((item, i) =>
              Array.isArray(item) ? (
                <CardioGroupCard
                  key={`group-${i}`}
                  exercises={item}
                  allHistory={workoutHistory}
                  programDayId={day.id}
                />
              ) : (
                <ExerciseTrackerCard
                  key={item.id}
                  ex={item}
                  history={getHistory(item, workoutHistory)}
                  programDayId={day.id}
                />
              )
            )}
          </div>
        </Section>
      )}

      {/* ── Finisher ── */}
      {finisher.length > 0 && (
        <Section title={t.finisherTitle} color="text-orange-400">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl px-4 divide-y divide-gray-800/60">
            {finisher.map(ex => <SimpleExRow key={ex.id} ex={ex} isEn={isEn} />)}
          </div>
        </Section>
      )}

      {/* ── Cooldown ── */}
      {cooldown.length > 0 && (
        <Section title={t.cooldownTitle} color="text-green-500">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl px-4 divide-y divide-gray-800/60">
            {cooldown.map(ex => <SimpleExRow key={ex.id} ex={ex} isEn={isEn} />)}
          </div>
        </Section>
      )}

      {/* ── Progression notes ── */}
      {t.progression[day.day_number] && (
        <Section title={t.progressionTitle} color="text-gray-500">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-2">
            {t.progression[day.day_number].map((note, i) => (
              <div key={i} className="flex gap-2 text-sm text-gray-400">
                <span className="text-gray-700 shrink-0">→</span>
                <span>{note}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Completed banner ── */}
      {isToday && pct === 100 && (
        <div className="text-center py-4 bg-green-900/20 border border-green-800 rounded-2xl">
          <p className="text-green-400 font-semibold">{t.completedToday}</p>
        </div>
      )}

    </div>
  );
}
