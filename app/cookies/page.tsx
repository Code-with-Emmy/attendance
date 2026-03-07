import { LegalPageShell } from "@/components/LegalPageShell";

export default function CookiesPage() {
  return (
    <LegalPageShell
      eyebrow="Cookie Policy"
      title="Browser storage for site, admin, and kiosk flows"
      description="This page explains browser-side storage used by the public site, the admin console, and the kiosk activation and sync experience."
      sections={[
        {
          title: "What is stored",
          body: "The product may use local storage, session storage, and authentication cookies to maintain kiosk activation, admin authentication, and essential application state.",
        },
        {
          title: "Why it is needed",
          body: "Storage keeps the kiosk bound to an approved device, preserves authenticated admin sessions, and supports attendance sync behavior when connectivity is unstable.",
        },
        {
          title: "Managing preferences",
          body: "Users can clear browser data locally, but clearing kiosk storage may require reactivation with a valid device token. This should be documented clearly during customer rollout and device support.",
        },
      ]}
    />
  );
}
