import { verifyPayment } from "@/app/actions/payment";
import Link from "next/link";

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ paymentId?: string; Id?: string }>;
}) {
  const params = await searchParams;
  const paymentId = params.paymentId ?? params.Id ?? "";

  let verified = false;
  let invoiceId: string | null = null;

  if (paymentId) {
    try {
      const result = await verifyPayment(paymentId);
      if (result.IsSuccess && result.Data?.InvoiceStatus === "Paid") {
        verified = true;
        invoiceId = result.Data?.InvoiceId ?? null;
      }
    } catch {}
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">

        <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">✓</span>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          {verified ? "تمت عملية الدفع بنجاح!" : "شكراً لك!"}
        </h1>
        <p className="text-gray-400 text-sm mb-2">
          {verified
            ? "تم استلام دفعتك وتفعيل اشتراكك في برنامج Hybrid Athlete."
            : "تم معالجة طلب الدفع. ستصلك رسالة تأكيد على بريدك الإلكتروني."}
        </p>

        {invoiceId && (
          <p className="text-xs text-gray-600 mb-6">
            رقم الفاتورة: #{invoiceId}
          </p>
        )}

        <div className="bg-[#1e1b2e]/80 border border-white/8 rounded-2xl p-6 mb-6 text-right">
          <p className="text-xs text-gray-500 mb-3 text-center">ملخص الطلب</p>
          <div className="flex justify-between text-sm">
            <span className="text-white font-medium">100 KWD</span>
            <span className="text-gray-400">Hybrid Athlete Program</span>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="block w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-900/40 transition-all"
        >
          ابدأ تدريبك الآن ⚡
        </Link>

      </div>
    </div>
  );
}
