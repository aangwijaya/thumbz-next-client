import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="flex-1 bg-paper">
      <Container size="page" className="flex flex-col gap-5 py-8 min-[801px]:py-12">
        <Skeleton className="aspect-video w-full rounded-image" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-3/4" />
      </Container>
    </div>
  );
}
