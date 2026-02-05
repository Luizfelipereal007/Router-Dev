import { getDb } from "@/lib/db";
import { GitHubService } from "@/lib/github";
import { GitLabService } from "@/lib/gitlab";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await ctx.params;
  const projectId = Number(idStr);

  if (!Number.isInteger(projectId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const { branch } = body as { branch?: string };

  const db = getDb();
  const project = db
    .prepare("SELECT * FROM projects WHERE id = ?")
    .get(projectId) as any;

  if (!project) {
    return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
  }

  if (!project.git_provider || !project.git_repo_id) {
    return NextResponse.json(
      { error: "Projeto não está vinculado a um repositório Git" },
      { status: 400 }
    );
  }

  // Buscar token do banco com base no provider do projeto
  const config = db
    .prepare("SELECT token, gitlab_url FROM git_config WHERE provider = ?")
    .get(project.git_provider) as
    | { token: string; gitlab_url: string | null }
    | undefined;

  if (!config) {
    return NextResponse.json(
      { error: "Token não configurado. Configure nas configurações primeiro." },
      { status: 400 }
    );
  }

  const { token, gitlab_url } = config;

  if (!project.git_is_fork) {
    return NextResponse.json(
      { error: "Este repositório não é um fork" },
      { status: 400 }
    );
  }

  try {
    const branchToSync = branch || project.git_default_branch || "main";

    if (project.git_provider === "github") {
      const github = new GitHubService(token);
      await github.syncFork(project.git_repo_full_name!, branchToSync);
    } else if (project.git_provider === "gitlab") {
      const gitlab = new GitLabService(token, gitlab_url || "https://gitlab.com");
      await gitlab.syncFork(project.git_repo_id, branchToSync);
    }

    return NextResponse.json({ success: true, message: "Sincronização iniciada" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao sincronizar fork" },
      { status: 500 }
    );
  }
}
