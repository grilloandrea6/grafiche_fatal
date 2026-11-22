import type { ReactNode } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { config, SCALE } from "../config";
import { ACT_TEXT_SCALE, acts, type ActProps } from "../config.acts";
import { GateWeave, Grain, OpticalDevelop } from "../fx";
import { InkMelt } from "../fx/InkMelt";

const full = { width: "100%", height: "100%" } as const;

// Cartello d'atto: un solo componente per ACT-I/II/III; cosa fa dipende
// dalle props (vedi config.acts.ts).
//
// Livelli, dal basso:  nero -> [Grain] -> GateWeave { blocco con fade out:
//   testo (scala ACT_TEXT_SCALE, InkMelt) -> pigmento (III, spento)
//   -> frutti a tutto quadro (III, SOPRA il testo) -> frutto (II) }
export function ActCard(p: ActProps) {
  const f = useCurrentFrame();
  const { durationInFrames: d } = useVideoConfig();
  const last = d - 1;
  const soft = {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...acts.easing),
  } as const;

  // Fade-in del testo e fade-out comune, che arriva a 0 sull'ultimo frame.
  const textIn = interpolate(
    f,
    [p.textInStart, p.textInStart + p.textInDuration],
    [0, 1],
    soft,
  );
  const fadeOut = interpolate(f, [last - p.fadeOut, last], [1, 0], soft);

  // Inchiostro: rampa 0 -> max da ink.start a ink.end (default ultimo frame)
  const inkEnd = p.ink?.end ?? last;
  const inkProgress = p.ink
    ? interpolate(f, [p.ink.start, inkEnd], [0, 1], soft) * p.ink.max
    : 0;
  // Dissolvenza del solo testo che finisce su ink.end (solo ACT-III)
  const textOut = p.ink?.textFade
    ? interpolate(f, [inkEnd - p.ink.textFade, inkEnd], [1, 0], soft)
    : 1;

  // Testo: PNG a canvas pieno ridotto con una scala unica attorno al centro
  // del frame (ACT_TEXT_SCALE, uguale per i tre atti).
  const textSrc = staticFile(p.text);
  const scaled = (children: ReactNode) => (
    <AbsoluteFill
      style={{
        transform: `scale(${ACT_TEXT_SCALE})`,
        transformOrigin: "center",
      }}
    >
      {children}
    </AbsoluteFill>
  );
  const png = <Img src={textSrc} style={full} />;
  // Dove sta l'inchiostro rispetto alla riduzione (vedi ink.onFinalSize):
  //   onFinalSize  -> InkMelt(scale(png)): il filtro lavora sulle lettere
  //                   già ridotte (ACT-III)
  //   altrimenti   -> scale(InkMelt(png)): il filtro lavora sul PNG a piena
  //                   dimensione e poi tutto viene ridotto (ACT-II)
  const text = !p.ink ? (
    scaled(png)
  ) : p.ink.onFinalSize ? (
    <InkMelt progress={inkProgress}>{scaled(png)}</InkMelt>
  ) : (
    scaled(<InkMelt progress={inkProgress}>{png}</InkMelt>)
  );
  // Atto III, testo davanti -> dietro ai segni: il testo c'è in due copie
  // identiche, una sotto e una sopra i segni. La copia sopra è piena fino a
  // textBehind.start e sfuma a 0 entro textBehind.end: dove i segni coprono
  // le lettere, il testo passa gradualmente dietro di loro; altrove non
  // cambia nulla (le due copie coincidono).
  const front = p.field?.textBehind
    ? interpolate(
        f,
        [p.field.textBehind.start, p.field.textBehind.end],
        [1, 0],
        soft,
      )
    : 0;

  // Frutti dell'Atto III: canvas pieno (cover, senza deformarli) a scala fissa
  // (103%), affiorano dal nero con OpticalDevelop, nessuna uscita propria
  const field = p.field && (
    <OpticalDevelop duration={d} inFrames={p.field.develop} outFrames={0}>
      <Img
        src={staticFile(p.field.src)}
        style={{
          ...full,
          objectFit: "cover",
          transform: `scale(${p.field.scale})`,
        }}
      />
    </OpticalDevelop>
  );

  return (
    <AbsoluteFill style={{ background: config.colors.black }}>
      {acts.grainEnabled && <Grain />}
      <GateWeave>
        {/* isolation: il multiply del pigmento si fonde solo con questo blocco */}
        <AbsoluteFill
          style={{
            opacity: fadeOut,
            isolation: "isolate",
          }}
        >
          <AbsoluteFill style={{ opacity: textIn * textOut }}>
            {/* Inchiostro: solo sul testo; l'opacità resta quella del
                fade-in/fade-out, applicata una volta sola dai contenitori */}
            {text}
          </AbsoluteFill>

          {/* Pigmento: copia dei frutti ritagliata dalla forma delle lettere
              (mask = alpha del PNG del testo) e moltiplicata sul testo
              bianco: dove una lettera copre un frutto diventa rosso scuro. */}
          {p.field?.pigment && (
            <AbsoluteFill
              style={{ opacity: textIn * textOut, mixBlendMode: "multiply" }}
            >
              <AbsoluteFill
                style={{
                  maskImage: `url("${textSrc}")`,
                  WebkitMaskImage: `url("${textSrc}")`,
                  // stessa scala e centro del layer testo
                  maskSize: `${ACT_TEXT_SCALE * 100}% ${ACT_TEXT_SCALE * 100}%`,
                  WebkitMaskSize: `${ACT_TEXT_SCALE * 100}% ${ACT_TEXT_SCALE * 100}%`,
                  maskPosition: "center",
                  WebkitMaskPosition: "center",
                  maskRepeat: "no-repeat",
                  WebkitMaskRepeat: "no-repeat",
                  maskMode: "alpha",
                }}
              >
                {field}
              </AbsoluteFill>
            </AbsoluteFill>
          )}

          {/* Frutti dell'Atto III SOPRA il testo: lo coprono dove si
              sovrappongono, e il testo svanisce sotto di loro */}
          {field}

          {/* Copia del testo DAVANTI ai segni (Atto III), finché front > 0 */}
          {front > 0 && (
            <AbsoluteFill style={{ opacity: textIn * textOut * front }}>
              {text}
            </AbsoluteFill>
          )}

          {p.fruit && <Fruit {...p.fruit} />}
        </AbsoluteFill>
      </GateWeave>
    </AbsoluteFill>
  );
}

// Frutto ritagliato dell'Atto II: offset dal centro, entrata graduale.
// L'uscita è il fade out del blocco: opacità = entrata x fade out del testo.
function Fruit(fr: NonNullable<ActProps["fruit"]>) {
  const f = useCurrentFrame();
  const fruitIn = interpolate(
    f,
    [fr.inStart, fr.inStart + fr.inDuration],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(...acts.easing),
    },
  );
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <Img
        src={staticFile(fr.src)}
        style={{
          width: fr.width * SCALE,
          height: "auto",
          flexShrink: 0, // non stringere il PNG se è più largo del quadro
          opacity: fruitIn,
          transform: `translate(${fr.x * SCALE}px, ${fr.y * SCALE}px) rotate(${fr.rot}deg) scale(${fr.scale})`,
        }}
      />
    </AbsoluteFill>
  );
}
