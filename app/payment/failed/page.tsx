import Link from "next/link";

export default function PaymentFailedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">

        <div className="w-20 h-20 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">✕</span>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          فشلت عملية الدفع
        </h1>
        <p className="text-gray-400 text-sm mb-8">
          لم تتم عملية الدفع. يمكنك المحاولة مرة أخرى أو التواصل معنا.
        </p>

        <Link
          href="/buy"
          className="block w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-900/40 transition-all mb-3"
        >
          حاول مرة أخرى
        </Link>

        <Link
          href="/dashboard"
          className="block w-full py-3.5 rounded-xl font-medium text-gray-400 hover:text-white border border-white/8 hover:border-white/20 transition-all"
        >
          العودة للرئيسية
        </Link>

      </div>
    </div>
  );
}
