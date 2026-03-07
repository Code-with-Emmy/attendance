"use client";

import Link from "next/link";
import { useState } from "react";

type ResetPasswordFormProps = {
  token: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          payload?.error || payload?.message || "Unable to reset password.",
        );
      }

      setStatus("success");
      setMessage(
        payload?.message ||
          "Password updated successfully. You can now sign in.",
      );
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Unable to reset password.",
      );
    }
  }

  if (!token) {
    return (
      <div className="site-card rounded-[2rem] p-7">
        <p className="section-label">Invalid Reset Link</p>
        <h2 className="mt-4 text-3xl font-semibold text-white">
          This password reset link is incomplete
        </h2>
        <p className="mt-4 text-sm leading-7 text-slate-400">
          Request a new reset link and use the latest email you receive.
        </p>
        <div className="mt-6">
          <Link href="/forgot-password" className="cta-secondary">
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="site-card rounded-[2rem] p-7">
      <p className="section-label">Reset Password</p>
      <h2 className="mt-4 text-3xl font-semibold text-white">
        Choose a new admin password
      </h2>
      <p className="mt-4 text-sm leading-7 text-slate-400">
        Use a strong password that is unique to your AttendanceKiosk admin
        account.
      </p>

      <div className="mt-7 grid gap-5">
        <label>
          <span className="label-text">New Password</span>
          <input
            type="password"
            className="input-field"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter new password"
            required
          />
        </label>

        <label>
          <span className="label-text">Confirm New Password</span>
          <input
            type="password"
            className="input-field"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm new password"
            required
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="cta-primary mt-7 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? "Updating Password..." : "Reset Password"}
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
          <p>{message}</p>
          {status === "success" ? (
            <div className="mt-3">
              <Link href="/login" className="text-blue-200 hover:text-blue-100">
                Continue to Login
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
