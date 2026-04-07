import Link from "next/link";
import Nav from "@/components/public/Nav";
import Footer from "@/components/public/Footer";

export default function BlogPostNotFound() {
  return (
    <>
      <Nav />
      <main className="min-h-screen pt-24 pb-16 flex items-center">
        <div className="section-container text-center">
          <p className="font-mono text-cyan-400 text-sm mb-4">404</p>
          <h1 className="text-2xl font-bold text-slate-100 mb-4">Post not found</h1>
          <Link
            href="/blog"
            className="font-mono text-sm text-slate-500 hover:text-cyan-400 transition-colors"
          >
            ← Back to blog
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
