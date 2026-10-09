import type { Metadata } from "next";

import { MyTickets } from "@/components/checkout/MyTickets";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Your tickets", robots: { index: false } };

export default function TicketsPage() {
  return (
    <div className="flex-1 bg-paper">
      <Container size="page" className="flex flex-col gap-8 py-10 min-[801px]:py-14">
        <PageHeader eyebrow="Account" title="Your tickets" description="Show the QR code at the venue gate." />
        <MyTickets />
      </Container>
    </div>
  );
}
