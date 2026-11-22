// Placeholder di FATAL-TITLE: node scripts/make-title-placeholders.mjs
// Richiede ImageMagick (`convert`). Genera in public/placeholders/:
//   fatal.png       "Fatal" in Pinyon Script, bianco su alpha, canvas pieno.
//                   Il PNG vero del grafico: stesso nome, canvas pieno.
//   essere_fg.png   PLACEHOLDER della sagoma dell'Essere (testa e spalle),
//                   scura, bordi sfumati, in basso al centro. Serve solo a
//                   verificare l'occlusione. NON più usato da FATAL-TITLE:
//                   il primo piano vero è la sequenza PNG in public/footage/fg/
//                   (FG_DIR in config.title.ts). Lasciato solo come riferimento.
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { width, height } from "../src/config.ts";
import {
  TITLE_FONT,
  TITLE_TEXT,
  TITLE_TEXT_SCALE,
} from "../src/config.title.ts";

const im = (...a) => execFileSync("convert", a.flat());
const out = "public/placeholders/";
const font = createRequire(import.meta.url).resolve(TITLE_FONT);

im(
  "-size",
  `${width}x${height}`,
  "xc:none",
  "-font",
  font,
  "-pointsize",
  String(Math.round(height * TITLE_TEXT_SCALE)),
  "-fill",
  "white",
  "-gravity",
  "center",
  "-annotate",
  "+0+0",
  TITLE_TEXT,
  "PNG32:" + out + "fatal.png",
);

// Sagoma: testa (ellisse) + collo + spalle, in proporzione all'altezza.
const u = height / 1080,
  cx = width / 2;
const p = (x, y) => `${Math.round(cx + x * u)},${Math.round(y * u)}`;
im(
  "-size",
  `${width}x${height}`,
  "xc:none",
  "-fill",
  "#141612",
  "-draw",
  `ellipse ${p(0, 470)} ${Math.round(105 * u)},${Math.round(135 * u)} 0,360`,
  "-draw",
  `rectangle ${p(-55, 560)} ${p(55, 700)}`,
  "-draw",
  `path 'M ${p(-420, 1080)} C ${p(-400, 760)} ${p(-150, 690)} ${p(0, 680)} C ${p(150, 690)} ${p(400, 760)} ${p(420, 1080)} Z'`,
  "-channel",
  "A",
  "-blur",
  `0x${Math.round(6 * u)}`,
  "+channel",
  "PNG32:" + out + "essere_fg.png",
);
