// Admin dashboard — protected by middleware
// Will be replaced with full dashboard in Milestone 3

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-[#0f1117] text-slate-100 flex items-center justify-center">
      <div className="text-center">
        <p className="font-mono text-cyan-400 text-sm mb-4">admin panel</p>
        <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
        <p className="text-slate-400 text-sm">
          Admin panel scaffold — full implementation in Milestone 3.
        </p>
      </div>
    </div>
  );
}
