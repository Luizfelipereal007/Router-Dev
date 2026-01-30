import { getDb, LinkRow, ProjectRow } from "@/lib/db";
import { projectSchema } from "@/lib/validation";
import { NextResponse } from "next/server";
import fs from "node:fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parse = projectSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parse.error.flatten() },
      { status: 400 }
    );
  }

  const { name, path } = parse.data;
  if (!fs.existsSync(path)) {
    return NextResponse.json({ error: "Caminho do projeto não existe" }, { status: 400 });
  }

  const db = getDb();
  const exists = db.prepare("SELECT id FROM projects WHERE id = ?").get(id) as
    | Pick<ProjectRow, "id">
    | undefined;

  if (!exists) {
    return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
  }

  db.prepare("UPDATE projects SET name = ?, path = ? WHERE id = ?").run(name, path, id);

  const links = db
    .prepare("SELECT * FROM links WHERE project_id = ? ORDER BY id")
    .all(id) as LinkRow[];

  return NextResponse.json(
    { id, name, path, links },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const db = getDb();
  const result = db.prepare("DELETE FROM projects WHERE id = ?").run(id);
  if (result.changes === 0) {
    return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}

