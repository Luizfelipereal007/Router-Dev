import { getDb, GitConfigRow } from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const configs = db
    .prepare("SELECT provider, token, gitlab_url, username, updated_at FROM git_config")
    .all() as Omit<GitConfigRow, "id">[];

  // Não retornar o token completo por segurança, apenas indicar se está configurado
  return NextResponse.json(
    configs.map((c) => ({
      provider: c.provider,
      hasToken: !!c.token,
      tokenPreview: c.token ? `${c.token.substring(0, 4)}...${c.token.substring(c.token.length - 4)}` : null,
      gitlab_url: c.gitlab_url,
      username: c.username,
      updated_at: c.updated_at,
    })),
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { provider, token, gitlabUrl, username } = body;

  if (!provider || !token) {
    return NextResponse.json(
      { error: "Provider e token são obrigatórios" },
      { status: 400 }
    );
  }

  if (provider !== "github" && provider !== "gitlab") {
    return NextResponse.json(
      { error: "Provider deve ser 'github' ou 'gitlab'" },
      { status: 400 }
    );
  }

  const db = getDb();
  
  // Verificar se já existe configuração para este provider
  const existing = db
    .prepare("SELECT id FROM git_config WHERE provider = ?")
    .get(provider) as { id: number } | undefined;

  if (existing) {
    // Atualizar
    db.prepare(`
      UPDATE git_config 
      SET token = ?, gitlab_url = ?, username = ?, updated_at = CURRENT_TIMESTAMP
      WHERE provider = ?
    `).run(token, gitlabUrl || null, username || null, provider);
  } else {
    // Inserir
    db.prepare(`
      INSERT INTO git_config (provider, token, gitlab_url, username)
      VALUES (?, ?, ?, ?)
    `).run(provider, token, gitlabUrl || null, username || null);
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const provider = searchParams.get("provider");

  if (!provider || (provider !== "github" && provider !== "gitlab")) {
    return NextResponse.json(
      { error: "Provider inválido" },
      { status: 400 }
    );
  }

  const db = getDb();
  db.prepare("DELETE FROM git_config WHERE provider = ?").run(provider);

  return NextResponse.json({ success: true });
}
