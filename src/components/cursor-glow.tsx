"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/components/reveal";

function clearTransform(element: HTMLElement | null) {
  if (!element) return;
  element.style.transform = "";
}

export function CursorGlow() {
  const dot = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  const reduce = usePrefersReducedMotion();

  useEffect(() => {
    const dotNode = dot.current;
    const glowNode = glow.current;
    if (!dotNode || !glowNode || reduce) return;

    const fineQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    let fine = fineQuery.matches;
    let x = window.innerWidth * 0.68;
    let y = window.innerHeight * 0.22;
    let dx = x;
    let dy = y;
    let gx = x;
    let gy = y;
    let scale = 1;
    let targetScale = 1;
    let frame = 0;
    let running = false;
    let touching = false;
    let magnetic: HTMLElement | null = null;

    const placeGlow = (nextX: number, nextY: number) => {
      glowNode.style.transform = `translate3d(${nextX}px, ${nextY}px, 0) translate(-50%, -50%)`;
    };

    if (!fine) {
      glowNode.style.opacity = "1";
      dotNode.style.opacity = "0";
      placeGlow(x, y);
      gx = x;
      gy = y;
    }

    const paint = () => {
      dx += (x - dx) * 0.55;
      dy += (y - dy) * 0.55;
      gx += (x - gx) * 0.12;
      gy += (y - gy) * 0.12;
      scale += (targetScale - scale) * 0.18;
      if (fine) {
        dotNode.style.transform = `translate3d(${dx}px, ${dy}px, 0) translate(-50%, -50%) scale(${scale})`;
      }
      placeGlow(gx, gy);
      const settled =
        Math.abs(x - dx) < 0.3 &&
        Math.abs(y - dy) < 0.3 &&
        Math.abs(x - gx) < 0.6 &&
        Math.abs(y - gy) < 0.6 &&
        Math.abs(targetScale - scale) < 0.01;
      if (settled) {
        running = false;
        return;
      }
      frame = requestAnimationFrame(paint);
    };

    const start = () => {
      if (running) return;
      running = true;
      frame = requestAnimationFrame(paint);
    };

    const followTouch = (clientX: number, clientY: number) => {
      dotNode.style.opacity = "0";
      glowNode.style.opacity = "1";
      targetScale = 1;
      x = clientX;
      y = clientY;
      clearTransform(magnetic);
      magnetic = null;
      start();
    };

    const onPointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") {
        touching = true;
        followTouch(event.clientX, event.clientY);
        return;
      }
      if (!fine) return;
      dotNode.style.opacity = "1";
      glowNode.style.opacity = "1";
      x = event.clientX;
      y = event.clientY;
      const hit = document.elementFromPoint(x, y);
      const nextMagnetic = hit?.closest<HTMLElement>(".magnetic, .liquid") ?? null;
      targetScale = hit?.closest("a, button, .magnetic") ? 1.6 : 1;
      if (magnetic && magnetic !== nextMagnetic) clearTransform(magnetic);
      magnetic = nextMagnetic;
      if (magnetic) {
        const rect = magnetic.getBoundingClientRect();
        const mx = (x - (rect.left + rect.width / 2)) * 0.18;
        const my = (y - (rect.top + rect.height / 2)) * 0.22;
        magnetic.style.transform = `translate3d(${mx.toFixed(2)}px, ${my.toFixed(2)}px, 0)`;
      }
      start();
    };

    const onTouch = (event: TouchEvent) => {
      const point = event.touches[0];
      if (!point) return;
      touching = true;
      followTouch(point.clientX, point.clientY);
    };

    const onTouchEnd = () => {
      touching = false;
    };

    const onScroll = () => {
      if (fine || touching) return;
      const phase = window.scrollY / 260;
      x = window.innerWidth * (0.5 + 0.22 * Math.sin(phase));
      y = window.innerHeight * (0.3 + 0.18 * Math.cos(phase * 0.85));
      start();
    };

    const onFineChange = () => {
      fine = fineQuery.matches;
      if (!fine) {
        dotNode.style.opacity = "0";
        glowNode.style.opacity = "1";
        start();
      }
    };

    const onOut = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.relatedTarget) return;
      dotNode.style.opacity = "0";
      glowNode.style.opacity = "0";
      clearTransform(magnetic);
      magnetic = null;
    };

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointerout", onOut);
    fineQuery.addEventListener("change", onFineChange);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointerout", onOut);
      fineQuery.removeEventListener("change", onFineChange);
      clearTransform(magnetic);
    };
  }, [reduce]);

  return (
    <>
      <div
        ref={glow}
        aria-hidden="true"
        className="cursor-glow pointer-events-none fixed top-0 left-0 z-30 size-40 rounded-full bg-[#ffa45c]/35 opacity-0 blur-3xl"
      />
      <div
        ref={dot}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-50 hidden size-2 rounded-full bg-[#ffa45c] opacity-0 mix-blend-difference [@media(hover:hover)_and_(pointer:fine)]:block"
      />
    </>
  );
}
