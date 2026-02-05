import { getDb } from "@/lib/db";
import { GitHubService } from "@/lib/github";
import { GitLabService } from "@/lib/gitlab";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { provider, importForks = true } = body;

  if (!provider || (provider !== "github" && provider !== "gitlab")) {
    return NextResponse.json(
      { error: "Provider inválido" },
      { status: 400 }
    );
  }

  // Buscar token do banco
  const db = getDb();
  const config = db
    .prepare("SELECT token, gitlab_url FROM git_config WHERE provider = ?")
    .get(provider) as { token: string; gitlab_url: string | null } | undefined;

  if (!config) {
    return NextResponse.json(
      { error: "Token não configurado. Configure nas configurações primeiro." },
      { status: 400 }
    );
  }

  const { token, gitlab_url } = config;

  try {
    let repositories: any[] = [];

    if (provider === "github") {
      const github = new GitHubService(token);
      const repos = await github.listRepositories();
      repositories = repos.map((repo) => ({
        id: repo.id.toString(),
        name: repo.name,
        full_name: repo.full_name,
        url: repo.html_url,
        default_branch: repo.default_branch,
        is_fork: repo.fork,
        fork_of: repo.parent ? {
          full_name: repo.parent.full_name,
          url: repo.parent.html_url,
          default_branch: repo.parent.default_branch,
        } : null,
        updated_at: repo.updated_at,
      }));
    } else {
      const gitlab = new GitLabService(token, gitlab_url || "https://gitlab.com");
      const repos = await gitlab.listRepositories();
      repositories = repos.map((repo) => ({
        id: repo.id.toString(),
        name: repo.name,
        full_name: repo.path_with_namespace,
        url: repo.web_url,
        default_branch: repo.default_branch,
        is_fork: !!repo.forked_from_project,
        fork_of: repo.forked_from_project ? {
          full_name: repo.forked_from_project.path_with_namespace,
          url: repo.forked_from_project.web_url,
          default_branch: repo.forked_from_project.default_branch,
        } : null,
        updated_at: repo.last_activity_at,
      }));
    }

    // Filtrar forks se necessário
    if (!importForks) {
      repositories = repositories.filter((repo) => !repo.is_fork);
    }

    let imported = 0;
    let updated = 0;

    for (const repo of repositories) {
      // Verificar se já existe projeto com este repositório
      const existing = db
        .prepare("SELECT id FROM projects WHERE git_provider = ? AND git_repo_id = ?")
        .get(provider, repo.id) as { id: number } | undefined;

      if (existing) {
        // Atualizar informações
        db.prepare(`
          UPDATE projects SET
            git_repo_full_name = ?,
            git_repo_url = ?,
            git_is_fork = ?,
            git_fork_of_full_name = ?,
            git_fork_of_url = ?,
            git_default_branch = ?
          WHERE id = ?
        `).run(
          repo.full_name,
          repo.url,
          repo.is_fork ? 1 : 0,
          repo.fork_of?.full_name || null,
          repo.fork_of?.url || null,
          repo.default_branch,
          existing.id
        );
        updated++;
      } else {
        // Criar novo projeto
        // Tentar obter informações do último commit
        let lastCommit: any = null;
        try {
          if (provider === "github") {
            const github = new GitHubService(token);
            lastCommit = await github.getLastCommit(repo.full_name, repo.default_branch);
          } else {
            const gitlab = new GitLabService(token, gitlab_url || "https://gitlab.com");
            lastCommit = await gitlab.getLastCommit(repo.id, repo.default_branch);
          }
        } catch (error) {
          // Ignora erro ao buscar commit
        }

        const result = db.prepare(`
          INSERT INTO projects (name, path, git_provider, git_repo_id, git_repo_full_name, git_repo_url, git_is_fork, git_fork_of_full_name, git_fork_of_url, git_default_branch, git_last_commit_sha, git_last_commit_message, git_last_commit_date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          repo.name,
          "", // Path vazio para projetos Git (não são locais)
          provider,
          repo.id,
          repo.full_name,
          repo.url,
          repo.is_fork ? 1 : 0,
          repo.fork_of?.full_name || null,
          repo.fork_of?.url || null,
          repo.default_branch,
          lastCommit?.sha || lastCommit?.id || null,
          lastCommit?.commit?.message || lastCommit?.message || null,
          lastCommit?.commit?.author?.date || lastCommit?.committed_date || null
        );
        imported++;
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      updated,
      total: repositories.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao importar repositórios" },
      { status: 500 }
    );
  }
}
