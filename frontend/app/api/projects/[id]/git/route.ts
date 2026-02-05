import { getDb } from "@/lib/db";
import { GitHubService } from "@/lib/github";
import { GitLabService } from "@/lib/gitlab";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await ctx.params;
  const projectId = Number(idStr);

  if (!Number.isInteger(projectId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const {
    provider,
    repoId,
    repoFullName,
    repoUrl,
    token,
    gitlabUrl,
  } = body;

  if (!provider || !repoId || !repoFullName || !token) {
    return NextResponse.json(
      { error: "Provider, repoId, repoFullName e token são obrigatórios" },
      { status: 400 }
    );
  }

  const db = getDb();
  const project = db
    .prepare("SELECT id FROM projects WHERE id = ?")
    .get(projectId) as any;

  if (!project) {
    return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
  }

  try {
    let repoInfo: any = {};
    let isFork = false;
    let forkOfFullName: string | null = null;
    let forkOfUrl: string | null = null;
    let defaultBranch = "main";
    let lastCommit: any = null;

    if (provider === "github") {
      const github = new GitHubService(token);
      repoInfo = await github.getRepository(repoFullName);
      isFork = repoInfo.fork;
      forkOfFullName = repoInfo.parent?.full_name || null;
      forkOfUrl = repoInfo.parent?.html_url || null;
      defaultBranch = repoInfo.default_branch;
      lastCommit = await github.getLastCommit(repoFullName, defaultBranch);
    } else if (provider === "gitlab") {
      const gitlab = new GitLabService(token, gitlabUrl || "https://gitlab.com");
      repoInfo = await gitlab.getRepository(repoId);
      isFork = !!repoInfo.forked_from_project;
      forkOfFullName = repoInfo.forked_from_project?.path_with_namespace || null;
      forkOfUrl = repoInfo.forked_from_project?.web_url || null;
      defaultBranch = repoInfo.default_branch;
      lastCommit = await gitlab.getLastCommit(repoId, defaultBranch);
    }

    // Atualizar projeto com informações do repositório
    db.prepare(`
      UPDATE projects SET
        git_provider = ?,
        git_repo_id = ?,
        git_repo_full_name = ?,
        git_repo_url = ?,
        git_is_fork = ?,
        git_fork_of_full_name = ?,
        git_fork_of_url = ?,
        git_default_branch = ?,
        git_last_commit_sha = ?,
        git_last_commit_message = ?,
        git_last_commit_date = ?
      WHERE id = ?
    `).run(
      provider,
      repoId.toString(),
      repoFullName,
      repoUrl || repoInfo.html_url || repoInfo.web_url,
      isFork ? 1 : 0,
      forkOfFullName,
      forkOfUrl,
      defaultBranch,
      lastCommit?.sha || lastCommit?.id || null,
      lastCommit?.commit?.message || lastCommit?.message || null,
      lastCommit?.commit?.author?.date || lastCommit?.committed_date || null,
      projectId
    );

    return NextResponse.json({
      success: true,
      gitInfo: {
        provider,
        repoId,
        repoFullName,
        isFork,
        forkOfFullName,
        defaultBranch,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao vincular repositório" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await ctx.params;
  const projectId = Number(idStr);

  if (!Number.isInteger(projectId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const db = getDb();
  db.prepare(`
    UPDATE projects SET
      git_provider = NULL,
      git_repo_id = NULL,
      git_repo_full_name = NULL,
      git_repo_url = NULL,
      git_is_fork = NULL,
      git_fork_of_full_name = NULL,
      git_fork_of_url = NULL,
      git_default_branch = NULL,
      git_last_commit_sha = NULL,
      git_last_commit_message = NULL,
      git_last_commit_date = NULL,
      git_ahead_count = NULL,
      git_behind_count = NULL,
      git_sync_status = NULL
    WHERE id = ?
  `).run(projectId);

  return NextResponse.json({ success: true });
}
