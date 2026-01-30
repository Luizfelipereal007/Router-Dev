import { getDb, LinkRow, ProjectRow } from "@/lib/db";
import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import fs from "node:fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const db = getDb();
  const link = db.prepare("SELECT * FROM links WHERE id = ?").get(id) as
    | LinkRow
    | undefined;
  if (!link)
    return NextResponse.json({ error: "Link não encontrado" }, { status: 404 });

  if (!link.terminal) {
    return NextResponse.json(
      { error: "Este link não está configurado como TERMINAL" },
      { status: 400 },
    );
  }

  const project = db
    .prepare("SELECT * FROM projects WHERE id = ?")
    .get(link.project_id) as ProjectRow | undefined;

  if (!project)
    return NextResponse.json(
      { error: "Projeto não encontrado" },
      { status: 404 },
    );

  if (!fs.existsSync(project.path)) {
    return NextResponse.json(
      { error: "Caminho do projeto não existe" },
      { status: 400 },
    );
  }

  try {
    spawn("code", ["."], {
      cwd: project.path,
      detached: true,
      stdio: "ignore",
    }).unref();
    return NextResponse.json(
      { status: "ok" },
      { status: 202, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Erro ao executar code .:", error);
    return NextResponse.json(
      { error: "Falha ao abrir o VS Code" },
      { status: 500 },
    );
  }
}
