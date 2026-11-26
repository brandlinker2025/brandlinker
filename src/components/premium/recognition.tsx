import { RevealGroup, RevealItem } from "@/components/reveal";
import { TiltCard } from "@/components/motion-fx";
import { SectionHeading } from "@/components/section-heading";
import { credentials } from "@data/career";

const extra = [{ kind: "Promotion", title: "Manager, ACI Motors", detail: "July 2026", when: "" }];

export function Recognition() {
  const items = [...extra, ...credentials];
  return (
    <section aria-labelledby="recognition-title" className="border-b border-white/10">
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <SectionHeading id="recognition-title" kicker="Recognition" title="Study and recognition" />
        <RevealGroup className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <RevealItem key={item.title} className="h-full">
              <TiltCard className="h-full"><article className="glass-card hover-card gold-edge h-full rounded-3xl border border-[#ffa45c]/35 p-6">
                <p className="text-[0.72rem] tracking-[0.2em] text-[#ffa45c] uppercase">
                  {item.kind}{item.when ? ` · ${item.when}` : ""}
                </p>
                <h3 className="mt-3 font-heading text-xl leading-tight text-white sm:text-2xl">{item.title}</h3>
                {item.detail ? <p className="mt-3 text-sm text-white/65">{item.detail}</p> : null}
              </article></TiltCard>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
