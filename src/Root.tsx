import { Composition } from "remotion";
import { HeadTitles } from "./HeadTitles";
import { width, height, config } from "./config";
export const RemotionRoot = () => (
  <Composition
    id="HEAD-TITLES"
    component={HeadTitles}
    width={width}
    height={height}
    fps={config.fps}
    durationInFrames={config.duration}
    defaultProps={{ phase: 5 }}
  />
);
