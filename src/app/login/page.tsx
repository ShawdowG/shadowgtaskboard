"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Mode = "magic" | "signin" | "register";
type Stage = "idle" | "checking" | "sent" | "registered";

const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

export default function LoginPage() {
  // Default to password sign-in everywhere; magic link remains available as an option
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState("");

  // On localhost, skip login entirely
  useEffect(() => {
    if (isLocalhost) { window.location.href = "/"; return; }
    // If already logged in, redirect to board
    void (async () => {
      const db = getSupabaseBrowserClient();
      const { data } = await db.auth.getSession();
      if (data.session) window.location.href = "/";
    })();
  }, []);

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setPassword("");
  }

  async function checkAllowlist(trimmed: string): Promise<boolean> {
    const res = await fetch("/api/auth/allowlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: trimmed }),
    });
    const { allowed } = await res.json();
    return allowed as boolean;
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    setStage("checking");

    if (!(await checkAllowlist(trimmed))) {
      setError("This email is not on the access list.");
      setStage("idle");
      return;
    }

    const db = getSupabaseBrowserClient();
    const { error: authError } = await db.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (authError) { setError(authError.message); setStage("idle"); return; }
    setStage("sent");
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !password) return;
    setStage("checking");

    const db = getSupabaseBrowserClient();
    const { error: authError } = await db.auth.signInWithPassword({ email: trimmed, password });
    if (authError) { setError(authError.message); setStage("idle"); return; }
    window.location.href = "/";
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !password) return;
    setStage("checking");

    if (!(await checkAllowlist(trimmed))) {
      setError("This email is not on the access list.");
      setStage("idle");
      return;
    }

    const db = getSupabaseBrowserClient();
    const { error: authError } = await db.auth.signUp({
      email: trimmed,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (authError) { setError(authError.message); setStage("idle"); return; }
    setStage("registered");
  }

  // ── Post-action screens ──────────────────────────────────────────────────────

  if (stage === "sent") {
    return (
      <Screen>
        <h1 className="text-2xl font-semibold">Check your email</h1>
        <p className="text-muted-foreground text-sm">
          We sent a magic link to <strong>{email}</strong>. Click it to sign in.
        </p>
        <Button variant="ghost" size="sm" onClick={() => setStage("idle")}>Try again</Button>
      </Screen>
    );
  }

  if (stage === "registered") {
    return (
      <Screen>
        <h1 className="text-2xl font-semibold">Confirm your email</h1>
        <p className="text-muted-foreground text-sm">
          We sent a confirmation link to <strong>{email}</strong>.
          <br />
          Click it, then sign in with your password.
        </p>
        <Button size="sm" onClick={() => { setStage("idle"); switchMode("signin"); }}>
          Go to sign in
        </Button>
      </Screen>
    );
  }

  // ── Main form ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">ShadowGTaskBoard</h1>
          <p className="text-muted-foreground text-sm">Internal agent workspace</p>
        </div>

        {/* Mode tabs */}
        <div className="flex rounded-md border overflow-hidden text-sm">
          {([["signin", "Sign in"], ["register", "Register"], ["magic", "Magic link"]] as const).map(
            ([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => switchMode(id)}
                className={`flex-1 py-1.5 transition-colors ${
                  mode === id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground"
                }`}
              >
                {label}
              </button>
            ),
          )}
        </div>

        {/* Sign in */}
        {mode === "signin" && (
          <form onSubmit={handleSignIn} className="space-y-3">
            <Input type="email" placeholder="your@email.com" value={email}
              onChange={(e) => setEmail(e.target.value)} autoFocus disabled={stage === "checking"} />
            <Input type="password" placeholder="Password" value={password}
              onChange={(e) => setPassword(e.target.value)} disabled={stage === "checking"} />
            {error && <p className="text-destructive text-xs">{error}</p>}
            <Button type="submit" className="w-full"
              disabled={stage === "checking" || !email.trim() || !password}>
              {stage === "checking" ? "Signing in..." : "Sign in"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              No account?{" "}
              <button type="button" className="underline hover:text-foreground"
                onClick={() => switchMode("register")}>
                Register
              </button>
            </p>
          </form>
        )}

        {/* Register */}
        {mode === "register" && (
          <form onSubmit={handleRegister} className="space-y-3">
            <Input type="email" placeholder="your@email.com" value={email}
              onChange={(e) => setEmail(e.target.value)} autoFocus disabled={stage === "checking"} />
            <Input type="password" placeholder="Password (min 6 chars)" value={password}
              onChange={(e) => setPassword(e.target.value)} disabled={stage === "checking"} />
            {error && <p className="text-destructive text-xs">{error}</p>}
            <Button type="submit" className="w-full"
              disabled={stage === "checking" || !email.trim() || password.length < 6}>
              {stage === "checking" ? "Creating account..." : "Create account"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <button type="button" className="underline hover:text-foreground"
                onClick={() => switchMode("signin")}>
                Sign in
              </button>
            </p>
          </form>
        )}

        {/* Magic link */}
        {mode === "magic" && (
          <form onSubmit={handleMagicLink} className="space-y-3">
            <Input type="email" placeholder="your@email.com" value={email}
              onChange={(e) => setEmail(e.target.value)} autoFocus disabled={stage === "checking"} />
            {error && <p className="text-destructive text-xs">{error}</p>}
            <Button type="submit" className="w-full"
              disabled={stage === "checking" || !email.trim()}>
              {stage === "checking" ? "Sending..." : "Send magic link"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-4 text-center">{children}</div>
    </div>
  );
}
