import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "./lang";

export const metadata: Metadata = {
  title: "Hybrid Athlete",
  description: "Track your workouts and progress",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-[#1c1c1e] text-white min-h-screen">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
