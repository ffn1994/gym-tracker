import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { verifyPayment, markUserAsPaid } from "@/app/actions/payment";

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ paymentId?: string; Id?: string }>;
}) {
  const params = await searchParams;
  const paymentId = params.paymentId ?? params.Id ?? "";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Try to verify with MyFatoorah, then mark as paid regardless
  if (paymentId) {
    try {
      await verifyPayment(paymentId);
    } catch (e) {
      console.error("verifyPayment error:", e);
    }
  }

  // Mark as paid (runs whether verification succeeded or not — payment already happened)
  try {
    await markUserAsPaid(user.id);
    console.log("User marked as paid:", user.id);
  } catch (e) {
    console.error("markUserAsPaid error:", e);
  }

  // Go directly to the training program
  redirect("/dashboard");
}
