import type { Metadata } from "next";

import { FavoritesList } from "@/components/account/FavoritesList";
import { MatchReminders } from "@/components/account/MatchReminders";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Favorites", robots: { index: false } };

export default function FavoritesPage() {
  return (
    <div className="flex-1 bg-paper">
      <Container size="page" className="flex flex-col gap-8 py-10 min-[801px]:py-14">
        <PageHeader eyebrow="Account" title="Favorites" description="Teams and players you follow appear first across THUMBZ." />
        <MatchReminders />
        <FavoritesList />
      </Container>
    </div>
  );
}
