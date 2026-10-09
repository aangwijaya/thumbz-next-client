import type { Metadata } from "next";

import { HistoryList } from "@/components/account/HistoryList";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Watch history", robots: { index: false } };

export default function HistoryPage() {
  return (
    <div className="flex-1 bg-paper">
      <Container size="page" className="flex flex-col gap-8 py-10 min-[801px]:py-14">
        <PageHeader eyebrow="Account" title="Watch history" description="Matches you watched, newest first." />
        <HistoryList />
      </Container>
    </div>
  );
}
