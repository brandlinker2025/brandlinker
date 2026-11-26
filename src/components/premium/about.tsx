import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { aboutAnswer } from "@/lib/site";

export function PremiumAbout() {
  return (
    <section id="about" className="scroll-mt-24 border-b border-white/10">
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <SectionHeading kicker="About" title="The work so far" />
        <Reveal className="mt-8 max-w-3xl text-lg leading-relaxed text-white/78 sm:text-xl">
          <p className="mb-5 text-base text-[#ffa45c] sm:text-lg">
            <strong className="font-semibold">About Razia Sultana Lina (RS Lina):</strong>{" "}
            {aboutAnswer}
          </p>
          <p>
            She has taken on wider leadership, strengthened how organizations
            meet their goals, and kept long-term commitments to customers,
            employees, and the communities she is part of.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
