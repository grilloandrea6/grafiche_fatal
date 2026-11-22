// Placeholder dei cartelli d'atto: node scripts/make-act-placeholders.mjs
// Richiede ImageMagick (`convert`), come scripts/placeholders.mjs.
//
// Cosa genera in public/placeholders/ e come sostituirlo (stesso nome file,
// PNG con alpha, nient'altro da toccare):
//   atto_i/ii/iii.png     testo bianco su trasparente, canvas pieno, centrato
//   frutti_atto_ii.png    Atto II, "uno o pochi frutti/fiori": ritaglio piccolo
//                         con 3 cerchi rosso scuro. Il vero va RITAGLIATO.
//   frutti_atto_iii.png   Atto III, "tanti frutti/fiori": canvas pieno con
//                         ~100 cerchi irregolari (seed fisso). Il vero va a
//                         CANVAS PIENO 16:9.
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { width, height, SCALE } from "../src/config.ts";
import { ACT_PLACEHOLDER_TEXT_SIZE, acts, actCompositions } from "../src/config.acts.ts";

const out = "public/placeholders/";
mkdirSync(out, { recursive: true });
const font = createRequire(import.meta.url).resolve(acts.font);
const pointsize = String(Math.round(height * ACT_PLACEHOLDER_TEXT_SIZE));
const im = (...args) => execFileSync("convert", args.flat(Infinity)).toString().trim();

// ── Testi ─────────────────────────────────────────────────────────────────
for (const { props } of actCompositions) {
  im(
    "-size",
    `${width}x${height}`,
    "xc:none",
    "-font",
    font,
    "-pointsize",
    pointsize,
    "-fill",
    "white",
    "-gravity",
    "center",
    "-annotate",
    "+0+0",
    props.label,
    "PNG32:" + "public/" + props.text,
  );
}

// ── Cerchi rosso scuro con leggera sfumatura radiale, bordi netti ────────
// Il renderer SVG interno di ImageMagick ignora i gradienti, quindi ogni
// cerchio è un radial-gradient ritagliato da un disco.
const shade = (hex, k) =>
  "#" +
  hex
    .slice(1)
    .match(/../g)
    .map((c) =>
      Math.min(255, Math.round(parseInt(c, 16) * k))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");
const light = shade(acts.fruitColor, 1.25),
  dark = shade(acts.fruitColor, 0.8);
const disc = ({ x, y, r }) => [
  "(",
  "-size",
  `${2 * r}x${2 * r}`,
  `radial-gradient:${light}-${dark}`,
  "(",
  "-size",
  `${2 * r}x${2 * r}`,
  "xc:none",
  "-fill",
  "white",
  "-draw",
  `circle ${r - 0.5},${r - 0.5} ${r - 0.5},0`,
  ")",
  "-compose",
  "CopyOpacity",
  "-composite",
  ")",
  "-geometry",
  `+${x - r}+${y - r}`,
  "-compose",
  "over",
  "-composite",
];
const fruits = (w, h, circles, file) =>
  im("-size", `${w}x${h}`, "xc:none", circles.map(disc), "PNG32:" + out + file);

// Atto II: piccolo ritaglio (pixel a 4K x2 per restare nitido)
fruits(
  300,
  270,
  [
    { x: 105, y: 150, r: 95 },
    { x: 215, y: 110, r: 72 },
    { x: 190, y: 215, r: 50 },
  ],
  "frutti_atto_ii.png",
);

// Atto III: canvas pieno, seed fisso (mulberry32) => sempre uguale
let s = acts.seed;
const rand = () => {
  s = (s + 0x6d2b79f5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
fruits(
  width,
  height,
  Array.from({ length: acts.fruitIIICount }, () => ({
    x: Math.round(rand() * width),
    y: Math.round(rand() * height),
    r: Math.round(height * (0.02 + 0.08 * rand() ** 2)),
  })),
  "frutti_atto_iii.png",
);

// ── Posizione della terza lettera dell'Atto II (per FRUIT_II_X/Y) ────────
// Stesso corpo e stessa linea di base: confronta "At", "Att" e il testo intero.
{
  const box = (text) => {
    const [w, h, x, y] = im(
      "-size",
      `${width}x${height}`,
      "xc:none",
      "-font",
      font,
      "-pointsize",
      pointsize,
      "-fill",
      "white",
      "-annotate",
      "+100+400",
      text,
      "-trim",
      "-format",
      "%w %h %X %Y",
      "info:",
    )
      .split(/[ +]+/)
      .map(Number);
    return { x, y, w, h };
  };
  const label = actCompositions[1].props.label;
  const full = box(label),
    two = box(label.slice(0, 2)),
    three = box(label.slice(0, 3));
  const t = box(label[2]);
  const centered = im(
    "public/" + actCompositions[1].props.text,
    "-trim",
    "-format",
    "%X %Y",
    "info:",
  )
    .split(/[ +]+/)
    .filter(Boolean)
    .map(Number);
  const cx = centered[0] + ((two.x + two.w + three.x + three.w) / 2 - full.x);
  const cy = centered[1] + (t.y + t.h / 2 - full.y);
  console.log(
    `Terza lettera di "${label}": FRUIT_II_X = ${Math.round((cx - width / 2) / SCALE)}, ` +
      `FRUIT_II_Y = ${Math.round((cy - height / 2) / SCALE)} (px a 4K dal centro)`,
  );
}
