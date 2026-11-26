"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ScrollProgress } from "@/components/motion-fx";
import { CursorGlow } from "@/components/cursor-glow";
import DataRain from "@/components/ui/data-rain";

export function AuthenticatedChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    // Pure isolated login page: zero personal chrome, zero links, zero headers or footers
    return (
      <main id="content" className="flex flex-1 flex-col outline-none">
        {children}
      </main>
    );
  }

  return (
    <>
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="ambient-wash" />
        <DataRain />
        <div className="absolute -top-40 -left-24 h-[38rem] w-[38rem] rounded-full bg-[#1e6bff]/30 blur-[120px]" />
        <div className="absolute top-[12%] -right-28 h-[34rem] w-[34rem] rounded-full bg-[#ff9f5a]/28 blur-[130px]" />
        <div className="absolute top-[48%] left-[18%] h-[30rem] w-[30rem] rounded-full bg-[#1e6bff]/0 blur-[130px]" />
        <div className="absolute -bottom-32 right-[8%] h-[32rem] w-[32rem] rounded-full bg-[#1e6bff]/14 blur-[120px]" />
      </div>
      <div className="relative z-10 flex min-h-full flex-col">
        <ScrollProgress />
        <CursorGlow />
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-[#2f7bff] focus:px-4 focus:py-2 focus:text-[#0a0c12]"
        >
          Skip to content
        </a>
        <SiteHeader />
        <div id="content" tabIndex={-1} className="flex flex-1 flex-col outline-none">
          {children}
        </div>
        <SiteFooter />
      </div>
    </>
  );
}
