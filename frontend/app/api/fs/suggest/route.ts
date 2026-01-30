import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = (searchParams.get("path") ?? "").trim();
  const limitRaw = Number(searchParams.get("limit") ?? "80") || 80;
  const limit = Math.min(200, Math.max(1, limitRaw));

  const home = process.env.HOME || "/";
  const input = raw;
  const normalized = input.length === 0 ? home : input;
  const endsWithSlash = normalized.endsWith(path.posix.sep);

  const baseDir = endsWithSlash ? normalized : path.posix.dirname(normalized);
  const prefix = endsWithSlash ? "" : path.posix.basename(normalized);

  if (!fs.existsSync(baseDir)) {
    return NextResponse.json(
      { input, baseDir, prefix, exists: false, entries: [] },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const stat = fs.statSync(baseDir);
    if (!stat.isDirectory()) {
      return NextResponse.json(
        { input, baseDir, prefix, exists: false, entries: [] },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const dirents = fs.readdirSync(baseDir, { withFileTypes: true });
    const entries = dirents
      .map((d) => {
        const isDir = d.isDirectory();
        const name = d.name;
        const fullPath = path.posix.join(baseDir, name);
        return {
          name,
          path: isDir ? `${fullPath}/` : fullPath,
          kind: isDir ? "dir" : "file",
        } as const;
      })
      .filter((e) => (prefix ? e.name.toLowerCase().startsWith(prefix.toLowerCase()) : true))
      .sort((a, b) => {
        if (a.kind !== b.kind) return a.kind === "dir" ? -1 : 1;
        return a.name.localeCompare(b.name);
      })
      .slice(0, limit);

    return NextResponse.json(
      { input, baseDir, prefix, exists: true, entries },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Erro em /api/fs/suggest:", error);
    return NextResponse.json({ error: "Falha ao listar diretório" }, { status: 500 });
  }
}

