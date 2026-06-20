"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function logExercise(data: {
  exercise_name: string;
  muscle_group: string | null;
  weight_kg: number;
  sets: number;
  reps: number;
  notes: string;
  program_day_id: number;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const today = new Date().toISOString().split("T")[0];
  const time = new Date().toTimeString().slice(0, 8);

  const { error } = await supabase.from("workouts").insert({
    user_id: user.id,
    exercise_name: data.exercise_name,
    muscle_group: data.muscle_group ?? "General",
    date: today,
    time,
    weight_kg: data.weight_kg,
    sets: data.sets,
    reps: data.reps,
    rest_time_seconds: 90,
    workout_duration_min: 0,
    difficulty_level: "Medium",
    notes: data.notes,
  });

  if (error) throw error;

  revalidatePath(`/dashboard/program/${data.program_day_id}`);
  revalidatePath("/dashboard");
}

export async function logBodyWeight(weight_kg: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const today = new Date().toISOString().split("T")[0];
  const { error } = await supabase
    .from("body_weights")
    .upsert({ user_id: user.id, weight_kg, date: today }, { onConflict: "user_id,date" });

  if (error) throw error;
  revalidatePath("/dashboard");
}

export async function deleteAllWorkouts() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("workouts").delete().eq("user_id", user.id);
  if (error) throw error;

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/program/1");
  revalidatePath("/dashboard/program/2");
  revalidatePath("/dashboard/program/3");
  revalidatePath("/dashboard/program/4");
}

export async function deleteExerciseHistory(names: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("workouts")
    .delete()
    .eq("user_id", user.id)
    .in("exercise_name", names.filter(Boolean));

  if (error) throw error;
  revalidatePath("/dashboard");
}

export async function getExerciseSuggestion(data: {
  exerciseName: string;
  exerciseNameEn: string | null;
  history: { date: string; weight_kg: number; sets: number; reps: number }[];
  targetSets: number | null;
  targetRepsMin: number | null;
  targetRepsMax: number | null;
}): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("No OpenRouter key");

  const last5 = data.history.slice(-5);
  const historyText = last5.length
    ? last5.map(h => `- ${h.date}: ${h.weight_kg}kg × ${h.sets}×${h.reps}`).join("\n")
    : "لا يوجد سجل سابق";

  const targetText = data.targetSets && data.targetRepsMin
    ? `البرنامج يطلب: ${data.targetSets} مجموعات × ${data.targetRepsMin}${data.targetRepsMax && data.targetRepsMax !== data.targetRepsMin ? `-${data.targetRepsMax}` : ""} تكرار`
    : "";

  const prompt = `أنت مدرب لياقة بدنية محترف. بناءً على سجل المتمرن في تمرين "${data.exerciseName}${data.exerciseNameEn ? ` (${data.exerciseNameEn})` : ""}":

${historyText}

${targetText}

اقترح الوزن والتكرارات للجلسة القادمة في جملة واحدة أو اثنتين بالعربية فقط. كن محدداً وعملياً. لا تشرح كثيراً.`;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://gym-tracker-gamma-henna.vercel.app",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 120,
    }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${json?.error?.message ?? "unknown"}`);
  return json.choices?.[0]?.message?.content ?? "تعذّر الحصول على اقتراح.";
}

export async function saveSessionNote(data: { program_day_id: number; note: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const today = new Date().toISOString().split("T")[0];
  const { error } = await supabase
    .from("session_notes")
    .upsert(
      { user_id: user.id, program_day_id: data.program_day_id, date: today, note: data.note },
      { onConflict: "user_id,program_day_id,date" }
    );

  if (error) throw error;
  revalidatePath(`/dashboard/program/${data.program_day_id}`);
}
