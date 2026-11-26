import { RevealItem, RevealGroup } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { credentials } from "@data/career";

export function EducationSection() {
  return (
    <section aria-labelledby="education-title" className="border-b border-white/10">
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <SectionHeading
          id="education-title"
          kicker="Education"
          title="Study and recognition"
        />
        <RevealGroup className="mt-10 grid gap-4 md:grid-cols-3">
          {credentials.map((item) => (
            <RevealItem key={item.title}>
            <article
              data-tilt
              className="glass-card backdrop-blur-xl hover-card h-full rounded-3xl border border-[#ffa45c]/35 p-6"
            >
              <p className="text-[0.7rem] tracking-[0.22em] text-[#ffa45c] uppercase">
                {item.kind}
                {item.when ? ` · ${item.when}` : ""}
              </p>
              <h3 className="mt-3 font-heading text-2xl leading-tight">
                {item.title}
              </h3>
              {item.detail ? (
                <p className="mt-3 text-sm leading-relaxed text-white/65">{item.detail}</p>
              ) : null}
            </article>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
