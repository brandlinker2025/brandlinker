import type { ReactNode } from "react";

export function PageHero({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <header className="border-b border-white/10">
      <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
        <p className="text-[0.7rem] tracking-[0.28em] text-[#ffa45c] uppercase">
          {kicker}
        </p>
        <div className="mt-4 h-px w-16 bg-gradient-to-r from-[#ffa45c] to-transparent" />
        <h1 className="mt-4 max-w-4xl font-heading text-4xl leading-[1.05] tracking-tight sm:text-5xl">
          {title}
        </h1>
        <div className="mt-5 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
          {children}
        </div>
      </div>
    </header>
  );
}
