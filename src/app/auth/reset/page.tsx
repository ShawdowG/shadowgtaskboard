"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [stage, setStage] = useState<"exchanging" | "ready" | "submitting" | "done">("exchanging");
  const [error, setError] = useState("");

  // On first load, exchange the code for a session.
  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setError("Missing reset code. Please use the link from your email.");
      setStage("ready");
      return;
    }

    void (async () => {
      try {
        const db = getSupabaseBrowserClient();
        const { error: exchangeError } = await db.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError(exchangeError.message || "Could not verify reset link.");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unexpected error.");
      } finally {
        setStage("ready");
      }
    })();
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setStage("submitting");
    try {
      const db = getSupabaseBrowserClient();
      const { error: updateError } = await db.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message || "Failed to update password.");
        setStage("ready");
        return;
      }
      setStage("done");
      // Give a short moment then go to board
      setTimeout(() => router.push("/"), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error.");
      setStage("ready");
    }
  }

  if (stage === "done") {
    return (
      <Screen>
        <h1 className="text-2xl font-semibold">Password updated</h1>
        <p className="text-muted-foreground text-sm">You will be redirected to the board shortly…</p>
      </Screen>
    );
  }

  return (
    <Screen>
      <h1 className="text-2xl font-semibold">Set a new password</h1>
      <p className="text-muted-foreground text-sm mb-4">
        Enter your new password below. This link can only be used once.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3 w-full max-w-sm mx-auto">
        <Input
          type="password"
          placeholder="New password (min 6 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={stage !== "ready"}
        />
        <Input
          type="password"
          placeholder="Confirm new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          disabled={stage !== "ready"}
        />
        {error && <p className="text-destructive text-xs">{error}</p>}
        <Button
          type="submit"
          className="w-full"
          disabled={stage !== "ready"}
        >
          {stage === "submitting" || stage === "exchanging" ? "Saving…" : "Save new password"}
        </Button>
      </form>
    </Screen>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-4 text-center">{children}</div>
    </div>
  );
}
