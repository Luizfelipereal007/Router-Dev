import { getDb } from "@/lib/db";
import { GitHubService } from "@/lib/github";
import { GitLabService } from "@/lib/gitlab";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await ctx.params;
  const projectId = Number(idStr);
  const { searchParams } = new URL(req.url);
  const provider = searchParams.get("provider");

  if (!Number.isInteger(projectId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  if (!provider || (provider !== "github" && provider !== "gitlab")) {
    return NextResponse.json(
      { error: "Provider inválido" },
      { status: 400 }
    );
  }

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

  // Buscar token do banco
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
    let branches: string[] = [];

    if (provider === "github") {
      const github = new GitHubService(token);
      // GitHub API para listar branches
      const response = await fetch(
        `https://api.github.com/repos/${project.git_repo_full_name}/branches`,
        {
          headers: {
            Authorization: `token ${token}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        branches = data.map((branch: any) => branch.name);
      }
    } else {
      const gitlab = new GitLabService(token, gitlab_url || "https://gitlab.com");
      // GitLab API para listar branches
      const response = await fetch(
        `${gitlab_url || "https://gitlab.com"}/api/v4/projects/${encodeURIComponent(project.git_repo_id)}/repository/branches`,
        {
          headers: {
            "PRIVATE-TOKEN": token,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        branches = data.map((branch: any) => branch.name);
      }
    }

    return NextResponse.json({ branches });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao listar branches" },
      { status: 500 }
    );
  }
}
