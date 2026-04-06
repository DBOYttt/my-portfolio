export default function MockModeBanner() {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs font-mono px-4 py-2 rounded-full backdrop-blur flex items-center gap-2 shadow-lg">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        Preview mode — edit{" "}
        <code className="bg-amber-500/20 px-1 rounded">src/lib/mock-data.ts</code>{" "}
        to customise content
      </div>
    </div>
  );
}
