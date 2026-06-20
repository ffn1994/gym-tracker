"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Lang = "ar" | "en";

export const T = {
  ar: {
    langToggle: "EN",
    back: "رجوع →",
    signOut: "خروج",
    profile: "الملف",
    program: "البرنامج",

    tabProgram: "البرنامج",
    tabWorkouts: "تماريني",
    tabProgress: "تقدم",
    tabStats: "إحصاء",

    logWorkout: "+ سجّل تمرين",
    logFirst: "+ سجّل أول تمرين",

    today: "اليوم",
    exercises: "تمارين",
    min: "دق",
    day: "اليوم",
    loadingProgram: "جاري تحميل البرنامج…",

    searchPlaceholder: "ابحث عن تمرين…",
    allMuscles: "كل العضلات",
    allLevels: "كل المستويات",
    clearFilters: "مسح",
    of: "من",
    workoutsCount: "تمرين",
    noMatchFilters: "لا يوجد تمرين يطابق الفلتر.",
    clearFiltersLink: "مسح الفلاتر",

    noWorkoutsTitle: "لا يوجد تمارين مسجّلة بعد.",
    noWorkoutsSubtitle: "ابدأ بتسجيل جلساتك!",

    startingWeight: "البداية",
    bestWeight: "الأفضل",
    latestWeight: "الأخير",
    sessionHistory: "سجل الجلسات",
    sessions: "جلسة",
    noChange: "بدون تغيير",

    totalSessions: "إجمالي الجلسات",
    thisWeek: "هذا الأسبوع",
    totalExercises: "التمارين",
    topMuscle: "أكثر عضلة",
    heaviestLift: "أثقل رفعة",
    totalVolume: "الحجم الكلي",
    kgLiftedTotal: "كيلو رُفعت إجمالاً",
    difficultyBreakdown: "توزيع الصعوبة",
    muscleGroupsTitle: "المجموعات العضلية",
    easy: "سهل",
    medium: "متوسط",
    hard: "صعب",

    duration: "المدة",
    dayProgress: "تقدم اليوم",
    exercisesLogged: "تمارين مسجّلة",
    progressionNotes: "ملاحظات التدرج",
    logTodayWorkout: "+ سجّل تمرين",
    completedToday: "🎉 أكملت تمرين اليوم — عمل ممتاز!",

    phases: {
      warmup: "الإحماء",
      main: "التمرين الأساسي",
      core: "الكور",
      finisher: "الخاتمة",
      cooldown: "التهدئة",
    } as Record<string, string>,

    progression: {
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
        "لو حسيت ألم في الركبة — وقف فوراً",
      ],
      4: [
        "الأسبوع 1-2: 20 دقيقة كارديو",
        "الأسبوع 3-4: 25 دقيقة",
        "الأسبوع 5-6: 30 دقيقة",
        "الأسبوع 7-8: 35 دقيقة",
      ],
    } as Record<number, string[]>,
  },

  en: {
    langToggle: "عربي",
    back: "← Back",
    signOut: "Sign out",
    profile: "Profile",
    program: "Program",

    tabProgram: "Program",
    tabWorkouts: "My Workouts",
    tabProgress: "Progress",
    tabStats: "Stats",

    logWorkout: "+ Log Workout",
    logFirst: "+ Log Your First Workout",

    today: "Today",
    exercises: "exercises",
    min: "min",
    day: "Day",
    loadingProgram: "Loading program…",

    searchPlaceholder: "Search exercise…",
    allMuscles: "All muscles",
    allLevels: "All levels",
    clearFilters: "Clear",
    of: "of",
    workoutsCount: "workouts",
    noMatchFilters: "No workouts match your filters.",
    clearFiltersLink: "Clear filters",

    noWorkoutsTitle: "No workouts logged yet.",
    noWorkoutsSubtitle: "Start tracking your sessions!",

    startingWeight: "Starting",
    bestWeight: "Best",
    latestWeight: "Latest",
    sessionHistory: "Session history",
    sessions: "sessions",
    noChange: "No change",

    totalSessions: "Total Sessions",
    thisWeek: "This Week",
    totalExercises: "Exercises",
    topMuscle: "Top Muscle",
    heaviestLift: "Heaviest Lift",
    totalVolume: "Total Volume",
    kgLiftedTotal: "kg lifted total",
    difficultyBreakdown: "Difficulty Breakdown",
    muscleGroupsTitle: "Muscle Groups",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",

    duration: "Duration",
    dayProgress: "Today's Progress",
    exercisesLogged: "exercises logged",
    progressionNotes: "Progression Notes",
    logTodayWorkout: "+ Log Workout",
    completedToday: "🎉 Completed today's workout — great job!",

    phases: {
      warmup: "Warm-up",
      main: "Main Workout",
      core: "Core",
      finisher: "Finisher",
      cooldown: "Cool-down",
    } as Record<string, string>,

    progression: {
      1: [
        "Weeks 1-2: Focus on correct form before adding weight",
        "Week 3+: Add 1-2 kg once you complete all reps easily",
        "Log your weights every session",
      ],
      2: [
        "Weeks 1-2: 5 rounds × 200m",
        "Weeks 3-4: 6 rounds × 200m",
        "Weeks 5-6: 5 rounds × 300m",
        "Weeks 7-8: 6 rounds × 400m",
      ],
      3: [
        "Don't use weight you can't control — form is everything",
        "Knee should always track over toes in squats",
        "If you feel knee pain — stop immediately",
      ],
      4: [
        "Weeks 1-2: 20 min cardio",
        "Weeks 3-4: 25 min",
        "Weeks 5-6: 30 min",
        "Weeks 7-8: 35 min",
      ],
    } as Record<number, string[]>,
  },
};

export type Translations = typeof T.ar;

const LangCtx = createContext<{ lang: Lang; t: Translations; toggle: () => void }>({
  lang: "ar",
  t: T.ar,
  toggle: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("ar");

  useEffect(() => {
    const saved = localStorage.getItem("gym-lang");
    if (saved === "en" || saved === "ar") setLang(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    localStorage.setItem("gym-lang", lang);
  }, [lang]);

  const toggle = () => setLang(l => (l === "ar" ? "en" : "ar"));

  return (
    <LangCtx.Provider value={{ lang, t: T[lang], toggle }}>
      {children}
    </LangCtx.Provider>
  );
}

export function useLang() {
  return useContext(LangCtx);
}
