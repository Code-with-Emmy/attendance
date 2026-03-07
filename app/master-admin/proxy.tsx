"use client";

import { useAuthUser } from "@/hooks/use-auth-user";
import { BrandLoader } from "@/components/brand-loader";

export function MasterAdminProxy({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthUser({ requireMasterAdmin: true });

  if (loading || !user) {
    return <BrandLoader label="Verifying platform clearance..." />;
  }

  return <>{children}</>;
}
