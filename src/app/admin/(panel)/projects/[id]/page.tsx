import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProjectForm from "@/components/admin/ProjectForm";

export default async function EditProjectPage({
  params,
}: {
  params: { id: string };
}) {
  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project) notFound();

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Edit project</h1>
        <p className="text-slate-500 font-mono text-sm mt-0.5">{project.slug}</p>
      </div>
      <ProjectForm
        initialData={{
          ...project,
          githubUrl: project.githubUrl ?? "",
          liveUrl: project.liveUrl ?? "",
          coverImage: project.coverImage ?? "",
        }}
        projectId={project.id}
      />
    </div>
  );
}
