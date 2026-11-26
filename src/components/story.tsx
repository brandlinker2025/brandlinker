import { Reveal } from "@/components/reveal";
import { communityFacebookUrl } from "@/lib/site";

export function Story() {
  return (
    <section aria-labelledby="story-title" className="border-t border-white/10">
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <Reveal>
          <p className="text-[0.7rem] tracking-[0.28em] text-[#ffa45c] uppercase">
            My story
          </p>
          <h2
            id="story-title"
            className="mt-3 max-w-3xl font-heading text-4xl leading-[0.95] tracking-tight text-white sm:text-5xl"
          >
            Their own destination.
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(18rem,28rem)_1fr] lg:items-start">
          <Reveal>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="font-heading text-5xl leading-none tracking-tight text-white sm:text-6xl">
                  107
                </p>
                <p className="mt-3 text-sm tracking-[0.16em] text-[#ffa45c] uppercase">
                  Women trained free
                </p>
              </div>
              <div>
                <p className="font-heading text-5xl leading-none tracking-tight text-white sm:text-6xl">
                  48K
                </p>
                <p className="mt-3 text-sm tracking-[0.16em] text-[#ffa45c] uppercase">
                  Community followers
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              Free scooter and motorcycle training on 15 May 2017. The follower
              count is from the Creative Minded BD Facebook page.
            </p>
            <a
              href={communityFacebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex text-sm text-[#ffa45c] underline underline-offset-4 hover:text-white"
            >
              Creative Minded BD on Facebook
            </a>
          </Reveal>
          <div className="max-w-3xl space-y-6 text-base leading-relaxed text-white/75 sm:text-lg">
            <Reveal>
              <p>
                On 15 May 2017 Creative Minded BD started, and its first
                initiative was free scooter and motorcycle training for 107
                female bikers. That was the beginning. The Facebook page calls
                the group “The largest Female biker group in Bangladesh.”
              </p>
            </Reveal>
            <Reveal delay={0.04}>
              <p>
                Many women joined because they shared her concern. Women face
                constant harassment on public transport. On buses it comes from
                fellow passengers, helpers, and supervisors. With CNGs, the
                auto-rickshaws, drivers drop women in unknown places late at
                night, make indecent gestures, and there have been kidnappings
                and snatchings.
              </p>
            </Reveal>
            <Reveal delay={0.06}>
              <p>
                Her idea was that if women ride scooters, they can reach their
                own destinations independently, free of that harassment. Riding
                brings its own safety needs: avoiding accidents, and riding
                securely. Proper training matters. That is why Creative Minded
                BD exists. Training, safety, and confidence for women riders.
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <p>
                Razia Sultana Lina is a digital creator based in Dhaka,
                Bangladesh. In her own words, she is “a traveler and photographer
                who loves exploring new places and capturing the beauty of the
                world.”
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <p>
                On 1 July 2026 she became Manager, ACI Motors, and Operation Head. She also builds what she
                wants riders to have. SheRides is a women’s ride web app with
                notifications and SOS location. Just-Go is a female-focused ride
                sharing app. Around those products she does web, design, and
                video work.
              </p>
            </Reveal>
            {/* TODO: personal ride anecdote. She has not published a specific ride story. Add it in her words when she does. Do not invent a route, a bike, or a date. */}
          </div>
        </div>
      </div>
    </section>
  );
}
