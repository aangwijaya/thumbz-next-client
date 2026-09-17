import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
        404
      </p>
      <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
        Page not found
      </h1>
      <p className="max-w-md text-sm text-text-secondary">
        The match or page you are looking for does not exist or has been removed.
      </p>
      <Button href="/" className="mt-2">
        Back to home
      </Button>
    </div>
  );
}
