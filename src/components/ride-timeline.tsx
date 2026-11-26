"use client";

import { timeline, type TimelineEntry } from "@data/timeline";
import { motion, useReducedMotion } from "motion/react";
import { useId, useState } from "react";
import { Reveal } from "@/components/reveal";
import { cn } from "@/lib/utils";

export function RideTimeline() {
  const [openId, setOpenId] = useState<string>(timeline[0]?.id ?? "");
  const reduce = useReducedMotion();
  const baseId = useId();

  return (
    <section
      id="timeline"
      aria-labelledby="timeline-title"
      className="scroll-mt-24 border-t border-white/10"
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <Reveal>
          <p className="text-[0.7rem] tracking-[0.28em] text-[#ffa45c] uppercase">
            Ride &amp; career
          </p>
          <h2
            id="timeline-title"
            className="mt-3 max-w-3xl font-heading text-4xl leading-[0.95] tracking-tight text-white sm:text-5xl"
          >
            What is dated.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
            Ride dates come from the Creative Minded BD page. The Women’s Day
            rally is every 8 March from 2019 onward. Tours through Khagrachari,
            Rangamati (Sajek), and Brahmanbaria have no single date. January
            2023 and October 2023 are month-only. SheRides, Just-Go, and Fiverr
            stay year-only in 2026, without a claimed day before or after 1 July.
          </p>
        </Reveal>
        <ol className="relative mt-12 space-y-3 border-l border-white/15 pl-6 sm:pl-10">
          {timeline.map((entry, index) => (
            <TimelineItem
              key={entry.id}
              entry={entry}
              index={index}
              open={openId === entry.id}
              panelId={`${baseId}-${entry.id}`}
              reduce={Boolean(reduce)}
              onToggle={() =>
                setOpenId((current) => (current === entry.id ? "" : entry.id))
              }
            />
          ))}
        </ol>
      </div>
    </section>
  );
}

function TimelineItem({
  entry,
  index,
  open,
  panelId,
  reduce,
  onToggle,
}: {
  entry: TimelineEntry;
  index: number;
  open: boolean;
  panelId: string;
  reduce: boolean;
  onToggle: () => void;
}) {
  const detail = (
    <div id={panelId} className="pr-2 pb-5 pl-1 text-sm leading-relaxed text-white/70 sm:text-base">
      <p>{entry.detail}</p>
      {entry.link ? (
        <a
          href={entry.link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex text-[#ffa45c] underline underline-offset-4 hover:text-white"
        >
          {entry.link.label}
        </a>
      ) : null}
      {entry.precision === "year" ? (
        <p className="mt-2 text-[#ffa45c]">Year only. The day is not on record.</p>
      ) : null}
      {entry.precision === "month" ? (
        <p className="mt-2 text-[#ffa45c]">Month only. The day is not on record.</p>
      ) : null}
      {entry.precision === "span" ? (
        <p className="mt-2 text-[#ffa45c]">Every 8 March since 2019.</p>
      ) : null}
      {entry.precision === "undated" ? (
        <p className="mt-2 text-[#ffa45c]">No single date is on record.</p>
      ) : null}
    </div>
  );

  return (
    <li className="relative">
      <span
        className={cn(
          "absolute top-5 -left-[1.65rem] size-3 rounded-full ring-4 ring-[#07080d] sm:-left-[2.65rem]",
          index === 0 ? "bg-[#2f7bff]" : "bg-[#2f7bff]",
        )}
        aria-hidden="true"
      />
      <Reveal delay={index * 0.04}>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03]">
          <button
            type="button"
            className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left sm:px-5"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={onToggle}
          >
            <span>
              <span className="block text-[0.7rem] tracking-[0.22em] text-[#ffa45c] uppercase">
                {entry.dateLabel}
              </span>
              <span className="mt-1 block font-heading text-xl text-white sm:text-2xl">
                {entry.title}
              </span>
            </span>
            <span className="mt-1 text-sm text-white/50">{open ? "Close" : "Open"}</span>
          </button>
          {reduce ? (
            open ? detail : null
          ) : (
            <motion.div
              initial={false}
              animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              {detail}
            </motion.div>
          )}
        </div>
      </Reveal>
    </li>
  );
}
