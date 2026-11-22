import { AbsoluteFill, Img, Sequence, staticFile } from "remotion";
import { config as c, TEXT_SCALE } from "./config";
import { Plate } from "./Plate";
import { GateWeave, Grain, Halation, Abrasion, OpticalDevelop } from "./fx";
type Credit = keyof typeof c.credits;
function CreditImage({ id }: { id: Credit }) {
  return (
    <Img
      src={staticFile("placeholders/credit_" + id + ".png")}
      style={{
        width: "100%",
        height: "100%",
        transform: `scale(${TEXT_SCALE})`,
      }}
    />
  );
}
export function HeadTitles() {
  return (
    <AbsoluteFill style={{ background: c.colors.black }}>
      {c.plates.map((plate, i) => (
        <Sequence
          key={i}
          name={"Plate " + (i + 1)}
          from={plate.from}
          durationInFrames={plate.to - plate.from}
        >
          <Plate src={plate.src} />
        </Sequence>
      ))}
      {c.grainEnabled && <Grain />}
      <GateWeave>
        {(Object.keys(c.credits) as Credit[]).map((id) => {
          const { in: from, out } = c.credits[id];
          const duration = out - from;
          const credit = (
            <Halation>
              <CreditImage id={id} />
            </Halation>
          );
          return (
            <Sequence
              key={id}
              name={id}
              from={from}
              durationInFrames={duration}
            >
              <OpticalDevelop duration={duration}>
                {id === "regia" ? (
                  <Abrasion duration={duration}>{credit}</Abrasion>
                ) : (
                  credit
                )}
              </OpticalDevelop>
            </Sequence>
          );
        })}
      </GateWeave>
    </AbsoluteFill>
  );
}
