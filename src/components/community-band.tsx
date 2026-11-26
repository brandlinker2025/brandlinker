export function CommunityBand() {
  return (
    <section
      id="journey"
      aria-labelledby="community-title"
      className="scroll-mt-24 border-t border-white/10"
    >
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <div>
          <p className="text-[0.7rem] tracking-[0.28em] text-[#ffa45c] uppercase">
            Founder &amp; Owner · 15 May 2017
          </p>
          <h2
            id="community-title"
            className="mt-4 font-heading text-5xl leading-[0.92] tracking-tight text-white sm:text-6xl"
          >
            Creative Minded BD
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-white/70">
            A female biker community in Bangladesh. She founded it and still
            owns it. This is her community leadership.
          </p>
        </div>
        <blockquote className="border-l-2 border-[#2f7bff] pl-5">
          <p className="font-serif text-3xl leading-snug text-white italic sm:text-4xl">
            “The largest Female biker group in Bangladesh”
          </p>
          <footer className="mt-4 text-sm text-white/60">
            From the Creative Minded BD Facebook page.
          </footer>
        </blockquote>
      </div>
    </section>
  );
}
