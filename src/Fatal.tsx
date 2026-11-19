import { useEffect, useState } from "react";
import {
  AbsoluteFill,
  staticFile,
  useCurrentFrame,
  useDelayRender,
} from "remotion";
import { fatal } from "./fatal-settings";

const clamp = (x: number) => Math.min(1, Math.max(0, x));
const fibers = (
  <>
    <feTurbulence
      type="fractalNoise"
      baseFrequency="0.087 0.18"
      numOctaves="3"
      seed="29"
      result="texture"
    />
    <feDisplacementMap
      in="SourceGraphic"
      in2="texture"
      scale="15"
      xChannelSelector="R"
      yChannelSelector="G"
    />
  </>
);

export function Fatal({ occlusion = false }: { occlusion?: boolean }) {
  const f = useCurrentFrame();
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const [handle] = useState(() => delayRender());
  const [asset, setAsset] = useState<SVGSVGElement>();
  useEffect(() => {
    fetch(staticFile(fatal.asset))
      .then((r) => r.text())
      .then((source) => {
        const doc = new DOMParser().parseFromString(source, "image/svg+xml");
        for (const id of fatal.groups)
          if (!doc.getElementById(id))
            throw Error("Gruppo SVG mancante: " + id);
        setAsset(doc.documentElement as unknown as SVGSVGElement);
        continueRender(handle);
      })
      .catch(cancelRender);
  }, [handle, continueRender, cancelRender]);
  const wet = clamp((f - fatal.stainStart) * fatal.stainSpeed);
  const light =
    (Math.sin(f * 0.087) +
      0.6 * Math.sin(f * 0.137 + 1) +
      0.3 * Math.sin(f * 0.037)) *
    fatal.light;
  return (
    <AbsoluteFill style={{ background: "#ede3cc" }}>
      <svg viewBox="0 0 1920 1080" width="100%" height="100%">
        <defs>
          <radialGradient id="paper">
            <stop stopColor="#f7efdd" />
            <stop offset="1" stopColor="#e6dac1" />
          </radialGradient>
          <filter id="grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency=".62"
              numOctaves="2"
              seed="7"
            />
          </filter>
          <filter id="edge" x="-30%" y="-30%" width="160%" height="160%">
            {fibers}
          </filter>
        </defs>
        <rect width="1920" height="1080" fill="url(#paper)" />
        {asset && (
          <svg
            x={240 + 0.55 * Math.sin(f * 2)}
            y={310 + 0.45 * Math.cos(f * 1.7)}
            width="1440"
            height="460"
            overflow="visible"
            viewBox={asset.getAttribute("viewBox")!}
            fillRule="evenodd"
          >
            {fatal.groups.map((id, i) => {
              const enter = clamp((f - i * fatal.letterDelay) / 18);
              const drift = Math.pow(1 - enter, 2) * Math.cos(enter * 4);
              const group = asset.querySelector("#" + CSS.escape(id))!;
              return (
                <g
                  key={id}
                  opacity={clamp(enter * 4)}
                  style={{
                    transformBox: "fill-box",
                    transformOrigin: "center",
                    transform:
                      "translate(" +
                      drift * (i % 2 ? 9 : -9) +
                      "px," +
                      drift * 22 +
                      "px) rotate(" +
                      drift * (i % 2 ? 4 : -4) +
                      "deg)",
                  }}
                >
                  <defs>
                    <g
                      id={"shape" + i}
                      dangerouslySetInnerHTML={{ __html: group.outerHTML }}
                    />
                    <mask id={"wet" + i} maskContentUnits="objectBoundingBox">
                      {[0, 1, 2, 3].map((j) => (
                        <ellipse
                          key={j}
                          cx={[0.08, 0.85, 0.3, 0.95][j]}
                          cy={(((i * 17 + j * 31) % 86) + 7) / 100}
                          rx={wet * (0.38 + j * 0.06)}
                          ry={wet * (0.23 + j * 0.04)}
                          fill="white"
                        />
                      ))}
                    </mask>
                  </defs>
                  {wet > 0 && (
                    <g filter="url(#edge)">
                      <use
                        href={"#shape" + i}
                        mask={"url(#wet" + i + ")"}
                        stroke="#40392e"
                        strokeWidth={2 * wet * fatal.stainExtent}
                        strokeLinejoin="round"
                      />
                    </g>
                  )}
                  <use href={"#shape" + i} fill="#211f1b" />
                </g>
              );
            })}
          </svg>
        )}
        {occlusion && (
          <path
            transform={"translate(" + (-550 + clamp(f / 85) * 2600) + " 210)"}
            fill="#413f39"
            d="M-160 900 Q-140 550 -70 461 L40 402 Q84 375 77 333 Q40 308 40 236 Q24 192 51 139 Q81 89 149 104 Q223 110 229 178 L235 211 253 242 237 249 Q241 301 210 309 L208 360 Q234 395 302 417 Q373 445 399 585 L453 900Z"
          />
        )}
        <rect
          width="1920"
          height="1080"
          opacity={Math.abs(light)}
          fill={light > 0 ? "white" : "#33210f"}
        />
        <rect
          width="1920"
          height="1080"
          filter="url(#grain)"
          opacity={fatal.grain}
        />
      </svg>
    </AbsoluteFill>
  );
}
