import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

const bg = "bg-stone/40";

function Header() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton bg={bg} className="h-3 w-28" />
      <Skeleton bg={bg} className="h-10 w-2/3 max-w-md" />
      <Skeleton bg={bg} className="h-4 w-full max-w-xl" />
    </div>
  );
}

function Chips() {
  return (
    <div className="flex gap-2">
      {[72, 96, 88, 80].map((width) => (
        <Skeleton key={width} bg={bg} className="h-10 rounded-lg" style={{ width }} />
      ))}
    </div>
  );
}

/**
 * Route-level loading UI shaped like the page it stands in for, so content
 * swaps in without layout shift.
 */
export function ListPageSkeleton({ variant }: { variant: "rows" | "tiles" | "cards" }) {
  return (
    <div className="flex-1 bg-paper">
      <span role="status" className="sr-only">
        Loading
      </span>
      <Container size="page" className="flex flex-col gap-8 py-10 min-[801px]:py-14">
        <Header />
        <Chips />
        {variant === "rows" ? (
          <div className="flex flex-col gap-1">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} bg={bg} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : variant === "tiles" ? (
          <div className="grid gap-4 min-[641px]:grid-cols-2 min-[1001px]:grid-cols-3">
            {Array.from({ length: 9 }, (_, index) => (
              <Skeleton key={index} bg={bg} className="h-[90px] rounded-image" />
            ))}
          </div>
        ) : (
          <div className="grid gap-x-6 gap-y-10 min-[641px]:grid-cols-2 min-[901px]:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="flex flex-col gap-3">
                <Skeleton variant="media" bg={bg} className="rounded-image" />
                <Skeleton bg={bg} className="w-1/3" />
                <Skeleton bg={bg} className="w-4/5" />
              </div>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="flex-1 bg-paper">
      <span role="status" className="sr-only">
        Loading
      </span>
      <div className="border-b border-stone">
        <Container size="page" className="flex items-center gap-6 py-10 min-[801px]:py-14">
          <Skeleton bg={bg} className="size-24 shrink-0 rounded-image" />
          <div className="flex flex-1 flex-col gap-3">
            <Skeleton bg={bg} className="h-3 w-32" />
            <Skeleton bg={bg} className="h-10 w-1/2" />
            <Skeleton bg={bg} className="h-4 w-2/3" />
          </div>
        </Container>
      </div>
      <Container size="page" className="flex flex-col gap-10 py-10">
        <Skeleton bg={bg} className="h-[98px] rounded-image" />
        <div className="grid gap-4 min-[641px]:grid-cols-2 min-[1001px]:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} bg={bg} className="h-[90px] rounded-image" />
          ))}
        </div>
      </Container>
    </div>
  );
}
