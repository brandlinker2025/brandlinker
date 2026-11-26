"use client";

import { animate, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useCanAnimate } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";

export type Stat = { to: number; prefix?: string; suffix: string; label: string; note: string; plain?: boolean };

const stats: Stat[] = [
  { to: 18, suffix: "+", label: "Years of experience", note: "Operations, audit, credit, and finance" },
  { to: 8, suffix: "+", label: "Years at ACI Motors Ltd.", note: "Since August 2018" },
  { to: 70, suffix: "", label: "Employees led", note: "Tejgaon and Gazipur centers" },
];

export function Counter({ stat }: { stat: Stat }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const can = useCanAnimate();
  const [value, setValue] = useState(stat.to);
  useEffect(() => {
    if (!can || !inView) return;
    const from = stat.plain ? stat.to - 12 : 0;
    const c = animate(from, stat.to, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => c.stop();
  }, [can, inView, stat]);
  return (
    <span ref={ref} className="tabular-nums">
      {value}
      {stat.suffix}
    </span>
  );
}

export function ImpactNumbers() {
  return (
    <section aria-labelledby="impact-title" className="border-b border-white/10">
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <SectionHeading id="impact-title" kicker="Career in numbers" title="The numbers on record" />
        <dl className="mt-10 grid gap-px overflow-hidden rounded-3xl border border-[#ffa45c]/35 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="glass-card backdrop-blur-xl px-6 py-7">
              <dt className="sr-only">{s.label}</dt>
              <dd className="font-heading text-5xl leading-none text-[#f3f5fb] sm:text-6xl">
                <Counter stat={s} />
              </dd>
              <dd className="mt-3 text-[0.72rem] tracking-[0.2em] text-[#ffa45c] uppercase">{s.label}</dd>
              <dd className="mt-1 text-sm text-white/60">{s.note}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
