"use client";

import { useProjects } from "@/hooks/useProjects";
import { Project } from "@/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

export default function Sidebar() {
  const pathname = usePathname();
  const { data } = useProjects();
  const projects: Project[] = data ?? [];

  // Separar projetos por tipo
  const githubProjects = projects.filter((p) => p.git_provider === "github");
  const gitlabProjects = projects.filter((p) => p.git_provider === "gitlab");
  const localProjects = projects.filter((p) => !p.git_provider);

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 dark:bg-slate-950 text-white shadow-xl z-50">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-5 border-b border-slate-700 dark:border-slate-800">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <span className="text-lg font-bold text-white">Router Dev</span>
          </Link>
        </div>

        {/* Theme Toggle */}
        <div className="px-5 py-3 border-b border-slate-700 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Tema</span>
            <ThemeToggle />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {/* Main navigation */}
          <Link
            href="/"
            className={`sidebar-link ${pathname === "/" ? "sidebar-link-active" : ""}`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span>Dashboard</span>
          </Link>

          <Link
            href="/projects/new"
            className={`sidebar-link ${pathname === "/projects/new" ? "sidebar-link-active" : ""}`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <span>Novo Projeto</span>
          </Link>

          <Link
            href="/settings"
            className={`sidebar-link ${pathname === "/settings" ? "sidebar-link-active" : ""}`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>Configurações</span>
          </Link>

          {/* Divider */}
          <div className="h-px bg-slate-700 dark:bg-slate-800 my-4" />

          {/* Projetos Locais */}
          {localProjects.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
                Projetos Locais
              </h3>
              <ul className="space-y-1">
                {localProjects.map((project) => (
                  <li key={project.id}>
                    <Link
                      href={`/projects/${project.id}`}
                      className={`sidebar-link text-sm ${pathname === `/projects/${project.id}` ? "sidebar-link-active" : ""}`}
                    >
                      <svg
                        className="w-4 h-4 opacity-75"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                        />
                      </svg>
                      <span className="truncate">{project.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Projetos GitHub */}
          {githubProjects.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2 flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </h3>
              <ul className="space-y-1">
                {githubProjects.map((project) => (
                  <li key={project.id}>
                    <Link
                      href={`/projects/${project.id}`}
                      className={`sidebar-link text-sm ${pathname === `/projects/${project.id}` ? "sidebar-link-active" : ""}`}
                    >
                      <svg
                        className="w-4 h-4 opacity-75"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                        />
                      </svg>
                      <span className="truncate">{project.name}</span>
                      {project.git_is_fork && (
                        <span className="text-xs text-purple-400 ml-auto">
                          Fork
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Projetos GitLab */}
          {gitlabProjects.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2 flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
                GitLab
              </h3>
              <ul className="space-y-1">
                {gitlabProjects.map((project) => (
                  <li key={project.id}>
                    <Link
                      href={`/projects/${project.id}`}
                      className={`sidebar-link text-sm ${pathname === `/projects/${project.id}` ? "sidebar-link-active" : ""}`}
                    >
                      <svg
                        className="w-4 h-4 opacity-75"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                        />
                      </svg>
                      <span className="truncate">{project.name}</span>
                      {project.git_is_fork && (
                        <span className="text-xs text-purple-400 ml-auto">
                          Fork
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Empty state */}
          {projects.length === 0 && (
            <div className="mt-6 px-3">
              <div className="bg-slate-800 dark:bg-slate-900 rounded-lg p-4 text-center">
                <p className="text-sm text-slate-400 mb-2">Nenhum projeto</p>
                <p className="text-xs text-slate-500">
                  Configure GitHub/GitLab nas configurações para importar
                  projetos
                </p>
              </div>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 dark:border-slate-800">
          <p className="text-xs text-slate-500 text-center">Router Dev v1.0</p>
        </div>
      </div>
    </aside>
  );
}
