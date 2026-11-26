import { SectionHeading } from "@/components/section-heading";
import { CreativeMinded } from "@/components/premium/creative-minded";
import { Counter, type Stat } from "@/components/premium/impact";

const community: Stat[] = [
  { to: 107, suffix: "", label: "Women trained free", note: "First Creative Minded BD initiative" },
  { to: 48, suffix: "K", label: "Community followers", note: "Creative Minded BD on Facebook" },
  { to: 2019, suffix: "", label: "Women's Day rally", note: "Every 8 March since 2019", plain: true },
];

export function Beyond() {
  return (
    <section id="beyond" aria-labelledby="beyond-title" className="scroll-mt-24 border-b border-[#ffa45c]/25">
      <div className="mx-auto w-full max-w-6xl px-5 pt-16 sm:px-8 sm:pt-24">
        <SectionHeading id="beyond-title" kicker="Beyond the office" title="Community">
          Outside the job: a riders’ community that trains women and rides together.
        </SectionHeading>
        <dl className="mt-10 grid gap-px overflow-hidden rounded-3xl border border-[#ffa45c]/35 sm:grid-cols-3">
          {community.map((s) => (
            <div key={s.label} className="glass-card backdrop-blur-xl px-6 py-7">
              <dt className="sr-only">{s.label}</dt>
              <dd className="font-heading text-5xl leading-none text-[#f3f5fb] sm:text-6xl"><Counter stat={s} /></dd>
              <dd className="mt-3 text-[0.72rem] tracking-[0.2em] text-[#ffa45c] uppercase">{s.label}</dd>
              <dd className="mt-1 text-sm text-white/60">{s.note}</dd>
            </div>
          ))}
        </dl>
      </div>
      <CreativeMinded />
      <div aria-hidden className="pb-16 sm:pb-24" />
    </section>
  );
}
