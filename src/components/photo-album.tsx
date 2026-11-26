"use client";

import { albumPhotos, albumSrc, albumThumb, type AlbumCategory } from "@data/album";
import { useEffect, useState } from "react";
import "./photo-album.css";

type Filter = "All" | AlbumCategory;
const FILTERS: Filter[] = ["All", "Riding", "Official"];

export function PhotoAlbum() {
  const [filter, setFilter] = useState<Filter>("All");
  const [open, setOpen] = useState<number | null>(null);
  const shown = filter === "All" ? albumPhotos : albumPhotos.filter((p) => p.category === filter);
  const count = (f: Filter) => (f === "All" ? albumPhotos.length : albumPhotos.filter((p) => p.category === f).length);
  const active = open === null ? null : shown[open];

  const total = shown.length;
  const step = (d: number) => setOpen((i) => (i === null ? i : (i + d + total) % total));

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      removeEventListener("keydown", onKey);
    };
  }, [open, total]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="pa" id="album" aria-labelledby="album-title">
      <div className="pa-inner">
        <header className="pa-head">
          <div>
            <p className="pa-eyebrow">ALBUM · {albumPhotos.length} PHOTOS</p>
            <h2 id="album-title" className="pa-title">Every photo, in one place</h2>
          </div>
          <div className="pa-tabs" role="tablist" aria-label="Filter photos">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                role="tab"
                aria-selected={filter === f}
                className="pa-tab"
                onClick={() => { setFilter(f); setOpen(null); }}
              >
                {f}
                <span>{count(f)}</span>
              </button>
            ))}
          </div>
        </header>

        <ul className="pa-grid">
          {shown.map((p, i) => (
            <li key={p.file}>
              <button type="button" className="pa-item" onClick={() => setOpen(i)} aria-label={`Open ${p.title}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={albumThumb(p.file)} alt={p.title} loading="lazy" decoding="async" />
                <span className="pa-cap">
                  <b>{p.title}</b>
                  <i>{p.category}</i>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {active && (
        <div className="pa-view" role="dialog" aria-modal="true" aria-label={active.title} onClick={() => setOpen(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={albumSrc(active.file)} alt={active.title} onClick={(e) => e.stopPropagation()} />
          <div className="pa-bar" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => step(-1)} aria-label="Previous photo">←</button>
            <p>
              <b>{active.title}</b>
              <span>{active.category} · {(open ?? 0) + 1} / {shown.length}</span>
            </p>
            <button type="button" onClick={() => step(1)} aria-label="Next photo">→</button>
          </div>
          <button type="button" className="pa-close" onClick={() => setOpen(null)} aria-label="Close">✕</button>
        </div>
      )}
    </section>
  );
}
