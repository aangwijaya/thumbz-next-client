import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

const bg = "bg-stone/40";

export default function HomeLoading() {
  return (
    <div className="flex-1 bg-paper">
      <span role="status" className="sr-only">
        Loading
      </span>

      <section className="bg-cream">
        <Container
          size="page"
          className="grid gap-12 py-14 sm:py-20 lg:grid-cols-[47fr_53fr] lg:items-center lg:gap-16 lg:py-24"
        >
          <div className="flex flex-col items-start gap-5">
            <Skeleton bg={bg} className="h-3 w-36" />
            <Skeleton bg={bg} className="h-10 w-4/5 sm:h-14" />
            <Skeleton bg={bg} className="h-10 w-3/5 sm:h-14" />
            <Skeleton bg={bg} className="h-5 w-full max-w-sm" />
            <Skeleton bg={bg} className="h-5 w-2/3 max-w-xs" />
            <Skeleton bg={bg} className="mt-2 h-12 w-36 rounded-lg" />
          </div>

          <div className="rounded-image border border-stone bg-paper p-2.5">
            <Skeleton variant="media" bg={bg} className="rounded-[10px]" />
            <div className="flex items-center justify-between gap-4 px-2 pb-2 pt-4">
              <Skeleton bg={bg} className="h-9 w-2/5" />
              <Skeleton bg={bg} className="h-6 w-10" />
              <Skeleton bg={bg} className="h-9 w-2/5" />
            </div>
          </div>
        </Container>
      </section>

      <section className="py-12 sm:py-14">
        <Container
          size="page"
          className="grid items-center gap-10 lg:grid-cols-[2fr_3fr] lg:gap-16"
        >
          <div className="flex flex-col items-start gap-4">
            <Skeleton bg={bg} className="h-3 w-20" />
            <Skeleton bg={bg} className="h-8 w-3/4 sm:h-10" />
            <Skeleton bg={bg} className="h-5 w-full max-w-sm" />
          </div>
          <div className="overflow-hidden rounded-lg border border-stone">
            {[0, 1, 2].map((row) => (
              <div
                key={row}
                className="flex items-center gap-4 border-b border-stone/60 p-3 last:border-b-0"
              >
                <Skeleton variant="media" bg={bg} className="w-28 shrink-0 rounded-[10px] sm:w-36" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton bg={bg} className="h-4 w-3/5" />
                  <Skeleton bg={bg} className="h-4 w-1/2" />
                  <Skeleton bg={bg} className="h-3 w-4/5" />
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </div>
  );
}
