import { isDistantPortrait } from "@data/professional";
import { RevealFrame } from "@/components/reveal";
import { cn } from "@/lib/utils";

export function ProfessionalPhoto({
  src,
  alt,
  caption,
  className,
  imageClassName,
  figureClassName,
  tilt = true,
  distant,
  motion = true,
}: {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
  imageClassName?: string;
  figureClassName?: string;
  tilt?: boolean;
  distant?: boolean;
  motion?: boolean;
}) {
  const quiet = distant ?? isDistantPortrait(src);
  const contained = quiet || (imageClassName?.includes("object-contain") ?? false);
  return (
    <figure
      {...(tilt ? { "data-tilt": "" } : {})}
      className={cn("grid w-full gap-2", figureClassName)}
    >
      <RevealFrame
        active={motion}
        className={cn(
          "relative overflow-hidden rounded-2xl border border-[#ffa45c]/45 bg-[#07080d]",
          quiet && "mx-auto aspect-[3/4] w-full max-w-[13.5rem]",
          className,
        )}
      >
        {contained ? (
          <>
            <img
              src={src}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full scale-125 object-cover object-[center_20%] opacity-50 blur-2xl"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255, 164, 92,0.42),transparent_52%),radial-gradient(ellipse_at_bottom_left,rgba(61,108,181,0.55),transparent_60%),linear-gradient(165deg,rgba(18,32,58,0.35),rgba(7, 8, 13,0.55))]"
            />
          </>
        ) : null}
        <img
          src={src}
          alt={alt}
          className={cn(
            "absolute inset-0 z-[1] h-full w-full",
            quiet ? "object-contain object-center" : "kenburns object-cover object-center",
            imageClassName,
          )}
        />
      </RevealFrame>
      {caption ? (
        <figcaption className="text-[0.68rem] font-medium tracking-[0.2em] text-[#ffa45c] uppercase">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
