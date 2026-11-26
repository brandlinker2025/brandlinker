import Link from "next/link";

export function RidingLink() {
  return (
    <section aria-labelledby="riding-link-title" className="border-b border-white/10">
      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8">
        <Link
          href="/riding"
          data-tilt
          className="glass-card backdrop-blur-xl hover-card block max-w-md rounded-2xl border border-white/10 p-5"
        >
          <p className="text-[0.7rem] tracking-[0.22em] text-[#ffa45c] uppercase">Riding</p>
          <h2 id="riding-link-title" className="mt-2 font-heading text-2xl text-white">
            Tours and rallies
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/65">
            A separate page for the riding groups and photographs.
          </p>
        </Link>
      </div>
    </section>
  );
}
