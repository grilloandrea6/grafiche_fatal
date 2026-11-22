import { Composition } from "remotion";
import { HeadTitles } from "./HeadTitles";
import { EndCredits, calculateEndCredits } from "./end-credits/EndCredits";
import { width, height, config } from "./config";
import { ActCard } from "./acts/ActCard";
import { actCompositions } from "./config.acts";
import { FatalTitle } from "./title/FatalTitle";
import { TITLE_DURATION } from "./config.title";
export const RemotionRoot = () => (
  <>
    <Composition
      id="HEAD-TITLES"
      component={HeadTitles}
      width={width}
      height={height}
      fps={config.fps}
      durationInFrames={config.duration}
    />
    {/* Durata calcolata da calculateMetadata in base a credits_ita.txt */}
    <Composition
      id="END-CREDITS"
      component={EndCredits}
      width={4320}
      height={2160}
      fps={config.fps}
      durationInFrames={1}
      defaultProps={{ sections: [] }}
      calculateMetadata={calculateEndCredits}
    />
    {/* Cartelli d'atto: durata e props da config.acts.ts */}
    {actCompositions.map((act) => (
      <Composition
        key={act.id}
        id={act.id}
        component={ActCard}
        width={width}
        height={height}
        fps={config.fps}
        durationInFrames={act.duration}
        defaultProps={act.props}
      />
    ))}
    {/* Titolo finale: Remotion non accetta "_" negli id */}
    <Composition
      id="FATAL-TITLE"
      component={FatalTitle}
      width={width}
      height={height}
      fps={config.fps}
      durationInFrames={TITLE_DURATION}
    />
  </>
);
