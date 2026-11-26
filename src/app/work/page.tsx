import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { SectionHeading } from "@/components/section-heading";
import { Reveal, RevealGroup, RevealItem } from "@/components/reveal";
import {
  HireFiverrButton,
  SocialLinks,
} from "@/components/social-links";
import { WorkImage } from "@/components/work-image";
import { buttonVariants } from "@/components/ui/button";
import { caseStudies, services, type CaseStudy } from "@data/work";
import { videoAds } from "@/data/videos";
import { publicFileExists } from "@/lib/images";
import { cn } from "@/lib/utils";

const description =
  "Websites Razia Sultana Lina has built, including Just-Go, SheRides, and Tithonia.";

export const metadata: Metadata = {
  title: "Work With Me",
  description,
  alternates: { canonical: "/work" },
  openGraph: {
    title: "Work With Me · RSLina",
    description,
    url: "/work",
  },
  twitter: {
    title: "Work With Me · RSLina",
    description,
  },
};

const rideAppSlugs = ["sherides", "just-go"] as const;

function StudyCard({ study, index }: { study: CaseStudy; index: number }) {
  const shotReady = study.image ? publicFileExists(study.image) : false;
  const proofReady = study.proof ? publicFileExists(study.proof.src) : false;
  return (
    <article className="glass-card backdrop-blur-xl hover-card overflow-hidden rounded-3xl border border-[#ffa45c]/35">
      <div className="grid lg:grid-cols-[1.35fr_0.9fr]">
        <div className="relative aspect-[16/10] min-h-64">
          {study.image && shotReady ? (
            <WorkImage
              src={study.image}
              alt={study.imageAlt ?? study.name}
              available
              label={study.name}
              sizes="(min-width: 1024px) 58vw, 100vw"
              priority={index === 0}
              className="absolute inset-0 h-full w-full"
              imageClassName={study.imageClassName}
            />
          ) : study.image ? (
            <div className="absolute inset-0 flex flex-col justify-end bg-[radial-gradient(circle_at_20%_20%,rgba(47, 123, 255,0.4),transparent_46%),linear-gradient(160deg,#0b0e16,#07080d)] p-6">
              <p className="text-[0.65rem] tracking-[0.22em] text-[#ffa45c] uppercase">
                Homepage comes here
              </p>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/70">
                Add <span className="text-white">public{study.image}</span> for the
                live homepage. The card is already written.
              </p>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col justify-end bg-[radial-gradient(circle_at_20%_20%,rgba(47, 123, 255,0.4),transparent_46%),linear-gradient(160deg,#0b0e16,#07080d)] p-6">
              <p className="text-[0.65rem] tracking-[0.22em] text-[#ffa45c] uppercase">
                No live capture yet
              </p>
              <p className="mt-3 max-w-xs font-heading text-3xl text-white">{study.name}</p>
            </div>
          )}
        </div>
        <div className="flex flex-col p-6 sm:p-8">
          <p className="text-[0.7rem] tracking-[0.22em] text-[#ffa45c] uppercase">
            {study.place}
          </p>
          <h3 className="mt-2 font-heading text-3xl tracking-tight sm:text-4xl">
            {study.name}
          </h3>
          <dl className="mt-6 space-y-4 text-sm leading-relaxed text-white/75 sm:text-base">
            <div>
              <dt className="text-[0.7rem] tracking-[0.16em] text-white/45 uppercase">
                They needed
              </dt>
              <dd className="mt-1">{study.needed}</dd>
            </div>
            <div>
              <dt className="text-[0.7rem] tracking-[0.16em] text-white/45 uppercase">
                She built
              </dt>
              <dd className="mt-1">{study.built}</dd>
            </div>
            <div>
              <dt className="text-[0.7rem] tracking-[0.16em] text-white/45 uppercase">
                The result
              </dt>
              <dd className="mt-1">{study.result}</dd>
            </div>
          </dl>
          {study.url ? (
            <a
              href={study.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ size: "lg" }),
                "mt-8 inline-flex h-12 w-fit rounded-full px-6 text-base",
              )}
            >
              Visit live site
            </a>
          ) : (
            <p className="mt-8 text-sm text-white/50">
              A public address is not on file, so this card has no link.
              {study.image
                ? " The picture is from the design set, not a live homepage."
                : " There is no live screenshot on file either."}
            </p>
          )}
          {study.liveShot && shotReady ? (
            <p className="mt-3 text-xs text-white/40">
              Homepage, captured from the live site.
            </p>
          ) : null}
        </div>
      </div>
      {study.proof ? (
        <div className="border-t border-white/10 p-6 sm:p-8">
          <p className="text-[0.7rem] tracking-[0.18em] text-[#ffa45c] uppercase">
            {study.proof.caption}
          </p>
          {proofReady ? (
            <div className="relative mt-4 aspect-[16/7] overflow-hidden rounded-2xl border border-white/10">
              <WorkImage
                src={study.proof.src}
                alt={study.proof.alt}
                available
                label={study.name}
                sizes="(min-width: 1024px) 70vw, 100vw"
                className="absolute inset-0 h-full w-full"
              />
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-white/20 px-5 py-8">
              <p className="font-heading text-2xl text-white">Search proof comes here</p>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/65">
                Add <span className="text-white">public{study.proof.src}</span> to show
                this search. The ranking is already stated above. This box is only the
                picture.
              </p>
            </div>
          )}
        </div>
      ) : null}
    </article>
  );
}

export default function WorkPage() {
  const primaryStudies = caseStudies.filter(
    (study) => !rideAppSlugs.includes(study.slug as (typeof rideAppSlugs)[number]),
  );
  const rideApps = rideAppSlugs.map(
    (slug) => caseStudies.find((study) => study.slug === slug) as CaseStudy,
  );

  return (
    <main>
      <PageHero kicker="Work" title="Sites she has built.">
        <p>
          One card for each project: what someone needed, what she made, and
          what came of it.
        </p>
        <div className="mt-6">
          <HireFiverrButton />
        </div>
      </PageHero>

      <section aria-labelledby="video-ads-title" className="border-b border-white/10">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <SectionHeading id="video-ads-title" kicker="Video" title="AI video ads" />
          <RevealGroup className="mt-10 grid grid-cols-2 items-start gap-x-4 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
            {videoAds.map((video) => (
              <RevealItem key={video.src} className="w-full max-w-[220px]">
                <div className="gold-frame relative overflow-hidden rounded-2xl border border-[#ffa45c]/70 bg-[#07080d]">
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255, 164, 92,0.4),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(61,108,181,0.45),transparent_60%),linear-gradient(165deg,#121a2e,#07080d)]"
                  />
                  <video
                    controls
                    muted
                    playsInline
                    preload="metadata"
                    poster={video.poster}
                    width={video.width}
                    height={video.height}
                    className="relative z-[1] w-full bg-transparent object-contain"
                    style={{ aspectRatio: `${video.width} / ${video.height}` }}
                  >
                    <source src={video.src} type="video/mp4" />
                  </video>
                </div>
                <h3 className="mt-3 font-heading text-lg leading-snug">{video.title}</h3>
                <p className="mt-1 text-xs leading-relaxed tracking-wide text-white/70">
                  {video.caption}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <section aria-labelledby="portfolio-title" className="border-b border-white/10">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <h2 id="portfolio-title" className="sr-only">
            Portfolio
          </h2>
          <div className="grid gap-12">
            {primaryStudies.map((study, index) => (
              <StudyCard key={study.slug} study={study} index={index} />
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="ride-apps-title" className="border-b border-white/10">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <SectionHeading id="ride-apps-title" kicker="Apps" title="SheRides and Just-Go" />
          <div className="mt-10 grid gap-12">
            {rideApps.map((study) => (
              <StudyCard key={study.slug} study={study} index={1} />
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="services-title">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <SectionHeading id="services-title" kicker="Studio" title="Also available" />
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/60">
            The same studio, if you need a site, a mark, a video, or a Google
            listing.
          </p>
          <ul className="mt-8 divide-y divide-white/10 border-y border-white/10">
            {services.map((service) => (
              <li key={service.number}>
                <Reveal>
                  <div className="grid gap-2 py-6 md:grid-cols-[4rem_1fr] md:gap-8">
                    <p className="font-heading text-sm tracking-[0.2em] text-[#ffa45c]">
                      {service.number}
                    </p>
                    <div>
                      <h3 className="font-heading text-xl">{service.title}</h3>
                      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">
                        {service.text}
                      </p>
                    </div>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
          <div className="glass-card backdrop-blur-xl mt-10 flex flex-col gap-6 rounded-3xl border border-[#ffa45c]/35 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <h2 className="font-heading text-2xl">Hire on Fiverr</h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/70">
                The profile is rslinacmbd.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <HireFiverrButton />
              <SocialLinks />
            </div>
          </div>
          <p className="mt-6 text-sm text-white/55">
            A brand partnership, rather than a gig, starts on the{" "}
            <Link href="/collaborate" className="text-[#ffa45c] underline-offset-4 hover:underline">
              collaboration page
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
