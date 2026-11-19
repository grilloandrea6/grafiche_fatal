// Run with Node 22.13+ from the project root. ImageMagick rasterizes the font.
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { config as c, width, height, SCALE } from "../src/config.ts";
const temp = mkdtempSync(join(tmpdir(), "head-font-"));
const font = join(temp, "font.ttf");
try {
  execFileSync("python3", [
    "-c",
    "from fontTools.ttLib import TTFont; import sys; f=TTFont(sys.argv[1]); f.flavor=None; f.save(sys.argv[2])",
    createRequire(import.meta.url).resolve(c.font),
    font,
  ]);
  mkdirSync("public/placeholders", { recursive: true });
  for (const [id, lines] of Object.entries(c.credits)) {
    const args = [
      "-size",
      width + "x" + height,
      "xc:none",
      "-font",
      font,
      "-gravity",
      "center",
      "-fill",
      c.colors.white,
    ];
    lines.forEach((line, i) => {
      const pair = lines.length === 2;
      const dy = pair ? Math.round((i ? 1 : -1) * c.lineOffset * SCALE) : 0;
      args.push(
        "-pointsize",
        String(
          SCALE *
            (pair ? (i ? c.translationSize : c.commissionSize) : c.nameSize),
        ),
        "-annotate",
        "+0" + (dy >= 0 ? "+" : "") + dy,
        line,
      );
    });
    execFileSync("convert", [
      ...args,
      "PNG32:public/placeholders/credit_" + id + ".png",
    ]);
  }
} finally {
  rmSync(temp, { recursive: true, force: true });
}
