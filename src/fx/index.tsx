import { noise2D } from "@remotion/noise";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { useId, type ReactNode } from "react";
import {
  config as c,
  height,
  width,
  SCALE,
  HALATION_BLUR,
  HALATION_OPACITY,
} from "../config";
type Layer = { children: ReactNode };
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const ramp = (frame: number, start: number, duration: number) =>
  interpolate(frame, [start, start + duration], [0, 1], clamp);
export function GateWeave({ children }: Layer) {
  const frame = useCurrentFrame();
  const t = frame * c.weaveFrequency;
  const n = (axis: number) => noise2D("gate", t, axis);
  return (
    <AbsoluteFill
      style={{
        transform: `translate(${n(1) * c.weave * SCALE}px,${n(2) * c.weave * SCALE}px) rotate(${(n(3) * c.weave) / 200}deg)`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
}
// `blend`/`opacity` opzionali (FATAL-TITLE su plate vero); di default screen.
export function Grain({
  blend = "screen",
  opacity = c.grain,
}: { blend?: "screen" | "soft-light" | "overlay"; opacity?: number } = {}) {
  const frame = useCurrentFrame();
  return (
    <svg
      width={width}
      height={height}
      style={{
        position: "absolute",
        // Sul nero "overlay" non lascia traccia: "screen" a bassa opacità.
        mixBlendMode: blend,
        opacity,
      }}
    >
      <filter id="silver">
        <feTurbulence
          type="fractalNoise"
          baseFrequency={0.55 / (c.grainSize * SCALE)}
          seed={frame + 1}
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#silver)" />
    </svg>
  );
}
// `opacity`/`blur` opzionali (FATAL-TITLE); di default i valori di config.ts.
export function Halation({
  children,
  opacity = HALATION_OPACITY,
  blur = HALATION_BLUR,
}: Layer & { opacity?: number; blur?: number }) {
  const id = "halo" + useId().replace(/[^a-z0-9]/gi, "");
  return (
    <>
      <AbsoluteFill
        style={{
          filter: `blur(${blur * SCALE}px)`,
          mixBlendMode: "screen",
          opacity,
          background: "transparent",
        }}
      >
        <svg width="0" height="0">
          <filter id={id}>
            <feFlood floodColor={c.halo} />
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>
        </svg>
        <AbsoluteFill style={{ filter: "url(#" + id + ")" }}>
          {children}
        </AbsoluteFill>
      </AbsoluteFill>
      <AbsoluteFill>{children}</AbsoluteFill>
    </>
  );
}
// Sviluppo ottico in entrata e, al contrario, in uscita. `duration` è la
// lunghezza del credit in frame (il frame è locale alla Sequence).
export const developFrames = (duration: number) => {
  const max = Math.floor(duration * c.developMaxShare);
  return {
    in: Math.min(c.developIn, max),
    out: Math.min(c.developOut, max),
  };
};
// `inFrames`/`outFrames` opzionali (cartelli d'atto) sostituiscono le durate
// calcolate da developFrames; outFrames = 0 => nessuna uscita.
export function OpticalDevelop({
  children,
  duration,
  inFrames,
  outFrames,
  blurTo = c.inkBlur,
}: Layer & {
  duration: number;
  inFrames?: number;
  outFrames?: number;
  blurTo?: number; // blur finale (px a 4K); di default inkBlur
}) {
  const f = useCurrentFrame();
  const auto = developFrames(duration);
  const d = { in: inFrames ?? auto.in, out: outFrames ?? auto.out };
  const easing = Easing.bezier(...c.developEasing);
  const t = Math.min(
    interpolate(f, [0, d.in], [0, 1], { ...clamp, easing }),
    d.out > 0
      ? interpolate(f, [duration - d.out, duration], [1, 0], {
          ...clamp,
          easing,
        })
      : 1,
  );
  return (
    <AbsoluteFill
      style={{
        opacity: t,
        filter: `brightness(${c.developBrightness + (1 - c.developBrightness) * t}) blur(${(c.developBlur + (blurTo - c.developBlur) * t) * SCALE}px)`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
}
// `start` e `max` opzionali (cartelli d'atto): lo spostamento resta 0 fino a
// `start` e poi sale fino a `max` (px a 4K) a fine durata.
export function Abrasion({
  children,
  duration,
  start = 0,
  max = c.abrasion,
}: Layer & { duration: number; start?: number; max?: number }) {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <svg width="0" height="0">
        <filter id="scuff">
          <feTurbulence
            type="fractalNoise"
            baseFrequency={0.2 / SCALE}
            seed={Math.floor(f / 3)}
            result="paper"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="paper"
            scale={max * SCALE * ramp(f, start, duration - start)}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>
      <AbsoluteFill style={{ filter: "url(#scuff)" }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
}
