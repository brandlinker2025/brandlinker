import Link from "next/link";
import { RevealGroup, RevealItem } from "@/components/reveal";
import { DrawLine, PopIn, TiltCard } from "@/components/motion-fx";
import { SectionHeading } from "@/components/section-heading";
import { aciLadder, earlierRoles } from "@data/career";

const rows = [
  ...aciLadder.map((r) => ({ title: r.end === "Present" ? "Manager" : r.title, org: "ACI Motors Ltd.", when: `${r.start} – ${r.end}`, bullets: r.bullets, current: r.end === "Present" })),
  ...earlierRoles.map((r) => ({ title: r.title, org: `${r.organization}, ${r.place}`, when: `${r.start} – ${r.end}`, bullets: r.bullets, current: false })),
];

export function CareerTimeline() {
  return (
    <section id="career" aria-labelledby="career-title" className="scroll-mt-24 border-b border-[#ffa45c]/25">
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <SectionHeading id="career-title" kicker="Career" title="From accountant to manager">
          Newest role first, back to December 2007.
        </SectionHeading>
        <RevealGroup className="relative mt-12 space-y-6 border-l border-[#ffa45c]/15 pl-6 sm:pl-10">
          <DrawLine className="-left-px" />
          {rows.map((r) => (
            <RevealItem key={r.title + r.when}>
              <article className="relative">
                <span aria-hidden className={`timeline-dot ${r.current ? "timeline-dot-live" : ""}`} />
                <TiltCard max={4}><div className="glass-card hover-card rounded-3xl border border-white/10 p-5 sm:p-6">
                  <p className="text-[0.72rem] tracking-[0.2em] text-[#ffa45c] uppercase">{r.when}</p>
                  <h3 className="mt-2 font-heading text-2xl text-white sm:text-3xl">{r.title}</h3>
                  <p className="mt-1 text-sm text-white/60">{r.org}</p>
                  <ul className="mt-4 space-y-1.5 text-sm leading-relaxed text-white/75 sm:text-base">
                    {r.bullets.map((b) => (
                      <li key={b} className="flex gap-2"><span aria-hidden className="text-[#ffa45c]">—</span>{b}</li>
                    ))}
                  </ul>
                </div></TiltCard>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>
        <div className="mt-10 flex flex-wrap gap-3">
          <PopIn>
            <Link href="/career" className="liquid tap inline-flex items-center rounded-full px-7 text-base">
              Read the career
            </Link>
          </PopIn>
        </div>
      </div>
    </section>
  );
}
