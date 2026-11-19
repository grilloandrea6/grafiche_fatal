import { noise2D } from "@remotion/noise";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { useId, type ReactNode } from "react";
import { config as c, height, width, SCALE } from "../config";
type Layer = { children: ReactNode };
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const ramp = (frame: number, start: number, duration: number) =>
  interpolate(frame, [start, start + duration], [0, 1], clamp);
export function GateWeave({ children }: Layer) {
  const frame = useCurrentFrame();
  const t = Math.floor((frame * 24) / c.fps) * c.weaveFrequency;
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
export function Grain() {
  const frame = useCurrentFrame();
  return (
    <svg
      width={width}
      height={height}
      style={{
        position: "absolute",
        mixBlendMode: "overlay",
        opacity: c.grain,
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
export function Halation({ children }: Layer) {
  const id = "halo" + useId().replace(/[^a-z0-9]/gi, "");
  return (
    <>
      <AbsoluteFill
        style={{
          filter: `blur(${c.haloBlur * SCALE}px)`,
          mixBlendMode: "screen",
          opacity: c.haloOpacity,
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
      <AbsoluteFill style={{ filter: `blur(${c.inkBlur * SCALE}px)` }}>
        {children}
      </AbsoluteFill>
    </>
  );
}
export function Condense({
  children,
  direction,
  start,
  duration,
}: Layer & { direction: "in" | "out"; start: number; duration: number }) {
  const f = useCurrentFrame(),
    id = useId().replace(/[^a-z0-9]/gi, "");
  const time = ramp(f, start, duration),
    p = direction === "in" ? time : 1 - time;
  if (p === 0) return null;
  if (p === 1) return <>{children}</>;
  // Amplify luminance around a moving threshold; keep the noise field fixed.
  return (
    <svg width={width} height={height}>
      <defs>
        <filter id={"noise" + id}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency={0.12 / SCALE}
            numOctaves="2"
            seed="17"
          />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0" intercept="1" />
            {(["R", "G", "B"] as const).map((channel) => {
              const Fn = { R: "feFuncR", G: "feFuncG", B: "feFuncB" }[
                channel
              ] as "feFuncR";
              return (
                <Fn
                  key={channel}
                  type="linear"
                  slope="18"
                  intercept={19 * p - 18}
                />
              );
            })}
          </feComponentTransfer>
        </filter>
        <mask id={"mask" + id}>
          <rect width="100%" height="100%" filter={"url(#noise" + id + ")"} />
        </mask>
      </defs>
      <foreignObject
        width={width}
        height={height}
        mask={"url(#mask" + id + ")"}
      >
        {children}
      </foreignObject>
    </svg>
  );
}
export function OpticalDevelop({ children }: Layer) {
  const t = interpolate(useCurrentFrame(), [0, c.developFrames], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.35, 0, 0.22, 1),
  });
  return (
    <AbsoluteFill
      style={{
        opacity: t,
        filter: `brightness(${0.15 + 0.85 * t}) blur(${(c.developBlur + (c.inkBlur - c.developBlur) * t) * SCALE}px)`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
}
export function Abrasion({ children }: Layer) {
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
            scale={
              c.abrasion * SCALE * ramp(f, 0, c.directorOut - c.directorIn)
            }
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>
      <AbsoluteFill style={{ filter: "url(#scuff)" }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
}
