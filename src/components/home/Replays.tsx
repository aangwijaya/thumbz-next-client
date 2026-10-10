import Link from "next/link";

import { replayHref, typeLabels } from "@/components/cards/ReplayCard";
import { HomeSectionHead } from "@/components/home/HomeSectionHead";
import { RevealButton, Spoiler } from "@/components/spoiler/Spoiler";
import { SpoilerToggle } from "@/components/spoiler/SpoilerToggle";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { Thumbnail } from "@/components/ui/Thumbnail";
import type { VideoSummary } from "@/lib/api/types";
import { formatAge, formatDuration, shortTeamName } from "@/lib/utils/format";

interface ReplaysProps {
  videos: VideoSummary[];
  tournamentId: string | null;
}

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember";

function Winner({ video, prefix = "" }: { video: VideoSummary; prefix?: string }) {
  const winner = video?.result?.winner_team;
  if (!winner) return null;
  return (
    <Spoiler matchId={video?.match_id ?? video.id}>
      <span className="font-semibold text-ink">
        {prefix}
        {shortTeamName(winner)} won
      </span>
    </Spoiler>
  );
}

/**
 * A replay shelf: the newest replay large, with a chip for every game of
 * its series, and the next ones beside it. Winners stay hidden while scores
 * are hidden.
 */
export function Replays({ videos, tournamentId }: ReplaysProps) {
  const [featured, ...others] = videos;
  if (!featured) return null;
  const series = videos
    .filter((video) => video?.match_id && video.match_id === featured.match_id && video?.result)
    .sort((x, y) => (x.result?.game_number ?? 0) - (y.result?.game_number ?? 0));
  const side = others.slice(0, 4);
  const link = replayHref(featured);
  const type = featured?.type ? typeLabels[featured.type] : undefined;

  return (
    <section id="replays" aria-labelledby="replays-title" className="scroll-mt-32 py-[clamp(40px,5vw,64px)]">
      <Container size="page">
        <HomeSectionHead
          id="replays-title"
          eyebrow="Replays"
          title="Missed a match? Watch it back"
          actions={
            <>
              <SpoilerToggle variant="switch" />
              <ArrowLink href={`/matches?status=completed${tournamentId ? `&tournament=${tournamentId}` : ""}`}>
                Browse all replays
              </ArrowLink>
            </>
          }
        />

        <div className="grid gap-8 min-[901px]:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          <article className="flex flex-col gap-3.5">
            <Link
              href={link.href}
              {...(link.external ? { target: "_blank", rel: "noreferrer" } : {})}
              className={`group rounded-image ${focusRing}`}
            >
              <Thumbnail
                src={featured?.thumbnail_url}
                colors={type?.colors}
                sizes="(min-width: 901px) 700px, 100vw"
                className="rounded-image shadow-[0_28px_56px_-40px_rgb(37_34_30/0.5)]"
              >
                {type ? (
                  <Badge tone="light" size="sm" className="absolute left-3 top-3">
                    {type.label}
                  </Badge>
                ) : null}
                <Badge tone="dark" className="absolute bottom-2.5 right-2.5">
                  {formatDuration(featured?.duration_seconds ?? 0)}
                </Badge>
              </Thumbnail>
              <span className="sr-only">Watch {featured?.title}</span>
            </Link>
            <p className="flex flex-wrap items-center gap-2 text-[13px] text-pencil">
              {featured?.media ? <Badge tone="dark">Protected</Badge> : null}
              <span>{formatAge(featured?.published_at ?? "")}</span>
            </p>
            <h3 className="text-pretty font-graphik text-[24px] font-bold leading-[1.25] tracking-[-0.005em] text-ink max-[640px]:text-[20px]">
              <Link
                href={link.href}
                {...(link.external ? { target: "_blank", rel: "noreferrer" } : {})}
                className={`rounded-lg transition-colors hover:text-deep-ember ${focusRing}`}
              >
                {featured?.title ?? "Untitled video"}
              </Link>
            </h3>
            {series.length > 1 ? (
              <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Games in this series">
                {series.map((video) => {
                  const href = replayHref(video);
                  return (
                    <Link
                      key={video.id}
                      href={href.href}
                      aria-current={video.id === featured.id ? "true" : undefined}
                      className={`inline-flex min-h-9 items-center gap-2 rounded-lg border border-stone px-3 text-[13px] font-semibold text-ink transition-colors hover:border-charcoal aria-[current=true]:border-ink aria-[current=true]:shadow-[inset_0_0_0_1px_var(--color-ink)] ${focusRing}`}
                    >
                      Game {video.result?.game_number}
                      <span className="font-normal text-pencil">{formatDuration(video?.duration_seconds ?? 0)}</span>
                      <Winner video={video} />
                    </Link>
                  );
                })}
                <RevealButton matchId={featured?.match_id ?? featured.id}>Show winners</RevealButton>
              </div>
            ) : null}
          </article>

          {side.length > 0 ? (
            <ul className="flex flex-col">
              {side.map((video) => {
                const href = replayHref(video);
                const kind = video?.type ? typeLabels[video.type] : undefined;
                return (
                  <li
                    key={video.id}
                    className="relative grid grid-cols-[164px_minmax(0,1fr)] items-center gap-4 border-b border-[#eeecea] py-3.5 first:pt-0 last:border-b-0 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-deep-ember max-[640px]:grid-cols-[120px_minmax(0,1fr)] max-[640px]:gap-3"
                  >
                    <Thumbnail src={video?.thumbnail_url} colors={kind?.colors} sizes="164px" className="rounded-[10px]">
                      <Badge tone="dark" size="xs" className="absolute bottom-1.5 right-1.5">
                        {formatDuration(video?.duration_seconds ?? 0)}
                      </Badge>
                    </Thumbnail>
                    <div className="min-w-0">
                      <h3 className="text-pretty font-graphik text-[15px] font-bold leading-[1.35] text-ink">
                        <Link
                          href={href.href}
                          {...(href.external ? { target: "_blank", rel: "noreferrer" } : {})}
                          className="after:absolute after:inset-0 hover:text-deep-ember focus-visible:outline-none"
                        >
                          {video?.title ?? "Untitled video"}
                        </Link>
                      </h3>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-pencil">
                        <span>
                          {kind?.label ?? "Video"} · {formatAge(video?.published_at ?? "")}
                        </span>
                        <Winner video={video} prefix="· " />
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
