// Run with Node 22.13+ from the project root. ImageMagick rasterizes the font
// (FreeType reads the .woff file directly).
// Font: Cormorant Garamond (config.font = fontFile(FONT_WEIGHT_NAME)). Corpo:
// quello di prima, Math.round(height * TEXT_SIZE) = 17 px, moltiplicato per
// FONT_SIZE_COMPENSATION, così le maiuscole sono alte come col Bodoni.
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import {
  config as c,
  width,
  height,
  TEXT_SIZE,
  FONT_SIZE_COMPENSATION,
  CREDIT_ABOVE_RATIO,
  CREDIT_ABOVE_GAP,
} from "../src/config.ts";
const font = createRequire(import.meta.url).resolve(c.font);
mkdirSync("public/placeholders", { recursive: true });
rmSync("public/placeholders/credit_commission.png", { force: true });
const size = Math.round(height * TEXT_SIZE) * FONT_SIZE_COMPENSATION; // corpo del nome
for (const [id, credit] of Object.entries(c.credits)) {
  // Una riga: il nome centrato. Due righe (`above`): riga piccola sopra e
  // nome sotto; con -gravity center ogni riga è centrata in orizzontale, e
  // gli offset verticali centrano nel quadro il blocco delle due righe.
  const lines = credit.above
    ? (() => {
        const small = size * CREDIT_ABOVE_RATIO;
        const total = small + size * CREDIT_ABOVE_GAP + size;
        return [
          { text: credit.above, size: small, y: -total / 2 + small / 2 },
          { text: credit.text, size, y: total / 2 - size / 2 },
        ];
      })()
    : [{ text: credit.text, size, y: 0 }];
  execFileSync("convert", [
    "-size", width + "x" + height, "xc:none",
    "-font", font, "-gravity", "center", "-fill", c.colors.white,
    ...lines.flatMap((l) => [
      "-pointsize", l.size.toFixed(2),
      "-annotate", `+0${l.y < 0 ? "-" : "+"}${Math.abs(l.y).toFixed(2)}`,
      l.text,
    ]),
    "PNG32:public/placeholders/credit_" + id + ".png",
  ]);
}
