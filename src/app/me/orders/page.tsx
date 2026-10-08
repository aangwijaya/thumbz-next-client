import type { Metadata } from "next";

import { OrdersList } from "@/components/checkout/OrdersList";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Your orders", robots: { index: false } };

export default function OrdersPage() {
  return (
    <div className="flex-1 bg-paper">
      <Container size="page" className="flex flex-col gap-8 py-10 min-[801px]:py-14">
        <PageHeader eyebrow="Account" title="Your orders" description="Venue ticket orders and their payment status." />
        <OrdersList />
      </Container>
    </div>
  );
}
