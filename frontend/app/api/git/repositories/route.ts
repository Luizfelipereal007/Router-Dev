import { GitHubService } from "@/lib/github";
import { GitLabService } from "@/lib/gitlab";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const provider = searchParams.get("provider");
  const token = searchParams.get("token");
  const gitlabUrl = searchParams.get("gitlabUrl");

  if (!provider || !token) {
    return NextResponse.json(
      { error: "Provider e token são obrigatórios" },
      { status: 400 }
    );
  }

  try {
    if (provider === "github") {
      const github = new GitHubService(token);
      const repos = await github.listRepositories();
      return NextResponse.json(repos);
    } else if (provider === "gitlab") {
      const gitlab = new GitLabService(token, gitlabUrl || "https://gitlab.com");
      const repos = await gitlab.listRepositories();
      return NextResponse.json(repos);
    } else {
      return NextResponse.json(
        { error: "Provider inválido. Use 'github' ou 'gitlab'" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao listar repositórios" },
      { status: 500 }
    );
  }
}
