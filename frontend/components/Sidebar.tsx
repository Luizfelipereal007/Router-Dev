"use client";

import { useProjects } from "@/hooks/useProjects";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  const { data } = useProjects();
  const projects = data ?? [];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white shadow-lg overflow-y-auto">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Router Dev</h1>
        <nav>
          <Link
            href="/"
            className={`block py-2 px-4 rounded mb-2 ${
              pathname === "/"
                ? "bg-blue-600 text-white"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            Home
          </Link>
          <Link
            href="/projects/new"
            className={`block py-2 px-4 rounded mb-4 ${
              pathname === "/projects/new"
                ? "bg-blue-600 text-white"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            + Novo Projeto
          </Link>
          <div className="mt-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase mb-2 px-4">
              Projetos
            </h2>
            {projects.length === 0 ? (
              <p className="text-sm text-gray-500 px-4">Nenhum projeto</p>
            ) : (
              <ul>
                {projects.map((project) => (
                  <li key={project.id}>
                    <Link
                      href={`/projects/${project.id}`}
                      className={`block py-2 px-4 rounded ${
                        pathname === `/projects/${project.id}`
                          ? "bg-blue-600 text-white"
                          : "text-gray-300 hover:bg-gray-800"
                      }`}
                    >
                      {project.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </nav>
      </div>
    </aside>
  );
}
