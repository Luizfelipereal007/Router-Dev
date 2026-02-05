"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type GitConfig = {
  provider: "github" | "gitlab";
  hasToken: boolean;
  tokenPreview?: string | null;
  gitlab_url?: string | null;
  username?: string | null;
  updated_at?: string;
};

export default function SettingsPage() {
  const router = useRouter();
  const [configs, setConfigs] = useState<GitConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [githubToken, setGithubToken] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [gitlabToken, setGitlabToken] = useState("");
  const [gitlabUrl, setGitlabUrl] = useState("https://gitlab.com");
  const [gitlabUsername, setGitlabUsername] = useState("");

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/git/config");
      if (response.ok) {
        const data = await response.json();
        setConfigs(data);

        // Preencher campos se já existir configuração
        const githubConfig = data.find(
          (c: GitConfig) => c.provider === "github",
        );
        const gitlabConfig = data.find(
          (c: GitConfig) => c.provider === "gitlab",
        );

        if (githubConfig) {
          setGithubUsername(githubConfig.username || "");
        }
        if (gitlabConfig) {
          setGitlabUrl(gitlabConfig.gitlab_url || "https://gitlab.com");
          setGitlabUsername(gitlabConfig.username || "");
        }
      }
    } catch {
      setError("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGithub = async () => {
    if (!githubToken) {
      setError("Token do GitHub é obrigatório");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/git/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "github",
          token: githubToken,
          username: githubUsername,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao salvar configuração");
      }

      setSuccess("Configuração do GitHub salva com sucesso!");
      setGithubToken("");

      // Link the account
      if (githubUsername) {
        try {
          await fetch("/api/user/linked-accounts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              provider: "github",
              provider_username: githubUsername,
            }),
          });
        } catch (e) {
          console.error("Error linking GitHub account:", e);
        }
      }

      await loadConfigs();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Erro ao salvar configuração",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGitlab = async () => {
    if (!gitlabToken) {
      setError("Token do GitLab é obrigatório");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/git/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "gitlab",
          token: gitlabToken,
          gitlabUrl: gitlabUrl,
          username: gitlabUsername,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao salvar configuração");
      }

      setSuccess("Configuração do GitLab salva com sucesso!");
      setGitlabToken("");

      // Link the account
      if (gitlabUsername) {
        try {
          await fetch("/api/user/linked-accounts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              provider: "gitlab",
              provider_username: gitlabUsername,
            }),
          });
        } catch (e) {
          console.error("Error linking GitLab account:", e);
        }
      }

      await loadConfigs();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Erro ao salvar configuração",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (provider: "github" | "gitlab") => {
    if (
      !confirm(`Tem certeza que deseja remover a configuração do ${provider}?`)
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/git/config?provider=${provider}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erro ao remover configuração");
      }

      // Remove all linked accounts for this provider
      try {
        await fetch(`/api/user/linked-accounts?provider=${provider}`, {
          method: "DELETE",
        });
      } catch (e) {
        console.error("Error removing linked accounts:", e);
      }

      setSuccess(`Configuração do ${provider} removida com sucesso!`);
      await loadConfigs();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Erro ao remover configuração",
      );
    }
  };

  const handleImport = async (
    provider: "github" | "gitlab",
    importForks: boolean,
  ) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/git/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          importForks,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao importar repositórios");
      }

      const data = await response.json();
      setSuccess(
        `Importação concluída! ${data.imported} novos projetos importados, ${data.updated} atualizados.`,
      );
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Erro ao importar repositórios",
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading && configs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-slate-600">
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
          <span>Carregando configurações...</span>
        </div>
      </div>
    );
  }

  const githubConfig = configs.find((c) => c.provider === "github");
  const gitlabConfig = configs.find((c) => c.provider === "gitlab");

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="btn btn-secondary p-2"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>
          <div>
            <h1 className="page-title">Configurações</h1>
            <p className="page-description">
              Configure suas integrações com GitHub e GitLab
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-3">
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-3">
          <svg
            className="w-5 h-5 flex-shrink-0"
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
          {success}
        </div>
      )}

      {/* GitHub */}
      <div className="card mb-6">
        <div className="p-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </div>
            <div>
              <h2 className="section-title">GitHub</h2>
              <p className="text-sm text-slate-500">
                Configure sua integração com GitHub
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          {githubConfig && (
            <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <svg
                  className="w-5 h-5 text-emerald-600"
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
                <span className="font-medium text-slate-900">Configurado</span>
              </div>
              <p className="text-sm text-slate-600">
                <span className="font-medium">Token:</span>{" "}
                {githubConfig.tokenPreview || "••••••••"}
              </p>
              {githubConfig.username && (
                <p className="text-sm text-slate-600">
                  <span className="font-medium">Usuário:</span>{" "}
                  {githubConfig.username}
                </p>
              )}
              <p className="text-xs text-slate-500 mt-2">
                Atualizado em:{" "}
                {new Date(githubConfig.updated_at || "").toLocaleString(
                  "pt-BR",
                )}
              </p>
              <button
                onClick={() => handleDelete("github")}
                className="mt-3 text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
              >
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Remover configuração
              </button>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="label">Personal Access Token</label>
              <input
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="ghp_..."
                className="input"
              />
              <p className="text-xs text-slate-500 mt-1">
                Crie um token em{" "}
                <a
                  href="https://github.com/settings/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline"
                >
                  github.com/settings/tokens
                </a>{" "}
                com permissões de repositório
              </p>
            </div>

            <div>
              <label className="label">Usuário (opcional)</label>
              <input
                type="text"
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                placeholder="seu-usuario"
                className="input"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleSaveGithub}
                disabled={saving || !githubToken}
                className="btn btn-primary"
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
              {githubConfig && (
                <button
                  onClick={() => handleImport("github", true)}
                  disabled={loading}
                  className="btn btn-secondary"
                >
                  {loading ? "Importando..." : "Importar (com forks)"}
                </button>
              )}
              {githubConfig && (
                <button
                  onClick={() => handleImport("github", false)}
                  disabled={loading}
                  className="btn btn-secondary"
                >
                  {loading ? "Importando..." : "Importar (sem forks)"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* GitLab */}
      <div className="card">
        <div className="p-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
            <div>
              <h2 className="section-title">GitLab</h2>
              <p className="text-sm text-slate-500">
                Configure sua integração com GitLab
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          {gitlabConfig && (
            <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <svg
                  className="w-5 h-5 text-emerald-600"
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
                <span className="font-medium text-slate-900">Configurado</span>
              </div>
              <p className="text-sm text-slate-600">
                <span className="font-medium">Token:</span>{" "}
                {gitlabConfig.tokenPreview || "••••••••"}
              </p>
              {gitlabConfig.username && (
                <p className="text-sm text-slate-600">
                  <span className="font-medium">Usuário:</span>{" "}
                  {gitlabConfig.username}
                </p>
              )}
              {gitlabConfig.gitlab_url && (
                <p className="text-sm text-slate-600">
                  <span className="font-medium">URL:</span>{" "}
                  {gitlabConfig.gitlab_url}
                </p>
              )}
              <p className="text-xs text-slate-500 mt-2">
                Atualizado em:{" "}
                {new Date(gitlabConfig.updated_at || "").toLocaleString(
                  "pt-BR",
                )}
              </p>
              <button
                onClick={() => handleDelete("gitlab")}
                className="mt-3 text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
              >
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Remover configuração
              </button>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="label">Personal Access Token</label>
              <input
                type="password"
                value={gitlabToken}
                onChange={(e) => setGitlabToken(e.target.value)}
                placeholder="glpat-..."
                className="input"
              />
              <p className="text-xs text-slate-500 mt-1">
                Crie um token em{" "}
                <a
                  href="https://gitlab.com/-/user_settings/personal_access_tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline"
                >
                  gitlab.com/-/user_settings/personal_access_tokens
                </a>{" "}
                com escopo API
              </p>
            </div>

            <div>
              <label className="label">URL do GitLab (opcional)</label>
              <input
                type="text"
                value={gitlabUrl}
                onChange={(e) => setGitlabUrl(e.target.value)}
                placeholder="https://gitlab.com"
                className="input"
              />
              <p className="text-xs text-slate-500 mt-1">
                Deixe em branco ou use https://gitlab.com para GitLab.com
              </p>
            </div>

            <div>
              <label className="label">Usuário (opcional)</label>
              <input
                type="text"
                value={gitlabUsername}
                onChange={(e) => setGitlabUsername(e.target.value)}
                placeholder="seu-usuario"
                className="input"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleSaveGitlab}
                disabled={saving || !gitlabToken}
                className="btn btn-primary"
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
              {gitlabConfig && (
                <button
                  onClick={() => handleImport("gitlab", true)}
                  disabled={loading}
                  className="btn btn-secondary"
                >
                  {loading ? "Importando..." : "Importar (com forks)"}
                </button>
              )}
              {gitlabConfig && (
                <button
                  onClick={() => handleImport("gitlab", false)}
                  disabled={loading}
                  className="btn btn-secondary"
                >
                  {loading ? "Importando..." : "Importar (sem forks)"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
