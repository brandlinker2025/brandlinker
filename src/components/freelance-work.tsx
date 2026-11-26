import Link from "next/link";
import { RevealGroup, RevealItem } from "@/components/reveal";
import { PopIn, TiltCard } from "@/components/motion-fx";

const gigs = [
  { title: "Professional logo design & brand guidelines", href: "https://www.fiverr.com/rslinacmbd/do-professional-logo-design-brand-guidelines" },
  { title: "Logo, brand kits, social posts, banners & flyers", href: "https://www.fiverr.com/rslinacmbd/design-logo-brand-kits-social-media-posts-banners-and-flyers" },
  { title: "Modern web app / PWA / booking app (Next.js + Supabase)", href: "https://www.fiverr.com/rslinacmbd/build-a-modern-web-app-pwa-or-booking-app-with-nextjs-and-supabase" },
];
const fiverrPortfolio = [
  { img: "birthday-tribute", title: "Cinematic AI Birthday Tribute Video", meta: "Corporate client · 16:9 HD · Sep 2025", desc: "A premium birthday surprise for a Managing Director: captain's welcome, golden-hour cabin, skywriting message and cake cutting, with faces and branding kept the same in every scene." },
  { img: "sparkle-promo", title: "Sparkle Riding School — Bangla Animated Promo", meta: "43-second vertical promo · Oct 2026", desc: "Ghibli-style characters, a real website walkthrough, motion graphics, sound design, AI voiceover and thumbnails for Reels and YouTube." },
];
const clients = [
  { name: "Sparkle Riding School", img: "sparkle", desc: "Bilingual scooter-training website: package and price, Dhaka training locations, trainer, admission and FAQs.", href: "https://sparkleridingschool.com" },
  { name: "Helena Khan — Cinematographer", img: "helenkhan", desc: "Portfolio for a Dhaka cinematographer: video hero, showreel, selected films, packages and WhatsApp booking.", href: "https://helenkhan.com" },
  { name: "Cheap Ticket Finder", img: "cheapticket", desc: "My own cheap-flight finder for Bangladesh travellers: search fares from Dhaka and compare deals in one place.", href: "https://cheapticketfinder.site" },
];
const extras = ["Video and ads", "Real estate videos"];

export function FreelanceWork() {
  return (
    <section aria-label="Freelance work" className="border-b border-white/10">
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <div>
          <p className="text-[0.72rem] tracking-[0.2em] text-[#ffa45c] uppercase">Services on Fiverr</p>
          <RevealGroup className="mt-6 grid gap-4 sm:grid-cols-3">
            {gigs.map((g, i) => (
              <RevealItem key={g.href} className="h-full">
                <TiltCard className="h-full"><a href={g.href} target="_blank" rel="noopener noreferrer" className="glass-card hover-card block h-full rounded-3xl border border-white/10 p-5 sm:p-6">
                  <p className="font-heading text-sm tracking-[0.2em] text-[#ffa45c]">{String(i + 1).padStart(2, "0")}</p>
                  <h4 className="mt-2 font-heading text-xl text-white">{g.title}</h4>
                  <p className="mt-3 text-sm text-[#ffa45c]">View gig on Fiverr</p>
                </a></TiltCard>
              </RevealItem>
            ))}
          </RevealGroup>
          <div className="mt-10">
            <p className="text-[0.72rem] tracking-[0.2em] text-[#ffa45c] uppercase">From my Fiverr portfolio</p>
            <RevealGroup className="mt-4 grid gap-4 sm:grid-cols-2">
              {fiverrPortfolio.map((w) => (
                <RevealItem key={w.img} className="h-full">
                  <TiltCard className="h-full">
                    <a href="https://www.fiverr.com/rslinacmbd" target="_blank" rel="noopener noreferrer" className="glass-card hover-card group block h-full overflow-hidden rounded-3xl border border-white/10">
                      <div className="relative overflow-hidden">
                        <picture>
                          <source type="image/avif" srcSet={`/work/fiverr/${w.img}-640.avif 640w, /work/fiverr/${w.img}-1280.avif 1280w`} sizes="(min-width: 640px) 50vw, 100vw" />
                          <img src={`/work/fiverr/${w.img}-1280.webp`} srcSet={`/work/fiverr/${w.img}-640.webp 640w, /work/fiverr/${w.img}-1280.webp 1280w`} sizes="(min-width: 640px) 50vw, 100vw" width={1280} height={720} loading="lazy" decoding="async" alt={`${w.title} — preview frame`} className="media-zoom aspect-video w-full object-cover" />
                        </picture>
                        <span aria-hidden className="absolute top-3 right-3 rounded-full bg-black/70 px-3 py-1 text-[0.65rem] tracking-[0.2em] text-[#ffa45c] uppercase backdrop-blur">▶ Video</span>
                      </div>
                      <div className="p-5 sm:p-6">
                        <p className="text-[0.7rem] tracking-[0.18em] text-white/55 uppercase">{w.meta}</p>
                        <h4 className="mt-2 font-heading text-xl text-white">{w.title}</h4>
                        <p className="mt-2 text-sm text-white/70">{w.desc}</p>
                        <p className="mt-3 text-sm text-[#ffa45c]">View on Fiverr</p>
                      </div>
                    </a>
                  </TiltCard>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
          <div className="mt-10">
            <p className="text-[0.72rem] tracking-[0.2em] text-[#ffa45c] uppercase">Selected client work</p>
            <RevealGroup className="mt-4 grid gap-4 sm:grid-cols-3">
              {clients.map((c) => {
                const inner = (
                  <>
                    <picture>
                      <source type="image/avif" srcSet={`/work/clients/${c.img}-480.avif 480w, /work/clients/${c.img}-960.avif 960w`} sizes="(min-width: 640px) 33vw, 100vw" />
                      <img src={`/work/clients/${c.img}-960.webp`} srcSet={`/work/clients/${c.img}-480.webp 480w, /work/clients/${c.img}-960.webp 960w`} sizes="(min-width: 640px) 33vw, 100vw" width={960} height={1200} loading="lazy" decoding="async" alt={`${c.name} website preview`} className="aspect-[4/5] w-full rounded-2xl object-cover" />
                    </picture>
                    <h4 className="mt-4 font-heading text-xl text-white">{c.name}</h4>
                    <p className="mt-2 text-sm text-white/70">{c.desc}</p>
                    {c.href && <p className="mt-3 text-sm text-[#ffa45c]">Visit website</p>}
                  </>
                );
                const cls = "glass-card hover-card block h-full rounded-3xl border border-white/10 p-4 sm:p-5";
                return (
                  <RevealItem key={c.name} className="h-full">
                    <TiltCard className="h-full">{c.href ? <a href={c.href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a> : <div className={cls}>{inner}</div>}</TiltCard>
                  </RevealItem>
                );
              })}
            </RevealGroup>
          </div>
          <div className="mt-6 rounded-3xl border border-white/10 p-5 sm:p-6">
            <p className="text-[0.72rem] tracking-[0.2em] text-[#ffa45c] uppercase">Also available — contact me</p>
            <ul className="mt-3 flex flex-wrap gap-3">
              {extras.map((e) => (
                <li key={e}><Link href="/collaborate" className="inline-block rounded-full border border-[#ffa45c]/40 px-4 py-1.5 text-sm text-white/85 hover:border-[#ffa45c]">{e}</Link></li>
              ))}
            </ul>
          </div>
          <PopIn className="mt-6">
            <a href="https://www.fiverr.com/rslinacmbd" target="_blank" rel="noopener noreferrer" className="liquid tap inline-flex items-center rounded-full px-7 text-base">
              Hire me on Fiverr
            </a>
          </PopIn>
        </div>
      </div>
    </section>
  );
}
