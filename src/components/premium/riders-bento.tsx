import Image from "next/image";
import Link from "next/link";
import { RevealGroup } from "@/components/reveal";
import { Parallax, PopIn, WipeItem } from "@/components/motion-fx";
import { SectionHeading } from "@/components/section-heading";

const tiles = [
  { src: "/gallery/red-day-bridge-group.jpg", alt: "Women dressed in red, standing with motorcycles on a bridge.", cap: "Women's Day rally", cls: "bento-a" },
  { src: "/gallery/rally-lead-rider.jpg", alt: "A rider at the front of a line of motorcycles.", cap: "Women's Day rally", cls: "bento-b" },
  { src: "/gallery/sajek.jpg", alt: "Riders stopped in Sajek, Rangamati.", cap: "Sajek, Rangamati", cls: "bento-c" },
  { src: "/gallery/yamaha-showroom-rally.jpg", alt: "Women in purple jerseys outside a showroom.", cap: "Before the ride", cls: "bento-d" },
  { src: "/gallery/yrc-rally-bridge.jpg", alt: "Riders crossing a bridge.", cap: "Women's Day rally", cls: "bento-e" },
  { src: "/gallery/ride-hills.jpg", alt: "A rider with arms raised on a green hill road.", cap: "On tour", cls: "bento-f" },
  { src: "/gallery/night-ride-crew.jpg", alt: "Riders together at night with their motorcycles.", cap: "On tour", cls: "bento-g" },
];

export function RidersBento() {
  return (
    <section aria-labelledby="riders-title" className="border-b border-white/10">
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <SectionHeading id="riders-title" kicker="Women riders" title="Tours and rallies">
          An annual Women's Day rally led by Lina every 8 March, each year since 2019.
        </SectionHeading>
        <RevealGroup className="bento mt-10">
          {tiles.map((t, i) => (
            <WipeItem key={t.src} className={`group relative overflow-hidden rounded-3xl border border-white/10 ${t.cls}`}>
              <Parallax className="absolute inset-0" distance={55}><Image src={t.src} alt={t.alt} fill sizes="(min-width: 1024px) 40vw, 100vw" className={`kenburns ${i % 2 ? "kenburns-alt" : ""} object-cover`} style={{ animationDelay: `${-i * 2.7}s` }} /></Parallax>
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pt-10 pb-3 text-[0.72rem] tracking-[0.2em] text-[#ffa45c] uppercase">
                {t.cap}
              </span>
            </WipeItem>
          ))}
        </RevealGroup>
        <PopIn className="mt-10">
          <Link href="/riding" className="liquid tap inline-flex items-center rounded-full px-7 text-base">
            See the riding page
          </Link>
        </PopIn>
      </div>
    </section>
  );
}
