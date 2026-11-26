"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  FacebookMark,
  FiverrMark,
  LinkedInMark,
  TikTokMark,
} from "@/components/social-links";
import { facebookUrl, fiverrUrl, linkedinUrl, tiktokUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

const links = [
  { href: "/#about", label: "About" },
  { href: "/career", label: "Career" },
  { href: "/work", label: "Work" },
  { href: "/freelance", label: "Freelance" },
  { href: "/riding", label: "Riding" },
  { href: "/gallery", label: "Gallery" },
  { href: "/#contact", label: "Contact" },
  { href: "/collaborate", label: "Collaborate" },
] as const;

const iconClass =
  "inline-flex size-9 items-center justify-center rounded-full border border-[#ffa45c]/30 text-[#ffa45c] transition-[transform,color,border-color,box-shadow] duration-200 hover:border-[#ffa45c] hover:text-white hover:shadow-[0_0_18px_rgba(47, 123, 255,0.35)] motion-safe:hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f7bff] active:scale-95 active:border-[#ffa45c] active:shadow-[0_0_18px_rgba(47, 123, 255,0.45)] sm:size-10";

function subscribeScroll(onStoreChange: () => void) {
  window.addEventListener("scroll", onStoreChange, { passive: true });
  return () => window.removeEventListener("scroll", onStoreChange);
}

function useScrolled() {
  return useSyncExternalStore(
    subscribeScroll,
    () => window.scrollY > 8,
    () => false,
  );
}

function isCurrent(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href.startsWith("/#")) return false;
  return pathname === href;
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const scrolled = useScrolled();

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50">
      <div
        className={cn(
          "relative z-50 border-b transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300",
          scrolled || open
            ? "border-[#ffa45c]/40 bg-[#0d1018]/55 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl"
            : "border-transparent bg-transparent",
        )}
      >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-5 sm:px-8">
        <Link
          href="/"
          className="font-heading text-xl tracking-tight text-[#f3f5fb] transition-colors duration-200 hover:text-[#ffa45c]"
          onClick={() => setOpen(false)}
        >
          RSLina
        </Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isCurrent(pathname, link.href) ? "page" : undefined}
              className={cn(
                "liquid liquid-sm rounded-full px-3 py-2 text-sm text-white/75 transition-[color,background-color,transform] duration-200 hover:bg-white/10 hover:text-white motion-safe:hover:-translate-y-px",
                isCurrent(pathname, link.href) && "bg-white/10 text-white",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Razia Sultana Lina on LinkedIn"
            className={iconClass}
          >
            <LinkedInMark className="size-6" />
          </a>
          <a
            href={facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="RSLina on Facebook"
            className={iconClass}
          >
            <FacebookMark className="size-6" />
          </a>
          <a
            href={tiktokUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="RSLina on TikTok, @raziasultanalina"
            className={iconClass}
          >
            <TikTokMark className="size-6" />
          </a>
          <a
            href={fiverrUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="RSLina on Fiverr, rslinacmbd"
            className={iconClass}
          >
            <FiverrMark className="size-6" />
          </a>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full border border-[#ffa45c]/35 text-white lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X aria-hidden /> : <Menu aria-hidden />}
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          </button>
        </div>
      </div>
      </div>
      {open ? (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="mobile-menu fixed inset-0 z-40 overflow-y-auto px-6 pt-24 pb-12 backdrop-blur-2xl lg:hidden"
        >
          <ul className="mx-auto flex w-full max-w-sm flex-col gap-3">
            {links.map((link, index) => (
              <li
                key={link.href}
                className="mobile-menu-link"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <Link
                  href={link.href}
                  aria-current={isCurrent(pathname, link.href) ? "page" : undefined}
                  className="glass-card block rounded-2xl border border-[#ffa45c]/45 px-5 py-4"
                  onClick={() => setOpen(false)}
                >
                  <span className="font-heading text-3xl text-[#ffd9b3]">{link.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
