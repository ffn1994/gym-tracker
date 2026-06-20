"use client";

import { useState } from "react";
import { deleteWorkout, updateWorkout } from "./actions";

type Workout = {
  id: number;
  exercise_name: string;
  muscle_group: string;
  date: string;
  time: string;
  weight_kg: number;
  sets: number;
  reps: number;
  rest_time_seconds: number;
  workout_duration_min: number;
  difficulty_level: string;
  notes: string;
  video_url?: string | null;
};

const inputClass =
  "w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

const difficultyStyles: Record<string, string> = {
  Hard: "bg-red-900/50 text-red-300 border-red-800",
  Medium: "bg-yellow-900/50 text-yellow-300 border-yellow-800",
  Easy: "bg-green-900/50 text-green-300 border-green-800",
};

export function WorkoutCard({ w }: { w: Workout }) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [form, setForm] = useState({
    exercise_name: w.exercise_name,
    muscle_group: w.muscle_group,
    weight_kg: w.weight_kg,
    sets: w.sets,
    reps: w.reps,
    rest_time_seconds: w.rest_time_seconds,
    workout_duration_min: w.workout_duration_min,
    difficulty_level: w.difficulty_level,
    notes: w.notes ?? "",
    video_url: w.video_url ?? "",
  });

  async function handleDelete() {
    if (!confirm("Delete this workout?")) return;
    setDeleting(true);
    await deleteWorkout(w.id);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await updateWorkout(w.id, {
      ...form,
      weight_kg: Number(form.weight_kg),
      sets: Number(form.sets),
      reps: Number(form.reps),
      rest_time_seconds: Number(form.rest_time_seconds),
      workout_duration_min: Number(form.workout_duration_min),
      video_url: form.video_url || null,
    });
    setEditing(false);
    setSaving(false);
  }

  return (
    <>
      <div className={`bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition ${deleting ? "opacity-40 pointer-events-none" : ""}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">{w.exercise_name}</h3>
            <p className="text-sm text-gray-400">{w.muscle_group}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${difficultyStyles[w.difficulty_level] ?? "bg-gray-800 text-gray-300 border-gray-700"}`}>
              {w.difficulty_level}
            </span>
            <button onClick={() => setEditing(true)} className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded-lg hover:bg-blue-900/20 transition">Edit</button>
            <button onClick={handleDelete} disabled={deleting} className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-lg hover:bg-red-900/20 transition disabled:opacity-50">
              {deleting ? "…" : "Delete"}
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Weight" value={`${w.weight_kg} kg`} />
          <Stat label="Sets" value={String(w.sets)} />
          <Stat label="Reps" value={String(w.reps)} />
          <Stat label="Rest" value={`${w.rest_time_seconds}s`} />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
          <span>{w.date}</span>
          {w.time && <span>{String(w.time).slice(0, 5)}</span>}
          {w.workout_duration_min && <span>{w.workout_duration_min} min session</span>}
        </div>

        {w.notes && (
          <p className="mt-3 text-sm text-gray-400 italic border-t border-gray-800 pt-3">
            &ldquo;{w.notes}&rdquo;
          </p>
        )}

        {/* Video */}
        {w.video_url && (
          <div className="mt-3 border-t border-gray-800 pt-3">
            <button
              onClick={() => setShowVideo(!showVideo)}
              className="flex items-center gap-2 text-xs text-purple-400 hover:text-purple-300 transition font-medium"
            >
              <span>{showVideo ? "▼" : "▶"}</span>
              {showVideo ? "Hide Video" : "Watch Video"}
            </button>
            {showVideo && (
              <video
                src={w.video_url}
                controls
                className="mt-3 w-full rounded-xl max-h-64 bg-black"
              />
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-5">Edit Workout</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <Field label="Exercise Name">
                <input value={form.exercise_name} onChange={(e) => setForm({ ...form, exercise_name: e.target.value })} className={inputClass} required />
              </Field>
              <Field label="Muscle Group">
                <input value={form.muscle_group} onChange={(e) => setForm({ ...form, muscle_group: e.target.value })} className={inputClass} required />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Weight (kg)">
                  <input type="number" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: Number(e.target.value) })} className={inputClass} min={0} step={0.5} required />
                </Field>
                <Field label="Sets">
                  <input type="number" value={form.sets} onChange={(e) => setForm({ ...form, sets: Number(e.target.value) })} className={inputClass} min={1} required />
                </Field>
                <Field label="Reps">
                  <input type="number" value={form.reps} onChange={(e) => setForm({ ...form, reps: Number(e.target.value) })} className={inputClass} min={1} required />
                </Field>
                <Field label="Rest (seconds)">
                  <input type="number" value={form.rest_time_seconds} onChange={(e) => setForm({ ...form, rest_time_seconds: Number(e.target.value) })} className={inputClass} min={0} required />
                </Field>
                <Field label="Duration (min)">
                  <input type="number" value={form.workout_duration_min} onChange={(e) => setForm({ ...form, workout_duration_min: Number(e.target.value) })} className={inputClass} min={0} required />
                </Field>
                <Field label="Difficulty">
                  <select value={form.difficulty_level} onChange={(e) => setForm({ ...form, difficulty_level: e.target.value })} className={inputClass} required>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </Field>
              </div>
              <Field label="Notes">
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={`${inputClass} resize-none`} rows={2} />
              </Field>
              <Field label="Video URL (optional)">
                <input type="url" value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="https://…" className={inputClass} />
              </Field>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold rounded-xl transition">
                  {saving ? "Saving…" : "Save Changes"}
                </button>
                <button type="button" onClick={() => setEditing(false)} className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-800 rounded-xl px-3 py-2">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
      {children}
    </div>
  );
}
