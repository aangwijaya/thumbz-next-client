import type { Metadata } from "next";

import { ProfileCard } from "@/components/account/ProfileCard";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Your profile", robots: { index: false } };

export default function ProfilePage() {
  return (
    <div className="flex-1 bg-paper">
      <Container size="page" className="flex flex-col gap-8 py-10 min-[801px]:py-14">
        <PageHeader eyebrow="Account" title="Your profile" />
        <ProfileCard />
      </Container>
    </div>
  );
}
