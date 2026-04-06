import type { Metadata } from "next";
import Nav from "@/components/public/Nav";
import Footer from "@/components/public/Footer";

export const metadata: Metadata = {
  title: "Blog",
  description: "Technical writing on software engineering, robotics, and systems.",
};

export default function BlogPage() {
  return (
    <>
      <Nav />
      <main className="min-h-screen pt-24 pb-16">
        <div className="section-container">
          <h1 className="section-heading">Blog</h1>
          <div className="accent-line" />
          <p className="text-slate-400 mb-12">
            Technical writing on software engineering, embedded systems, and robotics.
          </p>

          {/* Placeholder — will be populated from DB in Milestone 3 */}
          <div className="border border-dashed border-[#2a2d3a] rounded-xl p-12 text-center">
            <p className="text-slate-600 font-mono text-sm">
              // Blog posts coming soon — admin panel in Milestone 3
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
