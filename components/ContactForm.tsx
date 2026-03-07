"use client";

import { useState } from "react";

type ContactFormState = {
  name: string;
  email: string;
  company: string;
  subject: string;
  message: string;
};

const INITIAL_CONTACT_STATE: ContactFormState = {
  name: "",
  email: "",
  company: "",
  subject: "",
  message: "",
};

export function ContactForm() {
  const [formData, setFormData] = useState(INITIAL_CONTACT_STATE);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  function updateField<Key extends keyof ContactFormState>(
    key: Key,
    value: ContactFormState[Key],
  ) {
    setFormData((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/contact", {
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
        throw new Error(
          payload?.error || payload?.message || "Unable to send message.",
        );
      }

      setStatus("success");
      setMessage(
        payload?.message ||
          "Message received. The submission is now stored for follow-up.",
      );
      setFormData(INITIAL_CONTACT_STATE);
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Unable to send message.",
      );
    }
  }

  return (
    <form onSubmit={onSubmit} className="site-card rounded-[2rem] p-7">
      <p className="section-label">Contact</p>
      <h2 className="mt-4 text-3xl font-semibold text-white">
        Send a message
      </h2>

      <div className="mt-7 grid gap-5 md:grid-cols-2">
        <label>
          <span className="label-text">Name</span>
          <input
            className="input-field"
            value={formData.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Jane Doe"
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
            placeholder="jane@company.com"
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
          <span className="label-text">Subject</span>
          <input
            className="input-field"
            value={formData.subject}
            onChange={(event) => updateField("subject", event.target.value)}
            placeholder="Deployment question"
            required
          />
        </label>

        <label className="md:col-span-2">
          <span className="label-text">Message</span>
          <textarea
            className="textarea-field min-h-40"
            value={formData.message}
            onChange={(event) => updateField("message", event.target.value)}
            placeholder="Tell us what you need help with."
            required
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="cta-primary mt-7 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? "Sending..." : "Send Message"}
      </button>

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
    </form>
  );
}
