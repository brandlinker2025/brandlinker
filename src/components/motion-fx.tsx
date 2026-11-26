"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { useRef, type PointerEvent, type ReactNode } from "react";
import { useCanAnimate } from "@/components/reveal";

const ease = [0.22, 1, 0.36, 1] as const;

/** Thin orange → blue bar at the very top that fills as the page scrolls. */
export function ScrollProgress() {
  const can = useCanAnimate();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });
  if (!can) return null;
  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-[#ffa45c] via-[#ff8a3d] to-[#2f7bff] shadow-[0_0_12px_rgba(255,164,92,0.6)]"
      style={{ scaleX }}
    />
  );
}

/**
 * 3D tilt + cursor spotlight (21st.dev "spotlight card" style).
 * Only reacts to a mouse/pen; touch devices get the plain card.
 */
export function TiltCard({
  children,
  className,
  max = 7,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const can = useCanAnimate();
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const glow = useMotionValue(0);
  const rx = useSpring(useTransform(py, [0, 1], [max, -max]), { stiffness: 220, damping: 20 });
  const ry = useSpring(useTransform(px, [0, 1], [-max, max]), { stiffness: 220, damping: 20 });
  const gx = useTransform(px, (v) => `${v * 100}%`);
  const gy = useTransform(py, (v) => `${v * 100}%`);
  const o = useSpring(glow, { stiffness: 200, damping: 25 });
  const bg = useMotionTemplate`radial-gradient(420px circle at ${gx} ${gy}, rgba(255,164,92,0.22), rgba(47,123,255,0.10) 40%, transparent 70%)`;

  if (!can) return <div className={className}>{children}</div>;

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
    glow.set(1);
  };
  const onLeave = () => {
    px.set(0.5);
    py.set(0.5);
    glow.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={`relative [perspective:900px] ${className ?? ""}`}
    >
      <motion.div
        className="relative h-full [transform-style:preserve-3d]"
        style={{ rotateX: rx, rotateY: ry }}
      >
        {children}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] mix-blend-screen"
          style={{ background: bg, opacity: o, borderRadius: "1.5rem" }}
        />
      </motion.div>
    </motion.div>
  );
}

/** Image that drifts slightly slower than the page (parallax). Parent must be relative + overflow-hidden. */
export function Parallax({
  children,
  className,
  distance = 40,
}: {
  children: ReactNode;
  className?: string;
  distance?: number;
}) {
  const can = useCanAnimate();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [-distance, distance]);
  if (!can) return <div ref={ref} className={className}>{children}</div>;
  return (
    <motion.div ref={ref} className={className} style={{ y, scale: 1.15 }}>
      {children}
    </motion.div>
  );
}

/** Timeline rail that draws itself as you scroll past it. */
export function DrawLine({ className }: { className?: string }) {
  const can = useCanAnimate();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 60%"] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 28 });
  return (
    <div ref={ref} aria-hidden className={`pointer-events-none absolute top-0 bottom-0 w-[2px] ${className ?? ""}`}>
      <motion.div
        className="h-full w-full origin-top bg-gradient-to-b from-[#ffa45c] via-[#ff8a3d] to-[#2f7bff] shadow-[0_0_14px_rgba(255,164,92,0.7)]"
        style={can ? { scaleY } : undefined}
      />
    </div>
  );
}

/** Portrait that follows the cursor a little in 3D + floats gently. Same DOM on server and client. */
export function FloatTilt({ children, className }: { children: ReactNode; className?: string }) {
  const can = useCanAnimate();
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [6, -6]), { stiffness: 150, damping: 18 });
  const ry = useSpring(useTransform(px, [0, 1], [-8, 8]), { stiffness: 150, damping: 18 });
  return (
    <div
      ref={ref}
      className={`[perspective:1100px] ${className ?? ""}`}
      onPointerMove={(e) => {
        if (!can || e.pointerType === "touch" || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        px.set((e.clientX - r.left) / r.width);
        py.set((e.clientY - r.top) / r.height);
      }}
      onPointerLeave={() => {
        px.set(0.5);
        py.set(0.5);
      }}
    >
      <motion.div
        style={{ rotateX: rx, rotateY: ry }}
        animate={can ? { y: [0, -10, 0] } : undefined}
        transition={{ y: { duration: 6, repeat: Infinity, ease: "easeInOut" } }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/**
 * Wrap a button: springs in when scrolled into view and squishes on tap (works on phones too).
 * The magnetic pull toward the cursor is done globally in CursorGlow for every .liquid button.
 */
export function PopIn({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.span
      className={`inline-flex ${className ?? ""}`}
      initial={{ opacity: 0, scale: 0.8, y: 18 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ type: "spring", stiffness: 260, damping: 15 }}
      whileTap={{ scale: 0.93 }}
    >
      {children}
    </motion.span>
  );
}

/** Section titles: the whole heading rises in (no per-word split, so gradient text never overlaps). */
export function HeadingReveal({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.8, ease }}
    >
      {children}
    </motion.div>
  );
}

/** Gallery tile: wipes open from the centre with a slight zoom; use inside RevealGroup. */
export function WipeItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, scale: 0.92, clipPath: "inset(18% 18% 18% 18% round 24px)" },
        show: {
          opacity: 1,
          scale: 1,
          clipPath: "inset(0% 0% 0% 0% round 24px)",
          transition: { duration: 0.9, ease },
        },
      }}
      whileTap={{ scale: 0.97 }}
    >
      {children}
    </motion.div>
  );
}

/** Pops chips in one after another with a little spring. */
export function PopList({
  items,
  className,
  itemClassName,
}: {
  items: readonly string[];
  className?: string;
  itemClassName?: string;
}) {
  const can = useCanAnimate();
  if (!can) {
    return (
      <ul className={className}>
        {items.map((s) => (
          <li key={s} className={itemClassName}>{s}</li>
        ))}
      </ul>
    );
  }
  return (
    <motion.ul
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
    >
      {items.map((s) => (
        <motion.li
          key={s}
          className={itemClassName}
          variants={{
            hidden: { opacity: 0, scale: 0.6, y: 18 },
            show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 320, damping: 18 } },
          }}
          whileHover={{ scale: 1.08, y: -3 }}
          whileTap={{ scale: 0.95 }}
        >
          {s}
        </motion.li>
      ))}
    </motion.ul>
  );
}
