"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

export async function markUserAsPaid(userId: string) {
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  await admin.from("profiles").upsert({
    id: userId,
    is_paid: true,
    paid_at: new Date().toISOString(),
  });
}

const MYFATOORAH_BASE = "https://api.myfatoorah.com";

export async function createPaymentSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ?? "https://gym-tracker-gamma-henna.vercel.app";

  const headers = {
    Authorization: `Bearer ${process.env.MYFATOORAH_API_KEY}`,
    "Content-Type": "application/json",
  };

  // Step 1: Get available payment methods
  const initRes = await fetch(`${MYFATOORAH_BASE}/v2/InitiatePayment`, {
    method: "POST",
    headers,
    body: JSON.stringify({ InvoiceAmount: 100, CurrencyIso: "KWD" }),
  });
  const initData = await initRes.json();
  console.log("InitiatePayment:", JSON.stringify(initData));

  if (!initData.IsSuccess) {
    const errMsg = initData.Message ?? "Failed to initiate payment";
    console.error("InitiatePayment error:", errMsg);
    redirect(`/payment/failed?msg=${encodeURIComponent(errMsg)}`);
  }

  const methods: { PaymentMethodId: number; PaymentMethodEn: string }[] =
    initData.Data?.PaymentMethods ?? [];

  // Prefer KNET, otherwise take first available
  const method =
    methods.find((m) => m.PaymentMethodEn?.toLowerCase().includes("knet")) ??
    methods[0];

  if (!method) {
    redirect(`/payment/failed?msg=${encodeURIComponent("No payment methods available")}`);
  }

  // Step 2: Execute payment
  const execRes = await fetch(`${MYFATOORAH_BASE}/v2/ExecutePayment`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      PaymentMethodId: method.PaymentMethodId,
      CustomerName: user.email?.split("@")[0] ?? "Customer",
      DisplayCurrencyIso: "KWD",
      MobileCountryCode: "+965",
      CustomerMobile: "00000000",
      CustomerEmail: user.email ?? "",
      InvoiceValue: 100,
      CallBackUrl: `${baseUrl}/payment/success`,
      ErrorUrl: `${baseUrl}/payment/failed`,
      Language: "AR",
      CustomerReference: user.id,
      InvoiceItems: [
        { ItemName: "Hybrid Athlete Program", Quantity: 1, UnitPrice: 100 },
      ],
    }),
  });

  const execData = await execRes.json();
  console.log("ExecutePayment:", JSON.stringify(execData));

  if (execData.IsSuccess && execData.Data?.PaymentURL) {
    redirect(execData.Data.PaymentURL);
  }

  const errMsg = execData.Message ?? execData.ValidationErrors?.[0]?.Error ?? "Payment failed";
  console.error("ExecutePayment error:", errMsg);
  redirect(`/payment/failed?msg=${encodeURIComponent(errMsg)}`);
}

export async function verifyPayment(paymentId: string) {
  const res = await fetch(`${MYFATOORAH_BASE}/v2/GetPaymentStatus`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MYFATOORAH_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ Key: paymentId, KeyType: "PaymentId" }),
  });

  const data = await res.json();
  return data;
}
