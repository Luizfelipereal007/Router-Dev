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
        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
          <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Carregando projetos...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Projetos</h1>
        <p className="page-description">
          Gerencie seus projetos e links de acesso
        </p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <Link href="/projects/new" className="btn btn-primary">
          <svg
            className="w-4 h-4 mr-2"
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
          Novo Projeto
        </Link>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {projects.length} projeto{projects.length !== 1 ? "s" : ""}
        </span>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <svg
            className="empty-state-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
          <h3 className="empty-state-title">Nenhum projeto cadastrado</h3>
          <p className="empty-state-description">
            Comece criando um novo projeto local ou configure suas integrações
            com GitHub/GitLab para importar seus repositórios.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/projects/new" className="btn btn-primary">
              Criar Projeto Local
            </Link>
            <Link href="/settings" className="btn btn-secondary">
              Configurar Integrações
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const getSyncStatusBadge = () => {
              if (!project.git_sync_status) return null;

              const status = project.git_sync_status;
              const colors: Record<string, string> = {
                synced: "badge-success",
                ahead: "badge-primary",
                behind: "badge-warning",
                diverged: "badge-error",
              };

              const labels: Record<string, string> = {
                synced: "Sincronizado",
                ahead: "À frente",
                behind: "Atrasado",
                diverged: "Divergente",
              };

              return (
                <span className={`badge ${colors[status] || colors.synced}`}>
                  {labels[status] || status}
                </span>
              );
            };

            const getProviderIcon = () => {
              if (project.git_provider === "github") {
                return (
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                );
              }
              if (project.git_provider === "gitlab") {
                return (
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                );
              }
              return (
                <svg
                  className="w-4 h-4"
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
              );
            };

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="card card-hover p-5 block group animate-fade-in"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {getProviderIcon()}
                    </span>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {project.name}
                    </h3>
                  </div>
                  {project.git_provider && (
                    <span className="badge badge-neutral capitalize">
                      {project.git_provider}
                    </span>
                  )}
                </div>

                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 truncate flex items-center gap-1">
                  <svg
                    className="w-4 h-4 flex-shrink-0"
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
                  <span className="truncate">{project.path}</span>
                </p>

                {project.git_repo_full_name && (
                  <div className="mb-3">
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate flex items-center gap-1">
                      <svg
                        className="w-3 h-3 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                        />
                      </svg>
                      <span>{project.git_repo_full_name}</span>
                    </p>
                    {project.git_is_fork && (
                      <span className="inline-flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 mt-1">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        Fork
                      </span>
                    )}
                  </div>
                )}

                {project.git_is_fork && (
                  <div className="flex items-center gap-2 mb-3">
                    {getSyncStatusBadge()}
                    {(project.git_ahead_count !== null &&
                      project.git_ahead_count !== undefined) ||
                    (project.git_behind_count !== null &&
                      project.git_behind_count !== undefined) ? (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {project.git_ahead_count || 0}↑{" "}
                        {project.git_behind_count || 0}↓
                      </span>
                    ) : null}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <span className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                    {project.links?.length || 0} link
                    {project.links?.length !== 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                    Acessar
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
