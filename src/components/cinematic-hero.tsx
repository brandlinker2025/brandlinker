import Link from "next/link";
import { HeroCollage, type HeroRide } from "@/components/hero-collage";
import { buttonVariants } from "@/components/ui/button";
import { galleryItems } from "@data/gallery";
import { publicFileExists } from "@/lib/images";
import { cn } from "@/lib/utils";

function RoadLights() {
  return (
    <div className="road-stage opacity-50" aria-hidden="true">
      <div className="road-plane" />
      <span className="light-streak streak-a" />
      <span className="light-streak streak-b" />
      <span className="light-streak streak-c" />
    </div>
  );
}

export function CinematicHero() {
  const heroOrder = [
    "/gallery/ride-hills.jpg",
    "/gallery/rally-portrait.jpg",
    "/gallery/yrc-rally-convoy.jpg",
  ];
  const rides: HeroRide[] = heroOrder.map((src) => {
    const item = galleryItems.find((entry) => entry.src === src);
    return {
      src,
      title: item?.title ?? src,
      alt: item?.alt ?? "",
      available: publicFileExists(src),
    };
  });

  return (
    <section className="relative overflow-hidden">
      <RoadLights />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#07080d]/88 via-[#07080d]/55 to-[#07080d]/25"
        aria-hidden="true"
      />
      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-8 px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-2 lg:items-start lg:gap-12 lg:pt-10 lg:pb-8">
        <div>
          <p className="rise text-[0.7rem] tracking-[0.28em] text-[#ffa45c] uppercase">
            Razia Sultana Lina · Dhaka
          </p>
          <h1 className="rise rise-2 mt-3 font-heading text-5xl leading-[0.9] tracking-tight text-white sm:text-6xl lg:text-7xl">
            RSLina
          </h1>
          <p className="rise rise-3 mt-4 max-w-xl font-serif text-2xl leading-snug text-white italic sm:text-3xl">
            Founder of Creative Minded BD · Rider · Builder
          </p>
          <p className="rise rise-4 mt-4 max-w-lg text-base leading-relaxed text-white/75 sm:text-lg">
            Digital creator. A traveler and photographer based in Dhaka, Bangladesh.
          </p>
          <div className="rise rise-5 mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href="#journey"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-12 rounded-full px-6 text-base",
              )}
            >
              Explore My Journey
            </a>
            <Link
              href="/collaborate"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-12 rounded-full border-white/20 bg-white/5 px-6 text-base text-white hover:bg-white/10",
              )}
            >
              Collaborate With Me
            </Link>
          </div>
        </div>
        <HeroCollage rides={rides} />
      </div>
    </section>
  );
}
