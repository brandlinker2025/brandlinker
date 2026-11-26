import { PopList } from "@/components/motion-fx";
import { SectionHeading } from "@/components/section-heading";
import { secondarySkill, skills } from "@data/career";

export function SkillsSection() {
  return (
    <section aria-labelledby="skills-title" className="border-b border-white/10">
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <SectionHeading id="skills-title" kicker="Skills" title="What she runs" />
        <PopList
          items={skills}
          className="mt-8 flex flex-wrap gap-2"
          itemClassName="glass-card backdrop-blur-xl rounded-full px-4 py-2 text-sm text-[#f3f5fb] cursor-default"
        />
        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-white/60">
          {secondarySkill} sits beside that work, as a secondary skill.
        </p>
      </div>
    </section>
  );
}
