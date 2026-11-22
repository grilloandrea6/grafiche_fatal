// Stampa la timeline dei titoli di coda: node scripts/end-credits-table.mjs
// Usa lo stesso parser e la stessa config della composizione END-CREDITS.
import { readFileSync } from "node:fs";
import { config, endCredits as e } from "../src/config.ts";
import { buildTimeline, timelineTable } from "../src/end-credits/parse.ts";
const text = readFileSync("public/" + e.file, "utf8");
const { sections, durationInFrames } = buildTimeline(text, {
  fps: config.fps,
  ...e,
});
console.table(timelineTable(sections, config.fps));
console.log(
  `Durata totale: ${durationInFrames} frame (${(durationInFrames / config.fps).toFixed(2)} s)`,
);
