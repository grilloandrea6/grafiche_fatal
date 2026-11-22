import type { CSSProperties } from "react";
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Easing,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import {
  config,
  endCredits as e,
  FONT_NUMERIC,
  FONT_SIZE_COMPENSATION,
  FONT_WEIGHT_NAME,
  FONT_WEIGHT_ROLE,
  LOGO_WIDTH,
  LOWERCASE_PARTICLES,
  SCALE,
} from "../config";
import { fontFamily } from "../fonts";
import { Grain } from "../fx";
import {
  buildTimeline,
  nameCase,
  timelineTable,
  type Entry,
  type FreeLine,
  type TimedSection,
} from "./parse";

export type EndCreditsProps = { sections: TimedSection[] };

// Legge il file, calcola sezioni e durata totale. Gira all'apertura in Studio
// e prima di ogni render: se il file cambia, la timeline si ricalcola.
export const calculateEndCredits: CalculateMetadataFunction<
  EndCreditsProps
> = async () => {
  const text = await fetch(staticFile(e.file)).then((r) => r.text());
  const { sections, durationInFrames } = buildTimeline(text, {
    fps: config.fps,
    ...e,
  });
  console.table(timelineTable(sections, config.fps));
  console.log(
    `Durata totale: ${durationInFrames} frame (${(durationInFrames / config.fps).toFixed(2)} s)`,
  );
  return { durationInFrames, props: { sections } };
};

// ── Stili ────────────────────────────────────────────────────────────────
const px = (v: number) => v * SCALE;
// Compensazione ottica del font (config.ts): il corpo cresce di k, così le
// maiuscole hanno la stessa altezza di prima. Letter-spacing (em) e
// interlinea (moltiplicatore) si dividono per k: in px restano identici.
const k = FONT_SIZE_COMPENSATION;
const fontSize = (size: number) => px(size * k);
const tracking = (em: number) => `${em / k}em`;
const leading = (lh: number) => lh / k;
const role = (nameSize: number): CSSProperties => ({
  fontSize: fontSize(nameSize * e.roleRatio),
  fontWeight: FONT_WEIGHT_ROLE,
  letterSpacing: tracking(e.roleTracking),
  lineHeight: leading(e.nameLineHeight),
  textTransform: "uppercase", // a prescindere da come è scritto nel file
});
const name = (nameSize: number): CSSProperties => ({
  fontSize: fontSize(nameSize),
  fontWeight: FONT_WEIGHT_NAME,
  letterSpacing: tracking(e.nameTracking),
  lineHeight: leading(e.nameLineHeight),
});
const Names = ({ entry, size }: { entry: Entry; size: number }) => (
  <>
    {entry.names.map((n, i) => (
      <div key={i} style={name(size)}>
        {nameCase(n, LOWERCASE_PARTICLES)}
      </div>
    ))}
  </>
);

// ── Layout ───────────────────────────────────────────────────────────────
// Singolo: ruolo piccolo sopra, nomi impilati sotto, tutto centrato.
function Single({ entry }: { entry: Entry }) {
  const size = e.nameSize;
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ ...role(size), marginBottom: px(size * e.singleRoleGap) }}>
        {entry.role}
      </div>
      <Names entry={entry} size={size} />
    </div>
  );
}

// Multiplo: due colonne ai lati della linea centrale del quadro. I ruoli sono
// allineati a destra, i nomi a sinistra; il ruolo sta sulla stessa linea di
// base del primo nome (align-items: baseline).
function Multiple({ header, entries }: { header?: string; entries: Entry[] }) {
  const size = e.nameSize;
  const half = px((size * e.gutter) / 2);
  return (
    <div style={{ width: "100%" }}>
      {header && (
        <div
          style={{
            ...role(size),
            textAlign: "center",
            marginBottom: px(size * e.headerGap),
          }}
        >
          {header}
        </div>
      )}
      {entries.map((entry, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "baseline",
            marginTop: i ? px(size * e.rowGap) : 0,
          }}
        >
          <div
            style={{
              ...role(size),
              flex: 1,
              textAlign: "right",
              paddingRight: half,
            }}
          >
            {entry.role}
          </div>
          <div style={{ flex: 1, paddingLeft: half }}>
            <Names entry={entry} size={size} />
          </div>
        </div>
      ))}
    </div>
  );
}

// Libero: righe centrate, testo come nel file. Le righe `small` hanno il
// corpo dei ruoli (senza maiuscolo né letter-spacing dei ruoli).
// Il logo ha larghezza fissa LOGO_WIDTH, uguale per tutti i loghi, ed è
// centrato rispetto al testo; testo + logo sono centrati nel quadro.
function Free({ lines, logo }: { lines: FreeLine[]; logo?: string }) {
  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        fontWeight: FONT_WEIGHT_NAME,
        letterSpacing: tracking(e.nameTracking),
        lineHeight: leading(e.freeLineHeight),
      }}
    >
      {lines.map((l, i) => (
        <div
          key={i}
          style={{
            fontSize: fontSize(
              l.small ? e.nameSize * e.roleRatio : e.freeTextSize,
            ),
            marginTop: l.spaceBefore ? px(e.freeLineGap) : 0,
          }}
        >
          {l.text}
        </div>
      ))}
      {logo && (
        <Img
          src={staticFile(logo)}
          style={{
            width: px(LOGO_WIDTH),
            height: "auto",
            marginTop: px(e.logoGap),
          }}
        />
      )}
    </div>
  );
}

// Una card con dissolvenza in entrata e in uscita (frame locali alla Sequence).
function Card({ section }: { section: TimedSection }) {
  const f = useCurrentFrame();
  const d = section.durationInFrames;
  const fade = Math.min(Math.round(e.fade * config.fps), Math.floor(d / 2));
  const opt = {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...e.fadeEasing),
  } as const;
  const opacity = Math.min(
    interpolate(f, [0, fade], [0, 1], opt),
    interpolate(f, [d - fade, d], [1, 0], opt),
  );
  return (
    <AbsoluteFill
      style={{
        opacity,
        justifyContent: "center",
        alignItems: "center",
        color: e.textColor,
        fontFamily,
        fontVariantNumeric: FONT_NUMERIC,
        backgroundColor: "#000000"
      }}
    >
      {section.layout === "singolo" && <Single entry={section.entries[0]} />}
      {section.layout === "multiplo" && (
        <Multiple header={section.header} entries={section.entries} />
      )}
      {section.layout === "libero" && (
        <Free lines={section.lines} logo={section.logo} />
      )}
    </AbsoluteFill>
  );
}

export function EndCredits({ sections }: EndCreditsProps) {
  return (
    <AbsoluteFill style={{ background: config.colors.black }}>
      {e.grainEnabled && <Grain />}
      {sections.map((s) => (
        <Sequence
          key={s.index}
          name={`${s.index} ${s.layout}`}
          from={s.from}
          durationInFrames={s.durationInFrames}
        >
          <Card section={s} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
