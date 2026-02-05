import { getDb, LinkRow, ProjectRow } from "@/lib/db";
import { projectSchema } from "@/lib/validation";
import { NextResponse } from "next/server";
import fs from "node:fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const projects = db
    .prepare(`
      SELECT 
        id, name, path,
        git_provider, git_repo_id, git_repo_full_name, git_repo_url,
        git_is_fork, git_fork_of_full_name, git_fork_of_url,
        git_default_branch, git_last_commit_sha, git_last_commit_message, git_last_commit_date,
        git_ahead_count, git_behind_count, git_sync_status
      FROM projects 
      ORDER BY name
    `)
    .all() as ProjectRow[];

  const links = db.prepare("SELECT * FROM links ORDER BY id").all() as LinkRow[];

  const linksByProject = links.reduce<Record<number, LinkRow[]>>((acc, l) => {
    if (!acc[l.project_id]) acc[l.project_id] = [];
    acc[l.project_id].push(l);
    return acc;
  }, {});

  return NextResponse.json(
    projects.map((p) => ({
      ...p,
      links: linksByProject[p.id] ?? [],
      git_is_fork: p.git_is_fork === 1,
    })),
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parse = projectSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parse.error.flatten() },
      { status: 400 }
    );
  }

  const { name, path } = parse.data;
  // Projetos locais precisam ter path válido, mas projetos Git podem ter path vazio
  if (path && !fs.existsSync(path)) {
    return NextResponse.json({ error: "Caminho do projeto não existe" }, { status: 400 });
  }

  const db = getDb();
  const result = db.prepare("INSERT INTO projects (name, path) VALUES (?, ?)").run(name, path);

  return NextResponse.json(
    { id: Number(result.lastInsertRowid), name, path, links: [] },
    { status: 201, headers: { "Cache-Control": "no-store" } }
  );
}

