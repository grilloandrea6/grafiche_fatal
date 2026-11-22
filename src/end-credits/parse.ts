// Parser e timeline dei titoli di coda. Nessun import: lo usano sia Remotion
// sia `scripts/end-credits-table.mjs` (Node), così la tabella stampata è
// calcolata esattamente come nel video.

export type Entry = { role: string; names: string[] };
export type Section =
  // singolo: un ruolo, uno o più nomi impilati, centrato
  | { layout: "singolo"; entries: [Entry] }
  // multiplo: più ruoli; colonna ruoli a destra e colonna nomi a sinistra
  // della linea centrale. `header` è una riga di titolo sopra (es. "Cast").
  | { layout: "multiplo"; header?: string; entries: Entry[] }
  // libero: righe di testo centrate, maiuscole/minuscole come nel file.
  // `small` = corpo dei ruoli; le righe con nomi restano al corpo normale.
  // `logo` = immagine sotto il testo, al posto della riga che la nomina.
  | { layout: "libero"; lines: FreeLine[]; logo?: string };
export type FreeLine = { text: string; small: boolean; spaceBefore: boolean };

// Opzioni del testo libero (da config.endCredits)
export type FreeSettings = {
  // riga del file -> logo che la sostituisce (percorso in public/)
  logos: Record<string, string>;
  // righe da tenere piccole anche se contengono un nome proprio
  freeSmallLines: string[];
  // righe precedute da spazio extra (confronto sull'inizio della riga)
  freeSpaceBefore: string[];
};

export type TimedSection = Section & {
  index: number;
  chars: number;
  seconds: number;
  from: number; // primo frame
  durationInFrames: number;
};

export type TimingSettings = {
  fps: number;
  startBlack: number;
  endBlack: number;
  gap: number;
  minSec: number;
  secPerChar: number;
  maxSec: number;
};

const SEPARATOR = /^-\s*nero\s*-$/i;
const COLUMNS = /\t+| {2,}/; // colonne: tab o almeno due spazi
const PARTICLES = new Set(
  "di de del della dei degli da dal dalla van von der den du".split(" "),
);

// "laure DE groef" -> "Laure De Groef"; maiuscola anche dopo ' e -.
// Con lowercaseParticles le particelle (di, de, van...) restano minuscole,
// tranne quando sono la prima parola.
export function nameCase(name: string, lowercaseParticles: boolean) {
  return name
    .toLowerCase()
    .split(" ")
    .map((word, i) =>
      lowercaseParticles && i > 0 && PARTICLES.has(word)
        ? word
        : word.replace(
            /(^|['\u2019-])(\p{L})/gu,
            (_, sep, ch) => sep + ch.toUpperCase(),
          ),
    )
    .join(" ");
}

// Una riga "sembra un nome" se non ha cifre né punteggiatura da frase e ogni
// parola inizia con la maiuscola (o è una particella).
const looksLikeName = (line: string) =>
  !/[\d,;:]/.test(line) &&
  line
    .split(" ")
    .every((w) => /^\p{Lu}/u.test(w) || PARTICLES.has(w.toLowerCase()));
// Un ruolo inizia con la maiuscola e non finisce con una preposizione:
// "Con il supporto di" è l'inizio di una frase, non un ruolo.
const looksLikeRole = (line: string) =>
  /^\p{Lu}/u.test(line) && !/\s(di|da|del|della|per|con|a)$/i.test(line);

// REGOLA DEL LAYOUT (una sezione = il testo tra due righe "-nero-"):
// 1. Se qualche riga ha più colonne (tab o 2+ spazi) è una tabella ruolo/nomi:
//    prima colonna = ruolo, le altre = nomi. Se la prima riga ha una sola
//    colonna e le altre di più, la prima è un titolo (es. "Cast").
// 2. Se tutte le righe hanno una colonna sola: è "ruolo + nomi" quando la
//    prima riga sembra un ruolo (maiuscola iniziale, non finisce con una
//    preposizione come "di") e tutte le altre sembrano nomi;
//    altrimenti è testo libero (ringraziamenti, frasi istituzionali).
// 3. Un solo ruolo => singolo (nomi impilati); più ruoli => multiplo.
// Nel testo libero una riga resta al corpo dei nomi se contiene un nome
// proprio, cioè almeno due parole consecutive con la maiuscola
// ("Alessandro Proietti", "Franco Rosso", "Media Digitali"). Le altre
// ("Si ringraziano", "per il supporto", "A.A. 2025/2026") vanno al corpo dei
// ruoli. `freeSmallLines` forza piccole righe come "Fotografia e Cinema Digitale".
const same = (a: string, b: string) =>
  a.trim().toLowerCase() === b.trim().toLowerCase();
const hasProperName = (line: string) =>
  /\p{Lu}[\p{Ll}'\u2019]+[,.]?\s+\p{Lu}\p{Ll}/u.test(line);
function freeText(lines: string[], o: FreeSettings): Section {
  let logo: string | undefined;
  const kept = lines
    .map((l) => l.replace(/\s+/g, " "))
    .filter((l) => {
      const key = Object.keys(o.logos).find((k) => same(k, l));
      if (key) logo = o.logos[key];
      return !key;
    });
  return {
    layout: "libero",
    logo,
    lines: kept.map((text) => ({
      text,
      small:
        !hasProperName(text) || o.freeSmallLines.some((s) => same(s, text)),
      spaceBefore: o.freeSpaceBefore.some((s) =>
        text.toLowerCase().startsWith(s.toLowerCase()),
      ),
    })),
  };
}

export function classify(lines: string[], o: FreeSettings): Section {
  const rows = lines.map((l) =>
    l
      .split(COLUMNS)
      .map((s) => s.trim())
      .filter(Boolean),
  );
  let header: string | undefined;
  let entries: Entry[];
  if (rows.some((r) => r.length > 1)) {
    if (rows[0].length === 1) header = rows.shift()![0];
    entries = rows.map((r) => ({ role: r[0], names: r.slice(1) }));
  } else if (
    lines.length >= 2 &&
    looksLikeRole(lines[0]) &&
    lines.slice(1).every(looksLikeName)
  ) {
    entries = [{ role: lines[0], names: lines.slice(1) }];
  } else {
    return freeText(lines, o);
  }
  if (entries.length === 1 && !header)
    return { layout: "singolo", entries: [entries[0]] };
  return { layout: "multiplo", header, entries };
}

export function parseCredits(
  text: string,
  o: FreeSettings,
): { section: Section; chars: number }[] {
  const blocks: string[][] = [[]];
  // Il file ha il BOM UTF-8 e fine riga Windows (\r\n)
  for (const raw of text.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const line = raw.trim();
    if (SEPARATOR.test(line)) blocks.push([]);
    else if (line) blocks[blocks.length - 1].push(line);
  }
  return blocks
    .filter((b) => b.length > 0)
    .map((lines) => {
      const section = classify(lines, o);
      // caratteri visibili della sezione, spazi esclusi. Le righe sostituite
      // da un logo non contano: si conta solo il testo che resta.
      const visible =
        section.layout === "libero" ? section.lines.map((l) => l.text) : lines;
      return { section, chars: visible.join("").replace(/\s/g, "").length };
    });
}

// durata = clamp(MIN + chars * SEC_PER_CHAR, MIN, MAX), dissolvenze incluse.
// Tra due sezioni c'è `gap` secondi di nero; all'inizio e alla fine i neri.
export function buildTimeline(text: string, t: TimingSettings & FreeSettings) {
  const sec = (s: number) => Math.round(s * t.fps);
  let cursor = sec(t.startBlack);
  const sections: TimedSection[] = parseCredits(text, t).map(
    ({ section, chars }, i) => {
      const seconds = Math.min(
        t.maxSec,
        Math.max(t.minSec, t.minSec + chars * t.secPerChar),
      );
      const timed = {
        ...section,
        index: i + 1,
        chars,
        seconds,
        from: cursor,
        durationInFrames: sec(seconds),
      };
      cursor += timed.durationInFrames + sec(t.gap);
      return timed;
    },
  );
  const total =
    sections.length === 0
      ? cursor + sec(t.endBlack)
      : cursor - sec(t.gap) + sec(t.endBlack);
  return { sections, durationInFrames: total };
}

// Righe per console.table
export const timelineTable = (sections: TimedSection[], fps: number) =>
  sections.map((s) => ({
    "#": s.index,
    layout: s.layout,
    caratteri: s.chars,
    secondi: +s.seconds.toFixed(2),
    inizio: s.from,
    fine: s.from + s.durationInFrames - 1,
    "inizio (s)": +(s.from / fps).toFixed(2),
    testo: (s.layout === "libero"
      ? (s.lines[0]?.text ?? "")
      : (s.layout === "multiplo" && s.header) || s.entries[0].role
    ).slice(0, 30),
  }));
