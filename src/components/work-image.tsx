"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type WorkImageProps = {
  src: string;
  alt: string;
  available: boolean;
  label: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
  fallbackNote?: string;
  kicker?: string;
};

export function WorkImage({
  src,
  alt,
  available,
  label,
  sizes,
  priority = false,
  className,
  imageClassName,
  fallbackNote = "From the RSLina design set.",
  kicker = "Work",
}: WorkImageProps) {
  const [failed, setFailed] = useState(false);
  const showImage = available && !failed;

  return (
    <div className={cn("relative overflow-hidden bg-[#0b0e16]", className)}>
      {showImage ? (
        <Image
          src={src}
          alt={alt}
          fill
          {...(priority ? { priority: true } : { loading: "lazy" as const })}
          sizes={sizes}
          className={cn("object-cover", imageClassName)}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col justify-between bg-[radial-gradient(circle_at_30%_20%,rgba(255,106,26,0.38),transparent_46%),linear-gradient(160deg,#0b0e16,#07080d)] p-5">
          <div className="flex items-center justify-between text-[0.65rem] tracking-[0.22em] text-[#ffa45c] uppercase">
            <span>RSLina</span>
            <span>{kicker}</span>
          </div>
          <div>
            <p className="font-heading text-2xl leading-none tracking-tight text-white sm:text-3xl">
              {label}
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/70">
              {fallbackNote}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
