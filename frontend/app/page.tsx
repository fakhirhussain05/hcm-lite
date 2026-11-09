"use client";

import { useState } from "react";

type Mode = "login" | "signup";

export default function Home() {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("qazifakhir6@gmail.com");
  const [password, setPassword] = useState("fakhir052002@");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const isSignup = mode === "signup";
    const endpoint = isSignup ? "signup" : "login";

    try {
      const response = await fetch(`/api/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isSignup
            ? { name: name.trim(), email: email.trim(), password }
            : { email: email.trim(), password }
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Login failed.");
        return;
      }

      if (isSignup) {
        setMode("login");
        setPassword("");
        setMessage("Account created successfully! Please sign in.");
        return;
      }

      if (!data.token || !data.user) {
        setMessage("Login response is incomplete.");
        return;
      }

      localStorage.setItem("hcm_token", data.token);
      localStorage.setItem("hcm_user", JSON.stringify(data.user));
      window.location.href = "/dashboard";
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Connection error: ${error.message}`
          : "Unknown connection error."
      );
    } finally {
      setLoading(false);
    }
  }

  function changeMode(nextMode: Mode) {
    setMode(nextMode);
    setMessage("");
    setPassword("");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-5">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-2xl font-bold text-white">
            H
          </div>
          <h1 className="text-3xl font-bold text-slate-900">HCM Lite</h1>
          <p className="mt-2 text-slate-500">
            Human Capital Management System
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => changeMode("login")}
            className={`rounded-md py-2.5 font-semibold transition ${
              mode === "login"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => changeMode("signup")}
            className={`rounded-md py-2.5 font-semibold transition ${
              mode === "signup"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Sign Up
          </button>
        </div>

        <h2 className="mb-1 text-xl font-bold text-slate-900">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h2>
        <p className="mb-6 text-sm text-slate-500">
          {mode === "signup"
            ? "Register to access the HCM Lite employee portal."
            : "Sign in to access your account."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === "signup" && (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Full name
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={100}
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
              />
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Email address
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              required
              minLength={12}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Please wait..."
              : mode === "signup"
                ? "Create Account"
                : "Sign In"}
          </button>
        </form>

        {message && (
          <p
            role="status"
            className="mt-5 break-words rounded-lg bg-slate-100 p-3 text-sm text-slate-700"
          >
            {message}
          </p>
        )}

        <p className="mt-8 text-center text-xs text-slate-400">
          HCM Lite · Employee Management Portal
        </p>
      </section>
    </main>
  );
}
