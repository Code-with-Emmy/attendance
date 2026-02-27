import type { Metadata } from "next";
import "./globals.css";
import { BRAND_FULL_NAME } from "@/lib/branding";

export const metadata: Metadata = {
  title: BRAND_FULL_NAME,
  description: "Modern face-recognition attendance platform for kiosk clock in and admin operations.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
