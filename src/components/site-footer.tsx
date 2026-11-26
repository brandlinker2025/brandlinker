import Link from "next/link";
import { SocialLinks } from "@/components/social-links";

const links = [
  { href: "/#about", label: "About" },
  { href: "/career", label: "Career" },
  { href: "/work", label: "Work" },
  { href: "/freelance", label: "Freelance" },
  { href: "/riding", label: "Riding" },
  { href: "/#contact", label: "Contact" },
  { href: "/collaborate", label: "Collaborate" },
] as const;

export function SiteFooter() {
  return (
    <footer id="site-footer" className="mt-auto border-t border-white/10">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-heading text-2xl text-white">Razia Sultana Lina</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/65">
            Manager, ACI Motors — Yamaha Flagship Center, Tejgaon. Dhaka, Bangladesh.
          </p>
        </div>
        <div>
          <p className="text-[0.7rem] tracking-[0.28em] text-[#ffa45c] uppercase">
            On this site
          </p>
          <ul className="mt-4 space-y-2">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-white/75 hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <a href="/cv/Razia-Sultana-Lina-CV.pdf" download className="text-sm text-white/75 hover:text-white">
                Download CV
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-[0.7rem] tracking-[0.28em] text-[#ffa45c] uppercase">
            Reach
          </p>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Write through the inquiry form.
          </p>
          <div className="mt-4">
            <Link
              href="/collaborate"
              className="text-sm text-[#ffa45c] underline underline-offset-4 hover:text-white"
            >
              Open the inquiry form
            </Link>
          </div>
          <div className="mt-4">
            <SocialLinks community />
          </div>
        </div>
      </div>
      <div className="mx-auto w-full max-w-6xl px-5 pb-12 sm:px-8">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-[rgba(212,166,74,0.6)] bg-[#0b1226] px-5 py-5 text-center sm:flex-row sm:text-left">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/brandlinker-mark.webp" alt="BrandLinker logo" width={56} height={56} loading="lazy" decoding="async" className="h-14 w-14 shrink-0 rounded-full" />
          <div>
            <p className="font-semibold text-[#f6d27a]">Founder &amp; owner of BrandLinker</p>
            <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-[#f6d27a] sm:justify-start">
              <li><a href="https://www.brandlinkerbd.com/" className="underline underline-offset-4 hover:text-white">BrandLinker</a></li>
              <li><a href="https://brandlinkerdubai.com/" className="underline underline-offset-4 hover:text-white">BrandLinker Dubai</a></li>
              <li><a href="https://www.brandlinkerspark.com/" className="underline underline-offset-4 hover:text-white">BrandLinker Spark</a></li>
              <li><a href="https://brandlinkerstudio.com/" className="underline underline-offset-4 hover:text-white">BrandLinker Studio</a></li>
              <li><a href="https://cheapticketfinder.site/" className="underline underline-offset-4 hover:text-white">Cheap Ticket Finder</a></li>
              <li><a href="https://sherides.online/" className="underline underline-offset-4 hover:text-white">SheRides</a></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
