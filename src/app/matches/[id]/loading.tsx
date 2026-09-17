import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

export default function MatchLoading() {
  return (
    <div className="flex-1 bg-page-dark">
      <Container size="wide" className="flex flex-col gap-6 py-6 sm:gap-8 sm:py-10">
        <div className="flex flex-col gap-4 border-b border-page-dark-border pb-5 sm:pb-6">
          <Skeleton className="h-3 w-56" />
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-3">
              <Skeleton className="size-11 rounded-sm sm:size-14" />
              <Skeleton className="h-6 w-36" />
            </div>
            <Skeleton className="h-8 w-16" />
            <div className="flex items-center justify-end gap-3">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="size-11 rounded-sm sm:size-14" />
            </div>
          </div>
        </div>

        <section className="grid gap-4 lg:grid-cols-[19rem_minmax(0,1fr)_19rem] xl:grid-cols-[20rem_minmax(0,1fr)_20rem]">
          <Skeleton className="order-2 h-96 rounded-xl lg:order-1" />
          <Skeleton variant="media" className="order-1 rounded-xl lg:order-2" />
          <Skeleton className="order-3 h-96 rounded-xl" />
        </section>

        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </Container>
    </div>
  );
}
