"use client";

import { useMemo } from "react";

function seedRand(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 10000) / 10000;
  };
}

// All path data computed inside useMemo to ensure SSR/hydration consistency.

export function HandRule({
  seed = "rule",
  thickness = 1.2,
  color,
  dashed = false,
  style,
}: {
  seed?: string;
  thickness?: number;
  color?: string;
  dashed?: boolean;
  style?: React.CSSProperties;
}) {
  const d = useMemo(() => {
    const rand = seedRand(seed);
    const W = 1000, H = 14, segments = 4;
    const ys = Array.from({ length: segments + 1 }, () => 7 + (rand() - 0.5) * 3.2);
    let path = `M 2 ${ys[0].toFixed(2)}`;
    for (let i = 1; i <= segments; i++) {
      const x = (i / segments) * (W - 4) + 2;
      const cx1 = ((i - 1 + 0.33) / segments) * (W - 4) + 2;
      const cx2 = ((i - 1 + 0.66) / segments) * (W - 4) + 2;
      const cy1 = ys[i - 1] + (rand() - 0.5) * 1.5;
      const cy2 = ys[i] + (rand() - 0.5) * 1.5;
      path += ` C ${cx1.toFixed(1)} ${cy1.toFixed(2)}, ${cx2.toFixed(1)} ${cy2.toFixed(2)}, ${x.toFixed(1)} ${ys[i].toFixed(2)}`;
    }
    return path;
  }, [seed]);

  return (
    <svg
      className="hr-hand"
      viewBox="0 0 1000 14"
      preserveAspectRatio="none"
      style={style}
      aria-hidden="true"
    >
      <path
        suppressHydrationWarning
        d={d}
        fill="none"
        stroke={color || "currentColor"}
        strokeWidth={thickness}
        strokeLinecap="round"
        strokeDasharray={dashed ? "6 5" : undefined}
        opacity="0.78"
      />
    </svg>
  );
}

export function HandUnderline({
  seed = "u",
  color,
  thickness = 1.6,
}: {
  seed?: string;
  color?: string;
  thickness?: number;
}) {
  const d = useMemo(() => {
    const rand = seedRand(seed);
    const W = 200;
    const ys = [
      4 + (rand() - 0.5) * 2,
      5 + (rand() - 0.5) * 2,
      4.5 + (rand() - 0.5) * 2,
      5 + (rand() - 0.5) * 2,
    ];
    return (
      `M 2 ${ys[0].toFixed(2)} ` +
      `Q ${(W * 0.33).toFixed(0)} ${ys[1].toFixed(2)}, ${(W * 0.5).toFixed(0)} ${ys[2].toFixed(2)} ` +
      `T ${W - 2} ${ys[3].toFixed(2)}`
    );
  }, [seed]);

  return (
    <svg
      className="underline-svg"
      viewBox="0 0 200 8"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        suppressHydrationWarning
        d={d}
        fill="none"
        stroke={color || "currentColor"}
        strokeWidth={thickness}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function HandArrow({
  seed = "a",
  angle = 0,
  length = 60,
  color,
  thickness = 1.4,
  style,
}: {
  seed?: string;
  angle?: number;
  length?: number;
  color?: string;
  thickness?: number;
  style?: React.CSSProperties;
}) {
  const d = useMemo(() => {
    const rand = seedRand(seed);
    const W = length, H = 24;
    const y0 = H / 2 + (rand() - 0.5) * 1.5;
    const y1 = H / 2 + (rand() - 0.5) * 2;
    const y2 = H / 2 + (rand() - 0.5) * 1.5;
    const tipX = W - 4;
    const ah = 6 + rand() * 1.5;
    return (
      `M 2 ${y0.toFixed(2)} ` +
      `Q ${(W * 0.5).toFixed(0)} ${y1.toFixed(2)}, ${tipX} ${y2.toFixed(2)} ` +
      `M ${tipX} ${y2.toFixed(2)} L ${(tipX - ah).toFixed(1)} ${(y2 - ah * 0.7).toFixed(2)} ` +
      `M ${tipX} ${y2.toFixed(2)} L ${(tipX - ah).toFixed(1)} ${(y2 + ah * 0.7).toFixed(2)}`
    );
  }, [seed, length]);

  return (
    <svg
      viewBox={`0 0 ${length} 24`}
      width={length}
      height={24}
      style={{ transform: `rotate(${angle}deg)`, ...style }}
      aria-hidden="true"
    >
      <path
        suppressHydrationWarning
        d={d}
        fill="none"
        stroke={color || "currentColor"}
        strokeWidth={thickness}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HandCheck({
  size = 18,
  color,
  thickness = 1.6,
  style,
}: {
  size?: number;
  color?: string;
  thickness?: number;
  style?: React.CSSProperties;
}) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={style} aria-hidden="true">
      <path
        d="M 3.5 13 Q 6 14.5, 9 18.5 Q 13 12, 21 4.5"
        fill="none"
        stroke={color || "currentColor"}
        strokeWidth={thickness}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HandBracket({
  children,
  seed = "b",
  color,
  thickness = 1.4,
  padding = 6,
  style,
  className,
}: {
  children: React.ReactNode;
  seed?: string;
  color?: string;
  thickness?: number;
  padding?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  const pathD = useMemo(() => {
    const rand = seedRand(seed);
    const w = () => (rand() - 0.5) * 2;
    return `M ${2 + w()} ${2 + w()} L ${98 + w()} ${1 + w()} L ${99 + w()} ${39 + w()} L ${1 + w()} ${38 + w()} Z`;
  }, [seed]);

  return (
    <span
      className={className}
      style={{ position: "relative", display: "inline-block", padding: `${padding}px ${padding + 4}px`, ...style }}
    >
      <svg
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          color: color || "currentColor",
          pointerEvents: "none",
        }}
        aria-hidden="true"
      >
        <path
          suppressHydrationWarning
          d={pathD}
          fill="none"
          stroke="currentColor"
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          opacity="0.85"
        />
      </svg>
      <span style={{ position: "relative" }}>{children}</span>
    </span>
  );
}

export function SketchPlaceholder({
  label = "Placeholder",
  topLeft = "DWG-001",
  topRight = "REV. A",
  bottomRight = "1:1",
  aspect = "4 / 3",
  children,
  style,
}: {
  label?: string;
  topLeft?: string;
  topRight?: string;
  bottomRight?: string;
  aspect?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div className="sketch-frame" style={{ aspectRatio: aspect, ...style }}>
      <span className="corner c-tl">{topLeft}</span>
      <span className="corner c-tr">{topRight}</span>
      <span className="corner c-br">{bottomRight}</span>
      {children}
      <span className="label">{label}</span>
    </div>
  );
}

export function SectionHead({
  num,
  kicker,
  title,
  meta,
  sub,
}: {
  num: string;
  kicker: string;
  title: React.ReactNode;
  meta?: string;
  sub?: string;
}) {
  return (
    <header className="logbook-row" style={{ marginBottom: 24 }}>
      <aside className="margin">
        <span className="num">§ {num}</span>
        <span>{kicker}</span>
        {meta ? <span className="meta">{meta}</span> : null}
      </aside>
      <div>
        <h2 className="section-title">{title}</h2>
        {sub ? (
          <p style={{ maxWidth: "60ch", fontSize: 17, color: "var(--ink-soft)" }}>{sub}</p>
        ) : null}
        <div style={{ height: 22 }} />
        <HandRule seed={`rule-${num}`} />
      </div>
    </header>
  );
}
