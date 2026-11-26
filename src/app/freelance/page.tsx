import type { Metadata } from "next";
import { FreelanceWork } from "@/components/freelance-work";
import { PageHero } from "@/components/page-hero";
import { WorkCards } from "@/components/premium/work-cards";

const description =
  "Freelance work by Razia Sultana Lina (RS Lina): Fiverr services, AI videos, and websites built for clients.";

export const metadata: Metadata = {
  title: "Freelance",
  description,
  alternates: { canonical: "/freelance" },
  openGraph: { title: "Freelance · RSLina", description, url: "/freelance" },
  twitter: { title: "Freelance · RSLina", description },
};

export default function FreelancePage() {
  return (
    <main>
      <PageHero kicker="Freelance" title="Freelance work">
        <p>
          Design, video and web work done for clients outside the day job,
          most of it through Fiverr.
        </p>
      </PageHero>
      <FreelanceWork />
      <WorkCards exclude={["helenkhan"]} />
    </main>
  );
}
