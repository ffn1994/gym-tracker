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

  const res = await fetch(`${MYFATOORAH_BASE}/v2/SendPayment`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MYFATOORAH_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      CustomerName: user.email?.split("@")[0] ?? "Customer",
      NotificationOption: "LNK",
      InvoiceValue: 100,
      DisplayCurrencyIso: "KWD",
      CallBackUrl: `${baseUrl}/payment/success`,
      ErrorUrl: `${baseUrl}/payment/failed`,
      Language: "AR",
      CustomerEmail: user.email ?? "",
      InvoiceItems: [
        {
          ItemName: "Hybrid Athlete Program",
          Quantity: 1,
          UnitPrice: 100,
        },
      ],
    }),
  });

  const data = await res.json();

  if (data.IsSuccess && data.Data?.PaymentURL) {
    redirect(data.Data.PaymentURL);
  }

  redirect("/payment/failed");
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
