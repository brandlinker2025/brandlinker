"use client";

import Image from "next/image";
import { HeroGroup, HeroItem, RevealFrame } from "@/components/reveal";
import { FloatTilt, PopIn } from "@/components/motion-fx";
import { linkedinUrl } from "@/lib/site";

export const designation = "Manager, ACI Motors";

export function PremiumHero() {
  return (
    <section className="relative overflow-hidden border-b border-[#ffa45c]/25">
      <div aria-hidden className="pointer-events-none absolute inset-0 z-[0] bg-gradient-to-r from-[#05070d]/55 via-[#05070d]/10 to-transparent" />
      <div className="relative z-[1] mx-auto grid w-full max-w-6xl items-center gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-14 lg:py-20">
        <HeroGroup className="min-w-0">
          <HeroItem>
            <p className="text-[0.72rem] font-medium tracking-[0.3em] text-[#ffa45c] uppercase">
              Dhaka, Bangladesh
            </p>
          </HeroItem>
          <HeroItem>
            <h1 className="hero-name mt-5 font-heading font-bold tracking-tight">
              Razia Sultana{" "}
              <span className="block gold-text">Lina</span>
            </h1>
          </HeroItem>
          <HeroItem>
            <p className="mt-6 text-lg font-medium text-[#f3f5fb] sm:text-2xl">{designation}</p>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/72 sm:text-lg">
              Operation Head — leading
              facility operations, coordination, sales and after-sales at the Yamaha Flagship Center, Tejgaon.
            </p>
          </HeroItem>
          <HeroItem>
            <div className="mt-8 flex flex-wrap gap-3">
              <PopIn>
                <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="liquid tap inline-flex items-center rounded-full px-7 text-base">
                  LinkedIn
                </a>
              </PopIn>
              <PopIn>
                <a href="/collaborate" className="liquid tap inline-flex items-center rounded-full px-7 text-base">
                  Contact
                </a>
              </PopIn>
            </div>
          </HeroItem>
        </HeroGroup>
        <div className="relative mx-auto w-full max-w-[22rem] lg:max-w-none">
          <div aria-hidden className="portrait-glow" />
          <FloatTilt><RevealFrame eager><figure className="relative overflow-hidden rounded-[2rem] border border-[#ffa45c]/45 bg-black shadow-2xl">
            <Image
              src="/corporate/portrait-dark.jpg"
              alt="Portrait of Razia Sultana Lina."
              width={1600}
              height={1285}
              priority
              sizes="(min-width: 1024px) 26rem, 22rem"
              className="aspect-[4/5] w-full object-cover object-[50%_30%]"
            />
          </figure></RevealFrame></FloatTilt>
        </div>
      </div>
    </section>
  );
}
