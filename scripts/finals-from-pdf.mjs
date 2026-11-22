// File definitivi: node scripts/finals-from-pdf.mjs
// Richiede poppler (`pdftocairo`) e ImageMagick (`convert`).
//
// I cartelli e il titolo sono arrivati come PDF di InDesign (testo bianco su
// NERO PIENO, senza trasparenza). Qui li convertiamo in PNG 3840x2160 con
// alpha ricavato dalla luminosità:
//   1. pdftocairo rasterizza la pagina (2560x1440 pt, 16:9) direttamente a
//      3840x2160 in scala di grigi: un solo ricampionamento, nessun upscale.
//   2. alpha = luminosità, con livelli morbidi LEVEL_BLACK..LEVEL_WHITE:
//      sotto LEVEL_BLACK trasparente (toglie il rumore della scansione nel
//      fondo, che è già 0), sopra LEVEL_WHITE opaco (il cuore delle lettere
//      non resta semitrasparente sul plate). In mezzo la rampa resta lineare,
//      quindi l'antialiasing dei bordi non viene indurito.
//   3. RGB = bianco puro ovunque (alpha non premoltiplicato): i bordi
//      semitrasparenti sono bianchi, non grigi, quindi niente frangia scura.
// I due PNG dei frutti vengono copiati così come sono.
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SRC = "consegna";
const OUT = "public/finali";
const W = 3840;
const H = 2160;
const LEVEL_BLACK = "4%"; // ~10/255
const LEVEL_WHITE = "92%"; // ~235/255

// Puntini di polvere della scansione da cancellare (alpha = 0), per file:
// rettangoli [x0, y0, x1, y1] in px del PNG 3840x2160, tutti fuori dalle
// lettere. Nel titolo il puntino sotto la "F" (1617,1209) si vede sul plate.
const DUST = {
  "02": [
    [2330, 1140, 2337, 1147],
    [1565, 1142, 1591, 1152],
    [1615, 1207, 1624, 1216],
    [1711, 1305, 1718, 1312],
  ],
};

mkdirSync(OUT, { recursive: true });
const tmp = mkdtempSync(join(tmpdir(), "finali-"));

for (const n of ["02", "03", "04", "05"]) {
  const name = `pannelli_fatal_${n}`;
  const raw = join(tmp, name); // pdftocairo aggiunge .png
  execFileSync("pdftocairo", [
    "-png", "-gray", "-singlefile",
    "-scale-to-x", String(W), "-scale-to-y", String(H),
    `${SRC}/${name}.pdf`, raw,
  ]);
  execFileSync("convert", [
    `${raw}.png`,
    "-colorspace", "Gray",
    "-level", `${LEVEL_BLACK},${LEVEL_WHITE}`, // luminosità -> futuro alpha
    "-alpha", "copy", // alpha = luminosità
    // polvere: alpha = 0 dentro ciascun rettangolo (solo quella regione)
    ...(DUST[n] ?? []).flatMap(([x0, y0, x1, y1]) => [
      "-region", `${x1 - x0 + 1}x${y1 - y0 + 1}+${x0}+${y0}`,
      "-alpha", "transparent", "+region",
    ]),
    "-channel", "RGB", "-evaluate", "set", "100%", "+channel", // RGB bianco
    "-define", "png:color-type=6", // RGBA 8 bit
    `${OUT}/${name}.png`,
  ]);
  console.log(`${OUT}/${name}.png`);
}

for (const f of ["atto_2_segni.png", "atto_3_segni.png"]) {
  copyFileSync(`${SRC}/${f}`, `${OUT}/${f}`);
  console.log(`${OUT}/${f}`);
}
