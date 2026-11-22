import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import { config as c } from "./config";
// Sfondo di una scena: il video se `src` è indicato, altrimenti nero.
export function Plate({ src }: { src?: string }) {
  if (!src) return <AbsoluteFill style={{ background: c.colors.black }} />;
  return (
    <OffthreadVideo
      muted
      src={src.includes("://") ? src : staticFile(src)}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  );
}
