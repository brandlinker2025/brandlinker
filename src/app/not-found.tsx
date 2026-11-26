import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center px-5 py-24">
      <div className="mx-auto w-full max-w-xl">
        <p className="text-[0.7rem] tracking-[0.28em] text-[#ffa45c] uppercase">
          Missing page
        </p>
        <h1 className="mt-3 font-heading text-5xl tracking-tight text-white">
          This address has no page.
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-white/70">
          Home, riding, work, and contact are still here.
        </p>
        <Link
          href="/"
          className={cn(buttonVariants({ size: "lg" }), "mt-8 h-12 rounded-full px-6 text-base")}
        >
          Back home
        </Link>
      </div>
    </main>
  );
}
