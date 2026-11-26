import type { Metadata } from "next";
import { EducationSection } from "@/components/education-section";
import { ExperienceSection } from "@/components/experience-section";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { SkillsSection } from "@/components/skills-section";

const description =
  "Job history for Razia Sultana Lina, Manager, ACI Motors. Newest role first, from July 2026 back to December 2007. 18+ years across operations, audit, credit, and finance, and 8+ years at ACI Motors Ltd.";

export const metadata: Metadata = {
  title: "Career",
  description,
  alternates: { canonical: "/career" },
  openGraph: {
    title: "Career · RSLina",
    description,
    url: "/career",
  },
  twitter: {
    title: "Career · RSLina",
    description,
  },
};

const stats = [
  ["18+ years", "Across operations, audit, credit, and finance"],
  ["8+ years", "At ACI Motors Ltd., since August 2018"],
] as const;

export default function CareerPage() {
  return (
    <main>
      <PageHero kicker="Career" title="Newest role first.">
        <p>
          Manager, ACI Motors, and Operation Head. The record runs from July 2026 back to December
          2007.
        </p>
      </PageHero>
      <section aria-label="Career totals" className="border-b border-[#ffa45c]/25">
        <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
          <Reveal>
            <dl className="grid gap-px overflow-hidden rounded-2xl border border-[#ffa45c]/35 sm:grid-cols-2">
              {stats.map(([value, label]) => (
                <div key={value} className="glass-card backdrop-blur-xl px-5 py-5">
                  <dt className="font-heading text-3xl text-[#f3f5fb] sm:text-4xl">{value}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-white/70 sm:text-base">
                    {label}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>
      <ExperienceSection />
      <SkillsSection />
      <EducationSection />
    </main>
  );
}
