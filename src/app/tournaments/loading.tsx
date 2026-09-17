import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

export default function TournamentsLoading() {
  return (
    <div className="flex-1 bg-page-dark">
      <Container size="wide" className="flex flex-col gap-10 py-8 sm:py-12">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        {[0, 1].map((section) => (
          <div key={section} className="flex flex-col gap-5">
            <Skeleton className="h-8 w-40" />
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((card) => (
                <Skeleton key={card} className="h-28 rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </Container>
    </div>
  );
}
