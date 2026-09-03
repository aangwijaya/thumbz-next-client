import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

function SectionSkeleton({
  cards = 4,
  cols = "sm:grid-cols-2 lg:grid-cols-4",
  cardHeight = "h-36",
  media = false,
  className = "",
}: {
  cards?: number;
  cols?: string;
  cardHeight?: string;
  media?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-6 sm:gap-8 ${className}`}>
      <Skeleton className="h-9 w-48" />
      <div className={`grid gap-5 ${cols}`}>
        {Array.from({ length: cards }).map((_, index) =>
          media ? (
            <div key={index} className="space-y-3">
              <Skeleton variant="media" className="rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ) : (
            <Skeleton key={index} className={`${cardHeight} rounded-xl`} />
          ),
        )}
      </div>
    </div>
  );
}

export default function HomeLoading() {
  return (
    <>
      <div className="bg-page-light">
        <Container size="wide" className="flex flex-col gap-8 py-10 sm:gap-10 sm:py-14">
          <div className="grid gap-5 sm:gap-6 lg:grid-cols-2 2xl:gap-8">
            {[0, 1].map((hero) => (
              <div
                key={hero}
                className="flex flex-col rounded-xl border border-transparent p-4 sm:p-6 2xl:p-8"
              >
                <Skeleton bg="bg-ash" className="h-4 w-12" />
                <div className="mt-4 flex min-h-48 gap-5 sm:mt-5 sm:min-h-[20rem] sm:gap-8 lg:min-h-[20rem] xl:min-h-[22rem] 2xl:min-h-[26rem]">
                  <Skeleton bg="bg-ash" className="aspect-[3/4] w-[42%] h-full shrink-0 overflow-hidden  sm:w-[45%]" />
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-4 sm:gap-6 2xl:gap-8">
                    <div className="hidden flex-col gap-2 sm:flex">
                      {/* <Skeleton bg="bg-ash" className="h-6 w-3/4 max-w-72  sm:h-8 lg:h-9 2xl:h-10" /> */}
                      {/* <Skeleton bg="bg-ash" className="h-3 w-1/3 max-w-32" /> */}
                    </div>
                    <div className="flex w-full items-center justify-center gap-4 sm:gap-6 2xl:gap-8">
                      <div className="flex min-w-0 flex-1 flex-col items-center gap-2.5">
                        <Skeleton bg="bg-ash" className="size-12  sm:size-20 2xl:size-24" />
                        <Skeleton bg="bg-ash" className="h-4 w-16  sm:h-5 sm:w-24" />
                      </div>
                      <Skeleton bg="bg-ash" className="h-4 w-6  sm:w-8" />
                      <div className="flex min-w-0 flex-1 flex-col items-center gap-2.5">
                        <Skeleton bg="bg-ash" className="size-12  sm:size-20 2xl:size-24" />
                        <Skeleton bg="bg-ash" className="h-4 w-16  sm:h-5 sm:w-24" />
                      </div>
                    </div>
                    {/* <Skeleton bg="bg-ash" className="hidden h-9 w-32 rounded-full  sm:block sm:h-10 sm:w-36" /> */}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col border-t border-page-light-border">
            <div className="flex items-center gap-4 border-b border-page-light-border px-1 py-3.5">
              <Skeleton bg="bg-ash" className="h-3 w-10" />
              <Skeleton bg="bg-ash" className="h-4 w-1/2 max-w-md" />
              <Skeleton bg="bg-ash" className="ml-auto hidden h-3 w-40  sm:block" />
              <Skeleton bg="bg-ash" className="h-3 w-16" />
            </div>
          </div>
        </Container>
      </div>
      <div className="flex-1 bg-page-dark">
        <Container size="wide" className="flex flex-col gap-16 py-10 sm:gap-16 sm:py-14">
          <div className="flex flex-col gap-6 sm:gap-8">
            <Skeleton className="h-9 w-48" />
            <div className="flex flex-col gap-10">
              {[0, 1].map((group) => (
                <div key={group}>
                  <Skeleton className="mb-3 h-3 w-28" />
                  <div className="border-t border-page-dark-border">
                    {Array.from({ length: 3 }).map((_, row) => (
                      <div
                        key={row}
                        className="flex items-center gap-4 border-b border-page-dark-border px-1 py-4"
                      >
                        <Skeleton className="h-4 w-14" />
                        <Skeleton className="h-6 w-6 rounded-sm" />
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-6" />
                        <Skeleton className="h-6 w-6 rounded-sm" />
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="ml-auto hidden h-3 w-40 lg:block" />
                        <Skeleton className="h-3 w-8" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <SectionSkeleton
            cards={3}
            cols="sm:grid-cols-2 xl:grid-cols-3"
            cardHeight="h-40"
            className="border-t border-page-dark-border pt-14 sm:pt-16"
          />
          <SectionSkeleton
            cards={4}
            cols="sm:grid-cols-2 lg:grid-cols-4"
            cardHeight="h-40"
            className="border-t border-page-dark-border pt-14 sm:pt-16"
          />
          <SectionSkeleton
            cards={8}
            cols="sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
            className="border-t border-page-dark-border pt-14 sm:pt-16"
            media
          />
        </Container>
      </div>
    </>
  );
}
