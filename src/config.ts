// Le misure artistiche sono pixel del master UHD (scalate con SCALE).
// I tempi sono timecode "mm:ss:ff" (o "ss:ff") a 25 fps, convertiti in frame con tc().
export const width = 1920;
export const height = 1080;
export const SCALE = width / 3840;
export const FPS = 25;
// Accetta "mm:ss:ff" oppure "ss:ff" (i campi si leggono da destra).
export const tc = (timecode: string) => {
  const [ff, ss = 0, mm = 0] = timecode.split(":").map(Number).reverse();
  if (ff >= FPS) throw Error("Frame fuori range in " + timecode);
  return (mm * 60 + ss) * FPS + ff;
};
// ─── Font di HEAD_TITLES ed END_CREDITS (unico punto in cui è definito) ───
// Cormorant Garamond: web font in END_CREDITS (@remotion/google-fonts, caricato
// in src/fonts.ts), file .woff di @fontsource per i PNG dei titoli di testa.
// Non riguarda ACT_I/II/III e FATAL_TITLE, che hanno i loro PNG.
export type FontWeight = "400" | "500" | "600" | "700"; // pesi caricati
export const FONT_FAMILY = "Cormorant Garamond";
// Peso più vicino al Libre Bodoni 400 di prima, misurato a pari altezza delle
// maiuscole: spessore dell'asta / altezza maiuscola 0,180 (Bodoni 0,178) e
// densità di inchiostro della riga -3,5% (il 600 è a -13/-14%).
export const FONT_WEIGHT_ROLE: FontWeight = "700";
export const FONT_WEIGHT_NAME: FontWeight = "700";
// Compensazione ottica dei font-size: a pari corpo le maiuscole di Cormorant
// sono alte 622/1000 contro 754/1000 del Bodoni -> 754 / 622 = 1,212, così le
// maiuscole hanno la stessa altezza di prima. Le righe risultano però ~9% più
// larghe (a pari corpo Cormorant è largo 0,88-0,96 del Bodoni): si è data la
// priorità all'altezza. Interlinea e letter-spacing restano uguali in px.
export const FONT_SIZE_COMPENSATION = 1.212;
// Cormorant usa di default cifre "old-style" (l'1 sembra una ı in "1ST AC"):
// lining-nums dà cifre allineate alle maiuscole, come nel Bodoni.
export const FONT_NUMERIC = "lining-nums";
// File .woff per ImageMagick (PNG dei titoli di testa), per peso
export const fontFile = (weight: FontWeight) =>
  `@fontsource/cormorant-garamond/files/cormorant-garamond-latin-${weight}-normal.woff`;

// Dimensione del testo, unica per tutti e tre i credit.
export const TEXT_SIZE = 0.016; // corpo del font nei PNG, in frazione dell'altezza del frame (prima della compensazione)
export const TEXT_SCALE = 1;
// Credit su due righe (campo `above`): la riga sopra ha il corpo del nome
// x CREDIT_ABOVE_RATIO (0,6 come i ruoli dei titoli di coda) e sta a
// CREDIT_ABOVE_GAP corpi del nome sopra di esso (0,3 come singleRoleGap).
// Il blocco delle due righe è centrato nel quadro.
export const CREDIT_ABOVE_RATIO = 0.6;
export const CREDIT_ABOVE_GAP = 0.3; // scala a runtime dei PNG dei credit, centrata
// Halation: appena percepibile, bianca, in screen.
export const HALATION_OPACITY = 0.1;
export const HALATION_BLUR = 20; // px a 4K (scalato con SCALE)
export const config = {
  fps: FPS,
  duration: tc("00:40:00"), // 1000 frame
  credits: {
    cianalino: {
      text: "Lorenzo Cianalino",
      in: tc("00:08:00"), // 200
      out: tc("00:11:00"), // 275
    },
    miaglia: {
      text: "Alessandro Miaglia",
      in: tc("00:17:12"), // 437
      out: tc("00:20:12"), // 512
    },
    regia: {
      above: "Regia di", // riga piccola sopra (CREDIT_ABOVE_*), poi a capo
      text: "Giulia Nicotra",
      in: tc("00:23:18"), // 593
      out: tc("00:27:05"), // 680
    },
  },
  // Video di sfondo: src vuoto = nero. Percorso in public/ oppure URL.
  plates: [{ from: tc("00:00:00"), to: tc("00:40:00"), src: "" }],
  // OpticalDevelop, in entrata e (al contrario) in uscita
  developIn: tc("00:01:12"), // 1,5 s
  developOut: tc("00:01:12"), // 1,5 s
  developMaxShare: 1 / 3, // ingresso/uscita al massimo 1/3 dell'intervallo ciascuno
  developEasing: [0.45, 0, 0.55, 1] as const, // cubic-bezier morbido
  developBrightness: 0.15,
  developBlur: 6, // px a 4K all'inizio
  inkBlur: 1.5, // px a 4K a piena visibilità
  // Halation
  halo: "#FFFFFF",
  // Gate weave
  weave: 0.8,
  weaveFrequency: 0.035,
  // Grana
  grainEnabled: true,
  grain: 0.06,
  grainSize: 2.1,
  // Abrasion (solo regia)
  abrasion: 4,
  colors: { black: "#000000", white: "#ffffff" },
  // Font con cui vengono generati i PNG dei credit (corpo: TEXT_SIZE x
  // FONT_SIZE_COMPENSATION), vedi scripts/placeholders.mjs
  font: fontFile(FONT_WEIGHT_NAME),
};

// ─── END_CREDITS ────────────────────────────────────────────────────────────
// Stessi width/height/SCALE/FPS dei titoli di testa. Dimensioni in px a 4K
// (moltiplicate per SCALE), tempi in secondi, spaziature in em del testo.
export const LOGO_WIDTH = 500; // larghezza di tutti i loghi (px a 4K) = 2/3 del logo Politecnico precedente (748 px)
export const LOWERCASE_PARTICLES = false; // "di", "de", "van"... minuscole nei nomi
export const endCredits = {
  file: "credits_ita.txt", // in public/; la timeline si ricalcola se cambia
  textColor: "#D8D6D0",
  grainEnabled: true, // usa Grain (screen, opacità config.grain)
  // Timeline (secondi)
  startBlack: 2,
  endBlack: 2,
  gap: 0.5, // nero tra due sezioni
  fade: 1, // dissolvenza in entrata e in uscita (ciascuna)
  fadeEasing: [0.45, 0, 0.55, 1] as const,
  minSec: 4, // MIN
  secPerChar: 0.12, // SEC_PER_CHAR
  maxSec: 10, // MAX
  // Tipografia
  // Font e pesi: FONT_* in cima al file. I corpi qui sotto sono quelli di
  // prima: la compensazione FONT_SIZE_COMPENSATION si applica nel componente.
  nameSize: 52, // corpo dei nomi, uguale in card singola e multipla (px a 4K)
  freeTextSize: 52, // corpo delle righe con nomi nel testo libero (px a 4K)
  // Le altre righe del testo libero usano il corpo dei ruoli (nameSize * roleRatio)
  freeSmallLines: ["Fotografia e Cinema Digitale"], // piccole anche se hanno maiuscole
  // Righe del testo libero precedute da spazio extra (basta l'inizio della riga)
  freeSpaceBefore: ["Corso di Laurea", "A.A."],
  freeLineGap: 36, // spazio extra prima di quelle righe (px a 4K)
  // Righe del file sostituite da un logo, messo sotto il testo della card
  logos: {
    "Politecnico di Torino": "logos/logo_poli.png",
    "Film Commission Torino Piemonte": "logos/negativo_bn.png",
  } as Record<string, string>,
  logoGap: 60, // spazio tra testo e logo (px a 4K)
  roleRatio: 0.6, // corpo ruolo / corpo nome
  roleTracking: 0.14, // letter-spacing dei ruoli (em)
  nameTracking: 0.03, // letter-spacing dei nomi (em)
  nameLineHeight: 1.3, // interlinea tra nomi impilati
  freeLineHeight: 1.5, // interlinea del testo libero
  singleRoleGap: 0.3, // spazio ruolo→nome nella card singola (em del nome)
  rowGap: 0.75, // spazio tra le righe della card multipla (em del nome)
  gutter: 1.4, // spazio tra colonna ruoli e colonna nomi (em del nome)
  headerGap: 1.5, // spazio sotto il titolo di una card multipla (em del nome)
};
