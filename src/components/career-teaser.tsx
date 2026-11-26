import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const stats = [
  ["18+ years", "Operations, audit, credit, and finance"],
  ["8+ years", "At ACI Motors Ltd., since August 2018"],
] as const;

export function CareerTeaser() {
  return (
    <section aria-labelledby="career-teaser-title" className="border-b border-[#ffa45c]/25">
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <SectionHeading id="career-teaser-title" kicker="Career" title="The full record">
          Newest role first. Manager, ACI Motors, from July 2026, back to
          December 2007.
        </SectionHeading>
        <Reveal>
          <dl className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-[#ffa45c]/35 sm:grid-cols-2">
            {stats.map(([value, label]) => (
              <div key={value} className="glass-card backdrop-blur-xl px-5 py-4">
                <dt className="font-heading text-3xl text-[#f3f5fb]">{value}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-white/70">{label}</dd>
              </div>
            ))}
          </dl>
          <Link
            href="/career"
            className={cn(
              buttonVariants({ size: "lg" }),
              "mt-8 inline-flex h-12 rounded-full px-6 text-base",
            )}
          >
            Read the career
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
