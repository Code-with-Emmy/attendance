import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Attendance System",
  description: "Modern face-recognition attendance platform for kiosk clock in and admin operations.",
};

import { Lato } from "next/font/google";

const lato = Lato({
  subsets: ["latin"],
  weight: ["100", "300", "400", "700", "900"],
  variable: "--font-lato",
});

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${lato.variable} font-sans antialiased text-responsive`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
