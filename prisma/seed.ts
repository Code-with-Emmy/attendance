import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const planSeeds = [
  {
    code: "starter",
    name: "Starter",
    description: "Single-kiosk attendance for small teams.",
    monthlyPrice: 2900,
    yearlyPrice: 29000,
    currency: "USD",
    maxEmployees: 10,
    maxDevices: 1,
    isActive: true,
    features: [
      { code: "attendance", label: "Basic attendance tracking" },
      { code: "kiosk", label: "Single kiosk deployment" },
      { code: "reports", label: "Standard reports" },
    ],
  },
  {
    code: "growth",
    name: "Growth",
    description: "Recommended plan for scaling teams and multi-kiosk operations.",
    monthlyPrice: 9900,
    yearlyPrice: 99000,
    currency: "USD",
    maxEmployees: 50,
    maxDevices: 3,
    isActive: true,
    features: [
      { code: "attendance", label: "Advanced attendance tracking" },
      { code: "kiosk", label: "Up to 3 kiosks" },
      { code: "shifts", label: "Shift support" },
      { code: "reports", label: "Advanced reports" },
    ],
  },
  {
    code: "pro",
    name: "Pro",
    description: "Multi-branch attendance with payroll exports and premium support.",
    monthlyPrice: 24900,
    yearlyPrice: 249000,
    currency: "USD",
    maxEmployees: 200,
    maxDevices: 10,
    isActive: true,
    features: [
      { code: "attendance", label: "Multi-branch attendance" },
      { code: "kiosk", label: "Up to 10 kiosks" },
      { code: "payroll", label: "Payroll exports" },
      { code: "prioritySupport", label: "Premium support" },
    ],
  },
  {
    code: "enterprise",
    name: "Enterprise",
    description: "Custom onboarding, integrations, and SLA-backed support.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: "USD",
    maxEmployees: 1000000,
    maxDevices: 10000,
    isActive: true,
    features: [
      { code: "attendance", label: "Custom attendance workflows" },
      { code: "integrations", label: "Custom integrations" },
      { code: "sla", label: "Dedicated SLA" },
      { code: "prioritySupport", label: "Dedicated support" },
    ],
  },
];

async function main() {
  for (const plan of planSeeds) {
    await prisma.subscriptionPlan.upsert({
      where: { code: plan.code },
      update: plan,
      create: plan,
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
