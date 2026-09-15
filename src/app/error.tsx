"use client";

import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";

export default function RootError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <Container className="py-12">
      <ErrorState error={error} onRetry={reset} />
    </Container>
  );
}
