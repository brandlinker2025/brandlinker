"use client";

import { motion } from "motion/react";
import { useSyncExternalStore, type ReactNode } from "react";

function subscribe() {
  return () => {};
}

function useIsClient() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

function subscribeReducedMotion(onStoreChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

export function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

export function useCanAnimate() {
  const reduce = usePrefersReducedMotion();
  const client = useIsClient();
  return client && !reduce;
}

const ease = [0.22, 1, 0.36, 1] as const;

const viewport = { once: true, amount: "some", margin: "0px 0px 15% 0px" } as const;

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const animate = useCanAnimate();

  if (!animate) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 52 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewport}
      transition={{ duration: 0.85, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

export function RevealGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const animate = useCanAnimate();

  if (!animate) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={viewport}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.14 } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const animate = useCanAnimate();

  if (!animate) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 52 },
        show: { opacity: 1, y: 0, transition: { duration: 0.85, ease } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function HeroGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  // Always rendered as motion (also on the server) so the hero never flashes
  // in fully and then disappears/replays after hydration.
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.12, delayChildren: 0.06 } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function HeroItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 36 },
        show: { opacity: 1, y: 0, transition: { duration: 0.9, ease } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function RevealFrame({
  children,
  className,
  active = true,
  eager = false,
}: {
  children: ReactNode;
  className?: string;
  active?: boolean;
  /** Above-the-fold: animate on mount and render as motion on the server too (no flash). */
  eager?: boolean;
}) {
  const animate = useCanAnimate();
  const hidden = { opacity: 0, scale: 1.08, clipPath: "inset(10% 10% 10% 10% round 18px)" };
  const shown = { opacity: 1, scale: 1, clipPath: "inset(0% 0% 0% 0% round 18px)" };

  if (eager) {
    return (
      <motion.div className={className} initial={hidden} animate={shown} transition={{ duration: 1.1, delay: 0.25, ease }}>
        {children}
      </motion.div>
    );
  }

  if (!active || !animate) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={hidden}
      whileInView={shown}
      viewport={viewport}
      transition={{ duration: 0.95, ease }}
    >
      {children}
    </motion.div>
  );
}
