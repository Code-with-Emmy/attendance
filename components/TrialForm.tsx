"use client";

import Link from "next/link";
import { useState } from "react";

type TrialFormState = {
  businessEmail: string;
  organizationName: string;
  teamSize: string;
  password: string;
  confirmPassword: string;
};

const INITIAL_STATE: TrialFormState = {
  businessEmail: "",
  organizationName: "",
  teamSize: "",
  password: "",
  confirmPassword: "",
};

export function TrialForm() {
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const [loginEmail, setLoginEmail] = useState("");

  function updateField<Key extends keyof TrialFormState>(
    key: Key,
    value: TrialFormState[Key],
  ) {
    setFormData((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/trial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            message?: string;
            error?: string;
            loginEmail?: string;
          }
        | null;

      if (!response.ok) {
        throw new Error(
          payload?.error || payload?.message || "Unable to start free trial.",
        );
      }

      setStatus("success");
      setMessage(
        payload?.message ||
          "Trial workspace provisioned successfully. You can now sign in.",
      );
      setLoginEmail(payload?.loginEmail || formData.businessEmail);
      setFormData(INITIAL_STATE);
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Unable to start free trial.",
      );
    }
  }

  return (
    <form onSubmit={onSubmit} className="site-card rounded-[2rem] p-7">
      <p className="section-label">Start Free Trial</p>
      <h2 className="mt-4 text-3xl font-semibold text-white">
        Create your AttendanceKiosk workspace
      </h2>

      <div className="mt-7 grid gap-5">
        <label>
          <span className="label-text">Business Email</span>
          <input
            type="email"
            className="input-field"
            value={formData.businessEmail}
            onChange={(event) =>
              updateField("businessEmail", event.target.value)
            }
            placeholder="ops@company.com"
            required
          />
        </label>

        <label>
          <span className="label-text">Organization Name</span>
          <input
            className="input-field"
            value={formData.organizationName}
            onChange={(event) =>
              updateField("organizationName", event.target.value)
            }
            placeholder="Acme Operations"
            required
          />
        </label>

        <label>
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

        <div className="grid gap-5 md:grid-cols-2">
          <label>
            <span className="label-text">Password</span>
            <input
              type="password"
              className="input-field"
              value={formData.password}
              onChange={(event) => updateField("password", event.target.value)}
              placeholder="Create password"
              required
            />
          </label>

          <label>
            <span className="label-text">Confirm Password</span>
            <input
              type="password"
              className="input-field"
              value={formData.confirmPassword}
              onChange={(event) =>
                updateField("confirmPassword", event.target.value)
              }
              placeholder="Confirm password"
              required
            />
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="cta-primary mt-7 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? "Provisioning Trial..." : "Start Free Trial"}
      </button>

      {message ? (
        <div
          className={`mt-5 rounded-2xl px-4 py-3 text-sm ${
            status === "success"
              ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
              : "border border-red-400/20 bg-red-400/10 text-red-200"
          }`}
        >
          <p>{message}</p>
          {status === "success" ? (
            <div className="mt-3 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="text-emerald-200">
                Sign in with <strong>{loginEmail}</strong>
              </span>
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
