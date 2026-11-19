import {
  AbsoluteFill,
  Img,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { config as c } from "./config";
import { Plate } from "./Plate";
import {
  GateWeave,
  Grain,
  Halation,
  Abrasion,
  Condense,
  OpticalDevelop,
  ramp,
} from "./fx";
type Credit = keyof typeof c.credits;
function CreditImage({ id }: { id: Credit }) {
  return (
    <Img
      src={staticFile("placeholders/credit_" + id + ".png")}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
// Phase is used only to reproduce the intermediate exports; Studio opens the final cut.
export function HeadTitles({ phase = 5 }: { phase?: number }) {
  const f = useCurrentFrame();
  const layer = (id: Credit) =>
    phase === 5 ? (
      <Halation>
        <CreditImage id={id} />
      </Halation>
    ) : (
      <CreditImage id={id} />
    );
  const commission =
    ramp(f, 0, c.commissionFade) *
    (1 - ramp(f, c.A - c.commissionFade, c.commissionFade));
  return (
    <AbsoluteFill style={{ background: c.colors.black }}>
      {phase === 1 ? (
        <CreditImage
          id={f < c.A ? "commission" : f < c.B ? "cianalino" : "miaglia"}
        />
      ) : (
        <>
          {(["A", "B", "C", "D"] as const).map((kind, i) => (
            <Sequence
              key={kind}
              name={"Plate " + kind}
              from={c[kind]}
              durationInFrames={[c.B, c.C, c.D, c.duration][i] - c[kind]}
            >
              {phase >= (kind === "D" ? 4 : 3) && (
                <Plate kind={kind} src={c.plates[kind]} />
              )}
            </Sequence>
          ))}
          {phase === 5 && f >= c.A && <Grain />}
          <GateWeave>
            {f < c.A && (
              <AbsoluteFill style={{ opacity: commission }}>
                {layer("commission")}
              </AbsoluteFill>
            )}
            {phase >= 3 && f >= c.A && f < c.B + c.dissolveFrames && (
              <AbsoluteFill>
                <Condense
                  direction={f < c.B ? "in" : "out"}
                  start={f < c.B ? c.A : c.B}
                  duration={f < c.B ? c.condenseFrames : c.dissolveFrames}
                >
                  {layer("cianalino")}
                </Condense>
              </AbsoluteFill>
            )}
            {phase >= 3 && f >= c.B && f < c.C && (
              <AbsoluteFill>
                <Condense
                  direction="in"
                  start={c.B + Math.floor(c.dissolveFrames / 2)}
                  duration={c.condenseFrames}
                >
                  {layer("miaglia")}
                </Condense>
              </AbsoluteFill>
            )}
            {phase >= 4 && (
              <Sequence
                name="Regia"
                from={c.directorIn}
                durationInFrames={c.directorOut - c.directorIn}
              >
                <AbsoluteFill
                  style={{
                    opacity:
                      1 -
                      ramp(f, c.directorOut - c.directorFade, c.directorFade),
                  }}
                >
                  <OpticalDevelop>
                    <Abrasion>{layer("regia")}</Abrasion>
                  </OpticalDevelop>
                </AbsoluteFill>
              </Sequence>
            )}
          </GateWeave>
        </>
      )}
    </AbsoluteFill>
  );
}
