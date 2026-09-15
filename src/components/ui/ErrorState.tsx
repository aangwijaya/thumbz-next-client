"use client";

import { isApiError } from "@/lib/api/errors";

import { Button } from "./Button";
import { TextLink } from "./TextLink";

interface ErrorStateProps {
  error?: unknown;
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

interface ErrorCopy {
  title: string;
  message: string;
}

function describeError(error: unknown): ErrorCopy {
  if (isApiError(error)) {
    switch (error.code) {
      case "NOT_FOUND":
        return {
          title: "Not found",
          message:
            error.message ||
            "This content is not available or may have been removed.",
        };
      case "AUTHENTICATION_REQUIRED":
        return {
          title: "Sign in required",
          message: error.message || "Please sign in to view this content.",
        };
      default:
        return {
          title: "Something went wrong",
          message: error.message || "Please try again in a moment.",
        };
    }
  }
  return {
    title: "Something went wrong",
    message: "We couldn't load this right now. Please try again.",
  };
}

export function ErrorState({
  error,
  title,
  description,
  onRetry,
  className = "",
}: ErrorStateProps) {
  const copy = title ? { title, message: description } : describeError(error);

  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center gap-2 rounded-lg border border-border px-6 py-12 text-center ${className}`}
    >
      <h3 className="font-display text-xl tracking-tight">{copy.title}</h3>
      {copy.message ? (
        <p className="max-w-md text-sm text-text-secondary">{copy.message}</p>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        {onRetry ? (
          <Button onClick={onRetry}>Try again</Button>
        ) : null}
        <Button variant="ghost" onClick={() => window.history.back()}>
          Go back
        </Button>
        <TextLink href="/">Return home</TextLink>
      </div>
    </div>
  );
}
