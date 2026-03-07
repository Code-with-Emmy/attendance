import Link from "next/link";
import { ArrowLeft, FileText, ShieldCheck } from "lucide-react";
import { PublicSiteShell } from "@/components/PublicSiteShell";

type LegalSection = {
  title: string;
  body: string;
};

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  sections: LegalSection[];
};

export function LegalPageShell({
  eyebrow,
  title,
  description,
  sections,
}: Props) {
  return (
    <PublicSiteShell>
      <div className="site-container py-16">
        <header className="site-card rounded-[2rem] p-8 sm:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <p className="section-label">{eyebrow}</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                {title}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-slate-400">
                {description}
              </p>
            </div>

            <div className="grid gap-3 sm:min-w-[16rem]">
              <div className="rounded-[1.4rem] border border-white/8 bg-white/5 px-4 py-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-300" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Product Policy
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      Biometric and attendance terms
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-[1.4rem] border border-white/8 bg-white/5 px-4 py-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-200" />
                  <p className="text-sm leading-6 text-slate-400">
                    Review these pages before customer launch and jurisdiction
                    rollout.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="mt-8 grid gap-5">
          {sections.map((section) => (
            <article
              key={section.title}
              className="site-card rounded-[1.8rem] px-6 py-6 sm:px-7"
            >
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-slate-500">
                Section
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                {section.title}
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400 sm:text-base">
                {section.body}
              </p>
            </article>
          ))}
        </section>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="cta-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
            Return Home
          </Link>
          <Link
            href="/login"
            className="cta-primary"
          >
            Open Admin
          </Link>
        </div>
      </div>
    </PublicSiteShell>
  );
}
