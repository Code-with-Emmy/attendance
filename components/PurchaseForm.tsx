"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import {
  formatPublicMoney,
  getPublicPlanAmount,
  type PublicBillingCycle,
  type PublicPlan,
} from "@/lib/billing/public";
import {
  purchaseBenefits,
} from "@/lib/site-content";
import { PlanSelector } from "@/components/PlanSelector";

type PurchaseFormProps = {
  initialPlan: PublicPlan;
  plans: PublicPlan[];
};

type PurchaseState = {
  fullName: string;
  businessName: string;
  workEmail: string;
  phone: string;
  companySize: string;
  employeeCount: string;
  deviceCount: string;
};

const INITIAL_STATE: PurchaseState = {
  fullName: "",
  businessName: "",
  workEmail: "",
  phone: "",
  companySize: "",
  employeeCount: "",
  deviceCount: "",
};

export function PurchaseForm({ initialPlan, plans }: PurchaseFormProps) {
  const router = useRouter();
  const [selectedPlanCode, setSelectedPlanCode] = useState(initialPlan.code);
  const [billingPeriod, setBillingPeriod] =
    useState<PublicBillingCycle>("MONTHLY");
  const [formData, setFormData] = useState<PurchaseState>(INITIAL_STATE);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);

  const selectedPlan =
    plans.find((plan) => plan.code === selectedPlanCode) ?? initialPlan;
  const selectedPrice = getPublicPlanAmount(selectedPlan, billingPeriod);
  const annualSavings =
    selectedPlan.monthlyPrice * 12 - selectedPlan.yearlyPrice;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setStatus("loading");
    setMessage("");
    setIsRedirecting(false);

    try {
      const intentResponse = await fetch("/api/purchase/create-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          employeeCount: Number(formData.employeeCount),
          deviceCount: Number(formData.deviceCount),
          planCode: selectedPlan.code,
          billingPeriod: billingPeriod.toLowerCase(),
        }),
      });

      const intentPayload = (await intentResponse.json().catch(() => null)) as
        | { message?: string; error?: string; purchaseIntentId?: string }
        | null;

      if (!intentResponse.ok || !intentPayload?.purchaseIntentId) {
        throw new Error(
          intentPayload?.error ||
            intentPayload?.message ||
            "Unable to create purchase intent.",
        );
      }

      const checkoutResponse = await fetch("/api/purchase/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          purchaseIntentId: intentPayload.purchaseIntentId,
        }),
      });

      const checkoutPayload = (await checkoutResponse.json().catch(() => null)) as
        | { message?: string; error?: string; checkoutUrl?: string }
        | null;

      if (!checkoutResponse.ok || !checkoutPayload?.checkoutUrl) {
        throw new Error(
          checkoutPayload?.error ||
            checkoutPayload?.message ||
            "Unable to create checkout session.",
        );
      }

      setStatus("success");
      setIsRedirecting(true);
      setMessage("Redirecting to secure checkout...");
      window.location.href = checkoutPayload.checkoutUrl;
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to start purchase flow.",
      );
    }
  }

  function onPlanChange(planCode: string) {
    setSelectedPlanCode(planCode);
    router.replace(`/purchase?plan=${planCode}`, { scroll: false });
  }

  if (selectedPlan.code === "enterprise") {
    return (
      <div className="site-card rounded-[2rem] p-8">
        <p className="section-label">Enterprise Purchase</p>
        <h2 className="mt-4 text-3xl font-semibold text-white">
          Enterprise plans are handled through a guided sales process.
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-8 text-slate-400">
          Custom onboarding, integrations, and SLA commitments are scoped during
          a demo and solution design session.
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Link href="/demo" className="cta-primary">
            Book Demo
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/pricing" className="cta-secondary">
            Back to Pricing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
      <form onSubmit={onSubmit} className="space-y-8">
        <section className="site-card rounded-[2rem] p-7">
          <p className="section-label">Selected Plan</p>
          <h2 className="mt-4 text-3xl font-semibold text-white">
            Configure your subscription
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-8 text-slate-400">
            Choose the plan and billing period that fits your deployment. The
            form is ready for Stripe or Flutterwave checkout integration later.
          </p>

          <div className="mt-8">
            <PlanSelector
              plans={plans}
              selectedPlanCode={selectedPlanCode}
              billingPeriod={billingPeriod}
              onPlanChange={onPlanChange}
              onBillingChange={setBillingPeriod}
            />
          </div>
        </section>

        <section className="site-card rounded-[2rem] p-7">
          <p className="section-label">Business Information</p>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label>
              <span className="label-text">Full Name</span>
              <input
                className="input-field"
                value={formData.fullName}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    fullName: event.target.value,
                  }))
                }
                placeholder="Jane Doe"
                required
              />
            </label>

            <label>
              <span className="label-text">Business Name</span>
              <input
                className="input-field"
                value={formData.businessName}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    businessName: event.target.value,
                  }))
                }
                placeholder="Acme Operations Ltd"
                required
              />
            </label>

            <label>
              <span className="label-text">Work Email</span>
              <input
                type="email"
                className="input-field"
                value={formData.workEmail}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    workEmail: event.target.value,
                  }))
                }
                placeholder="ops@company.com"
                required
              />
            </label>

            <label>
              <span className="label-text">Phone</span>
              <input
                className="input-field"
                value={formData.phone}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
                placeholder="+234 800 000 0000"
                required
              />
            </label>

            <label className="md:col-span-2">
              <span className="label-text">Company Size</span>
              <select
                className="select-field"
                value={formData.companySize}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    companySize: event.target.value,
                  }))
                }
                required
              >
                <option value="">Select company size</option>
                <option value="1-25">1-25 employees</option>
                <option value="26-100">26-100 employees</option>
                <option value="101-250">101-250 employees</option>
                <option value="251-500">251-500 employees</option>
                <option value="500+">500+ employees</option>
              </select>
            </label>

            <label>
              <span className="label-text">Employee Count</span>
              <input
                type="number"
                min={1}
                className="input-field"
                value={formData.employeeCount}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    employeeCount: event.target.value,
                  }))
                }
                placeholder="25"
                required
              />
            </label>

            <label>
              <span className="label-text">Device Count</span>
              <input
                type="number"
                min={1}
                className="input-field"
                value={formData.deviceCount}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    deviceCount: event.target.value,
                  }))
                }
                placeholder="2"
                required
              />
            </label>
          </div>
        </section>

        <section className="site-card rounded-[2rem] p-7">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-blue-400/18 bg-blue-500/10 p-3 text-blue-200">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="section-label">Payment</p>
              <h3 className="mt-1 text-2xl font-semibold text-white">
                Payment integration placeholder
              </h3>
            </div>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-dashed border-white/12 bg-slate-950/45 p-6">
            <p className="text-sm leading-7 text-slate-300">
              Your checkout session will be created on the server using
              provider-side pricing data from Postgres. Stripe is the default
              provider, and the architecture is ready for Flutterwave.
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">
                  Stripe checkout
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Redirect to hosted checkout or embedded payment element.
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">
                  Flutterwave checkout
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Support local cards and regional payment methods.
                </p>
              </div>
            </div>
            {/* TODO: integrate Stripe checkout */}
            {/* TODO: integrate Flutterwave checkout */}
          </div>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row">
            <button
              type="submit"
              className="cta-primary"
              disabled={status === "loading" || isRedirecting}
            >
              {status === "loading" || isRedirecting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Start Subscription
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
            <Link href="/pricing" className="cta-secondary">
              Back to Pricing
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {message ? (
            <div
              className={`mt-5 rounded-2xl px-4 py-3 text-sm ${
                status === "success"
                  ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                  : "border border-red-400/20 bg-red-400/10 text-red-200"
              }`}
            >
              {message}
            </div>
          ) : null}
        </section>
      </form>

      <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
        <section className="site-card rounded-[2rem] p-7">
          <p className="section-label">Order Summary</p>
          <h3 className="mt-4 text-3xl font-semibold text-white">
            {selectedPlan.name}
          </h3>
          <p className="mt-2 text-sm text-slate-400">{selectedPlan.description}</p>

          <div className="mt-6 rounded-[1.5rem] border border-white/8 bg-slate-950/55 p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm text-slate-400">Billing</p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  {`${formatPublicMoney(selectedPrice, selectedPlan.currency)}/${
                    billingPeriod === "YEARLY" ? "year" : "month"
                  }`}
                </p>
              </div>
              <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
                {billingPeriod.toLowerCase()}
              </span>
            </div>
            {annualSavings ? (
              <p className="mt-4 text-sm text-emerald-300">
                Save {formatPublicMoney(annualSavings, selectedPlan.currency)} per
                year with annual billing.
              </p>
            ) : null}
            <p className="mt-3 text-sm text-slate-400">
              Amount due at checkout: {formatPublicMoney(selectedPrice, selectedPlan.currency)}
            </p>
            <p className="mt-3 text-sm text-slate-400">
              Supports up to {selectedPlan.maxEmployees} employees and {selectedPlan.maxDevices} devices.
            </p>
          </div>

          <div className="surface-divider mt-6 pt-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Included
            </p>
            <ul className="mt-4 space-y-3">
              {selectedPlan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-3 text-sm text-slate-300"
                >
                  <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-emerald-300" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="site-card rounded-[2rem] p-7">
          <p className="section-label">Why Teams Buy</p>
          <div className="mt-6 space-y-4">
            {purchaseBenefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <div
                  key={benefit.title}
                  className="rounded-[1.4rem] border border-white/8 bg-white/5 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl border border-white/8 bg-slate-950/50 p-3 text-blue-200">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {benefit.title}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-slate-400">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="site-card rounded-[2rem] p-7">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-emerald-300">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">
                Subscription setup support
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                Need help choosing kiosk hardware or onboarding locations first?
                Book a guided demo and we’ll shape the rollout with you.
              </p>
            </div>
          </div>
        </section>
      </aside>
    </div>
  );
}
