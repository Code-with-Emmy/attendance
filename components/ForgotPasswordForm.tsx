"use client";

import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          payload?.error || payload?.message || "Unable to send reset link.",
        );
      }

      setStatus("success");
      setMessage(
        payload?.message ||
          "If an account exists for that email, a reset link has been sent.",
      );
      setEmail("");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Unable to send reset link.",
      );
    }
  }

  return (
    <form onSubmit={onSubmit} className="site-card rounded-[2rem] p-7">
      <p className="section-label">Password Recovery</p>
      <h2 className="mt-4 text-3xl font-semibold text-white">
        Request a secure reset link
      </h2>
      <p className="mt-4 text-sm leading-7 text-slate-400">
        Enter the email tied to your admin account. We will send a time-limited
        password reset link if the account exists.
      </p>

      <div className="mt-7 grid gap-5">
        <label>
          <span className="label-text">Email</span>
          <input
            type="email"
            className="input-field"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@company.com"
            required
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="cta-primary mt-7 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? "Sending Link..." : "Send Reset Link"}
      </button>

      <div className="mt-5 text-sm text-slate-400">
        <Link href="/login" className="text-blue-300 hover:text-blue-200">
          Back to login
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
    </form>
  );
}
