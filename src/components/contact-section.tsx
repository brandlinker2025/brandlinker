import Link from "next/link";
import { RevealItem, RevealGroup } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { PopIn, TiltCard } from "@/components/motion-fx";
import { facebookUrl, fiverrUrl, linkedinUrl, tiktokUrl } from "@/lib/site";

const channels = [
  {
    label: "LinkedIn",
    value: "linkedin.com/in/rslina",
    href: linkedinUrl,
  },
  {
    label: "Facebook",
    value: "facebook.com/rslinacmd",
    href: facebookUrl,
  },
  {
    label: "TikTok",
    value: "@raziasultanalina",
    href: tiktokUrl,
  },
  {
    label: "Fiverr",
    value: "fiverr.com/rslinacmbd",
    href: fiverrUrl,
  },
] as const;

export function ContactSection() {
  return (
    <section id="contact" className="scroll-mt-24">
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <SectionHeading kicker="Contact" title="Write to Lina">
          A note goes through the inquiry form. The public profiles are listed
          below.
        </SectionHeading>
        <p className="mt-8">
          <PopIn>
            <Link
              href="/collaborate"
              className="liquid inline-flex h-12 items-center rounded-full bg-primary px-6 text-base font-medium text-primary-foreground"
            >
              Open the inquiry form
            </Link>
          </PopIn>
        </p>
        <p className="mt-6 text-sm text-white/70">
          <span className="text-[0.7rem] tracking-[0.22em] text-[#ffa45c] uppercase">Email</span>
          <span className="ml-3 select-all break-all text-base text-white">creativemindedbd@gmail.com</span>
        </p>
        <RevealGroup className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {channels.map((channel) => (
            <RevealItem key={channel.label} className="h-full">
              <TiltCard className="h-full"><a
                href={channel.href}
                data-tilt
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card backdrop-blur-xl hover-card flex h-full flex-col rounded-2xl border border-white/10 px-5 py-4"
              >
                <span className="text-[0.7rem] tracking-[0.22em] text-[#ffa45c] uppercase">
                  {channel.label}
                </span>
                <span className="mt-2 text-base text-white">{channel.value}</span>
              </a></TiltCard>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
