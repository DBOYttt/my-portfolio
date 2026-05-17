import { interpolate } from "remotion";

/**
 * Returns opacity 0→1 over [start, start+duration] frames.
 */
export function fadeIn(
  frame: number,
  start: number,
  duration: number
): number {
  return interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

/**
 * Returns opacity 1→0 over [start, start+duration] frames.
 */
export function fadeOut(
  frame: number,
  start: number,
  duration: number
): number {
  return interpolate(frame, [start, start + duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

/**
 * Returns translateY value: slides up from `offset`px to 0 over duration.
 */
export function slideUp(
  frame: number,
  start: number,
  duration: number,
  offset = 40
): number {
  return interpolate(frame, [start, start + duration], [offset, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

/**
 * Returns opacity 0→1 for a list item at `index`, staggered by `itemDelay` frames.
 */
export function stagger(
  index: number,
  frame: number,
  start: number,
  itemDelay = 8,
  fadeDuration = 15
): number {
  const itemStart = start + index * itemDelay;
  return interpolate(frame, [itemStart, itemStart + fadeDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

/**
 * Clamps a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Count up from 0 to target over duration frames starting at start.
 */
export function countUp(
  frame: number,
  start: number,
  duration: number,
  target: number
): number {
  return Math.round(
    interpolate(frame, [start, start + duration], [0, target], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
}
