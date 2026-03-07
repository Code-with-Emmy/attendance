import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BadgeCheck,
  Building2,
  Camera,
  CheckCircle2,
  Clock3,
  CreditCard,
  Lock,
  MonitorSmartphone,
  ShieldCheck,
  Users,
} from "lucide-react";

export type SitePlanId = "starter" | "growth" | "pro" | "enterprise";
export type BillingPeriod = "monthly" | "yearly";

export type SiteFeature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export type SitePlan = {
  id: SitePlanId;
  name: string;
  audience: string;
  monthlyPrice: number | null;
  yearlyPrice: number | null;
  priceLabel: string;
  description: string;
  badge?: string;
  highlight?: boolean;
  ctaLabel: string;
  ctaHref: string;
  features: string[];
};

export const siteNavigation = [
  { label: "Product", href: "/#product" },
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Security", href: "/security" },
  { label: "Contact", href: "/contact" },
] as const;

export const trustBullets = [
  "Liveness verified face recognition",
  "Real-time attendance tracking",
  "Payroll-ready reports",
];

export const problemPoints = [
  {
    title: "Buddy punching",
    description:
      "Shared PINs and paper sheets make time theft easy and hard to dispute.",
  },
  {
    title: "Manual timesheets",
    description:
      "Supervisors chase handwritten logs instead of operating from live attendance data.",
  },
  {
    title: "Payroll mistakes",
    description:
      "Incorrect hours create avoidable payroll disputes, rework, and delayed approvals.",
  },
  {
    title: "No visibility",
    description:
      "Operations leaders cannot see attendance health across teams and locations in real time.",
  },
] as const;

export const featureItems: SiteFeature[] = [
  {
    icon: Camera,
    title: "Facial Recognition",
    description:
      "Fast face matching built for kiosk use on office, retail, and frontline devices.",
  },
  {
    icon: BadgeCheck,
    title: "Liveness Detection",
    description:
      "Stops spoof attempts with an active liveness verification layer before attendance is accepted.",
  },
  {
    icon: MonitorSmartphone,
    title: "Device-Locked Kiosk",
    description:
      "Bind tablets or laptops to approved kiosk devices and enforce a dedicated attendance mode.",
  },
  {
    icon: Building2,
    title: "Admin Dashboard",
    description:
      "Manage employees, locations, shifts, kiosks, and attendance exceptions from one console.",
  },
  {
    icon: Activity,
    title: "Attendance Reports",
    description:
      "Review live punch activity, lateness patterns, and payroll-ready daily and monthly reports.",
  },
  {
    icon: Users,
    title: "Multi-Location Support",
    description:
      "Run attendance across several branches while keeping policies and visibility centralized.",
  },
  {
    icon: Lock,
    title: "Role-Based Access",
    description:
      "Separate permissions for HR, operations, branch managers, and finance stakeholders.",
  },
  {
    icon: CreditCard,
    title: "Payroll Exports",
    description:
      "Prepare clean exports for payroll workflows and downstream finance tooling.",
  },
];

export const workflowSteps = [
  {
    step: "Step 1",
    title: "Open Kiosk",
    description:
      "Launch the kiosk on an approved device and present the live camera frame to employees.",
  },
  {
    step: "Step 2",
    title: "Verify Face with Liveness",
    description:
      "The kiosk confirms identity with face recognition and checks for a live subject before accepting the attempt.",
  },
  {
    step: "Step 3",
    title: "Attendance Logged Instantly",
    description:
      "Clock-in or clock-out is written in real time for dashboards, exports, and payroll processing.",
  },
] as const;

export const securityPrinciples = [
  {
    icon: ShieldCheck,
    title: "Face embeddings instead of raw photos",
    description:
      "AttendanceKiosk is designed to match against biometric embeddings so organizations can limit raw image retention.",
  },
  {
    icon: BadgeCheck,
    title: "Liveness verification",
    description:
      "A liveness layer reduces spoofing risk before attendance records are written into the system.",
  },
  {
    icon: Activity,
    title: "Tamper-evident audit logs",
    description:
      "Administrative changes, attendance events, and device activity are tracked for operational review.",
  },
  {
    icon: Lock,
    title: "Role-based access",
    description:
      "Sensitive workflows are restricted by role so only approved admins can manage employees and devices.",
  },
  {
    icon: Building2,
    title: "Secure Postgres-backed storage",
    description:
      "Attendance records, device metadata, and organization settings are structured for durable backend storage.",
  },
  {
    icon: MonitorSmartphone,
    title: "Device control and kiosk security",
    description:
      "Organizations can activate, revoke, and monitor kiosk devices from a central administrative layer.",
  },
];

export const pricingPlans: SitePlan[] = [
  {
    id: "starter",
    name: "Starter",
    audience: "Small teams",
    monthlyPrice: 29,
    yearlyPrice: 290,
    priceLabel: "$29",
    description: "For small teams starting with a single kiosk.",
    ctaLabel: "Choose Starter",
    ctaHref: "/purchase?plan=starter",
    features: [
      "Single kiosk deployment",
      "Up to 10 employees",
      "Basic attendance tracking",
      "Standard reports",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    audience: "Scaling operations",
    monthlyPrice: 99,
    yearlyPrice: 990,
    priceLabel: "$99",
    description: "For teams adding more kiosks, shifts, and deeper reporting.",
    badge: "Most Popular",
    highlight: true,
    ctaLabel: "Choose Growth",
    ctaHref: "/purchase?plan=growth",
    features: [
      "Up to 50 employees",
      "Up to 3 kiosks",
      "Shift support",
      "Advanced attendance reports",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    audience: "Multi-branch businesses",
    monthlyPrice: 249,
    yearlyPrice: 2490,
    priceLabel: "$249",
    description: "For mature teams running multiple branches and payroll workflows.",
    ctaLabel: "Choose Pro",
    ctaHref: "/purchase?plan=pro",
    features: [
      "Up to 200 employees",
      "Up to 10 kiosks",
      "Role-based access",
      "Payroll exports",
      "Premium support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    audience: "Large organizations",
    monthlyPrice: null,
    yearlyPrice: null,
    priceLabel: "Custom",
    description: "For large deployments with compliance, integrations, and SLA requirements.",
    ctaLabel: "Talk to Sales",
    ctaHref: "/demo",
    features: [
      "Custom onboarding",
      "Dedicated support",
      "Custom integrations",
      "Enterprise SLA",
    ],
  },
];

export const purchaseBenefits = [
  {
    icon: CheckCircle2,
    title: "Launch in days",
    description:
      "Get your kiosk, admin dashboard, and attendance workflows ready without hardware lock-in.",
  },
  {
    icon: Clock3,
    title: "Reduce payroll friction",
    description:
      "Move from manual checks to clear, exportable attendance records.",
  },
  {
    icon: ShieldCheck,
    title: "Operate with confidence",
    description:
      "Use liveness verification, audit visibility, and device controls from day one.",
  },
];

export function getPlanById(planId: string | null | undefined): SitePlan {
  return (
    pricingPlans.find((plan) => plan.id === planId) ??
    pricingPlans.find((plan) => plan.id === "growth")!
  );
}

export function getPlanPrice(
  plan: SitePlan,
  billingPeriod: BillingPeriod,
): number | null {
  return billingPeriod === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
}

export function formatPlanPrice(
  plan: SitePlan,
  billingPeriod: BillingPeriod,
): string {
  const value = getPlanPrice(plan, billingPeriod);
  if (value === null) {
    return "Custom";
  }

  if (billingPeriod === "yearly") {
    return `$${value}/year`;
  }

  return `$${value}/month`;
}
