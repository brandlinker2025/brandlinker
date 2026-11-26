import Image from "next/image";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { communityFacebookUrl } from "@/lib/site";
import { PopIn, TiltCard } from "@/components/motion-fx";

export function CreativeMinded() {
  return (
    <section aria-labelledby="cmbd-title" className="border-b border-[#ffa45c]/25">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-2 lg:items-center">
        <Reveal>
          <SectionHeading id="cmbd-title" kicker="Founded 15 May 2017" title="Creative Minded BD">
            <p>
              Founder and owner of Creative Minded BD. The Facebook page calls it
              “The largest Female biker group in Bangladesh.” The first
              initiative was free scooter and motorcycle training for 107 women.
            </p>
            <p className="mt-4">
              The group exists for training, safety, and confidence, because
              riding securely and avoiding accidents takes proper training.
            </p>
          </SectionHeading>
          <PopIn className="mt-8">
            <a href={communityFacebookUrl} target="_blank" rel="noopener noreferrer" className="liquid tap inline-flex items-center rounded-full px-7 text-base">
              Creative Minded BD on Facebook
            </a>
          </PopIn>
        </Reveal>
        <Reveal>
          <TiltCard max={5}>
            <div className="relative overflow-hidden rounded-[2rem] border border-[#ffa45c]/35">
              <Image src="/gallery/community-steps-group.jpg" alt="Creative Minded BD riders together on steps." width={1600} height={1200} sizes="(min-width: 1024px) 34rem, 100vw" className="kenburns kenburns-alt aspect-[4/3] w-full object-cover" />
            </div>
          </TiltCard>
        </Reveal>
      </div>
    </section>
  );
}
