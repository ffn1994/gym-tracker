"use client";

import { useState } from "react";
import { addWorkout } from "./actions";

const inputClass =
  "w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

const MUSCLE_GROUPS = [
  "Chest", "Back", "Shoulders", "Biceps", "Triceps",
  "Legs", "Glutes", "Core", "Cardio", "Full Body",
];

function today() {
  return new Date().toISOString().split("T")[0];
}
function nowTime() {
  return new Date().toTimeString().slice(0, 5);
}

export function AddWorkoutModal({ onClose }: { onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    exercise_name: "",
    muscle_group: "",
    date: today(),
    time: nowTime(),
    weight_kg: 0,
    sets: 3,
    reps: 10,
    rest_time_seconds: 60,
    workout_duration_min: 30,
    difficulty_level: "Medium",
    notes: "",
    video_url: "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await addWorkout({
      ...form,
      weight_kg: Number(form.weight_kg),
      sets: Number(form.sets),
      reps: Number(form.reps),
      rest_time_seconds: Number(form.rest_time_seconds),
      workout_duration_min: Number(form.workout_duration_min),
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">Log Workout</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Exercise Name">
            <input
              value={form.exercise_name}
              onChange={(e) => set("exercise_name", e.target.value)}
              placeholder="e.g. Bench Press"
              className={inputClass}
              required
            />
          </Field>

          <Field label="Muscle Group">
            <select
              value={form.muscle_group}
              onChange={(e) => set("muscle_group", e.target.value)}
              className={inputClass}
              required
            >
              <option value="">Select muscle group</option>
              {MUSCLE_GROUPS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                className={inputClass}
                required
              />
            </Field>
            <Field label="Time">
              <input
                type="time"
                value={form.time}
                onChange={(e) => set("time", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Weight (kg)">
              <input
                type="number"
                value={form.weight_kg}
                onChange={(e) => set("weight_kg", Number(e.target.value))}
                className={inputClass}
                min={0}
                step={0.5}
                required
              />
            </Field>
            <Field label="Difficulty">
              <select
                value={form.difficulty_level}
                onChange={(e) => set("difficulty_level", e.target.value)}
                className={inputClass}
                required
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </Field>
            <Field label="Sets">
              <input
                type="number"
                value={form.sets}
                onChange={(e) => set("sets", Number(e.target.value))}
                className={inputClass}
                min={1}
                required
              />
            </Field>
            <Field label="Reps">
              <input
                type="number"
                value={form.reps}
                onChange={(e) => set("reps", Number(e.target.value))}
                className={inputClass}
                min={1}
                required
              />
            </Field>
            <Field label="Rest (seconds)">
              <input
                type="number"
                value={form.rest_time_seconds}
                onChange={(e) => set("rest_time_seconds", Number(e.target.value))}
                className={inputClass}
                min={0}
              />
            </Field>
            <Field label="Duration (min)">
              <input
                type="number"
                value={form.workout_duration_min}
                onChange={(e) => set("workout_duration_min", Number(e.target.value))}
                className={inputClass}
                min={0}
              />
            </Field>
          </div>

          <Field label="Notes (optional)">
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="How did it feel?"
              className={`${inputClass} resize-none`}
              rows={2}
            />
          </Field>

          <Field label="Video URL (optional)">
            <input
              type="url"
              value={form.video_url}
              onChange={(e) => set("video_url", e.target.value)}
              placeholder="https://…"
              className={inputClass}
            />
          </Field>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold rounded-xl transition"
            >
              {saving ? "Saving…" : "Log Workout"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
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
