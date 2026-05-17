import React from "react";
import { Composition } from "remotion";
import { PortfolioDemo } from "./Composition";

// Total frames: 1570 at 30fps ≈ 52.3 seconds
const TOTAL_FRAMES = 1570;
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
