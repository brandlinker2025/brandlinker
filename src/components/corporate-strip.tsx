import { ProfessionalPhoto } from "@/components/professional-photo";
import { RevealItem, RevealGroup } from "@/components/reveal";
import { corporateStrip } from "@data/professional";
import { TiltCard } from "@/components/motion-fx";

export function CorporateStrip() {
  return (
    <section aria-label="At the office" className="border-b border-white/10">
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8">
        <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {corporateStrip.map((photo, i) => (
            <RevealItem
              key={photo.src}
              className={i < 2 ? "lg:col-span-3" : i === 4 ? "sm:col-span-2 lg:col-span-2" : "lg:col-span-2"}
            >
              <TiltCard max={5}>
                <ProfessionalPhoto
                  src={photo.src}
                  alt={photo.alt}
                  caption={photo.caption}
                  className={i < 2 ? "aspect-[16/10]" : "aspect-[4/3]"}
                />
              </TiltCard>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
