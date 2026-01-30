import { getDb, LinkRow } from "@/lib/db";
import { linkSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
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
  return NextResponse.json(link, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
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
  const existing = db.prepare("SELECT * FROM links WHERE id = ?").get(id) as
    | LinkRow
    | undefined;
  if (!existing)
    return NextResponse.json({ error: "Link não encontrado" }, { status: 404 });

  const { name, url, terminal } = parse.data;
  db.prepare(
    "UPDATE links SET name = ?, url = ?, terminal = ? WHERE id = ?",
  ).run(name, url, terminal ? 1 : 0, id);

  const updated = db.prepare("SELECT * FROM links WHERE id = ?").get(id) as
    | LinkRow
    | undefined;
  return NextResponse.json(updated ?? null, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const db = getDb();
  const result = db.prepare("DELETE FROM links WHERE id = ?").run(id);
  if (result.changes === 0)
    return NextResponse.json({ error: "Link não encontrado" }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
