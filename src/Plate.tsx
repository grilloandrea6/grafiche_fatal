import {
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  interpolate,
} from "remotion";
import { config as c } from "./config";
type Kind = keyof typeof c.plates;
export function Plate({ kind, src }: { kind: Kind; src?: string }) {
  const f = useCurrentFrame(),
    p = c.colors;
  if (src)
    return (
      <>
        <OffthreadVideo
          muted
          src={src.includes("://") ? src : staticFile(src)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        {kind === "D" && (
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 1920 1080"
            style={{ position: "absolute" }}
          >
            <clipPath id="horizon">
              <rect width="1920" height="721" />
            </clipPath>
            <g clipPath="url(#horizon)">
              <Heads />
            </g>
          </svg>
        )}
      </>
    );
  return (
    <svg width="100%" height="100%" viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="air" x2=".15" y2="1">
          <stop stopColor={kind === "D" ? p.sky : p.green} />
          <stop offset="1" stopColor={kind === "D" ? p.haze : p.grass} />
        </linearGradient>
        <filter id="mist">
          <feGaussianBlur stdDeviation="32" />
        </filter>
        <filter id="wind">
          <feTurbulence
            type="fractalNoise"
            baseFrequency=".005 .009"
            numOctaves="2"
            result="n"
          />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="33" />
        </filter>
      </defs>
      <rect width="1920" height="1080" fill="url(#air)" />
      {kind === "A" && (
        <path
          filter="url(#mist)"
          fill={p.shadow}
          d="M1100 1100 Q1130 680 1280 620 Q1200 300 1350 280 Q1510 275 1460 605 Q1610 720 1670 1100Z"
        />
      )}
      {kind === "B" && (
        <g filter="url(#wind)" fill={p.grass}>
          {Array.from({ length: 125 }, (_, i) => {
            const x = i * 16 - 30,
              sway = 36 * Math.sin(f * 0.06 + i * 0.22);
            return (
              <path
                key={i}
                opacity={0.35 + 0.25 * Math.sin(i)}
                d={`M${x} 1100 Q${x + 20} 500 ${x + sway} ${80 + 170 * Math.sin(i * 7)} Q${x + 36} 620 ${x + 18} 1100Z`}
              />
            );
          })}
        </g>
      )}
      {kind === "C" && (
        <path fill={p.shadow} d="M450 1080V416L1320 345 1455 441V1080Z" />
      )}
      {kind === "D" && (
        <>
          <Heads />
          <path
            fill={p.land}
            d="M0 724 Q460 713 795 722 T1490 720 L1920 716V1080H0Z"
          />
        </>
      )}
    </svg>
  );
}

function Heads() {
  const f = useCurrentFrame();
  return (
    <g
      fill={c.colors.shadow}
      opacity={interpolate(
        f,
        [c.headsIn - c.D, c.headsIn - c.D + c.headsFade],
        [0, 1],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
      )}
    >
      {[1042, 1095, 1190, 1224, 1305, 1420].map((x, i) => (
        <ellipse key={x} cx={x} cy={720} rx={6 + (i % 3)} ry={10 + (i % 4)} />
      ))}
    </g>
  );
}
