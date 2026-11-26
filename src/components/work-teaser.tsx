import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function WorkTeaser() {
  return (
    <section aria-labelledby="teaser-title" className="border-t border-white/10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-16 sm:px-8 sm:py-24 md:flex-row md:items-end md:justify-between">
        <Reveal className="min-w-0">
          <p className="text-[0.7rem] tracking-[0.28em] text-[#ffa45c] uppercase">
            Web projects
          </p>
          <h2
            id="teaser-title"
            className="mt-3 max-w-xl font-heading text-4xl leading-[0.95] tracking-tight text-white sm:text-5xl"
          >
            Sites, kept separate from the day job.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
            AI video ads, then
            Tithonia. SheRides and Just-Go sit further down that page.
          </p>
        </Reveal>
        <Link
          href="/work"
          className={cn(
            buttonVariants({ size: "lg" }),
            "h-12 shrink-0 rounded-full px-6 text-base",
          )}
        >
          See the work
        </Link>
      </div>
    </section>
  );
}
