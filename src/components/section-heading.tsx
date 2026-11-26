import type { ReactNode } from "react";
import { HeadingReveal } from "@/components/motion-fx";

type SectionHeadingProps = {
  id?: string;
  kicker: string;
  title: string;
  children?: ReactNode;
  size?: "lg" | "sm";
  as?: "h2" | "h3";
};

export function SectionHeading({
  id,
  kicker,
  title,
  children,
  size = "lg",
  as: Heading = "h2",
}: SectionHeadingProps) {
  return (
    <div className="max-w-2xl">
      <p className="text-[0.7rem] font-medium tracking-[0.28em] text-[#ffa45c] uppercase">
        {kicker}
      </p>
      <div className="mt-4 h-px w-16 bg-gradient-to-r from-[#ffa45c] to-transparent" />
      <HeadingReveal>
      <Heading
        id={id}
        className={
          size === "sm"
            ? "mt-4 font-heading text-2xl leading-tight tracking-tight sm:text-3xl"
            : "mt-4 font-heading text-4xl leading-[1.05] tracking-tight sm:text-5xl"
        }
      >
        {title}
      </Heading>
      </HeadingReveal>
      {children ? (
        <div className="mt-5 text-base leading-relaxed text-white/72 sm:text-lg">
          {children}
        </div>
      ) : null}
    </div>
  );
}
