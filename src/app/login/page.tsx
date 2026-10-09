"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { safeNextPath } from "@/lib/utils/safe-redirect";

function GoogleIcon() {
  return (
    <span
      aria-hidden="true"
      className="flex size-5 items-center justify-center rounded-full border border-page-dark-border font-mono text-xs"
    >
      G
    </span>
  );
}

function LoginForm() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));

  const [mode, setMode] = useState<"login" | "register">(
    searchParams.get("mode") === "register" ? "register" : "login",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === "login") {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError("Invalid email or password.");
      } else {
        enterSignedIn(next);
      }
    } else {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) {
        setError(signUpError.message);
      } else if (data.session) {
        enterSignedIn(next);
      } else {
        setMessage("Account created. Check your email to confirm your sign-up.");
      }
    }
    setLoading(false);
  }

  async function handleGoogle() {
    setError(null);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (oauthError) setError(oauthError.message);
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 px-4 py-16 sm:py-20">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
          {mode === "login" ? "Sign in" : "Create account"}
        </h1>
        <p className="text-sm text-text-secondary">
          {mode === "login"
            ? "Join the live conversation on THUMBZ."
            : "One account for comments, favorites and history."}
        </p>
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        className="inline-flex items-center justify-center gap-2.5 rounded-full border border-page-dark-border px-5 py-2.5 text-sm font-medium transition-colors hover:border-text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="h-px flex-1 bg-page-dark-border" />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-secondary">
          or
        </span>
        <span aria-hidden="true" className="h-px flex-1 bg-page-dark-border" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-secondary">
            Email
          </span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-lg border border-page-dark-border bg-page-dark-surface px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-secondary">
            Password
          </span>
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-lg border border-page-dark-border bg-page-dark-surface px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
          />
        </label>

        {error ? <p className="text-sm text-error">{error}</p> : null}
        {message ? <p className="text-sm text-success">{message}</p> : null}

        <Button type="submit" disabled={loading} className="justify-center">
          {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-text-secondary">
        {mode === "login" ? "No account yet?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError(null);
            setMessage(null);
          }}
          className="font-medium text-text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
        >
          {mode === "login" ? "Create one" : "Sign in"}
        </button>
      </p>
    </div>
  );
}

/**
 * A full navigation, not router.push: links prefetched while signed out
 * (footer, menu) sit in the client Router Cache as redirects to /login and
 * would send the user straight back here.
 */
function enterSignedIn(next: string) {
  window.location.assign(next);
}

export default function LoginPage() {
  return (
    <div className="flex-1 bg-page-dark">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
