import Link from "next/link";

export default async function PaymentFailedPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  const params = await searchParams;
  const msg = params.msg ?? "";

  return (
    <div className="min-h-screen flex items-center justify-center px-4" dir="rtl">
      <div className="w-full max-w-sm text-center">

        <div className="w-20 h-20 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-6 text-4xl">
          ✕
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          فشلت عملية الدفع
        </h1>
        <p className="text-gray-400 text-sm mb-4">
          لم تتم عملية الدفع. يمكنك المحاولة مرة أخرى أو التواصل معنا.
        </p>

        {msg && (
          <p className="text-xs text-red-400/70 bg-red-900/10 border border-red-800/30 rounded-lg px-4 py-2 mb-6 font-mono">
            {msg}
          </p>
        )}

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
