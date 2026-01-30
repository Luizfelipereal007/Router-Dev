"use client";

import { useProjects } from "@/hooks/useProjects";
import { Project } from "@/types";
import Link from "next/link";

export default function Home() {
  const { data, isLoading } = useProjects();
  const projects: Project[] = data ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Carregando projetos...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Projetos</h1>
      <div className="mb-4">
        <Link
          href="/projects/new"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Novo Projeto
        </Link>
      </div>
      {projects.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600 mb-4">Nenhum projeto cadastrado ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {project.name}
              </h2>
              <p className="text-sm text-gray-600 mb-4 truncate">{project.path}</p>
              <p className="text-sm text-gray-500">
                {project.links?.length || 0} link(s)
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
