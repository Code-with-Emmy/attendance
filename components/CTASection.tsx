import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { siteAssets } from "@/lib/site-assets";

type CTASectionProps = {
  title: string;
  description: string;
};

export function CTASection({ title, description }: CTASectionProps) {
  return (
    <section className="bg-[#020617] pb-20">
      <div className="site-container">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[rgba(15,23,42,0.88)] shadow-[0_24px_90px_rgba(2,6,23,0.4)] backdrop-blur-xl">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative min-h-[360px]">
              <Image
                src={siteAssets.operationsPhoto}
                alt="AttendanceKiosk in a real workplace environment"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.92),rgba(2,6,23,0.7),rgba(2,6,23,0.3))]" />
              <div className="relative flex h-full flex-col justify-center px-8 py-10 lg:px-12">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#3B82F6]">
                  Ready to launch
                </p>
                <h2 className="mt-4 max-w-3xl font-heading text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                  {title}
                </h2>
                <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
                  {description}
                </p>

                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <Link
                    href="/demo"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#3B82F6] px-6 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(59,130,246,0.35)] transition hover:-translate-y-0.5 hover:bg-[#60A5FA]"
                  >
                    Book Demo
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/trial"
                    className="inline-flex h-12 items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 text-sm font-medium text-slate-100 transition hover:border-white/20 hover:bg-white/10"
                  >
                    Start Free Trial
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid gap-px bg-white/10">
              {[
                {
                  label: "Rollout speed",
                  value: "Move from one kiosk to multiple locations without changing the attendance workflow.",
                },
                {
                  label: "Operational trust",
                  value: "Reduce attendance disputes with liveness verification, auditability, and cleaner logs.",
                },
                {
                  label: "Business impact",
                  value: "Give HR, operations, and payroll the same attendance truth in real time.",
                },
              ].map((item) => (
                <div key={item.label} className="bg-[#0F172A] p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#3B82F6]">
                    {item.label}
                  </p>
                  <p className="mt-3 text-lg leading-8 text-slate-200">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
