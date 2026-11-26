"use client";

import { ProfessionalPhoto } from "@/components/professional-photo";
import { Reveal, useCanAnimate } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { aciLadder, earlierRoles } from "@data/career";
import { cn } from "@/lib/utils";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

export function ExperienceSection() {
  const unique = earlierRoles.find((role) => !role.compact);
  const compact = earlierRoles.filter((role) => role.compact);
  const listRef = useRef<HTMLOListElement>(null);
  const animate = useCanAnimate();
  const { scrollYProgress } = useScroll({
    target: listRef,
    offset: ["start 92%", "end 40%"],
  });
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section id="experience" className="scroll-mt-24 border-b border-[#ffa45c]/25">
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <SectionHeading kicker="History" title="Newest role first">
          ACI Motors Ltd. from July 2026, then the roles back to December 2007.
          Only Manager is the present role.
        </SectionHeading>
        <ol ref={listRef} className="relative mt-12 space-y-12">
          <motion.span
            aria-hidden
            className="pointer-events-none absolute top-3 bottom-3 left-4 w-px origin-top bg-gradient-to-b from-[#f3f5fb] via-[#2f7bff] to-transparent"
            style={animate ? { scaleY, originY: 0 } : { scaleY: 1 }}
          />
          {aciLadder.map((step, index) => {
            const current = step.end === "Present";
            return (
              <li key={step.title}>
                <Reveal
                  delay={index * 0.08}
                  className="grid gap-6 border-t border-[#ffa45c]/20 pt-8 lg:grid-cols-[minmax(16rem,22rem)_1fr] lg:gap-10"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="relative z-10 inline-flex size-8 items-center justify-center rounded-full border border-[#ffa45c]/70 bg-[#07080d] text-sm text-[#f3f5fb] shadow-[0_0_16px_rgba(47, 123, 255,0.35)]">
                        {index + 1}
                      </span>
                      {current ? (
                        <span className="text-[0.65rem] tracking-[0.18em] text-[#ffa45c] uppercase">
                          Present
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-4 font-heading text-2xl leading-tight text-[#f3f5fb]">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm text-white/55">
                      {step.start} – {step.end}
                    </p>
                    <ul className="mt-4 list-disc space-y-1 pl-4 text-sm leading-relaxed text-white/72">
                      {step.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  </div>
                  <ul
                    className={cn(
                      "grid gap-3",
                      step.photos.length > 1 ? "grid-cols-2 lg:grid-cols-4" : "max-w-sm",
                    )}
                  >
                    {step.photos.map((photo) => (
                      <li key={photo.src} className={cn(photo.wide && "col-span-2")}>
                        <ProfessionalPhoto
                          src={photo.src}
                          alt={photo.alt}
                          distant={photo.distant}
                          className={
                            photo.distant
                              ? undefined
                              : photo.wide
                                ? "aspect-[16/10]"
                                : photo.tall
                                  ? "aspect-[480/853]"
                                  : "aspect-[3/4]"
                          }
                          imageClassName={
                            photo.distant || photo.contain
                              ? "object-contain object-center"
                              : undefined
                          }
                        />
                      </li>
                    ))}
                  </ul>
                </Reveal>
              </li>
            );
          })}
        </ol>

        {unique ? (
          <article
            data-tilt
            className="glass-card backdrop-blur-xl hover-card mt-14 rounded-2xl p-6"
          >
            <p className="text-[0.7rem] tracking-[0.22em] text-[#ffa45c] uppercase">
              Before ACI Motors Ltd.
            </p>
            <h3 className="mt-3 font-heading text-2xl text-[#f3f5fb]">{unique.organization}</h3>
            <p className="mt-2 text-base text-white/85">{unique.title}</p>
            <p className="mt-1 text-sm text-white/55">
              {unique.start} – {unique.end}
              <span className="px-2 text-white/30">·</span>
              {unique.place}
            </p>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm leading-relaxed text-white/72">
              {unique.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </article>
        ) : null}

        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {compact.map((role) => (
            <li key={role.organization} data-tilt className="glass-card backdrop-blur-xl hover-card rounded-2xl px-5 py-4">
              <h3 className="text-base text-[#f3f5fb]">{role.organization}</h3>
              <p className="mt-1 text-sm text-white/75">{role.title}</p>
              <p className="mt-1 text-sm text-white/50">
                {role.start} – {role.end}
                <span className="px-2 text-white/25">·</span>
                {role.place}
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-4 text-sm leading-relaxed text-white/60">
                {role.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
