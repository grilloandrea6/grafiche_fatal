import { useEffect } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  getRemotionEnvironment,
  prefetch,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { config, SCALE } from "../config";
import {
  FG_DIR,
  FG_FRAME_COUNT,
  FG_PAD,
  FG_PREFIX,
  FG_START_OFFSET,
  PLATE_PREVIEW_SRC,
  PLATE_SRC,
  TITLE_BLUR,
  TITLE_DURATION,
  TITLE_GRAIN_BLEND,
  TITLE_GRAIN_ENABLED,
  TITLE_GRAIN_OPACITY,
  TITLE_HALATION_BLUR,
  TITLE_HALATION_OPACITY,
  TITLE_IN_DURATION,
  TITLE_IN_START,
  TITLE_SCALE,
  TITLE_SHADE_CX,
  TITLE_SHADE_CY,
  TITLE_SHADE_ENABLED,
  TITLE_SHADE_OPACITY,
  TITLE_SHADE_RX,
  TITLE_SHADE_RY,
  TITLE_SRC,
  TITLE_X,
  TITLE_Y,
} from "../config.title";
import { GateWeave, Grain, Halation, OpticalDevelop } from "../fx";

// Nessun grade qui: plate e primo piano restano piatti (log), il grade si
// fa in Resolve.

// 1. Plate: il video originale. In render il ProRes (letto dal compositor
// di Remotion, non dal browser); in Studio il proxy H.264, perché Chrome
// non decodifica il ProRes. trimBefore = stesso offset del primo piano.
function Background() {
  const { isRendering } = getRemotionEnvironment();
  return (
    <OffthreadVideo
      muted
      src={staticFile(isRendering ? PLATE_SRC : PLATE_PREVIEW_SRC)}
      trimBefore={FG_START_OFFSET || undefined}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  );
}

// Percorso del PNG del primo piano per un frame del sorgente.
const fgFile = (sourceFrame: number) =>
  staticFile(
    `${FG_DIR}/${FG_PREFIX}${String(sourceFrame).padStart(FG_PAD, "0")}.png`,
  );

// 3. Primo piano: sequenza PNG RGBA, un file per frame. <Img> blocca il
// render (delayRender) finché il PNG non è caricato, quindi in render non
// ci sono lampeggi. In Studio precarichiamo tutta la sequenza (~96 MB) per
// uno scrubbing fluido; in render il prefetch non serve.
function Foreground() {
  const frame = useCurrentFrame();
  useEffect(() => {
    if (getRemotionEnvironment().isRendering) return;
    const handles = Array.from({ length: FG_FRAME_COUNT }, (_, i) =>
      prefetch(fgFile(i)),
    );
    return () => handles.forEach((h) => h.free());
  }, []);
  // Oltre l'ultimo file si tiene l'ultimo frame (non dovrebbe succedere con
  // FG_START_OFFSET + durata <= FG_FRAME_COUNT).
  const sourceFrame = Math.min(frame + FG_START_OFFSET, FG_FRAME_COUNT - 1);
  return (
    <Img src={fgFile(sourceFrame)} style={{ width: "100%", height: "100%" }} />
  );
}

// 2. Titolo: dietro il primo piano. Gate weave solo qui; sviluppo ottico da
// TITLE_IN_START, poi fermo fino all'ultimo frame (nessun fade out: taglio).
// L'halation sta dentro questo layer, quindi resta sotto il ragazzo.
function Title() {
  const hold = TITLE_DURATION - TITLE_IN_START;
  return (
    <Sequence from={TITLE_IN_START} durationInFrames={hold} name="Titolo">
      <GateWeave>
        <AbsoluteFill
          style={{
            transform: `translate(${TITLE_X * SCALE}px, ${TITLE_Y * SCALE}px) scale(${TITLE_SCALE})`,
          }}
        >
          <OpticalDevelop
            duration={hold}
            inFrames={TITLE_IN_DURATION}
            outFrames={0}
            blurTo={TITLE_BLUR}
          >
            <Halation
              opacity={TITLE_HALATION_OPACITY}
              blur={TITLE_HALATION_BLUR}
            >
              <Img
                src={staticFile(TITLE_SRC)}
                style={{ width: "100%", height: "100%" }}
              />
            </Halation>
          </OpticalDevelop>
        </AbsoluteFill>
      </GateWeave>
    </Sequence>
  );
}

// 2a. Gradiente scuro sotto il titolo: ellisse nera morbida in Multiply,
// con la stessa trasformazione del titolo (così resta centrata sulla scritta)
// e la stessa entrata dello sviluppo ottico. Nero in Multiply = scurisce il
// plate al massimo del TITLE_SHADE_OPACITY al centro, 0 sul bordo.
function Shade() {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [TITLE_IN_START, TITLE_IN_START + TITLE_IN_DURATION],
    [0, TITLE_SHADE_OPACITY],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(...config.developEasing),
    },
  );
  const px = (v: number) => `${v * SCALE}px`;
  return (
    <AbsoluteFill style={{ mixBlendMode: "multiply", opacity }}>
      <AbsoluteFill
        style={{
          transform: `translate(${TITLE_X * SCALE}px, ${TITLE_Y * SCALE}px) scale(${TITLE_SCALE})`,
          background: `radial-gradient(ellipse ${px(TITLE_SHADE_RX)} ${px(TITLE_SHADE_RY)} at ${px(TITLE_SHADE_CX)} ${px(TITLE_SHADE_CY)}, #000 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
}

// Ordine dal basso: plate, gradiente, titolo, primo piano.
export function FatalTitle() {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Background />
      {TITLE_SHADE_ENABLED && <Shade />}
      <Title />
      {/* AbsoluteFill: un elemento non posizionato finirebbe sotto lo sfondo */}
      <AbsoluteFill>
        <Foreground />
      </AbsoluteFill>
      {TITLE_GRAIN_ENABLED && (
        <Grain blend={TITLE_GRAIN_BLEND} opacity={TITLE_GRAIN_OPACITY} />
      )}
    </AbsoluteFill>
  );
}
