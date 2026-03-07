import type { Metadata } from "next";
import { AttendanceKioskScreen } from "@/components/AttendanceKioskScreen";

export const metadata: Metadata = {
  title: "AttendanceKiosk — Biometric Terminal",
  description:
    "Premium biometric facial recognition kiosk terminal for enterprise clock-in and clock-out attendance.",
};

export default function KioskPage() {
  return <AttendanceKioskScreen />;
}
