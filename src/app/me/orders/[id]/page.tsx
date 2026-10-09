import type { Metadata } from "next";

import { OrderDetail } from "@/components/checkout/OrderDetail";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Order", robots: { index: false } };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="flex-1 bg-paper">
      <Container size="page" className="flex flex-col gap-8 py-10 min-[801px]:py-14">
        <PageHeader eyebrow="Venue tickets" title="Your order" />
        <OrderDetail orderId={id} />
      </Container>
    </div>
  );
}
