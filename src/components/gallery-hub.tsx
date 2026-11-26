"use client";

import {
  designGallery,
  galleryCategories,
  galleryItems,
  type GalleryCategory,
  type GalleryItem,
} from "@data/gallery";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Reveal } from "@/components/reveal";
import { WorkImage } from "@/components/work-image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type GalleryHubProps = {
  ready: Record<string, boolean>;
};

type Lightbox =
  | { kind: "photo"; index: number }
  | { kind: "design"; index: number }
  | null;

const frameSizes = "(min-width: 1024px) 360px, (min-width: 640px) 45vw, 100vw";

export function GalleryHub({ ready }: GalleryHubProps) {
  const [category, setCategory] = useState<GalleryCategory | null>(null);
  const [lightbox, setLightbox] = useState<Lightbox>(null);
  const visible =
    category === null
      ? galleryItems
      : galleryItems.filter((item) => item.category === category);
  const activePhoto =
    lightbox?.kind === "photo" ? visible[lightbox.index] : undefined;
  const activeDesign =
    lightbox?.kind === "design" ? designGallery[lightbox.index] : undefined;
  const active = activePhoto ?? activeDesign ?? null;

  function step(direction: -1 | 1) {
    setLightbox((current) => {
      if (!current) return current;
      const count = current.kind === "photo" ? visible.length : designGallery.length;
      if (count === 0) return current;
      return {
        kind: current.kind,
        index: (current.index + direction + count) % count,
      };
    });
  }

  useEffect(() => {
    if (!lightbox) return;
    const count = lightbox.kind === "photo" ? visible.length : designGallery.length;
    function onKey(event: KeyboardEvent) {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      const direction = event.key === "ArrowRight" ? 1 : -1;
      setLightbox((current) => {
        if (!current || count === 0) return current;
        return {
          kind: current.kind,
          index: (current.index + direction + count) % count,
        };
      });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, visible.length]);

  return (
    <section
      id="gallery"
      aria-labelledby="gallery-title"
      className="scroll-mt-24 border-t border-white/10"
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <Reveal>
          <p className="text-[0.7rem] tracking-[0.28em] text-[#ffa45c] uppercase">
            Gallery
          </p>
          <h2
            id="gallery-title"
            className="mt-3 font-heading text-4xl leading-[0.95] tracking-tight text-white sm:text-5xl"
          >
            Tours, rallies, the hour before.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
            Tours, including Khagrachari, Rangamati, and Brahmanbaria. Women’s
            Day rally, every 8 March since 2019. Some frames are from before
            the ride. Sajek, Rangamati is the only photograph tied to one place.
          </p>
        </Reveal>
        <div className="mt-8 flex flex-wrap gap-2" role="toolbar" aria-label="Gallery filters">
          {galleryCategories.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={category === item}
              onClick={() => {
                setCategory((current) => (current === item ? null : item));
                setLightbox(null);
              }}
              className={cn(
                "liquid liquid-sm h-10 rounded-full border px-4 text-sm transition-colors",
                category === item
                  ? "border-[#2f7bff] bg-[#2f7bff] text-[#0a0c12]"
                  : "border-white/15 text-white/75 hover:text-white",
              )}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3">
          {visible.map((item, index) => (
            <PhotoCard
              key={item.src}
              item={item}
              ready={Boolean(ready[item.src])}
              onOpen={() => setLightbox({ kind: "photo", index })}
            />
          ))}
        </div>

        <div className="mt-20">
          <h3 className="font-heading text-2xl text-white">Design set</h3>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/60">
            Marks and screens from the studio, separate from the ride photographs.
          </p>
          <div className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3">
            {designGallery.map((item, index) => (
              <PhotoCard
                key={item.src}
                item={{ ...item, category: "Design", fallbackNote: "From the RSLina design set." }}
                ready={Boolean(ready[item.src])}
                onOpen={() => setLightbox({ kind: "design", index })}
              />
            ))}
          </div>
        </div>
      </div>
      <Dialog
        open={active !== null}
        onOpenChange={(open) => {
          if (!open) setLightbox(null);
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto border-white/10 bg-[#0a0c12] p-3 text-white sm:max-w-4xl">
          {active ? (
            <div>
              <div
                className={cn(
                  "relative mx-auto w-full overflow-hidden rounded-2xl bg-black",
                  active.ratio,
                  active.ratio === "aspect-[3/4]" || active.ratio === "aspect-[4/5]"
                    ? "max-w-md"
                    : "max-h-[75vh]",
                )}
              >
                <WorkImage
                  src={active.src}
                  alt={active.alt}
                  available={Boolean(ready[active.src])}
                  label={active.title}
                  sizes="(min-width: 896px) 896px, 92vw"
                  className="absolute inset-0 h-full w-full"
                  fallbackNote={activePhoto?.fallbackNote ?? "From the RSLina design set."}
                  kicker={activePhoto?.category ?? "Design"}
                />
              </div>
              <div className="flex items-start justify-between gap-4 px-2 pt-4 pb-2">
                <div>
                  <DialogTitle className="font-heading text-2xl text-white">
                    {active.title}
                  </DialogTitle>
                  <DialogDescription className="mt-2 text-sm leading-relaxed text-white/70">
                    {active.caption}
                  </DialogDescription>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="border-white/15 bg-transparent text-white"
                    aria-label="Previous photograph"
                    onClick={() => step(-1)}
                  >
                    <ChevronLeft />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="border-white/15 bg-transparent text-white"
                    aria-label="Next photograph"
                    onClick={() => step(1)}
                  >
                    <ChevronRight />
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function PhotoCard({
  item,
  ready,
  onOpen,
}: {
  item: Pick<GalleryItem, "src" | "title" | "alt" | "ratio" | "fallbackNote"> & {
    category: string;
  };
  ready: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group mb-4 block w-full break-inside-avoid rounded-3xl text-left outline-none focus-visible:ring-2 focus-visible:ring-[#2f7bff]"
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-3xl border border-white/10 shadow-[0_18px_40px_rgba(0,0,0,0.28)]",
          item.ratio,
        )}
      >
        <WorkImage
          src={item.src}
          alt={item.alt}
          available={ready}
          label={item.title}
          sizes={frameSizes}
          className="absolute inset-0 h-full w-full"
          imageClassName="media-zoom object-cover"
          fallbackNote={item.fallbackNote}
          kicker={item.category}
        />
      </div>
      <span className="mt-3 block text-[0.65rem] tracking-[0.2em] text-[#ffa45c] uppercase">
        {item.category}
      </span>
      <span className="mt-1 block font-heading text-lg text-white">{item.title}</span>
    </button>
  );
}
