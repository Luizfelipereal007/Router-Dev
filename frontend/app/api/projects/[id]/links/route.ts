import { getDb, LinkRow, ProjectRow } from "@/lib/db";
import { linkSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: projectIdStr } = await ctx.params;
  const projectId = Number(projectIdStr);
  if (!Number.isInteger(projectId)) {
    return NextResponse.json(
      { error: "ID de projeto inválido" },
      { status: 400 },
    );
  }

  const body = await req.json().catch(() => null);
  const parse = linkSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parse.error.flatten() },
      { status: 400 },
    );
  }

  const db = getDb();
  const project = db
    .prepare("SELECT id FROM projects WHERE id = ?")
    .get(projectId) as Pick<ProjectRow, "id"> | undefined;

  if (!project) {
    return NextResponse.json(
      { error: "Projeto não encontrado" },
      { status: 404 },
    );
  }

  const { name, url, terminal } = parse.data;
  const result = db
    .prepare(
      "INSERT INTO links (project_id, name, url, terminal) VALUES (?, ?, ?, ?)",
    )
    .run(projectId, name, url, terminal ? 1 : 0);

  const link: LinkRow = {
    id: Number(result.lastInsertRowid),
    project_id: projectId,
    name,
    url,
    terminal: terminal ? 1 : 0,
  };

  return NextResponse.json(link, {
    status: 201,
    headers: { "Cache-Control": "no-store" },
  });
}
