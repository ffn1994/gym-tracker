import { createPaymentSession } from "@/app/actions/payment";
import Link from "next/link";

const FEATURES = [
  "4 أيام تدريب متنوعة ومتكاملة",
  "برنامج Warm-up + Main Workout + Core",
  "تتبع التقدم اليومي لكل تمرين",
  "سجل الأوزان والمجموعات والتكرارات",
  "دعم كامل باللغتين العربية والإنجليزية",
  "إحصائيات أسبوعية لأدائك",
  "اقتراحات ذكية للتمارين",
];

export default function BuyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="bg-[#17152a]/80 backdrop-blur-sm border-b border-white/5 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold text-white">
            ⚡ Hybrid Athlete
          </Link>
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition">
            ← العودة
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Badge */}
          <div className="flex justify-center mb-6">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 tracking-wider uppercase">
              متاح الآن
            </span>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              برنامج التدريب الشامل
            </h1>
            <p className="text-gray-400 text-sm">
              نظام تدريبي احترافي مصمم لبناء الجسم المثالي
            </p>
          </div>

          {/* Card */}
          <div className="bg-[#1e1b2e]/80 border border-white/8 rounded-2xl overflow-hidden">

            {/* Price header */}
            <div className="bg-gradient-to-br from-blue-700/30 via-violet-900/30 to-[#13111f] border-b border-white/6 px-6 py-8 text-center">
              <p className="text-gray-400 text-sm mb-1">السعر</p>
              <div className="flex items-end justify-center gap-2">
                <span className="text-5xl font-bold text-white">100</span>
                <span className="text-xl text-gray-300 mb-2">KWD</span>
              </div>
              <p className="text-gray-500 text-xs mt-2">دفعة واحدة — وصول كامل</p>
            </div>

            {/* Features */}
            <div className="px-6 py-6">
              <ul className="space-y-3">
                {FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-gray-300">
                    <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pay button */}
            <div className="px-6 pb-6">
              <form action={createPaymentSession}>
                <button
                  type="submit"
                  className="w-full py-4 rounded-xl font-bold text-white text-base bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-900/40 transition-all active:scale-[0.98]"
                >
                  ادفع الآن — 100 KWD
                </button>
              </form>
              <p className="text-center text-xs text-gray-600 mt-3">
                الدفع عبر MyFatoorah · آمن ومشفر
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
