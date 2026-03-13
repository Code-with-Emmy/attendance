"use client";

import { useState } from "react";

type DemoFormState = {
  fullName: string;
  company: string;
  email: string;
  phone: string;
  teamSize: string;
  message: string;
};

const INITIAL_STATE: DemoFormState = {
  fullName: "",
  company: "",
  email: "",
  phone: "",
  teamSize: "",
  message: "",
};

export function DemoForm() {
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  function updateField<Key extends keyof DemoFormState>(
    key: Key,
    value: DemoFormState[Key],
  ) {
    setFormData((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/demo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error || payload?.message || "Unable to book demo.");
      }

      setStatus("success");
      setMessage(
        payload?.message ||
          "Demo request received. Our team can now follow up from the stored record.",
      );
      setFormData(INITIAL_STATE);
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Unable to book demo.",
      );
    }
  }

  return (
    <form onSubmit={onSubmit} className="site-card rounded-[2rem] p-7">
      <p className="section-label">Book Demo</p>
      <h2 className="mt-4 text-3xl font-black text-white">
        Schedule a guided product walkthrough
      </h2>

      <div className="mt-7 grid gap-5 md:grid-cols-2">
        <label>
          <span className="label-text">Full Name</span>
          <input
            className="input-field"
            value={formData.fullName}
            onChange={(event) => updateField("fullName", event.target.value)}
            placeholder="Jane Doe"
            required
          />
        </label>

        <label>
          <span className="label-text">Company</span>
          <input
            className="input-field"
            value={formData.company}
            onChange={(event) => updateField("company", event.target.value)}
            placeholder="Acme Operations"
            required
          />
        </label>

        <label>
          <span className="label-text">Email</span>
          <input
            type="email"
            className="input-field"
            value={formData.email}
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="you@company.com"
            required
          />
        </label>

        <label>
          <span className="label-text">Phone</span>
          <input
            className="input-field"
            value={formData.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            placeholder="+1 (555) 000-0000"
            required
          />
        </label>

        <label className="md:col-span-2">
          <span className="label-text">Team Size</span>
          <select
            className="select-field"
            value={formData.teamSize}
            onChange={(event) => updateField("teamSize", event.target.value)}
            required
          >
            <option value="">Select team size</option>
            <option value="1-25">1-25 employees</option>
            <option value="26-100">26-100 employees</option>
            <option value="101-250">101-250 employees</option>
            <option value="251-500">251-500 employees</option>
            <option value="500+">500+ employees</option>
          </select>
        </label>

        <label className="md:col-span-2">
          <span className="label-text">Message</span>
          <textarea
            className="textarea-field min-h-36"
            value={formData.message}
            onChange={(event) => updateField("message", event.target.value)}
            placeholder="Tell us about your attendance process, rollout timeline, or deployment goals."
            required
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="cta-primary mt-7 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? "Booking Demo..." : "Book Demo"}
      </button>

      {message ? (
        <div
          className={`mt-5 rounded-2xl px-4 py-3 text-sm ${
            status === "success"
              ? "border border-[#E67300]/20 bg-[#E67300]/10 text-[#ffe0bc]"
              : "border border-red-400/20 bg-red-400/10 text-red-200"
          }`}
        >
          {message}
        </div>
      ) : null}
    </form>
  );
}
