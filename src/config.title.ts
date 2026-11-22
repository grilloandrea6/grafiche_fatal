// Parametri di FATAL-TITLE, il titolo finale. Tempi "ss:ff" a 25 fps con tc();
// px "a 4K" moltiplicati per SCALE. Larghezza/altezza/fps: config.ts.
import { tc } from "./config.ts";

export const TITLE_DURATION = tc("04:17"); // 117 frame, finisce con un taglio netto

// ── Sorgenti (public/footage/) ───────────────────────────────────────────
// Plate: il video originale, ProRes 422 10 bit 3840×2160, 25 fps, 117 frame.
// Chrome non riproduce il ProRes, quindi in Studio si usa un proxy H.264
// (1080p, CRF 12); il render usa sempre il ProRes (vedi FatalTitle.tsx).
export const PLATE_SRC = "footage/titolo.mov";
export const PLATE_PREVIEW_SRC = "footage/titolo_proxy.mp4";

// Primo piano: sequenza PNG RGBA 3840×2160 ricavata dallo stesso video
// (matte/out/), copiata e rinumerata da 0: fg_0000.png = frame 0 del plate.
// File = `${FG_DIR}/${FG_PREFIX}${(frame + FG_START_OFFSET) padded}.png`
export const FG_DIR = "footage/fg";
export const FG_PREFIX = "fg_";
export const FG_PAD = 4; // cifre di zero padding
export const FG_FRAME_COUNT = 117; // file disponibili: fg_0000 … fg_0116

// Frame del sorgente da cui parte la composizione, uguale per plate e
// primo piano (così restano sincronizzati). La sorgente non ha margini
// (117 frame = durata della composizione): 0 è l'unico valore possibile
// finché non arriva una versione più lunga dello shot.
export const FG_START_OFFSET = 0;

// ── Titolo ───────────────────────────────────────────────────────────────
// Titolo definitivo: public/finali/pannelli_fatal_02.png, bianco su alpha,
// canvas pieno 3840x2160 (alpha ricavato dal PDF con scripts/finals-from-pdf.mjs).
// A scala 1 la scritta "Fatal" occupa x 1611-2212, y 867-1178 (px a 4K).
export const TITLE_SRC = "finali/pannelli_fatal_02.png";
export const TITLE_TEXT = "Fatal"; // solo per il placeholder (in _old/)
export const TITLE_FONT =
  "@fontsource/pinyon-script/files/pinyon-script-latin-400-normal.woff";
export const TITLE_TEXT_SCALE = 0.22; // solo per il placeholder (in _old/)
// Posizione, misurata sulla sequenza del primo piano (frame 42-116). La
// sommità della testa è a y≈835 (ciuffo largo 5-40 px), da y≈865 la testa è
// larga 80-130 px e si allarga scendendo (y 955: x≈1838-2173); il centro
// scivola da x≈2010 (frame 42) a x≈1970 (frame 116).
// A scala 1,26 l'occhio delle lettere (a, t, a) è alto ~199 px; con Y = -230
// va da y≈769 a y≈968 (linea di base): la testa entra nelle lettere centrali
// da y≈900 in giù, cioè nel loro terzo inferiore (~66 px); sopra resta solo il
// ciuffo sottile della sommità (y≈835). "F" (x≈1571-1748, y≈606-968) e "l"
// (x≈2240-2328, y≈599-968) restano interamente fuori dalla testa e nel frame.
// Trasformazione: translate(X, Y) dopo scale(SCALE) attorno al centro.
export const TITLE_X = 40; // offset dal centro (px a 4K): "ata" centrata su x≈1985
export const TITLE_Y = -230; // era -40
export const TITLE_SCALE = 1.26; // +30% (era 0,97)
export const TITLE_BLUR = 2; // fuori fuoco costante (px a 4K, scalato con SCALE); era 1
export const TITLE_IN_START = tc("01:17"); // frame 42: ~3 s a schermo
export const TITLE_IN_DURATION = tc("01:12"); // 1,5 s di sviluppo ottico
export const TITLE_HALATION_OPACITY = 0.1;
export const TITLE_HALATION_BLUR = 20; // px a 4K

// Gradiente scuro sotto il titolo e sopra il plate: ellisse nera morbida,
// Multiply, opacità massima al centro, sfumata a 0 sul bordo. Coordinate
// nello spazio del PNG del titolo a scala 1 (px a 4K): segue TITLE_X/Y/SCALE.
// Compare con lo sviluppo ottico del titolo (stessi tempi e curva).
export const TITLE_SHADE_ENABLED = true;
export const TITLE_SHADE_OPACITY = 0.2; // massimo, al centro
export const TITLE_SHADE_CX = 1911; // centro della scritta "Fatal" (x 1611-2212)
export const TITLE_SHADE_CY = 1022; // (y 867-1178)
export const TITLE_SHADE_RX = 520; // raggi dell'ellisse: ~1,7x la scritta
export const TITLE_SHADE_RY = 300;

// ── Grana sul composito ──────────────────────────────────────────────────
// Spenta. Misurato sul plate: rumore ~0,3/255 (8 bit), cioè quasi nessuna
// grana propria; la grana si può aggiungere qui o in Resolve.
export const TITLE_GRAIN_ENABLED = false;
export const TITLE_GRAIN_BLEND = "soft-light" as const;
export const TITLE_GRAIN_OPACITY = 0.06;
