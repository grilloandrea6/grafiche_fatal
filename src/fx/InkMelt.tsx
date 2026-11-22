import { useId, type ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { SCALE } from "../config";
import {
  INK_BLUR_MAX,
  INK_DRIP_MAX,
  INK_HOLES_MAX,
  INK_SEED,
} from "../config.acts";

// "Inchiostro che si scioglie": un solo parametro `progress` (0 = testo
// intatto, 1 = massimo) guida tutto. Catena del filtro SVG:
//   1. colatura: rumore a bassa frequenza (molto più basso in orizzontale)
//      sposta il testo quasi solo in verticale;
//   2. buchi: un secondo rumore, trasformato in maschera con una soglia che
//      sale con progress, svuota zone irregolari delle lettere;
//   3. gooey: blur dell'alpha + soglia ripida, così bordi e buchi diventano
//      forme morbide e arrotondate.
// I seed sono fissi; il rumore scorre lentamente con feOffset guidato dal
// frame, quindi il movimento è continuo (nessuno scatto da cambio di seed).
export function InkMelt({
  children,
  progress,
}: {
  children: ReactNode;
  progress: number;
}) {
  const f = useCurrentFrame();
  const id = "ink" + useId().replace(/[^a-z0-9]/gi, "");
  if (progress <= 0) return <>{children}</>;
  const p = Math.min(1, progress);

  const blur = INK_BLUR_MAX * SCALE * p;
  const drip = INK_DRIP_MAX * SCALE * p;
  // soglia dei buchi: negativa a p=0 (nessun buco), sale fino a INK_HOLES_MAX
  const threshold = -0.05 + INK_HOLES_MAX * p;
  const holeSlope = 8; // bordi dei buchi leggermente sfumati
  // soglia "gooey": più ripida man mano che il blur cresce. Il punto fisso è
  // al 25% di alpha (non al 50%): i tratti si gonfiano invece di assottigliarsi,
  // così i filetti sottili del Bodoni non spariscono.
  const goo = 1 + 7 * Math.min(1, p * 3);

  return (
    <AbsoluteFill>
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <filter
          id={id}
          x="-10%"
          y="-50%"
          width="120%"
          height="200%"
          colorInterpolationFilters="sRGB"
        >
          {/* 1. Colatura */}
          <feTurbulence
            type="fractalNoise"
            baseFrequency={`${0.002 / SCALE / 2} ${0.01 / SCALE / 2}`}
            numOctaves="2"
            seed={INK_SEED}
          />
          <feOffset dy={f * 0.4 * SCALE} result="dripNoise" />
          {/* R fisso a 0,5 => nessuno spostamento orizzontale */}
          <feColorMatrix
            in="dripNoise"
            type="matrix"
            values="0 0 0 0 0.5  0 1 0 0 0  0 0 1 0 0  0 0 0 0 1"
            result="dripMap"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="dripMap"
            scale={drip}
            xChannelSelector="R"
            yChannelSelector="G"
            result="dripped"
          />
          {/* 2. Buchi: rumore -> alpha -> soglia che sale con progress */}
          <feTurbulence
            type="fractalNoise"
            baseFrequency={0.012 / SCALE / 2}
            numOctaves="2"
            seed={INK_SEED + 11}
          />
          <feOffset dx={f * 0.25 * SCALE} dy={f * 0.15 * SCALE} />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  1 0 0 0 0"
          />
          <feComponentTransfer result="holes">
            <feFuncA
              type="linear"
              slope={holeSlope}
              intercept={-holeSlope * threshold}
            />
          </feComponentTransfer>
          <feComposite in="dripped" in2="holes" operator="in" />
          {/* 3. Gooey: blur + soglia ripida sull'alpha */}
          <feGaussianBlur stdDeviation={blur} />
          <feComponentTransfer>
            <feFuncA type="linear" slope={goo} intercept={-(goo - 1) * 0.25} />
          </feComponentTransfer>
        </filter>
      </svg>
      <AbsoluteFill style={{ filter: `url(#${id})` }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
}
