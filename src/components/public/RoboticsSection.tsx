const highlights = [
  {
    icon: "🤖",
    title: "Autonomous Systems",
    description:
      "Designed and built mobile robot platforms with autonomous navigation using ROS2, SLAM, and sensor fusion.",
  },
  {
    icon: "⚡",
    title: "Embedded Development",
    description:
      "Low-level firmware development on STM32 and Arduino platforms. Real-time systems with FreeRTOS.",
  },
  {
    icon: "👁️",
    title: "Computer Vision",
    description:
      "Integrated OpenCV pipelines for object detection and tracking in real-time robotic applications.",
  },
  {
    icon: "🔧",
    title: "Hardware Integration",
    description:
      "End-to-end hardware/software co-design: PCB selection, sensor calibration, actuator control.",
  },
];

export default function RoboticsSection() {
  return (
    <section id="robotics" className="py-24 border-t border-[#2a2d3a]">
      {/* Slightly different background to visually separate the section */}
      <div className="bg-[#1a1d27]/50">
        <div className="section-container py-16">
          <div className="mb-12">
            <p className="font-mono text-cyan-400 text-sm mb-2">
              engineering showcase
            </p>
            <h2 className="section-heading">Robotics & Hardware</h2>
            <div className="accent-line" />
            <p className="text-slate-400 max-w-2xl leading-relaxed">
              Software engineering and robotics aren&apos;t separate disciplines
              for me. I work across the full stack — from firmware to
              high-level planning algorithms — because real systems require
              coherence at every layer.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {highlights.map((item) => (
              <div key={item.title} className="card">
                <div className="text-2xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-slate-100 mb-2">
                  {item.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          {/* Placeholder for future robotics gallery */}
          <div className="mt-10 p-6 border border-dashed border-[#2a2d3a] rounded-xl text-center">
            <p className="text-slate-600 font-mono text-sm">
              // Project gallery and build logs coming soon
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
