// Parametri dei cartelli d'atto (ACT-I, ACT-II, ACT-III).
// Tempi in timecode "ss:ff" a 25 fps tramite tc(); px "a 4K" moltiplicati per
// SCALE nei componenti. Larghezza, altezza e fps sono quelli di config.ts.
//
// ASSET DEFINITIVI (in public/finali/, generati da scripts/finals-from-pdf.mjs
// a partire da consegna/). I placeholder sono in public/placeholders/_old/.
//   pannelli_fatal_03/04/05.png  Atto I/II/III: testo bianco su alpha, canvas
//                                pieno 3840x2160 (alpha ricavato dai PDF)
//   atto_2_segni.png  Atto II: pochi segni, PNG ritagliato 5833x3533
//   atto_3_segni.png  Atto III: tanti segni, PNG 7400x4100 (non 16:9), a
//                     canvas pieno al 103% fisso, sopra il testo
//
// Dimensione dei segni: ricavata da pannelli_fatal.pdf (impaginato di
// riferimento), confrontando la larghezza dei segni con quella della scritta
// nella stessa pagina e riportandola alla scritta dei PNG definitivi.
import { tc } from "./config.ts";

// Scala UNICA del layer testo dei tre atti (i PNG a canvas pieno restano
// intatti; scale() attorno al centro del frame). Misurata su
// reference_dimensioni.jpg (736x439): maiuscole alte ~7,2 px = 1,64%
// dell'altezza, riga ~118 px (senza virgolette) = 16% della larghezza.
// Nei PNG le maiuscole sono alte 144 px = 6,67% di 2160 -> 1,64 / 6,67 =
// 0,246; con 0,25 la riga dell'Atto III (la più lunga) è il 16,2% della
// larghezza, come nella reference.
export const ACT_TEXT_SCALE = 0.25;
// Corpo del testo nei vecchi PNG placeholder (solo per lo script
// make-act-placeholders.mjs), in frazione dell'altezza del frame.
export const ACT_PLACEHOLDER_TEXT_SIZE = 0.035;

// Frutto dell'Atto II: offset dal centro del quadro (px a 4K), scala e
// rotazione (gradi). 0, 0 = centro del PNG esattamente al centro del quadro.
export const FRUIT_II_X = 0;
export const FRUIT_II_Y = 0;
export const FRUIT_II_WIDTH = 5833; // larghezza nativa del PNG, trattata come px a 4K
// Segni / scritta come in pannelli_fatal.pdf (pag. 4), poi ridotti dello stesso
// fattore delle scritte: 0,536 x ACT_TEXT_SCALE (0,25) = 0,134, cioè
// 5833 x 0,134 = ~782 px a 4K. Nessuna rotazione (segni dritti).
export const FRUIT_II_SCALE = 0.536 * ACT_TEXT_SCALE; // 0,134
export const FRUIT_II_ROT = 0;
// Frutti dell'Atto III: a canvas pieno (object-fit: cover, il PNG è 7400x4100,
// un po' più largo del 16:9: ~29 px a 4K tagliati per lato) e fissi a questa
// scala per tutta la durata, nessun push-in. 1,03 = 103%, quindi niente bordi.
export const FRUIT_III_SCALE = 1.03;
// Entrata graduale del frutto (da sincronizzare con lo specchio che si rompe)
export const FRUIT_II_IN_START = tc("02:00");
export const FRUIT_II_IN_DURATION = tc("01:00");

// "Inchiostro che si scioglie" (InkMelt) sul solo testo di ACT-II e ACT-III.
// INK_*_START: da quando parte; INK_*_MAX: intensità raggiunta alla fine
// della rampa (0-1, moltiplica i tre valori massimi qui sotto). La rampa
// finisce sull'ultimo frame (ACT-II) o su INK_III_END (ACT-III).
export const INK_II_START = tc("02:12"); // metà durata di ACT-II (frame 62)
export const INK_II_MAX = 0.6; // media: le lettere restano leggibili
export const INK_III_START = tc("04:19"); // testo di ACT-III tutto visibile (frame 119)
export const INK_III_MAX = 0.35; // più lieve di ACT-II
// ACT-III: InkMelt da solo non porta l'alpha a zero, quindi il testo si
// scioglie fino a INK_III_END e negli ultimi INK_III_TEXT_FADE frame di quella
// rampa sfuma (solo il testo). INK_III_END cade prima del fade out finale
// dei segni (frame 150-174), così i segni restano soli per qualche frame.
export const INK_III_END = tc("05:21"); // frame 146: testo del tutto sparito
export const INK_III_TEXT_FADE = 14; // frame 132 -> 146
// ACT-III: il testo entra DAVANTI ai segni e, mentre comincia a sciogliersi,
// passa DIETRO (dissolvenza incrociata tra una copia sopra e una sotto i
// segni). Poi si scioglie e svanisce là dietro (INK_III_END).
export const TEXT_III_BEHIND_START = tc("04:19"); // frame 119: testo tutto visibile
export const TEXT_III_BEHIND_END = tc("05:07"); // frame 132: tutto dietro, inizia la dissolvenza
export const INK_BLUR_MAX = 10; // ammorbidimento "gooey" dei bordi (px a 4K)
export const INK_DRIP_MAX = 40; // colatura verticale (px a 4K)
export const INK_HOLES_MAX = 0.5; // soglia dei buchi a intensità 1 (0-1)
export const INK_SEED = 7; // seed fisso dei due rumori

export const acts = {
  grainEnabled: true, // Grain esistente: screen, opacità config.grain (6%)
  easing: [0.45, 0, 0.55, 1] as const, // curva morbida di tutti i fade
  font: "@fontsource/libre-bodoni/files/libre-bodoni-latin-400-normal.woff",
  fruitColor: "#6B0F1A",
  fruitIIICount: 100, // cerchi del placeholder dell'Atto III (80-120)
  seed: 35, // seed fisso del placeholder dell'Atto III (riproducibile)
};

// Props di ogni composizione, passate così come sono ad ActCard.
export type ActProps = {
  text: string; // PNG del testo in public/
  label: string; // testo scritto nel placeholder (non usato dai PNG definitivi)
  textInStart: number;
  textInDuration: number;
  fadeOut: number; // frame; il fade finisce sull'ultimo frame
  // Inchiostro che si scioglie sul testo, da `start` a `end` (default:
  // ultimo frame). `textFade`: frame di dissolvenza del solo testo che
  // finiscono su `end` (dopo `end` il testo non c'è più).
  // `onFinalSize`: true = il filtro lavora sulle lettere già ridotte da
  // ACT_TEXT_SCALE (effetto ben visibile); false = lavora sul PNG a piena
  // dimensione prima della riduzione (effetto 4x più lieve rispetto alle
  // lettere: è com'era ACT-II prima della riduzione, così resta leggibile).
  ink?: {
    start: number;
    max: number;
    end?: number;
    textFade?: number;
    onFinalSize?: boolean;
  };
  // Atto II: frutto ritagliato che compare dopo la scritta
  fruit?: {
    src: string;
    x: number;
    y: number;
    width: number;
    scale: number;
    rot: number;
    inStart: number;
    inDuration: number;
  };
  // Atto III: frutti a canvas pieno, SOPRA il testo, a scala fissa, che
  // affiorano con OpticalDevelop; effetto pigmento opzionale sulle lettere
  // textBehind: il testo sta davanti ai segni fino a `start` e passa
  // dietro entro `end` (vedi ActCard)
  field?: {
    src: string;
    scale: number;
    develop: number;
    pigment: boolean;
    textBehind?: { start: number; end: number };
  };
};

const I: ActProps = {
  text: "finali/pannelli_fatal_03.png",
  label: "Atto I: Il campo",
  textInStart: 0,
  textInDuration: 12,
  fadeOut: 12,
};
const II: ActProps = {
  text: "finali/pannelli_fatal_04.png",
  label: "Atto II: Il tentativo",
  textInStart: 0,
  textInDuration: 12,
  fadeOut: 12,
  ink: { start: INK_II_START, max: INK_II_MAX, onFinalSize: false },
  fruit: {
    src: "finali/atto_2_segni.png",
    x: FRUIT_II_X,
    y: FRUIT_II_Y,
    width: FRUIT_II_WIDTH,
    scale: FRUIT_II_SCALE,
    rot: FRUIT_II_ROT,
    inStart: FRUIT_II_IN_START,
    inDuration: FRUIT_II_IN_DURATION,
  },
};
const III: ActProps = {
  text: "finali/pannelli_fatal_05.png",
  label: "Atto III: la resa e la rinascita",
  textInStart: tc("02:00"),
  ink: {
    start: INK_III_START,
    max: INK_III_MAX,
    end: INK_III_END,
    textFade: INK_III_TEXT_FADE,
    onFinalSize: true,
  },
  textInDuration: tc("02:19"), // 2,76 s, fade-in lentissimo
  fadeOut: 24,
  field: {
    src: "finali/atto_3_segni.png",
    scale: FRUIT_III_SCALE,
    develop: tc("02:00"), // affiora dal nero in 0-2 s
    pigment: false, // true = le lettere sotto i frutti si tingono di rosso
    textBehind: { start: TEXT_III_BEHIND_START, end: TEXT_III_BEHIND_END },
  },
};

// id delle composizioni: Remotion non accetta "_", quindi ACT-I ecc.
export const actCompositions = [
  { id: "ACT-I", duration: tc("05:17"), props: I }, // 142 frame
  { id: "ACT-II", duration: tc("05:00"), props: II }, // 125 frame
  { id: "ACT-III", duration: tc("07:00"), props: III }, // 175 frame
];
