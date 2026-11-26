"use client";

import { promotionPhoto } from "@data/professional";
import { ProfessionalPhoto } from "@/components/professional-photo";
import { HeroGroup, HeroItem, Reveal, useCanAnimate } from "@/components/reveal";
import { buttonVariants } from "@/components/ui/button";
import { cvPath, linkedinUrl } from "@/lib/site";
import { cn } from "@/lib/utils";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

const facts = [
  { label: "Role", value: "Manager, ACI Motors" },
  { label: "Operation Head", value: "Facility operations, sales and after-sales" },
  { label: "Location", value: "Dhaka" },
  {
    label: "Experience",
    value: "18+ years",
    note: "8+ years at ACI Motors Ltd.",
  },
] as const;

const outline = cn(
  buttonVariants({ variant: "outline", size: "lg" }),
  "shine h-12 rounded-full border-[#ffa45c]/45 bg-white/5 px-6 text-base text-[#f3f5fb] hover:border-[#ffa45c] hover:bg-white/10",
);

export function CareerHero({ cvAvailable }: { cvAvailable: boolean }) {
  const photoRef = useRef<HTMLDivElement>(null);
  const animate = useCanAnimate();
  const { scrollYProgress } = useScroll({
    target: photoRef,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [22, -28]);

  return (
    <section className="relative border-b border-[#ffa45c]/25">
      <div aria-hidden className="ambient-glow">
        <div className="ambient-orb ambient-orb-gold" />
        <div className="ambient-orb ambient-orb-navy" />
      </div>
      <div className="relative z-[1] mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-12 lg:py-14">
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-stretch lg:gap-x-14 lg:gap-y-6">
          <HeroGroup className="mx-auto w-full max-w-xl lg:mx-0 lg:max-w-none">
            <HeroItem>
              <p className="text-[0.7rem] font-medium tracking-[0.28em] text-[#ffa45c] uppercase">
                Dhaka, Bangladesh
              </p>
              <div className="mt-4 h-px w-16 bg-gradient-to-r from-[#ffa45c] to-transparent" />
            </HeroItem>
            <HeroItem>
              <h1 className="mt-4 font-heading text-4xl leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">
                Razia Sultana Lina
              </h1>
            </HeroItem>
            <HeroItem>
              <p className="mt-3 text-lg text-[#f3f5fb] sm:text-xl">Manager, ACI Motors</p>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-white/72 sm:text-lg">
                Operation Head — leading
                facility operations, coordination, sales and after-sales. 18+
                years of experience across operations, audit, credit, and finance.
              </p>
            </HeroItem>
            <HeroItem>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "shine h-12 rounded-full px-6 text-base",
                  )}
                >
                  LinkedIn
                </a>
                <a href="#contact" className={outline}>
                  Contact
                </a>
                {cvAvailable ? (
                  <a href={cvPath} download className={outline}>
                    Download CV
                  </a>
                ) : null}
              </div>
            </HeroItem>
          </HeroGroup>
          <motion.div
            ref={photoRef}
            style={animate ? { y } : undefined}
            className="mx-auto w-full max-w-sm lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:h-full lg:max-w-none"
          >
            <ProfessionalPhoto
              src={promotionPhoto.src}
              alt={promotionPhoto.alt}
              caption={promotionPhoto.caption}
              tilt={false}
              motion={false}
              figureClassName="flex h-full flex-col"
              className="gold-frame aspect-[3/4] w-full lg:aspect-auto lg:min-h-0 lg:flex-1"
              imageClassName="object-cover object-center"
            />
          </motion.div>
          <Reveal>
            <dl className="grid gap-px overflow-hidden rounded-2xl border border-[#ffa45c]/35 sm:grid-cols-2">
              {facts.map((fact) => (
                <div key={fact.label} className="glass-card backdrop-blur-xl px-4 py-3.5">
                  <dt className="text-[0.7rem] tracking-[0.22em] text-[#ffa45c] uppercase">
                    {fact.label}
                  </dt>
                  <dd className="mt-1 text-sm text-[#f3f5fb] sm:text-base">{fact.value}</dd>
                  {"note" in fact ? (
                    <dd className="mt-1 text-sm text-[#ffa45c]">{fact.note}</dd>
                  ) : null}
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
