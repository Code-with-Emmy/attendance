import Link from "next/link";
import { ArrowRight } from "lucide-react";

type CTASectionProps = {
  title: string;
  description: string;
};

export function CTASection({ title, description }: CTASectionProps) {
  return (
    <section className="site-container py-18">
      <div className="site-card overflow-hidden rounded-[2rem] p-8 sm:p-10 lg:p-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="section-label">Next Step</p>
            <h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              {title}
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-400">
              {description}
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row lg:flex-col">
            <Link href="/demo" className="cta-primary">
              Book Demo
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/trial" className="cta-secondary">
              Start Free Trial
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
