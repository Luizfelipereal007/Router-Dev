import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Endpoint para obter o token completo (usado apenas internamente pelos serviços)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const provider = searchParams.get("provider");

  if (!provider || (provider !== "github" && provider !== "gitlab")) {
    return NextResponse.json(
      { error: "Provider inválido" },
      { status: 400 }
    );
  }

  const db = getDb();
  const config = db
    .prepare("SELECT token, gitlab_url FROM git_config WHERE provider = ?")
    .get(provider) as { token: string; gitlab_url: string | null } | undefined;

  if (!config) {
    return NextResponse.json(
      { error: "Configuração não encontrada" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    token: config.token,
    gitlab_url: config.gitlab_url,
  });
}
