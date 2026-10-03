import { Skeleton } from "@/components/ui/Skeleton";

const bg = "bg-stone/40";

// Same frame as the watch page: player and score strip, chat beside them.
export default function MatchLoading() {
  return (
    <div className="flex-1 bg-paper">
      <span role="status" className="sr-only">
        Loading match
      </span>
      <div className="mx-auto grid w-full max-w-[1376px] gap-4 min-[901px]:grid-cols-[minmax(0,1fr)_320px] min-[901px]:px-6 min-[901px]:pt-[50px] lg:px-8 min-[1181px]:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <Skeleton variant="media" bg={bg} className="min-[901px]:rounded-xl" />
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6 px-5 pt-5 min-[901px]:px-1">
            <Skeleton bg={bg} className="h-11 w-40" />
            <Skeleton bg={bg} className="h-11 w-24" />
            <Skeleton bg={bg} className="h-11 w-40 justify-self-end" />
          </div>
        </div>
        <Skeleton bg={bg} className="mx-5 h-[440px] rounded-xl min-[901px]:mx-0 min-[901px]:h-auto" />
      </div>
    </div>
  );
}
