"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/app/lang";
import { logExercise, logBodyWeight, saveSessionNote, deleteAllWorkouts, deleteExerciseHistory, getExerciseSuggestion } from "./actions";

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
const REST_SECS = 90;

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

function weekLabel(date: string, history: WorkoutEntry[], prefix: string): string {
  if (history.length === 0) return "";
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  const first = new Date(sorted[0].date + "T00:00:00");
  const d = new Date(date + "T00:00:00");
  const diffDays = Math.floor((d.getTime() - first.getTime()) / (1000 * 60 * 60 * 24));
  return `${prefix}${Math.floor(diffDays / 7) + 1}`;
}

/* ─── Group helpers ──────────────────────────────────────────── */

type ExGroup =
  | { kind: "single"; ex: ProgramExercise }
  | { kind: "choice"; exercises: ProgramExercise[] }
  | { kind: "circuit"; exercises: ProgramExercise[] };

function isChoiceExercise(ex: ProgramExercise): boolean {
  const note = (ex.notes_en ?? ex.notes ?? "").toLowerCase();
  return note.includes("pick one") || note.includes("اختر واحد");
}

function isRecoveryExercise(ex: ProgramExercise): boolean {
  const note = (ex.notes_en ?? ex.notes ?? "").toLowerCase();
  return note.includes("between each round") || note.includes("بين كل");
}

function groupExercises(exercises: ProgramExercise[]): ExGroup[] {
  const result: ExGroup[] = [];
  let i = 0;
  while (i < exercises.length) {
    const ex = exercises[i];
    if (isChoiceExercise(ex)) {
      const group: ProgramExercise[] = [ex];
      while (i + 1 < exercises.length && isChoiceExercise(exercises[i + 1])) {
        i++;
        group.push(exercises[i]);
      }
      result.push({ kind: "choice", exercises: group });
    } else if (i + 1 < exercises.length && isRecoveryExercise(exercises[i + 1])) {
      result.push({ kind: "circuit", exercises: [ex, exercises[i + 1]] });
      i++;
    } else {
      result.push({ kind: "single", ex });
    }
    i++;
  }
  return result;
}

/* ─── Stepper input (+/−) ────────────────────────────────────── */

function Stepper({
  value, onChange, step, placeholder, hasError,
}: {
  value: string;
  onChange: (v: string) => void;
  step: number;
  placeholder: string;
  hasError?: boolean;
}) {
  function adjust(delta: number) {
    const cur = parseFloat(value) || 0;
    const next = Math.max(0, Math.round((cur + delta) * 100) / 100);
    onChange(String(next));
  }
  return (
    <div className={`flex items-center flex-1 min-w-0 bg-gray-800 rounded-lg overflow-hidden border ${hasError ? "border-red-500" : "border-gray-700"}`}>
      <button
        type="button"
        onClick={() => adjust(-step)}
        className="px-2 py-2.5 text-gray-400 active:bg-gray-700 hover:text-white text-base leading-none select-none shrink-0"
      >
        −
      </button>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-0 flex-1 min-w-0 text-center text-sm text-white bg-transparent border-0 focus:outline-none placeholder-gray-600"
      />
      <button
        type="button"
        onClick={() => adjust(step)}
        className="px-2 py-2.5 text-gray-400 active:bg-gray-700 hover:text-white text-base leading-none select-none shrink-0"
      >
        +
      </button>
    </div>
  );
}

/* ─── Rest Timer banner ──────────────────────────────────────── */

function RestTimer({ seconds, onDismiss, isEn }: { seconds: number; onDismiss: () => void; isEn: boolean }) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display = mins > 0
    ? `${mins}:${String(secs).padStart(2, "0")}`
    : `${secs}s`;
  return (
    <div className="flex items-center justify-between rounded-lg bg-amber-950/30 border border-amber-800/30 px-3 py-2">
      <span className="text-xs text-amber-400 font-medium">{isEn ? "Rest" : "راحة"}</span>
      <span className={`text-base font-bold font-mono ${seconds <= 10 ? "text-red-400" : "text-amber-300"}`}>
        {display}
      </span>
      <button onClick={onDismiss} className="text-xs text-gray-600 hover:text-gray-400 transition">
        {isEn ? "Skip" : "تخطى"}
      </button>
    </div>
  );
}

function useRestTimer() {
  const [restSeconds, setRestSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (restSeconds === null || restSeconds <= 0) {
      if (restSeconds === 0) setRestSeconds(null);
      return;
    }
    const id = setTimeout(() => setRestSeconds(s => s !== null ? s - 1 : null), 1000);
    return () => clearTimeout(id);
  }, [restSeconds]);

  return {
    restSeconds,
    startRest: () => setRestSeconds(REST_SECS),
    stopRest: () => setRestSeconds(null),
  };
}

/* ─── Body Weight Card ───────────────────────────────────────── */

function BodyWeightCard({ initialWeight, savedToday, isEn }: {
  initialWeight: number | null;
  savedToday: boolean;
  isEn: boolean;
}) {
  const [weight, setWeight] = useState(initialWeight ? String(initialWeight) : "");
  const [pending, startTransition] = useTransition();
  const [flash, setFlash] = useState<"idle" | "ok" | "err">("idle");
  const [hasErr, setHasErr] = useState(false);

  function save() {
    const w = parseFloat(weight);
    if (!weight || isNaN(w) || w <= 0) { setHasErr(true); return; }
    setHasErr(false);
    startTransition(async () => {
      try {
        await logBodyWeight(w);
        setFlash("ok");
        setTimeout(() => setFlash("idle"), 2500);
      } catch {
        setFlash("err");
        setTimeout(() => setFlash("idle"), 2000);
      }
    });
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3 flex items-center gap-3">
      <span className="text-lg shrink-0">⚖️</span>
      <span className="text-sm font-medium text-gray-300 shrink-0">
        {isEn ? "Body weight" : "وزن الجسم"}
      </span>
      {(savedToday || flash === "ok") && (
        <span className="text-xs text-green-400 font-medium shrink-0">✓</span>
      )}
      <div className="flex items-center gap-1.5 ms-auto">
        <div className="w-28">
          <Stepper
            value={weight}
            onChange={v => { setWeight(v); setHasErr(false); }}
            step={0.5}
            placeholder={isEn ? "kg" : "كيلو"}
            hasError={hasErr}
          />
        </div>
        <button
          onClick={save}
          disabled={pending}
          className={`shrink-0 h-9 px-3 rounded-lg text-sm font-bold transition ${
            flash === "ok"  ? "bg-green-600 text-white" :
            flash === "err" ? "bg-red-600 text-white"   :
            "bg-gray-700 hover:bg-gray-600 text-white"
          } disabled:opacity-50`}
        >
          {pending ? "…" : flash === "ok" ? "✓" : flash === "err" ? "✗" : isEn ? "Save" : "حفظ"}
        </button>
      </div>
    </div>
  );
}

/* ─── Session Note Card ──────────────────────────────────────── */

function SessionNoteCard({ initialNote, programDayId, isEn }: {
  initialNote: string;
  programDayId: number;
  isEn: boolean;
}) {
  const [note, setNote] = useState(initialNote);
  const [pending, startTransition] = useTransition();
  const [flash, setFlash] = useState<"idle" | "ok" | "err">("idle");

  function save() {
    if (!note.trim()) return;
    startTransition(async () => {
      try {
        await saveSessionNote({ program_day_id: programDayId, note: note.trim() });
        setFlash("ok");
        setTimeout(() => setFlash("idle"), 2500);
      } catch {
        setFlash("err");
        setTimeout(() => setFlash("idle"), 2000);
      }
    });
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-2">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        📝 {isEn ? "Session Note" : "ملاحظة الجلسة"}
      </p>
      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder={isEn ? "How did it go? Any notes for next time…" : "كيف كانت الجلسة؟ ملاحظات للمرة القادمة…"}
        rows={2}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-gray-500"
      />
      <button
        onClick={save}
        disabled={pending || !note.trim()}
        className={`w-full h-9 rounded-lg text-sm font-bold transition ${
          flash === "ok"  ? "bg-green-600 text-white" :
          flash === "err" ? "bg-red-600 text-white"   :
          "bg-gray-700 hover:bg-gray-600 text-white"
        } disabled:opacity-40`}
      >
        {pending ? "…" : flash === "ok"
          ? `✓ ${isEn ? "Saved" : "تم الحفظ"}`
          : flash === "err" ? "✗"
          : isEn ? "Save Note" : "حفظ الملاحظة"}
      </button>
    </div>
  );
}

/* ─── Exercise Tracker Card ──────────────────────────────────── */

function ExerciseTrackerCard({ ex, history, programDayId }: {
  ex: ProgramExercise;
  history: WorkoutEntry[];
  programDayId: number;
}) {
  const { lang, t } = useLang();
  const isEn = lang === "en";

  const exName  = isEn ? (ex.exercise_name_en ?? ex.exercise_name) : ex.exercise_name;
  const exNotes = isEn ? (ex.notes_en ?? ex.notes) : ex.notes;
  const isTimed = ex.duration_seconds !== null && ex.reps_min === null && ex.sets !== null;
  const showWeight = !isTimed && ex.muscle_group !== "Cardio";

  const latest    = history[0];
  const maxWeight = showWeight && history.length > 0
    ? Math.max(...history.map(h => Number(h.weight_kg)))
    : 0;

  const [weight, setWeight] = useState(latest ? String(latest.weight_kg) : "");
  const [sets,   setSets]   = useState(latest ? String(latest.sets) : (ex.sets ? String(ex.sets) : ""));
  const [reps,   setReps]   = useState(
    latest ? String(latest.reps)
      : isTimed ? (ex.duration_seconds ? String(ex.duration_seconds) : "")
      : (ex.reps_max ? String(ex.reps_max) : "")
  );
  const [pending, startTransition] = useTransition();
  const [flash, setFlash] = useState<"idle" | "ok" | "pr" | "err">("idle");
  const [errFields, setErrFields] = useState<Set<string>>(new Set());
  const { restSeconds, startRest, stopRest } = useRestTimer();

  const todayStr    = new Date().toISOString().split("T")[0];
  const loggedToday = history.some(h => h.date === todayStr);

  function clearErr(field: string) {
    setErrFields(prev => { const s = new Set(prev); s.delete(field); return s; });
  }

  function doLog(w: number, s: number, r: number) {
    const isNewPR = showWeight && w > 0 && w > maxWeight;
    startTransition(async () => {
      try {
        await logExercise({
          exercise_name: ex.exercise_name,
          muscle_group: ex.muscle_group,
          weight_kg: w, sets: s, reps: r, notes: "",
          program_day_id: programDayId,
        });
        setFlash(isNewPR ? "pr" : "ok");
        startRest();
        setTimeout(() => setFlash("idle"), isNewPR ? 3000 : 1800);
      } catch {
        setFlash("err");
        setTimeout(() => setFlash("idle"), 1800);
      }
    });
  }

  function submit() {
    const errs = new Set<string>();
    if (!sets || parseInt(sets) <= 0) errs.add("sets");
    if (!reps || parseInt(reps) <= 0) errs.add("reps");
    if (errs.size > 0) { setErrFields(errs); return; }
    doLog(parseFloat(weight) || 0, parseInt(sets), parseInt(reps));
  }

  function repeatLast() {
    if (!latest) return;
    doLog(Number(latest.weight_kg), latest.sets, latest.reps);
  }

  const [confirmDel, setConfirmDel] = useState(false);
  const [delPending, startDelTransition] = useTransition();

  function handleDelete() {
    startDelTransition(async () => {
      await deleteExerciseHistory([ex.exercise_name, ex.exercise_name_en ?? ""].filter(Boolean));
      setConfirmDel(false);
    });
  }

  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [suggPending, startSuggTransition] = useTransition();

  function fetchSuggestion() {
    setSuggestion(null);
    startSuggTransition(async () => {
      try {
        const result = await getExerciseSuggestion({
          exerciseName: ex.exercise_name,
          exerciseNameEn: ex.exercise_name_en,
          history: [...history].reverse().slice(-5).map(h => ({
            date: h.date,
            weight_kg: Number(h.weight_kg),
            sets: h.sets,
            reps: h.reps,
          })),
          targetSets: ex.sets,
          targetRepsMin: ex.reps_min,
          targetRepsMax: ex.reps_max,
        });
        setSuggestion(result);
      } catch {
        setSuggestion(isEn ? "Could not get suggestion." : "تعذّر الحصول على اقتراح.");
      }
    });
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-semibold text-white">{exName}</span>
        <div className="flex items-center gap-2">
          {loggedToday && (
            <span className="text-xs text-green-400 font-medium">{t.loggedToday} ✓</span>
          )}
          <span className="text-xs font-mono text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
            {formatTarget(ex)}
          </span>
          <button
            onClick={fetchSuggestion}
            disabled={suggPending}
            title={isEn ? "AI suggestion" : "اقتراح AI"}
            className="text-gray-600 hover:text-purple-400 text-base leading-none transition disabled:opacity-40"
          >
            {suggPending ? "⏳" : "🤖"}
          </button>
          {history.length > 0 && (
            confirmDel ? (
              <div className="flex items-center gap-1">
                <button onClick={handleDelete} disabled={delPending} className="text-xs text-red-400 font-bold hover:text-red-300">✓</button>
                <button onClick={() => setConfirmDel(false)} className="text-xs text-gray-500 hover:text-gray-300">✗</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDel(true)} className="text-gray-700 hover:text-red-500 text-sm leading-none transition">🗑️</button>
            )
          )}
        </div>
      </div>

      {/* AI Suggestion bubble */}
      {suggestion && (
        <div className="mx-4 mb-2 rounded-xl bg-purple-950/40 border border-purple-800/50 px-3 py-2.5 flex items-start gap-2">
          <span className="text-base shrink-0">🤖</span>
          <p className="text-xs text-purple-200 flex-1 leading-relaxed">{suggestion}</p>
          <button onClick={() => setSuggestion(null)} className="text-gray-600 hover:text-gray-400 text-xs shrink-0 mt-0.5">✕</button>
        </div>
      )}

      {/* History */}
      {history.length > 0 ? (
        <div className="border-t border-gray-800 divide-y divide-gray-800/60">
          {history.slice(0, 8).map((entry, idx) => {
            const prev  = history[idx + 1];
            const delta = prev && !isTimed ? entry.weight_kg - prev.weight_kg : null;
            const wk    = weekLabel(entry.date, history, t.weekLabel);
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
                  {isTimed ? `${entry.sets} × ${entry.reps}s` : `${entry.sets}×${entry.reps}`}
                </span>
                {!isTimed && Number(entry.weight_kg) > 0 && Number(entry.weight_kg) === maxWeight ? (
                  <span className="text-amber-400 shrink-0">🏆</span>
                ) : (
                  <>
                    {delta !== null && delta !== 0 && (
                      <span className={`font-semibold shrink-0 ${delta > 0 ? "text-green-400" : "text-red-400"}`}>
                        {delta > 0 ? "↑" : "↓"}{Math.abs(delta)}
                      </span>
                    )}
                    {delta === 0 && <span className="text-gray-700 shrink-0">—</span>}
                  </>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-gray-700 px-4 pb-3 border-t border-gray-800 pt-2">{t.noHistory}</p>
      )}

      {/* Form */}
      <div className="px-4 py-3 border-t border-gray-800 space-y-2">

        {/* Rest timer */}
        {restSeconds !== null && (
          <RestTimer seconds={restSeconds} onDismiss={stopRest} isEn={isEn} />
        )}

        {/* Steppers */}
        <div className="flex gap-1.5">
          {showWeight && (
            <Stepper value={weight} onChange={v => { setWeight(v); clearErr("weight"); }} step={2.5} placeholder={t.weightKg} />
          )}
          <Stepper value={sets} onChange={v => { setSets(v); clearErr("sets"); }} step={1} placeholder={t.sets} hasError={errFields.has("sets")} />
          <Stepper value={reps} onChange={v => { setReps(v); clearErr("reps"); }} step={1} placeholder={isTimed ? t.seconds : t.reps} hasError={errFields.has("reps")} />
        </div>

        {/* Buttons */}
        <div className="flex gap-1.5">
          {latest && (
            <button
              onClick={repeatLast}
              disabled={pending}
              title={isEn ? "Repeat last session" : "كرر آخر جلسة"}
              className="shrink-0 h-9 w-9 flex items-center justify-center rounded-lg bg-gray-800 border border-gray-700 text-base hover:border-gray-600 active:bg-gray-700 transition disabled:opacity-50"
            >
              🔄
            </button>
          )}
          <button
            onClick={submit}
            disabled={pending}
            className={`flex-1 h-9 rounded-lg font-bold text-sm transition ${
              flash === "pr"  ? "bg-amber-500 text-white" :
              flash === "ok"  ? "bg-green-600 text-white" :
              flash === "err" ? "bg-red-600 text-white"   :
              "bg-blue-600 hover:bg-blue-500 text-white"
            } disabled:opacity-50`}
          >
            {pending ? "…" : flash === "pr" ? "🏆 رقم قياسي!" : flash === "ok" ? "✓" : flash === "err" ? "✗" : t.logEntry}
          </button>
        </div>
      </div>

      {exNotes && (
        <p className="text-xs text-gray-600 px-4 pb-2.5">{exNotes}</p>
      )}
    </div>
  );
}

/* ─── Cardio Group Card (pick one of N) ─────────────────────── */

function CardioGroupCard({ exercises, allHistory, programDayId }: {
  exercises: ProgramExercise[];
  allHistory: WorkoutEntry[];
  programDayId: number;
}) {
  const { lang, t } = useLang();
  const isEn = lang === "en";
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [pending, startTransition] = useTransition();
  const [flash, setFlash] = useState<"idle" | "ok" | "err">("idle");
  const { restSeconds, startRest, stopRest } = useRestTimer();

  const selected       = exercises[selectedIdx];
  const isTimed        = selected.duration_seconds !== null && selected.reps_min === null;
  const isLongDuration = (selected.duration_seconds ?? 0) >= 120;
  const history        = getHistory(selected, allHistory);
  const latest         = history[0];
  const todayStr       = new Date().toISOString().split("T")[0];
  const loggedToday    = history.some(h => h.date === todayStr);

  const [sets, setSets] = useState(latest ? String(latest.sets) : (selected.sets ? String(selected.sets) : ""));
  const [reps, setReps] = useState(latest ? String(latest.reps) : "");
  const [errFields, setErrFields] = useState<Set<string>>(new Set());

  function clearErr(field: string) {
    setErrFields(prev => { const s = new Set(prev); s.delete(field); return s; });
  }

  function handleSelect(idx: number) {
    if (idx === selectedIdx) return;
    setSelectedIdx(idx);
    const ex   = exercises[idx];
    const hist = getHistory(ex, allHistory);
    const last = hist[0];
    setSets(last ? String(last.sets) : (ex.sets ? String(ex.sets) : ""));
    setReps(last ? String(last.reps) : "");
    setFlash("idle");
    setErrFields(new Set());
  }

  function doLog(s: number, r: number) {
    startTransition(async () => {
      try {
        await logExercise({
          exercise_name: selected.exercise_name,
          muscle_group: selected.muscle_group,
          weight_kg: 0, sets: s, reps: r, notes: "",
          program_day_id: programDayId,
        });
        setFlash("ok");
        startRest();
        setTimeout(() => setFlash("idle"), 1800);
      } catch {
        setFlash("err");
        setTimeout(() => setFlash("idle"), 1800);
      }
    });
  }

  function submit() {
    const errs = new Set<string>();
    if (!sets || parseInt(sets) <= 0) errs.add("sets");
    if (!reps || parseInt(reps) <= 0) errs.add("reps");
    if (errs.size > 0) { setErrFields(errs); return; }
    doLog(parseInt(sets), parseInt(reps));
  }
  function repeatLast() { if (latest) doLog(latest.sets, latest.reps); }

  const [confirmDel, setConfirmDel] = useState(false);
  const [delPending, startDelTransition] = useTransition();
  function handleDelete() {
    startDelTransition(async () => {
      await deleteExerciseHistory([selected.exercise_name, selected.exercise_name_en ?? ""].filter(Boolean));
      setConfirmDel(false);
    });
  }

  const rawNote    = isEn ? (selected.notes_en ?? selected.notes) : selected.notes;
  const displayNote = rawNote?.replace(/\s*[—–-]\s*(pick one of the three|اختر واحد[^.،]*)\.?/gi, "").trim();

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {isEn ? "Choose one" : "اختر نوع التمرين"}
        </span>
        <div className="flex items-center gap-2">
          {loggedToday && <span className="text-xs text-green-400 font-medium">{t.loggedToday} ✓</span>}
          {history.length > 0 && (
            confirmDel ? (
              <div className="flex items-center gap-1">
                <button onClick={handleDelete} disabled={delPending} className="text-xs text-red-400 font-bold hover:text-red-300">✓</button>
                <button onClick={() => setConfirmDel(false)} className="text-xs text-gray-500 hover:text-gray-300">✗</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDel(true)} className="text-gray-700 hover:text-red-500 text-sm leading-none transition">🗑️</button>
            )
          )}
        </div>
      </div>

      {/* Selector tabs */}
      <div className="flex gap-2 p-3">
        {exercises.map((ex, idx) => {
          const name = isEn ? (ex.exercise_name_en ?? ex.exercise_name) : ex.exercise_name;
          const hist = getHistory(ex, allHistory);
          return (
            <button key={ex.id} onClick={() => handleSelect(idx)}
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

      {/* History */}
      {history.length > 0 ? (
        <div className="border-t border-gray-800 divide-y divide-gray-800/60">
          {history.slice(0, 6).map(entry => {
            const wk = weekLabel(entry.date, history, t.weekLabel);
            return (
              <div key={entry.id} className="flex items-center gap-3 px-4 py-2 text-xs">
                <span className="w-7 text-gray-600 shrink-0 font-mono">{wk}</span>
                <span className="w-14 text-gray-500 shrink-0">{formatDate(entry.date)}</span>
                <span className="text-gray-300 flex-1">
                  {isTimed ? `${entry.sets} × ${entry.reps}${isLongDuration ? "m" : "s"}` : `${entry.sets}×${entry.reps}`}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-gray-700 px-4 pb-3 border-t border-gray-800 pt-2">{t.noHistory}</p>
      )}

      {/* Form */}
      <div className="px-4 py-3 border-t border-gray-800 space-y-2">
        {restSeconds !== null && (
          <RestTimer seconds={restSeconds} onDismiss={stopRest} isEn={isEn} />
        )}
        <div className="flex gap-1.5">
          <Stepper value={sets} onChange={v => { setSets(v); clearErr("sets"); }} step={1} placeholder={t.sets} hasError={errFields.has("sets")} />
          <Stepper value={reps} onChange={v => { setReps(v); clearErr("reps"); }} step={1} placeholder={isLongDuration ? t.min : isTimed ? t.seconds : t.reps} hasError={errFields.has("reps")} />
        </div>
        <div className="flex gap-1.5">
          {latest && (
            <button onClick={repeatLast} disabled={pending}
              title={isEn ? "Repeat last" : "كرر آخر جلسة"}
              className="shrink-0 h-9 w-9 flex items-center justify-center rounded-lg bg-gray-800 border border-gray-700 text-base hover:border-gray-600 active:bg-gray-700 transition disabled:opacity-50"
            >🔄</button>
          )}
          <button onClick={submit} disabled={pending}
            className={`flex-1 h-9 rounded-lg font-bold text-sm transition ${
              flash === "ok" ? "bg-green-600 text-white" : flash === "err" ? "bg-red-600 text-white" : "bg-blue-600 hover:bg-blue-500 text-white"
            } disabled:opacity-50`}
          >
            {pending ? "…" : flash === "ok" ? "✓" : flash === "err" ? "✗" : t.logEntry}
          </button>
        </div>
      </div>

      {displayNote && <p className="text-xs text-gray-600 px-4 pb-2.5">{displayNote}</p>}
    </div>
  );
}

/* ─── Circuit Card (run + recovery → rounds only) ────────────── */

function CircuitCard({ exercises, allHistory, programDayId }: {
  exercises: ProgramExercise[];
  allHistory: WorkoutEntry[];
  programDayId: number;
}) {
  const { lang, t } = useLang();
  const isEn = lang === "en";

  const primary     = exercises[0];
  const history     = getHistory(primary, allHistory);
  const latest      = history[0];
  const todayStr    = new Date().toISOString().split("T")[0];
  const loggedToday = history.some(h => h.date === todayStr);
  const { restSeconds, startRest, stopRest } = useRestTimer();

  const [rounds, setRounds] = useState(latest ? String(latest.sets) : (primary.sets ? String(primary.sets) : ""));
  const [pending, startTransition] = useTransition();
  const [flash, setFlash] = useState<"idle" | "ok" | "err">("idle");
  const [roundsErr, setRoundsErr] = useState(false);

  function doLog(s: number) {
    startTransition(async () => {
      try {
        for (const ex of exercises) {
          await logExercise({
            exercise_name: ex.exercise_name, muscle_group: ex.muscle_group,
            weight_kg: 0, sets: s, reps: 1, notes: "", program_day_id: programDayId,
          });
        }
        setFlash("ok");
        startRest();
        setTimeout(() => setFlash("idle"), 1800);
      } catch {
        setFlash("err");
        setTimeout(() => setFlash("idle"), 1800);
      }
    });
  }

  function submit() {
    if (!rounds || parseInt(rounds) <= 0) { setRoundsErr(true); return; }
    doLog(parseInt(rounds));
  }
  function repeatLast() { if (latest) doLog(latest.sets); }

  const [confirmDel, setConfirmDel] = useState(false);
  const [delPending, startDelTransition] = useTransition();
  function handleDelete() {
    startDelTransition(async () => {
      const allNames = exercises.flatMap(ex => [ex.exercise_name, ex.exercise_name_en ?? ""]).filter(Boolean);
      await deleteExerciseHistory(allNames);
      setConfirmDel(false);
    });
  }

  const ICONS = ["🏃", "🚶"];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">

      {/* Exercise names */}
      <div className="px-4 pt-4 pb-3 space-y-1.5">
        {exercises.map((ex, idx) => {
          const name = isEn ? (ex.exercise_name_en ?? ex.exercise_name) : ex.exercise_name;
          return (
            <div key={ex.id} className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-white">{ICONS[idx] ?? "•"} {name}</span>
              {idx === 0 && (
                <div className="flex items-center gap-2 shrink-0">
                  {loggedToday && <span className="text-xs text-green-400 font-medium">{t.loggedToday} ✓</span>}
                  <span className="text-xs font-mono text-gray-500 bg-gray-800 px-2 py-0.5 rounded">{primary.sets}×</span>
                  {history.length > 0 && (
                    confirmDel ? (
                      <div className="flex items-center gap-1">
                        <button onClick={handleDelete} disabled={delPending} className="text-xs text-red-400 font-bold">✓</button>
                        <button onClick={() => setConfirmDel(false)} className="text-xs text-gray-500">✗</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDel(true)} className="text-gray-700 hover:text-red-500 text-sm leading-none transition">🗑️</button>
                    )
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* History */}
      {history.length > 0 ? (
        <div className="border-t border-gray-800 divide-y divide-gray-800/60">
          {history.slice(0, 6).map(entry => {
            const wk = weekLabel(entry.date, history, t.weekLabel);
            return (
              <div key={entry.id} className="flex items-center gap-3 px-4 py-2 text-xs">
                <span className="w-7 text-gray-600 shrink-0 font-mono">{wk}</span>
                <span className="w-14 text-gray-500 shrink-0">{formatDate(entry.date)}</span>
                <span className="text-gray-300">{entry.sets} {isEn ? "rounds" : "جولات"}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-gray-700 px-4 pb-3 border-t border-gray-800 pt-2">{t.noHistory}</p>
      )}

      {/* Form */}
      <div className="px-4 py-3 border-t border-gray-800 space-y-2">
        {restSeconds !== null && (
          <RestTimer seconds={restSeconds} onDismiss={stopRest} isEn={isEn} />
        )}
        <div className="flex gap-1.5">
          {latest && (
            <button onClick={repeatLast} disabled={pending}
              title={isEn ? "Repeat last" : "كرر آخر جلسة"}
              className="shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-gray-800 border border-gray-700 text-base hover:border-gray-600 active:bg-gray-700 transition disabled:opacity-50"
            >🔄</button>
          )}
          <Stepper value={rounds} onChange={v => { setRounds(v); setRoundsErr(false); }} step={1} placeholder={isEn ? "Rounds" : "جولات"} hasError={roundsErr} />
          <button onClick={submit} disabled={pending}
            className={`shrink-0 h-10 px-5 rounded-lg font-bold text-sm transition ${
              flash === "ok" ? "bg-green-600 text-white" : flash === "err" ? "bg-red-600 text-white" : "bg-blue-600 hover:bg-blue-500 text-white"
            } disabled:opacity-50`}
          >
            {pending ? "…" : flash === "ok" ? "✓" : flash === "err" ? "✗" : t.logEntry}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Simple exercise row (warmup / cooldown / finisher) ─────── */

function SimpleExRow({ ex, isEn }: { ex: ProgramExercise; isEn: boolean }) {
  const [checked, setChecked] = useState(false);
  const name  = isEn ? (ex.exercise_name_en ?? ex.exercise_name) : ex.exercise_name;
  const notes = isEn ? (ex.notes_en ?? ex.notes) : ex.notes;
  return (
    <div className="flex items-start gap-3 py-2.5 cursor-pointer select-none" onClick={() => setChecked(c => !c)}>
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

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div>
      <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${color}`}>{title}</p>
      {children}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */

export function ProgramDayView({ day, exercises, workoutHistory, latestBodyWeight, bodyWeightToday, todayNote }: {
  day: ProgramDay;
  exercises: ProgramExercise[];
  workoutHistory: WorkoutEntry[];
  latestBodyWeight: number | null;
  bodyWeightToday: boolean;
  todayNote: string;
}) {
  const { lang, t } = useLang();
  const isEn = lang === "en";
  const router = useRouter();

  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [clearingAll, startClearAll] = useTransition();

  function handleClearAll() {
    startClearAll(async () => {
      await deleteAllWorkouts();
      setConfirmClearAll(false);
      router.refresh();
    });
  }

  const dayName = isEn ? (day.day_name_en ?? day.day_name) : day.day_name;
  const dayGoal = isEn ? (day.goal_en ?? day.goal) : day.goal;

  const todayWeekDay = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date().getDay()];
  const isToday = day.day_of_week === todayWeekDay;

  const todayStr      = new Date().toISOString().split("T")[0];
  const mainExercises = exercises.filter(e => e.phase === "main" || e.phase === "core");
  const doneToday     = mainExercises.filter(ex => getHistory(ex, workoutHistory).some(h => h.date === todayStr));
  const pct           = mainExercises.length > 0 ? Math.round((doneToday.length / mainExercises.length) * 100) : 0;

  const warmup   = exercises.filter(e => e.phase === "warmup");
  const main     = exercises.filter(e => e.phase === "main");
  const core     = exercises.filter(e => e.phase === "core");
  const finisher = exercises.filter(e => e.phase === "finisher");
  const cooldown = exercises.filter(e => e.phase === "cooldown");

  function renderGroups(list: ProgramExercise[]) {
    return groupExercises(list).map((group, i) => {
      if (group.kind === "choice")  return <CardioGroupCard key={`choice-${i}`}  exercises={group.exercises} allHistory={workoutHistory} programDayId={day.id} />;
      if (group.kind === "circuit") return <CircuitCard     key={`circuit-${i}`} exercises={group.exercises} allHistory={workoutHistory} programDayId={day.id} />;
      return <ExerciseTrackerCard key={group.ex.id} ex={group.ex} history={getHistory(group.ex, workoutHistory)} programDayId={day.id} />;
    });
  }

  return (
    <div className="space-y-6">

      {/* Top action bar */}
      <div className="flex justify-end items-center gap-3">
        <button
          onClick={() => router.refresh()}
          className="text-xs text-gray-600 hover:text-gray-400 flex items-center gap-1 transition"
        >
          🔄 {isEn ? "Refresh" : "تحديث"}
        </button>
        {confirmClearAll ? (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-red-400">{isEn ? "Delete all logs?" : "مسح كل السجل؟"}</span>
            <button onClick={handleClearAll} disabled={clearingAll} className="text-xs text-red-400 font-bold hover:text-red-300">✓</button>
            <button onClick={() => setConfirmClearAll(false)} className="text-xs text-gray-500 hover:text-gray-300">✗</button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmClearAll(true)}
            className="text-xs text-gray-700 hover:text-red-500 flex items-center gap-1 transition"
          >
            🗑️ {isEn ? "Clear all" : "مسح الكل"}
          </button>
        )}
      </div>

      {/* Day header */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{DAY_ICONS[day.day_number]}</span>
              <span className="text-xs text-gray-500">{t.day} {day.day_number}</span>
              {isToday && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-600 text-white">{t.today}</span>
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
              <div className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? "bg-green-500" : "bg-blue-500"}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Body weight */}
      <BodyWeightCard initialWeight={latestBodyWeight} savedToday={bodyWeightToday} isEn={isEn} />

      {warmup.length > 0 && (
        <Section title={t.warmupTitle} color="text-yellow-500">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl px-4 divide-y divide-gray-800/60">
            {warmup.map(ex => <SimpleExRow key={ex.id} ex={ex} isEn={isEn} />)}
          </div>
        </Section>
      )}

      {main.length > 0 && (
        <Section title={t.mainTitle} color="text-blue-400">
          <div className="space-y-3">{renderGroups(main)}</div>
        </Section>
      )}

      {core.length > 0 && (
        <Section title={t.coreTitle} color="text-purple-400">
          <div className="space-y-3">{renderGroups(core)}</div>
        </Section>
      )}

      {finisher.length > 0 && (
        <Section title={t.finisherTitle} color="text-orange-400">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl px-4 divide-y divide-gray-800/60">
            {finisher.map(ex => <SimpleExRow key={ex.id} ex={ex} isEn={isEn} />)}
          </div>
        </Section>
      )}

      {cooldown.length > 0 && (
        <Section title={t.cooldownTitle} color="text-green-500">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl px-4 divide-y divide-gray-800/60">
            {cooldown.map(ex => <SimpleExRow key={ex.id} ex={ex} isEn={isEn} />)}
          </div>
        </Section>
      )}

      {/* Session note */}
      <SessionNoteCard initialNote={todayNote} programDayId={day.id} isEn={isEn} />

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

      {isToday && pct === 100 && (
        <div className="text-center py-4 bg-green-900/20 border border-green-800 rounded-2xl">
          <p className="text-green-400 font-semibold">{t.completedToday}</p>
        </div>
      )}

    </div>
  );
}
