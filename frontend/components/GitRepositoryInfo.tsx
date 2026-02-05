"use client";

import { Project } from "@/types";
import { useEffect, useState } from "react";

interface ErrorResponse {
  error?: string;
}

type GitRepositoryInfoProps = {
  project: Project;
  onUnlink: () => void;
};

export default function GitRepositoryInfo({
  project,
  onUnlink,
}: GitRepositoryInfoProps) {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState(
    project.git_default_branch || "main",
  );
  const [availableBranches, setAvailableBranches] = useState<string[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  // Estados locais para o status de sincronização do fork
  const [syncStatus, setSyncStatus] = useState(project.git_sync_status || null);
  const [aheadCount, setAheadCount] = useState(project.git_ahead_count || 0);
  const [behindCount, setBehindCount] = useState(project.git_behind_count || 0);

  const loadBranches = async () => {
    if (!project.git_provider || !project.git_repo_id) {
      setError("Projeto não está vinculado a um repositório Git válido.");
      return;
    }

    setLoadingBranches(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        provider: project.git_provider,
      });

      const response = await fetch(
        `/api/git/repositories/${project.id}/branches?${params.toString()}`,
      );

      if (!response.ok) {
        const errorData = (await response
          .json()
          .catch(() => ({}))) as ErrorResponse;
        throw new Error(
          errorData.error || "Erro ao carregar branches do repositório",
        );
      }

      const data = (await response.json()) as { branches?: string[] };
      const branches = data.branches ?? [];
      setAvailableBranches(branches);

      if (branches.length > 0 && !branches.includes(selectedBranch)) {
        setSelectedBranch(branches[0]);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar branches",
      );
    } finally {
      setLoadingBranches(false);
    }
  };

  useEffect(() => {
    if (project.git_is_fork) {
      // Carrega branches automaticamente ao abrir um fork
      void loadBranches();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id, project.git_is_fork]);

  const handleCheckStatus = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/git/repositories/${project.id}/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            branch: selectedBranch,
          }),
        },
      );

      if (!response.ok) {
        const errorData = (await response
          .json()
          .catch(() => ({}))) as ErrorResponse;
        throw new Error(
          errorData.error || "Erro ao verificar status do repositório",
        );
      }

      const data = await response.json();

      // Atualiza os estados locais com os dados retornados pela API
      if (data.compareResult) {
        setSyncStatus(data.compareResult.status);
        setAheadCount(data.compareResult.ahead_by || 0);
        setBehindCount(data.compareResult.behind_by || 0);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao verificar status");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncFork = async () => {
    if (!project.git_is_fork) {
      setError("Este repositório não é um fork");
      return;
    }

    setSyncing(true);
    setError(null);

    try {
      const response = await fetch(`/api/git/repositories/${project.id}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branch: selectedBranch,
        }),
      });

      if (!response.ok) {
        const errorData = (await response
          .json()
          .catch(() => ({}))) as ErrorResponse;
        throw new Error(
          errorData.error || "Erro ao sincronizar fork com o original",
        );
      }

      alert("Sincronização iniciada! Verifique o repositório.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao sincronizar fork");
    } finally {
      setSyncing(false);
    }
  };

  const getSyncStatusBadge = () => {
    if (!syncStatus) return null;

    const status = syncStatus;
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
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    );
  };

  return (
    <div className="card mb-6">
      <div className="p-5 border-b border-slate-200">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${project.git_provider === "github" ? "bg-slate-900" : "bg-orange-500"}`}
            >
              <span className="text-white">{getProviderIcon()}</span>
            </div>
            <div>
              <h3 className="section-title">Repositório Git</h3>
              <p className="text-sm text-slate-500 capitalize">
                {project.git_provider}
              </p>
            </div>
          </div>
          <button
            onClick={onUnlink}
            className="btn btn-ghost text-sm text-red-600 hover:bg-red-50"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
              />
            </svg>
            Desvincular
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm font-medium text-slate-500">
              Repositório
            </span>
            <a
              href={project.git_repo_url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 hover:underline flex items-center gap-1 mt-1"
            >
              <span>{project.git_repo_full_name}</span>
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
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>

          <div>
            <span className="text-sm font-medium text-slate-500">
              Branch padrão
            </span>
            <p className="text-sm text-slate-900 mt-1">
              {project.git_default_branch}
            </p>
          </div>
        </div>

        {project.git_is_fork && (
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <span className="badge badge-neutral">Fork</span>
              {getSyncStatusBadge()}
              {(syncStatus !== null && syncStatus !== undefined) ||
              (aheadCount !== null && aheadCount !== undefined) ||
              (behindCount !== null && behindCount !== undefined) ? (
                <span className="text-sm text-slate-600">
                  {aheadCount} commits à frente, {behindCount} atrás
                </span>
              ) : null}
            </div>

            <div className="space-y-3">
              <div>
                <label className="label">Branch para sincronização</label>
                <div className="flex gap-2">
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="input flex-1"
                  >
                    {availableBranches.length > 0 ? (
                      availableBranches.map((branch) => (
                        <option key={branch} value={branch}>
                          {branch}
                        </option>
                      ))
                    ) : (
                      <option value={selectedBranch}>{selectedBranch}</option>
                    )}
                  </select>
                  <button
                    onClick={loadBranches}
                    disabled={loadingBranches}
                    className="btn btn-secondary"
                  >
                    {loadingBranches ? "Carregando..." : "Atualizar"}
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCheckStatus}
                  disabled={loading}
                  className="btn btn-secondary"
                >
                  {loading ? "Verificando..." : "Verificar Status"}
                </button>
                <button
                  onClick={handleSyncFork}
                  disabled={syncing}
                  className="btn btn-primary"
                >
                  {syncing ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
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
                      Sincronizando...
                    </>
                  ) : (
                    "Sincronizar Fork"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {project.git_last_commit_sha && (
          <div className="pt-4 border-t border-slate-200">
            <span className="text-sm font-medium text-slate-500">
              Último commit
            </span>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono text-slate-700">
                {project.git_last_commit_sha.substring(0, 7)}
              </code>
              {project.git_last_commit_message && (
                <span className="text-sm text-slate-600">
                  - {project.git_last_commit_message.substring(0, 50)}
                  {project.git_last_commit_message.length > 50 ? "..." : ""}
                </span>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
