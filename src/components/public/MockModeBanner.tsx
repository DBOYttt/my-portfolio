export default function MockModeBanner() {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div
        style={{
          background: "color-mix(in oklch, var(--accent) 10%, transparent)",
          border: "1px solid color-mix(in oklch, var(--accent) 30%, transparent)",
          color: "var(--ink-soft)",
        }}
        className="text-xs font-mono px-4 py-2 rounded-full backdrop-blur flex items-center gap-2 shadow-lg"
      >
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--accent)" }} />
        Preview mode — edit{" "}
        <code className="px-1 rounded" style={{ background: "color-mix(in oklch, var(--accent) 15%, transparent)" }}>src/lib/mock-data.ts</code>{" "}
        to customise content
      </div>
    </div>
  );
}
