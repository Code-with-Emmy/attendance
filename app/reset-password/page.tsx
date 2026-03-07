import { KeyRound } from "lucide-react";
import { PublicSiteShell } from "@/components/PublicSiteShell";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { token = "" } = await searchParams;

  return (
    <PublicSiteShell>
      <section className="site-container py-18">
        <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="site-card rounded-4xl p-8 sm:p-10">
            <p className="section-label">Secure Reset</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
              Set a new password for your admin workspace
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-400">
              Use the secure link from your email to update your password and
              return to the AttendanceKiosk admin console.
            </p>

            <div className="mt-8 rounded-4xl border border-white/8 bg-white/5 p-5">
              <div className="flex items-start gap-3">
                <KeyRound className="mt-1 h-5 w-5 text-blue-300" />
                <p className="text-sm leading-7 text-slate-400">
                  Reset links expire automatically and are invalidated after
                  use to reduce account recovery abuse.
                </p>
              </div>
            </div>
          </div>

          <ResetPasswordForm token={token} />
        </div>
      </section>
    </PublicSiteShell>
  );
}
