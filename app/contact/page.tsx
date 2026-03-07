import { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { PublicSiteShell } from "@/components/PublicSiteShell";

export const metadata: Metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <PublicSiteShell>
      <section className="site-container py-18">
        <div className="grid gap-8 xl:grid-cols-[1.04fr_0.96fr]">
          <ContactForm />

          <aside className="space-y-6">
            <section className="site-card rounded-[2rem] p-7">
              <p className="section-label">Contact Details</p>
              <div className="mt-6 space-y-4">
                {[
                  {
                    title: "Email",
                    value: "sales@attendancekiosk.app",
                    icon: Mail,
                  },
                  {
                    title: "Phone",
                    value: "+1 (555) 101-4488",
                    icon: Phone,
                  },
                  {
                    title: "Coverage",
                    value: "Remote demos and deployments worldwide",
                    icon: MapPin,
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="rounded-[1.5rem] border border-white/8 bg-white/5 p-5"
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl border border-white/8 bg-slate-950/50 p-3 text-blue-200">
                          <Icon className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {item.title}
                          </p>
                          <p className="mt-2 text-sm leading-7 text-slate-400">
                            {item.value}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="site-card rounded-[2rem] p-7">
              <p className="section-label">Best For</p>
              <p className="mt-4 text-base leading-8 text-slate-400">
                Use this route for product questions, rollout planning, sales
                follow-up, or security and compliance conversations.
              </p>
            </section>
          </aside>
        </div>
      </section>
    </PublicSiteShell>
  );
}
