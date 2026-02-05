"use client";

import { GitRepository, Project } from "@/types";
import { useEffect, useState } from "react";

type GitProviderConfig = {
  provider: string;
  hasToken: boolean;
  tokenPreview: string | null;
  gitlab_url: string | null;
  username: string | null;
  updated_at: string | null;
};

type GitRepositoryFormProps = {
  project: Project;
  onSuccess: () => void;
  onCancel: () => void;
};

export default function GitRepositoryForm({
  project,
  onSuccess,
  onCancel,
}: GitRepositoryFormProps) {
  const [provider, setProvider] = useState<"github" | "gitlab">("github");
  const [token, setToken] = useState("");
  const [gitlabUrl, setGitlabUrl] = useState("https://gitlab.com");
  const [repositories, setRepositories] = useState<GitRepository[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<GitRepository | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasConfig, setHasConfig] = useState(false);

  useEffect(() => {
    checkConfig(provider);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  // Verificar se já existe configuração ao mudar provider
  const checkConfig = async (prov: "github" | "gitlab") => {
    try {
      const response = await fetch("/api/git/config");
      if (response.ok) {
        const configs = (await response.json()) as GitProviderConfig[];
        const config = configs.find((c) => c.provider === prov);
        if (config && config.hasToken) {
          setHasConfig(true);
          // Buscar token completo
          const tokenRes = await fetch(
            `/api/git/config/token?provider=${prov}`,
          );
          if (tokenRes.ok) {
            const { token: savedToken, gitlab_url } = await tokenRes.json();
            setToken(savedToken);
            if (prov === "gitlab" && gitlab_url) {
              setGitlabUrl(gitlab_url);
            }
          }
        } else {
          setHasConfig(false);
          setToken("");
        }
      }
    } catch {
      setHasConfig(false);
    }
  };

  const loadRepositories = async () => {
    if (!token) {
      setError(
        "Token é obrigatório. Configure nas configurações ou informe abaixo.",
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        provider,
        token,
      });

      if (provider === "gitlab" && gitlabUrl) {
        params.append("gitlabUrl", gitlabUrl);
      }

      const response = await fetch(`/api/git/repositories?${params}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao carregar repositórios");
      }

      const repos = await response.json();
      setRepositories(repos);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar repositórios",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLinkRepository = async () => {
    if (!selectedRepo || !token) {
      setError("Selecione um repositório e informe o token");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const repoId =
        provider === "github"
          ? selectedRepo.id.toString()
          : selectedRepo.path_with_namespace || selectedRepo.id.toString();
      const repoFullName =
        provider === "github"
          ? selectedRepo.full_name!
          : selectedRepo.path_with_namespace!;
      const repoUrl =
        provider === "github" ? selectedRepo.html_url! : selectedRepo.web_url!;

      const response = await fetch(`/api/projects/${project.id}/git`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          repoId,
          repoFullName,
          repoUrl,
          token,
          gitlabUrl: provider === "gitlab" ? gitlabUrl : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao vincular repositório");
      }

      onSuccess();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Erro ao vincular repositório",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
          <svg
            className="w-5 h-5 text-indigo-600"
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
        </div>
        <div>
          <h3 className="section-title">Vincular Repositório Git</h3>
          <p className="text-sm text-slate-500">
            Selecione um repositório para vincular
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="label">Provedor</label>
          <select
            value={provider}
            onChange={(e) => {
              setProvider(e.target.value as "github" | "gitlab");
              setRepositories([]);
              setSelectedRepo(null);
            }}
            className="input"
          >
            <option value="github">GitHub</option>
            <option value="gitlab">GitLab</option>
          </select>
        </div>

        {provider === "gitlab" && (
          <div>
            <label className="label">URL do GitLab (opcional)</label>
            <input
              type="text"
              value={gitlabUrl}
              onChange={(e) => setGitlabUrl(e.target.value)}
              placeholder="https://gitlab.com"
              className="input"
            />
          </div>
        )}

        {hasConfig ? (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-sm text-emerald-700 flex items-center gap-2">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Token configurado nas configurações. Você pode usar o token salvo
              ou informar um novo abaixo.
            </p>
          </div>
        ) : (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-700 flex items-center gap-2">
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
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              Token não configurado. Configure nas{" "}
              <a href="/settings" className="text-indigo-600 hover:underline">
                configurações
              </a>{" "}
              ou informe abaixo.
            </p>
          </div>
        )}

        <div>
          <label className="label">
            Token de Acesso {hasConfig && "(opcional - já configurado)"}
          </label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder={provider === "github" ? "ghp_..." : "glpat-..."}
            className="input"
          />
          <p className="text-xs text-slate-500 mt-1">
            {provider === "github"
              ? "GitHub Personal Access Token (com permissões de repositório)"
              : "GitLab Personal Access Token (com permissões de API)"}
          </p>
        </div>

        <button
          onClick={loadRepositories}
          disabled={loading || !token}
          className="btn btn-secondary"
        >
          {loading ? (
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
              Carregando...
            </>
          ) : (
            "Carregar Repositórios"
          )}
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {repositories.length > 0 && (
          <div>
            <label className="label">Selecione um Repositório</label>
            <select
              value={selectedRepo?.id || ""}
              onChange={(e) => {
                const repo = repositories.find(
                  (r) => r.id.toString() === e.target.value,
                );
                setSelectedRepo(repo || null);
              }}
              className="input"
            >
              <option value="">Selecione...</option>
              {repositories.map((repo) => (
                <option key={repo.id} value={repo.id}>
                  {provider === "github"
                    ? repo.full_name
                    : repo.path_with_namespace}
                  {repo.fork || repo.forked_from_project ? " (Fork)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleLinkRepository}
            disabled={loading || !selectedRepo}
            className="btn btn-primary"
          >
            {loading ? (
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
                Vinculando...
              </>
            ) : (
              <>
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
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                Vincular
              </>
            )}
          </button>
          <button onClick={onCancel} className="btn btn-secondary">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
