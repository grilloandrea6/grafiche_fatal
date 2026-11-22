// Caricamento del font dei titoli (FONT_FAMILY in config.ts) come web font.
// Separato da config.ts perché loadFont() gira solo nel browser, mentre
// config.ts è importato anche dagli script Node in scripts/.
import { loadFont } from "@remotion/google-fonts/CormorantGaramond";
import { cancelRender, continueRender, delayRender } from "remotion";
import { FONT_FAMILY } from "./config";

// Tutti i pesi 400-700 (così FONT_WEIGHT_* si può cambiare dalla config),
// solo stile normale (l'italic non è usato), latin + latin-ext per accenti
// e apostrofi.
const font = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin", "latin-ext"],
});

// Il nome restituito deve coincidere con quello della config
if (font.fontFamily !== FONT_FAMILY) {
  throw new Error(
    `Font atteso "${FONT_FAMILY}", caricato "${font.fontFamily}"`,
  );
}

// Nessun frame viene catturato (render) o mostrato come pronto (Studio)
// prima che tutti i file del font siano caricati.
const handle = delayRender(`Caricamento ${FONT_FAMILY}`);
// Se un file non si carica, il render si ferma con l'errore (cancelRender).
font.waitUntilDone().then(() => continueRender(handle), cancelRender);

export const fontFamily = font.fontFamily;
