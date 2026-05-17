import React from "react";
import { Composition } from "remotion";
import { PortfolioDemo } from "./Composition";
import { loadFont as loadNewsreader } from "@remotion/google-fonts/Newsreader";
import { loadFont as loadInterTight } from "@remotion/google-fonts/InterTight";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";

// Load fonts — called at module level, Remotion waits for them before rendering
const { fontFamily: newsreader } = loadNewsreader("normal", { weights: ["400", "500", "600"] });
const { fontFamily: interTight } = loadInterTight("normal", { weights: ["400", "500", "600", "700"] });
const { fontFamily: jetbrainsMono } = loadJetBrainsMono("normal", { weights: ["400", "500"] });

// Export so scenes can use the resolved font families
export { newsreader, interTight, jetbrainsMono };

// Total frames: 2820 at 30fps ≈ 94 seconds
const TOTAL_FRAMES = 2820;
const FPS = 30;
const WIDTH = 1280;
const HEIGHT = 720;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="PortfolioDemo"
        component={PortfolioDemo}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{}}
      />
    </>
  );
};
