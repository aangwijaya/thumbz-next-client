import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

export default function TournamentDetailLoading() {
  return (
    <div className="flex-1 bg-page-dark">
      <Container size="wide" className="flex flex-col gap-6 py-8 sm:gap-8 sm:py-12">
        <div className="flex items-center gap-6 border-b border-page-dark-border pb-6">
          <Skeleton className="size-16 rounded-md" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-3 w-56" />
          </div>
        </div>
        <Skeleton className="h-4 w-full max-w-2xl" />
        <Skeleton className="h-9 w-96" />
        <div className="flex flex-col">
          {[0, 1, 2, 3, 4].map((row) => (
            <Skeleton key={row} className="mb-2 h-12 w-full" />
          ))}
        </div>
      </Container>
    </div>
  );
}
