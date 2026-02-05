import { getDb, LinkRow, ProjectRow } from "@/lib/db";
import { linkSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  console.log("[POST /api/projects/:id/links] Iniciando criação de link");

  const { id: projectIdStr } = await ctx.params;
  console.log("[POST /api/projects/:id/links] projectIdStr:", projectIdStr);

  const projectId = Number(projectIdStr);
  console.log("[POST /api/projects/:id/links] projectId:", projectId);

  if (!Number.isInteger(projectId)) {
    console.log("[POST /api/projects/:id/links] ID inválido");
    return NextResponse.json(
      { error: "ID de projeto inválido" },
      { status: 400 },
    );
  }

  const body = await req.json().catch(() => null);
  console.log("[POST /api/projects/:id/links] body:", body);

  const parse = linkSchema.safeParse(body);
  console.log("[POST /api/projects/:id/links] parse.success:", parse.success);
  if (!parse.success) {
    console.log(
      "[POST /api/projects/:id/links] Erro de validação:",
      parse.error.flatten(),
    );
    return NextResponse.json(
      { error: "Dados inválidos", details: parse.error.flatten() },
      { status: 400 },
    );
  }

  const db = getDb();
  console.log("[POST /api/projects/:id/links] DB obtido");

  const project = db
    .prepare("SELECT id FROM projects WHERE id = ?")
    .get(projectId) as Pick<ProjectRow, "id"> | undefined;
  console.log("[POST /api/projects/:id/links] project:", project);

  if (!project) {
    console.log("[POST /api/projects/:id/links] Projeto não encontrado");
    return NextResponse.json(
      { error: "Projeto não encontrado" },
      { status: 404 },
    );
  }

  const { name, url, terminal } = parse.data;
  console.log("[POST /api/projects/:id/links] Inserindo link:", {
    projectId,
    name,
    url,
    terminal,
  });

  try {
    const result = db
      .prepare(
        "INSERT INTO links (project_id, name, url, terminal) VALUES (?, ?, ?, ?)",
      )
      .run(projectId, name, url, terminal ? 1 : 0);

    console.log("[POST /api/projects/:id/links] result:", result);

    const link: LinkRow = {
      id: Number(result.lastInsertRowid),
      project_id: projectId,
      name,
      url,
      terminal: terminal ? 1 : 0,
    };
    console.log("[POST /api/projects/:id/links] link criado:", link);

    return NextResponse.json(link, {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[POST /api/projects/:id/links] Erro ao criar link:", error);
    return NextResponse.json(
      { error: "Erro ao criar link no banco de dados" },
      { status: 500 },
    );
  }
}
