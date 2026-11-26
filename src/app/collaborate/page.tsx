import type { Metadata } from "next";
import Link from "next/link";
import { CollaborateForm } from "@/components/collaborate-form";
import { PageHero } from "@/components/page-hero";
import { SectionHeading } from "@/components/section-heading";
import { SocialLinks } from "@/components/social-links";

const description =
  "Contact Razia Sultana Lina in Dhaka. Send an inquiry through the form.";

export const metadata: Metadata = {
  title: "Contact",
  description,
  alternates: { canonical: "/collaborate" },
  openGraph: {
    title: "Contact · RSLina",
    description,
    url: "/collaborate",
  },
  twitter: {
    title: "Contact · RSLina",
    description,
  },
};

const notes = [
  {
    title: "A direct note",
    text: "The inquiry form reaches Razia Sultana Lina.",
  },
  {
    title: "Web projects",
    text: "Sites she has built are on the work page, separate from her operations role.",
  },
  {
    title: "Her employment",
    text: "She is Manager, ACI Motors, and Operation Head. That is her job. It is not a partnership offered on this page.",
  },
] as const;

export default function CollaboratePage() {
  return (
    <main>
      <PageHero kicker="Contact" title="Write to Lina.">
        <p>
          For a note about her work, or about a web project. Send it through
          the inquiry form.
        </p>
      </PageHero>

      <section aria-labelledby="notes-title" className="border-b border-white/10">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <SectionHeading id="notes-title" kicker="Note" title="Before you send it" />
          <ul className="mt-10 grid gap-4 md:grid-cols-3">
            {notes.map((note) => (
              <li
                key={note.title}
                data-tilt
                className="glass-card backdrop-blur-xl hover-card rounded-3xl border border-[#ffa45c]/35 p-6"
              >
                <h3 className="font-heading text-2xl">{note.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/70">{note.text}</p>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm text-white/65">
            <Link
              href="/work"
              className="text-[#ffa45c] underline underline-offset-4 hover:text-white"
            >
              See the web projects
            </Link>
          </p>
        </div>
      </section>

      <section aria-labelledby="collab-title" className="border-b border-white/10">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8">
          <SectionHeading id="collab-title" kicker="Collaborations" title="Past collaborations" />
          {/* TODO: replace this card when she names collaborations she wants published. Do not invent brands. */}
          <div className="mt-6 rounded-3xl border border-dashed border-white/20 px-6 py-10">
            <p className="font-heading text-2xl">Not published yet</p>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/65">
              Brand work can be listed here when she is ready to name it. Nothing
              is filled in ahead of that.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="inquiry-title">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <SectionHeading id="inquiry-title" kicker="Form" title="Send an inquiry" />
            <p className="mt-4 text-base leading-relaxed text-white/70">
              Name, email, brand, budget if you have one, and the message.
              Fiverr, Facebook, and TikTok stay available.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <SocialLinks />
            </div>
          </div>
          <CollaborateForm />
        </div>
      </section>
    </main>
  );
}
