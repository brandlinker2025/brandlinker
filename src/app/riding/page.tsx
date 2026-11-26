import type { Metadata } from "next";
import { ProfessionalPhoto } from "@/components/professional-photo";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import {
  groupRidingPhotos,
  malaysiaTourPhotos,
  ridingHero,
  ridingPhotos,
  type RidePhoto,
} from "@/data/riding";
import { communityFacebookUrl, womenRidersGroup } from "@/lib/site";

const description =
  "Riding photographs, plus Advisor of YRC Girls BD and founder and owner of Creative Minded BD.";

export const metadata: Metadata = {
  title: "Riding",
  description,
  alternates: { canonical: "/riding" },
  openGraph: {
    title: "Riding · RSLina",
    description,
    url: "/riding",
  },
  twitter: {
    title: "Riding · RSLina",
    description,
  },
};

function frameFor(photo: RidePhoto) {
  const portrait = photo.height > photo.width;
  const ratio = photo.width / photo.height;
  const frame = "gold-frame border border-[#ffa45c]/70";
  if (portrait) {
    return {
      className: `${frame} aspect-[3/4]`,
      imageClassName: "object-contain object-top",
    };
  }
  if (ratio > 1.6) {
    return {
      className: `${frame} aspect-video`,
      imageClassName: "object-cover object-[center_20%]",
    };
  }
  if (ratio > 1.4) {
    return {
      className: `${frame} aspect-[3/2]`,
      imageClassName: "object-cover object-[center_20%]",
    };
  }
  return {
    className: `${frame} aspect-[4/3]`,
    imageClassName: "object-cover object-[center_20%]",
  };
}

function PhotoGrid({ photos }: { photos: RidePhoto[] }) {
  return (
    <ul className="mt-8 grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {photos.map((photo) => {
        const frame = frameFor(photo);
        return (
          <li key={photo.src}>
            <ProfessionalPhoto
              src={photo.src}
              alt={photo.alt}
              caption={photo.caption}
              className={frame.className}
              imageClassName={frame.imageClassName}
            />
          </li>
        );
      })}
    </ul>
  );
}

export default function RidingPage() {
  return (
    <main>
      <header className="border-b border-[#ffa45c]/25">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-8 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-14">
          <div className="max-w-xl">
            <p className="text-[0.7rem] tracking-[0.28em] text-[#ffa45c] uppercase">
              Riding
            </p>
            <div className="mt-4 h-px w-16 bg-gradient-to-r from-[#ffa45c] to-transparent" />
            <h1 className="mt-4 font-heading text-4xl leading-[0.95] tracking-tight sm:text-5xl">
              On the road.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
              {ridingHero.caption}.
            </p>
          </div>
          <figure className="mx-auto w-full max-w-sm lg:max-w-none">
            <div className="gold-frame relative aspect-[3/4] overflow-hidden rounded-2xl border border-[#ffa45c]/70 bg-[#07080d]">
              <img
                src={ridingHero.src}
                alt={ridingHero.alt}
                className="absolute inset-0 h-full w-full object-cover object-top"
              />
            </div>
          </figure>
        </div>
      </header>

      <section aria-labelledby="riding-photos-title" className="border-b border-white/10">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8">
          <Reveal>
          <SectionHeading id="riding-photos-title" kicker="Photographs" title="Riding" />
          <PhotoGrid photos={ridingPhotos} />
          <div className="mt-16">
            <SectionHeading as="h3" kicker="Tour" title="Malaysia tour" size="sm" />
          </div>
          <PhotoGrid photos={malaysiaTourPhotos} />
          </Reveal>
        </div>
      </section>

      <section aria-labelledby="group-riding-title" className="border-b border-white/10">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8">
          <Reveal>
          <SectionHeading id="group-riding-title" kicker="Riding" title="Group riding" />
          <PhotoGrid photos={groupRidingPhotos} />
          </Reveal>
        </div>
      </section>

      <section aria-labelledby="groups-title" className="border-b border-white/10">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <h2 id="groups-title" className="sr-only">
            Riding groups
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <article data-tilt className="glass-card backdrop-blur-xl hover-card rounded-3xl border border-[#ffa45c]/35 p-6 sm:p-8">
              <h3 className="font-heading text-3xl leading-tight tracking-tight">
                {womenRidersGroup.role}, {womenRidersGroup.name}
              </h3>
              <p className="mt-4 text-base leading-relaxed text-white/75">
                The most organized female biker group in Bangladesh. Lina is{" "}
                {womenRidersGroup.role}.
              </p>
            </article>
            <article data-tilt className="glass-card backdrop-blur-xl hover-card rounded-3xl border border-[#ffa45c]/35 p-6 sm:p-8">
              <h3 className="font-heading text-3xl leading-tight tracking-tight">
                Founder &amp; Owner, Creative Minded BD
              </h3>
              <div className="mt-4 space-y-3 text-base leading-relaxed text-white/75">
                <p>
                  Founded in 2017. One of the largest female biker groups in
                  Bangladesh, with about 48K members. It runs tours and works on
                  social issues.
                </p>
                <p>
                  The first initiative was free riding training for 107 women, so
                  they could commute safely instead of facing harassment on buses.
                </p>
              </div>
              <a
                href={communityFacebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex text-sm text-[#ffa45c] underline underline-offset-4 hover:text-white"
              >
                Creative Minded BD on Facebook
              </a>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
