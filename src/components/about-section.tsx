import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";

export function AboutSection() {
  return (
    <section id="about" className="scroll-mt-24 border-b border-white/10">
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <SectionHeading kicker="About" title="The work so far" />
        <Reveal className="mt-8 max-w-3xl text-base leading-relaxed text-white/75 sm:text-lg">
          <p>
            Razia Sultana Lina is Manager, ACI Motors, in Dhaka. She is
            Operation Head — leading
            facility operations, coordination, sales and after-sales. Across 18+
            years in operations, audit, credit, and finance, and 8+ years at ACI
            Motors Ltd., she has
            taken on wider leadership, strengthened how organizations meet
            their goals, and kept long-term commitments to customers,
            employees, and the communities she is part of.
          </p>
        </Reveal>
      </div>
    </section>
  );
}