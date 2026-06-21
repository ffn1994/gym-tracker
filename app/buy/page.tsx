import { createPaymentSession } from "@/app/actions/payment";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const PILLARS = [
  {
    icon: "🏋️",
    title: "القوة البدنية",
    subtitle: "Strength Training",
    desc: "تمارين مقاومة احترافية مصممة لبناء عضلاتك وتطوير قوتك الحقيقية بشكل تدريجي ومدروس",
    color: "from-blue-700/20 to-transparent border-blue-700/30",
    iconBg: "bg-blue-600/15",
  },
  {
    icon: "💓",
    title: "القوة القلبية",
    subtitle: "Cardio Fitness",
    desc: "برنامج كارديو متدرج يطور تحملك ويقوي جهازك القلبي التنفسي لأداء رياضي أعلى",
    color: "from-rose-700/20 to-transparent border-rose-700/30",
    iconBg: "bg-rose-600/15",
  },
  {
    icon: "💪",
    title: "البناء العضلي",
    subtitle: "Muscle Building",
    desc: "حجم ومجموعات وتكرارات محسوبة بدقة لتحفيز أقصى نمو عضلي مع الحفاظ على اللياقة",
    color: "from-violet-700/20 to-transparent border-violet-700/30",
    iconBg: "bg-violet-600/15",
  },
];

const DAYS = [
  {
    n: 1, icon: "💪", color: "from-blue-700/30 to-[#13111f]", border: "border-blue-700/40",
    name: "Upper Body", nameAr: "الجزء العلوي",
    desc: "صدر · ظهر · أكتاف · بايسبس · ترايسبس",
    duration: "45-55",
  },
  {
    n: 2, icon: "🏃", color: "from-emerald-700/30 to-[#13111f]", border: "border-emerald-700/40",
    name: "Cardio & Endurance", nameAr: "كارديو وتحمل",
    desc: "جهاز قلبي · تحمل · حرق دهون",
    duration: "40-50",
  },
  {
    n: 3, icon: "🦵", color: "from-orange-700/30 to-[#13111f]", border: "border-orange-700/40",
    name: "Lower Body", nameAr: "الجزء السفلي",
    desc: "أرجل · أرداف · كور · استقرار",
    duration: "50-60",
  },
  {
    n: 4, icon: "🚴", color: "from-violet-700/30 to-[#13111f]", border: "border-violet-700/40",
    name: "Cycling & Recovery", nameAr: "دراجة واسترداد",
    desc: "دراجة · تمدد · تعافي نشط",
    duration: "35-45",
  },
];

const FEATURES = [
  { icon: "📊", text: "تتبع الوزن والمجموعات والتكرارات لكل تمرين" },
  { icon: "📈", text: "إحصائيات أسبوعية تفصيلية لأدائك" },
  { icon: "🕐", text: "سجل تاريخي كامل لكل تمرين" },
  { icon: "🤖", text: "اقتراحات ذكية بالذكاء الاصطناعي" },
  { icon: "🌙", text: "تصميم داكن مريح للعيون" },
  { icon: "🌐", text: "واجهة عربية وإنجليزية بالكامل" },
  { icon: "⚡", text: "سريع وسهل الاستخدام من الجوال" },
  { icon: "♾️", text: "وصول مدى الحياة بدفعة واحدة" },
];

const PREVIEW_EXERCISES = [
  "Bench Press", "Pull-Ups", "Overhead Press",
  "Squat", "Romanian Deadlift", "Running Intervals",
  "Plank", "Cycling Sprint",
];

export default async function BuyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Check if already paid
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_paid")
      .eq("id", user.id)
      .single();
    if (profile?.is_paid) {
      const { redirect } = await import("next/navigation");
      redirect("/dashboard");
    }
  }

  return (
    <div className="min-h-screen" dir="rtl">
      {/* Navbar */}
      <nav className="bg-[#17152a]/80 backdrop-blur-sm border-b border-white/5 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <span className="text-xl font-bold text-white">⚡ Hybrid Athlete</span>
          {!user && (
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition">
              تسجيل الدخول
            </Link>
          )}
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4">

        {/* ===== HERO ===== */}
        <section className="py-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/15 border border-blue-500/25 text-blue-400 text-xs font-semibold tracking-wider mb-6">
            ✦ البرنامج الأمثل للياقة الشاملة
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
            تدريب لا مثيل له
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8 leading-relaxed">
            البرنامج الوحيد الذي يجمع <span className="text-white font-semibold">القوة البدنية</span> و<span className="text-white font-semibold">الكارديو</span> و<span className="text-white font-semibold">البناء العضلي</span> في منظومة تدريبية متكاملة
          </p>

          <form action={createPaymentSession}>
            <button
              type="submit"
              className="px-10 py-4 rounded-2xl font-bold text-white text-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-xl shadow-blue-900/40 transition-all active:scale-[0.97]"
            >
              اشترك الآن — 100 KWD
            </button>
          </form>
          <p className="text-gray-600 text-xs mt-3">دفعة واحدة · وصول مدى الحياة · دفع آمن عبر MyFatoorah</p>
        </section>

        {/* ===== 3 PILLARS ===== */}
        <section className="pb-14">
          <h2 className="text-center text-xl font-bold text-white mb-2">ثلاثة محاور تدريبية</h2>
          <p className="text-center text-gray-500 text-sm mb-8">لا تختر بين القوة والتحمل — حققهما معاً</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PILLARS.map((p) => (
              <div key={p.title} className={`bg-gradient-to-br ${p.color} border rounded-2xl p-5`}>
                <div className={`w-12 h-12 rounded-xl ${p.iconBg} flex items-center justify-center text-2xl mb-4`}>
                  {p.icon}
                </div>
                <p className="text-white font-bold mb-0.5">{p.title}</p>
                <p className="text-gray-500 text-xs mb-3">{p.subtitle}</p>
                <p className="text-gray-400 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== 4 DAYS ===== */}
        <section className="pb-14">
          <h2 className="text-center text-xl font-bold text-white mb-2">4 أيام تدريب متنوعة</h2>
          <p className="text-center text-gray-500 text-sm mb-8">كل يوم له هدف مختلف — تنوع يمنع الملل ويضمن النتيجة</p>
          <div className="grid grid-cols-2 gap-3">
            {DAYS.map((d) => (
              <div key={d.n} className={`bg-gradient-to-br ${d.color} border ${d.border} rounded-2xl p-5`}>
                <div className="text-3xl mb-3">{d.icon}</div>
                <p className="text-xs text-gray-500 mb-0.5">اليوم {d.n}</p>
                <p className="text-sm font-bold text-white leading-snug">{d.nameAr}</p>
                <p className="text-xs text-gray-400 mt-1">{d.name}</p>
                <p className="text-xs text-gray-500 mt-2">{d.desc}</p>
                <p className="text-xs text-gray-600 mt-2">{d.duration} دقيقة</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== PREVIEW (locked) ===== */}
        <section className="pb-14">
          <h2 className="text-center text-xl font-bold text-white mb-2">لمحة من البرنامج</h2>
          <p className="text-center text-gray-500 text-sm mb-8">تمارين احترافية مع تتبع كامل لكل تفصيلة</p>
          <div className="relative rounded-2xl overflow-hidden border border-white/8">
            {/* Blurred preview */}
            <div className="blur-sm pointer-events-none select-none p-4 grid grid-cols-2 gap-2">
              {PREVIEW_EXERCISES.map((ex) => (
                <div key={ex} className="bg-[#1e1b2e]/80 border border-white/6 rounded-xl p-4">
                  <p className="text-white text-sm font-medium">{ex}</p>
                  <p className="text-gray-500 text-xs mt-1">3x8-10 · ••• kg</p>
                  <div className="mt-3 h-1.5 bg-white/5 rounded-full">
                    <div className="h-full w-2/3 bg-blue-500/50 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
            {/* Lock overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#13111f]/70 backdrop-blur-[2px]">
              <div className="text-4xl mb-3">🔒</div>
              <p className="text-white font-bold text-base mb-1">محتوى مقفل</p>
              <p className="text-gray-400 text-sm text-center px-8">اشترك للوصول الكامل لكل التمارين والتتبع</p>
            </div>
          </div>
        </section>

        {/* ===== FEATURES ===== */}
        <section className="pb-14">
          <h2 className="text-center text-xl font-bold text-white mb-2">كل ما تحتاجه في مكان واحد</h2>
          <p className="text-center text-gray-500 text-sm mb-8">تطبيق متكامل يرافقك في كل تمرين</p>
          <div className="bg-[#1e1b2e]/60 border border-white/6 rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map((f) => (
              <div key={f.text} className="flex items-start gap-3">
                <span className="text-xl shrink-0">{f.icon}</span>
                <p className="text-gray-300 text-sm leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== PRICE + CTA ===== */}
        <section className="pb-16">
          <div className="bg-gradient-to-br from-blue-700/20 via-violet-900/20 to-[#13111f] border border-white/8 rounded-2xl overflow-hidden">
            <div className="p-8 text-center">
              <p className="text-gray-400 text-sm mb-2">سعر لا يُكرر</p>
              <div className="flex items-end justify-center gap-2 mb-1">
                <span className="text-6xl font-black text-white">100</span>
                <span className="text-2xl text-gray-300 mb-3">KWD</span>
              </div>
              <p className="text-gray-500 text-sm mb-8">دفعة واحدة فقط · وصول كامل مدى الحياة</p>

              <form action={createPaymentSession}>
                <button
                  type="submit"
                  className="w-full max-w-xs mx-auto block py-4 rounded-xl font-bold text-white text-base bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-xl shadow-blue-900/40 transition-all active:scale-[0.97]"
                >
                  ادفع الآن ⚡
                </button>
              </form>

              {!user && (
                <p className="text-gray-600 text-xs mt-4">
                  ليس لديك حساب؟{" "}
                  <Link href="/register" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
                    سجّل الآن مجاناً
                  </Link>
                </p>
              )}

              <p className="text-gray-700 text-xs mt-3">
                الدفع عبر MyFatoorah · مشفر وآمن 🔐
              </p>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
