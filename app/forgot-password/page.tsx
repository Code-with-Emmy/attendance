import { ShieldCheck } from "lucide-react";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";
import { PublicSiteShell } from "@/components/PublicSiteShell";

export default function ForgotPasswordPage() {
  return (
    <PublicSiteShell>
      <section className="site-container py-18">
        <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="site-card rounded-4xl p-8 sm:p-10">
            <p className="section-label">Account Recovery</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
              Recover admin access securely
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-400">
              AttendanceKiosk uses time-limited password reset tokens and
              server-side verification before any password change is applied.
            </p>

            <div className="mt-8 rounded-4xl border border-white/8 bg-white/5 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-1 h-5 w-5 text-emerald-300" />
                <p className="text-sm leading-7 text-slate-400">
                  Reset requests are logged, tokenized, and validated on the
                  server before the linked Supabase account is updated.
                </p>
              </div>
            </div>
          </div>

          <ForgotPasswordForm />
        </div>
      </section>
    </PublicSiteShell>
  );
}
