"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import "./ribbon-gallery.css";

import { albumPhotos, albumSrc, ribbonFiles } from "@data/album";

/* The first six land in the grid; the rest appear only in the ribbon. */
const PHOTOS: [string, string][] = ribbonFiles.map((file) => {
  const photo = albumPhotos.find((p) => p.file === file);
  return [photo?.title ?? file, albumSrc(file)];
});

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => t * t * (3 - 2 * t);
const out = (t: number) => 1 - (1 - t) ** 3;
const span = (p: number, a: number, b: number) => clamp((p - a) / (b - a));

const CARD_W = 2.1, CARD_H = 1.32, GAP = 0.03, STEP = CARD_W + GAP, NX = 28, NY = 3;
const FOV = 35, GZ = 8, RIB_A = 0.14, RIB_B = 0.63;
const VS = `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const FS = `uniform sampler2D map;uniform vec2 cover;uniform float aspect,ready,radius;varying vec2 vUv;
void main(){
  vec2 q=(abs(vUv-.5)-.5)*vec2(aspect,1.)+radius;
  float d=length(max(q,0.))+min(max(q.x,q.y),0.)-radius;
  float px=fwidth(d),a=1.-smoothstep(-px,px,d);
  if(a<.01)discard;
  vec2 uv=vUv;if(!gl_FrontFacing)uv.x=1.-uv.x;
  vec3 c=mix(vec3(.075),texture2D(map,(uv-.5)*cover+.5).rgb,ready);
  float edge=smoothstep(-.012-px,-.012,d);
  gl_FragColor=vec4(mix(c,vec3(1.),edge*.1),a);
}`;

type Rect = { x: number; y: number; w: number; h: number; vw: number; vh: number; c: number; r: number };
type Card = { i: number; title: string; geo: THREE.PlaneGeometry; mat: THREE.ShaderMaterial; tex: THREE.Texture; mesh: THREE.Mesh; rect: Rect | null };

export function RibbonGallery() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const q = <T extends HTMLElement>(s: string) => el.querySelector(s) as T;
    const track = q<HTMLDivElement>(".rg-track"), stage = q<HTMLElement>(".rg-stage");
    const l1 = q<HTMLDivElement>(".rg-l1"), l2 = q<HTMLDivElement>(".rg-l2"), cap = q<HTMLDivElement>(".rg-cap");
    const rule = q<HTMLDivElement>(".rg-rule"), nameEl = q<HTMLDivElement>(".rg-name");
    const intros = [".rg-hint", ".rg-cross", ".rg-glow"].map((s) => q<HTMLElement>(s));
    const canvas = q<HTMLCanvasElement>(".rg-gl");
    const smooth = matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : 0.09;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch {
      return;
    }
    renderer.setClearColor(0, 0);
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
    const aniso = renderer.capabilities.getMaxAnisotropy();

    /* ribbon rail */
    const SAMPLES = 1200, pathP: THREE.Vector3[] = [], pathT: THREE.Vector3[] = [];
    const PH0 = -1.5, PH1 = Math.PI * 2 + 1.35;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 160; i++) {
      const t = i / 160, ph = mix(PH0, PH1, t), cs = Math.cos(ph), u = 2 * t - 1;
      const depth = cs > 0 ? 7.6 + 16.4 * cs ** 0.9 : 7.6 + 2.2 * cs;
      const edge = 0.84 + 0.5 * span(0.14 - t, 0, 0.14) + 0.8 * span(t, 0.84, 1);
      pts.push(new THREE.Vector3(edge * Math.sin(ph) * depth * 0.561, 0.5 * Math.sign(u) * Math.abs(u) ** 1.4 * depth * 0.63, -depth));
    }
    const path = new THREE.CatmullRomCurve3(pts, false, "centripetal");
    path.arcLengthDivisions = 1500;
    const PATH_L = path.getLength();
    for (let i = 0; i <= SAMPLES; i++) { const u = i / SAMPLES; pathP.push(path.getPointAt(u)); pathT.push(path.getTangentAt(u)); }
    const at = (s: number, op: THREE.Vector3, ot: THREE.Vector3) => {
      const f = clamp(s / PATH_L) * SAMPLES, i = Math.min(SAMPLES - 1, Math.floor(f)), k = f - i;
      op.lerpVectors(pathP[i], pathP[i + 1], k); ot.lerpVectors(pathT[i], pathT[i + 1], k).normalize();
    };

    /* cards */
    const cards: Card[] = PHOTOS.map(([title, src], i) => {
      const tex = new THREE.Texture();
      tex.colorSpace = THREE.NoColorSpace; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.anisotropy = aniso;
      const geo = new THREE.PlaneGeometry(1, 1, NX, NY);
      const mat = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: FS, transparent: true, side: THREE.DoubleSide,
        uniforms: { map: { value: tex }, cover: { value: new THREE.Vector2(1, 1) }, aspect: { value: CARD_W / CARD_H }, ready: { value: 0 }, radius: { value: 0.018 } } });
      const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.visible = false; scene.add(mesh);
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        tex.image = img; tex.needsUpdate = true;
        const va = img.naturalWidth / img.naturalHeight, ca = CARD_W / CARD_H;
        mat.uniforms.cover.value.set(va > ca ? ca / va : 1, va > ca ? 1 : va / ca);
        mat.uniforms.ready.value = 1;
      };
      img.src = src;
      return { i, title, geo, mat, tex, mesh, rect: null };
    });

    /* layout */
    let W = 1, H = 1, asp = 1, cols = 3, rows = 2, tanH = 0.3153;
    const resize = () => {
      W = stage.clientWidth; H = stage.clientHeight; asp = W / H;
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(W, H, false);
      camera.aspect = asp; camera.fov = asp < 16 / 9 ? (Math.atan(0.561 / asp) * 360) / Math.PI : FOV; camera.updateProjectionMatrix();
      tanH = Math.tan((camera.fov * Math.PI) / 360);
      cols = asp < 0.9 ? 2 : 3; rows = asp < 0.9 ? 3 : 2;
    };
    resize();
    const grid = (i: number): Rect => {
      const vh = 2 * GZ * tanH, vw = vh * asp, gw = vw * (cols === 3 ? 0.74 : 0.88), gap = gw * 0.017;
      const cw = (gw - gap * (cols - 1)) / cols, ch = cw / (CARD_W / CARD_H), gh = ch * rows + gap * 1.6 * (rows - 1);
      const c = i % cols, r = Math.floor(i / cols);
      return { x: -gw / 2 + cw / 2 + c * (cw + gap), y: gh / 2 - ch / 2 - r * (ch + gap * 1.6), w: cw, h: ch, vw, vh, c, r };
    };

    /* scroll */
    let target = 0, p = 0;
    const readScroll = () => {
      const r = track.getBoundingClientRect();
      target = clamp(-r.top / (track.offsetHeight - innerHeight));
    };
    readScroll();

    /* pose */
    const op = new THREE.Vector3(), ot = new THREE.Vector3(), up = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0), vp = new THREE.Vector3();
    const poseRibbon = (c: Card, head: number) => {
      const pos = c.geo.attributes.position, centre = head - c.i * STEP;
      for (let iy = 0; iy <= NY; iy++) for (let ix = 0; ix <= NX; ix++) {
        const k = iy * (NX + 1) + ix, lu = ix / NX - 0.5, lv = 0.5 - iy / NY;
        at(centre + lu * CARD_W, op, ot);
        up.copy(Y).addScaledVector(ot, -Y.dot(ot)).normalize();
        vp.copy(op).addScaledVector(up, lv * CARD_H);
        pos.setXYZ(k, vp.x, vp.y, vp.z);
      }
      pos.needsUpdate = true;
    };
    const poseGrid = (c: Card, qq: number) => {
      const g = grid(c.i), pos = c.geo.attributes.position;
      const dx = (g.c - (cols - 1) / 2) * 1.2, dy = g.r < rows / 2 ? 1 : -1;
      const ox = dx * g.vw * 0.62 * (1 - qq), oy = dy * g.vh * (g.c === 1 ? 0.95 : 0.34) * (1 - qq), tilt = (1 - qq) * 0.22 * (g.c - 1 || 0.5) * dy;
      const cs = Math.cos(tilt), sn = Math.sin(tilt);
      for (let iy = 0; iy <= NY; iy++) for (let ix = 0; ix <= NX; ix++) {
        const k = iy * (NX + 1) + ix, x = (ix / NX - 0.5) * g.w, y = (0.5 - iy / NY) * g.h;
        pos.setXYZ(k, g.x + ox + x * cs - y * sn, g.y + oy + x * sn + y * cs, -GZ - (1 - qq) * 0.6 * Math.sin((ix / NX) * Math.PI));
      }
      pos.needsUpdate = true;
      c.rect = g;
    };

    const render = () => {
      const pp = p;
      const rise = 1 - out(span(pp, 0, 0.12));
      const run = mix(-50, 76, span(pp, 0, 0.58));
      l1.style.transform = `translate3d(${run}vw,${rise * 34}vh,0)`;
      l2.style.transform = `translate3d(${-run}vw,${rise * 34}vh,0)`;
      cap.style.opacity = String(1 - span(pp, 0.52, 0.57));
      cap.style.transform = `translate(-50%,calc(-50% + ${rise * 34}vh))`;
      const intro = String(1 - span(pp, 0, 0.05));
      for (const n of intros) n.style.opacity = intro;
      rule.style.transform = `scaleX(${ease(span(pp, 0.72, 0.86))})`;
      const total = PATH_L + cards.length * STEP;
      const head = mix(0, total, span(pp, RIB_A, RIB_B));
      for (const c of cards) {
        const s = head - c.i * STEP, end = PATH_L - CARD_W;
        if (s < end) {
          c.mesh.visible = s > CARD_W; c.rect = null;
          if (c.mesh.visible) poseRibbon(c, head);
        } else if (c.i < cols * rows) {
          const st = mix(RIB_A, RIB_B, (end + c.i * STEP) / total), qq = out(span(pp, st, st + 0.13));
          c.mesh.visible = qq > 0.001;
          if (c.mesh.visible) poseGrid(c, qq);
        } else { c.mesh.visible = false; c.rect = null; }
      }
      renderer.render(scene, camera);
    };

    /* hover */
    const onMove = (e: PointerEvent) => {
      let hit: Card | null = null;
      if (p > 0.86) {
        const b = stage.getBoundingClientRect();
        const nx = (e.clientX - b.left) / W - 0.5, ny = 0.5 - (e.clientY - b.top) / H;
        for (const c of cards) { const g = c.rect; if (!g) continue; const x = nx * g.vw, y = ny * g.vh; if (Math.abs(x - g.x) < g.w / 2 && Math.abs(y - g.y) < g.h / 2) hit = c; }
      }
      nameEl.style.opacity = hit ? "1" : "0";
      if (hit) { nameEl.textContent = hit.title; nameEl.style.transform = `translate(${e.clientX + 14}px,${e.clientY + 16}px)`; }
    };

    addEventListener("resize", resize);
    addEventListener("scroll", readScroll, { passive: true });
    stage.addEventListener("pointermove", onMove);

    let raf = 0;
    const loop = () => {
      p += (target - p) * smooth;
      if (Math.abs(target - p) < 0.00005) p = target;
      render();
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
      removeEventListener("scroll", readScroll);
      stage.removeEventListener("pointermove", onMove);
      for (const c of cards) { c.geo.dispose(); c.mat.dispose(); c.tex.dispose(); }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="rg" ref={root}>
      <div className="rg-track">
        <section className="rg-stage" aria-label="Photo gallery">
          <h1 className="sr-only">Ride in motion — photo gallery</h1>
          <div className="rg-hl rg-l1" aria-hidden="true"><span>RIDE IN</span></div>
          <div className="rg-hl rg-l2" aria-hidden="true"><span>MOTION</span></div>
          <div className="rg-cap">Tours, rallies and riders across Bangladesh.</div>
          <div className="rg-glow" />
          <div className="rg-cross"><i>+</i></div>
          <div className="rg-rule" />
          <canvas className="rg-gl" />
          <div className="rg-hint">SCROLL TO RIDE &nbsp;↓</div>
          <div className="rg-bot">
            <p>Moments from the road with YRC Girls BD, Yamaha riders and friends.</p>
            <div className="rg-mono rg-mid">TOURS<s>/</s>RALLIES<s>/</s>COMMUNITY<s>/</s>YAMAHA</div>
            <a href="#album" className="rg-mono">SEE FULL ALBUM</a>
          </div>
          <div className="rg-name" />
        </section>
      </div>
    </div>
  );
}
