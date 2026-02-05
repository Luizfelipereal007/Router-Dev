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

  // Buscar token do banco, com base no provider do projeto
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

  try {
    let repoInfo: any = {};
    let lastCommit: any = null;
    let compareResult: any = null;

    if (project.git_provider === "github") {
      const github = new GitHubService(token);
      const repo = await github.getRepository(project.git_repo_full_name!);
      repoInfo = repo;
      const branchToCheck = branch || project.git_default_branch || repo.default_branch;
      lastCommit = await github.getLastCommit(
        project.git_repo_full_name!,
        branchToCheck
      );

      if (project.git_is_fork && project.git_fork_of_full_name) {
        const forkBranch = project.git_default_branch || repo.default_branch;
        const parentRepo = await github.getRepository(project.git_fork_of_full_name);
        const parentBranch = parentRepo.default_branch;
        
        // Comparar do ponto de vista do fork:
        // base = branch do fork, head = branch do repositório original
        // ahead_by = commits no fork que não estão no original
        // behind_by = commits no original que não estão no fork
        try {
          compareResult = await github.compareBranches(
            project.git_repo_full_name!,
            forkBranch,
            `${project.git_fork_of_full_name.split("/")[0]}:${parentBranch}`
          );
        } catch (error) {
          // Se falhar, tenta comparar do repositório original
          try {
            const result = await github.compareBranches(
              project.git_fork_of_full_name,
              parentBranch,
              `${project.git_repo_full_name!.split("/")[0]}:${forkBranch}`
            );
            // Inverter os valores: o que está ahead no original é behind no fork
            compareResult = {
              ahead_by: result.behind_by,
              behind_by: result.ahead_by,
              status: result.status,
            };
          } catch (e) {
            // Se ainda falhar, deixa como null
            compareResult = null;
          }
        }
      }
    } else if (project.git_provider === "gitlab") {
      const gitlab = new GitLabService(token, gitlab_url || "https://gitlab.com");
      const repo = await gitlab.getRepository(project.git_repo_id);
      repoInfo = repo;
      lastCommit = await gitlab.getLastCommit(
        project.git_repo_id,
        project.git_default_branch || repo.default_branch
      );

      if (project.git_is_fork && project.git_fork_of_full_name) {
        const parentRepo = await gitlab.getRepository(project.git_fork_of_full_name);
        const forkBranch = branch || project.git_default_branch || repo.default_branch;
        const parentBranch = parentRepo.default_branch;
        
        // Comparar: from é o repositório original, to é o fork
        compareResult = await gitlab.compareBranches(
          project.git_repo_id,
          parentBranch,
          forkBranch
        );
      }
    }

    // Atualizar informações no banco
    const updates: string[] = [];
    const values: any[] = [];

    if (lastCommit) {
      updates.push("git_last_commit_sha = ?");
      values.push(lastCommit.sha || lastCommit.id);
      updates.push("git_last_commit_message = ?");
      values.push(lastCommit.commit?.message || lastCommit.message);
      updates.push("git_last_commit_date = ?");
      values.push(lastCommit.commit?.author?.date || lastCommit.committed_date);
    }

    if (compareResult) {
      updates.push("git_ahead_count = ?");
      values.push(compareResult.ahead_by || 0);
      updates.push("git_behind_count = ?");
      values.push(compareResult.behind_by || 0);
      updates.push("git_sync_status = ?");
      values.push(compareResult.status || "synced");
    }

    if (updates.length > 0) {
      values.push(projectId);
      db.prepare(
        `UPDATE projects SET ${updates.join(", ")} WHERE id = ?`
      ).run(...values);
    }

    return NextResponse.json({
      lastCommit,
      compareResult,
      repoInfo: {
        default_branch: repoInfo.default_branch,
        updated_at: repoInfo.updated_at || repoInfo.last_activity_at,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao verificar status" },
      { status: 500 }
    );
  }
}
