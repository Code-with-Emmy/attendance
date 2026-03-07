import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

type PublicSiteShellProps = {
  children: React.ReactNode;
};

export function PublicSiteShell({ children }: PublicSiteShellProps) {
  return (
    <div className="site-shell">
      <div className="pointer-events-none absolute inset-0">
        <div className="site-grid absolute inset-0 opacity-20" />
        <div className="absolute left-[8%] top-24 h-56 w-56 rounded-full bg-blue-500/14 blur-3xl" />
        <div className="absolute right-[6%] top-52 h-72 w-72 rounded-full bg-cyan-500/8 blur-3xl" />
        <div className="absolute bottom-28 left-1/3 h-64 w-64 rounded-full bg-emerald-500/8 blur-3xl" />
      </div>

      <div className="relative">
        <Navbar />
        <main>{children}</main>
        <Footer />
      </div>
    </div>
  );
}
