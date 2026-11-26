import Image from "next/image";
import Link from "next/link";
import { RevealGroup, RevealItem } from "@/components/reveal";
import { PopIn, TiltCard } from "@/components/motion-fx";
import { SectionHeading } from "@/components/section-heading";
import { caseStudies } from "@data/work";

export function WorkCards({ exclude = [] }: { exclude?: string[] }) {
  const items = caseStudies.filter((c) => c.image && !exclude.includes(c.slug));
  return (
    <section id="work" aria-labelledby="work-title" className="scroll-mt-24 border-b border-white/10">
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <SectionHeading id="work-title" kicker="Web projects" title="Sites, kept separate from the day job." />
        <RevealGroup className="mt-10 grid gap-5 sm:grid-cols-2">
          {items.map((c) => (
            <RevealItem key={c.slug} className="h-full">
              <TiltCard className="h-full"><Link href={`/work#${c.slug}`} className="group glass-card hover-card flex h-full flex-col overflow-hidden rounded-3xl border border-white/10">
                <div className="relative aspect-[16/10] overflow-hidden bg-black">
                  <Image src={c.image!} alt={c.imageAlt ?? c.name} fill sizes="(min-width: 640px) 50vw, 100vw" className="media-zoom object-cover object-top" />
                </div>
                <div className="p-5 sm:p-6">
                  <h3 className="font-heading text-2xl text-white">{c.name}</h3>
                  <p className="mt-1 text-sm text-[#ffa45c]">{c.place}</p>
                </div>
              </Link></TiltCard>
            </RevealItem>
          ))}
        </RevealGroup>
        <PopIn className="mt-10">
          <Link href="/work" className="liquid tap inline-flex items-center rounded-full px-7 text-base">
            See the work
          </Link>
        </PopIn>
      </div>
    </section>
  );
}
