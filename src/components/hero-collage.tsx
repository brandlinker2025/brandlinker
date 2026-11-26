"use client";

import Image from "next/image";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import type { MouseEvent } from "react";
import { cn } from "@/lib/utils";

export type HeroRide = {
  src: string;
  title: string;
  alt: string;
  available: boolean;
};

const layouts = [
  {
    className: "top-[6%] left-[2%] z-20 h-[62%] w-[64%] -rotate-6",
    dx: 16,
    dy: 10,
  },
  {
    className: "top-0 right-[0%] z-10 h-[50%] w-[48%] rotate-[7deg]",
    dx: -22,
    dy: 14,
  },
  {
    className: "right-[6%] bottom-[2%] z-30 h-[46%] w-[52%] rotate-[4deg]",
    dx: 12,
    dy: -16,
  },
] as const;

const stats = [
  { value: "107", label: "women trained free" },
  { value: "48K", label: "community" },
  { value: "Since", label: "2017" },
] as const;

export function HeroCollage({ rides }: { rides: HeroRide[] }) {
  const reduce = useReducedMotion();
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 70, damping: 18, mass: 0.4 });
  const sy = useSpring(py, { stiffness: 70, damping: 18, mass: 0.4 });

  function onMove(event: MouseEvent<HTMLDivElement>) {
    if (reduce) return;
    const rect = event.currentTarget.getBoundingClientRect();
    px.set((event.clientX - rect.left) / rect.width - 0.5);
    py.set((event.clientY - rect.top) / rect.height - 0.5);
  }

  function onLeave() {
    px.set(0);
    py.set(0);
  }

  return (
    <div className="w-full">
      <div
        className="relative mx-auto h-[20rem] w-full max-w-md sm:h-[22rem] lg:mx-0 lg:h-[22rem] lg:max-w-none"
        onMouseMove={onMove}
        onMouseLeave={onLeave}
      >
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2f7bff]/35 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute top-6 right-6 h-36 w-36 rounded-full bg-[#2f7bff]/30 blur-3xl"
          aria-hidden="true"
        />
        <div className="sr-only">Lina on the road, and the Women’s Day rally</div>
        {rides.slice(0, 3).map((ride, index) => {
          const layout = layouts[index];
          if (!layout) return null;
          return (
            <RideCard
              key={ride.src}
              ride={ride}
              className={layout.className}
              dx={layout.dx}
              dy={layout.dy}
              sx={sx}
              sy={sy}
              priority={index === 0}
              still={Boolean(reduce)}
            />
          );
        })}
      </div>
      <ul className="mt-4 grid grid-cols-3 gap-2" aria-label="Creative Minded BD">
        {stats.map((stat) => (
          <li
            key={stat.label}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-2 py-3 text-center"
          >
            <p className="font-heading text-xl tracking-tight text-white sm:text-2xl">
              {stat.value}
            </p>
            <p className="mt-1 text-[0.65rem] tracking-[0.14em] text-[#ffa45c] uppercase">
              {stat.label}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RideCard({
  ride,
  className,
  dx,
  dy,
  sx,
  sy,
  priority,
  still,
}: {
  ride: HeroRide;
  className: string;
  dx: number;
  dy: number;
  sx: MotionValue<number>;
  sy: MotionValue<number>;
  priority: boolean;
  still: boolean;
}) {
  const x = useTransform(sx, (value) => value * dx);
  const y = useTransform(sy, (value) => value * dy);

  return (
    <motion.figure
      className={cn(
        "absolute overflow-hidden rounded-2xl border border-white/20 bg-[#0b0e16] shadow-[0_24px_50px_rgba(0,0,0,0.45)] ring-1 ring-white/10",
        className,
      )}
      style={still ? undefined : { x, y }}
    >
      {ride.available ? (
        <Image
          src={ride.src}
          alt={ride.alt}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 340px, 70vw"
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col justify-end bg-[radial-gradient(circle_at_20%_15%,rgba(255,106,26,0.55),transparent_42%),linear-gradient(155deg,#14223f,#0a0c12)] p-4">
          <p className="text-[0.62rem] tracking-[0.2em] text-[#ffa45c] uppercase">
            {ride.src.split("/").pop()}
          </p>
          <p className="mt-1 font-heading text-lg leading-none tracking-tight text-white">
            {ride.title}
          </p>
        </div>
      )}
    </motion.figure>
  );
}
