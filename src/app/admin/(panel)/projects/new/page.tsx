import type { Metadata } from "next";
import ProjectForm from "@/components/admin/ProjectForm";

export const metadata: Metadata = { title: "New Project" };

export default function NewProjectPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">New project</h1>
      </div>
      <ProjectForm />
    </div>
  );
}
