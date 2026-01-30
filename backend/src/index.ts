import Database from "better-sqlite3";
import cors from "cors";
import express from "express";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(cors());
app.use(express.json());

const dataDir = path.join(__dirname, "..", "data");
const dbPath = path.join(dataDir, "dashboard.sqlite");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    path TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    terminal INTEGER NOT NULL CHECK (terminal IN (0, 1)),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  );
`);

const projectSchema = z.object({
  name: z.string().min(1),
  path: z.string().min(1),
});

const linkSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  terminal: z.boolean(),
});

type Project = {
  id: number;
  name: string;
  path: string;
};

type Link = {
  id: number;
  project_id: number;
  name: string;
  url: string;
  terminal: number;
};

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/fs/suggest", (req, res) => {
  const raw = typeof req.query.path === "string" ? req.query.path : "";
  const limit = Math.min(
    200,
    Math.max(
      1,
      Number(typeof req.query.limit === "string" ? req.query.limit : 80) || 80,
    ),
  );

  const home = process.env.HOME || "/";
  const input = raw.trim();

  const normalized = input.length === 0 ? home : input;
  const endsWithSlash = normalized.endsWith(path.posix.sep);

  // Separar em: baseDir + prefix (parte final digitada)
  const baseDir = endsWithSlash ? normalized : path.posix.dirname(normalized);
  const prefix = endsWithSlash ? "" : path.posix.basename(normalized);

  // `baseDir` precisa existir e ser diretório para listar conteúdo
  if (!fs.existsSync(baseDir)) {
    return res.json({
      input,
      baseDir,
      prefix,
      exists: false,
      entries: [],
    });
  }

  try {
    const stat = fs.statSync(baseDir);
    if (!stat.isDirectory()) {
      return res.json({
        input,
        baseDir,
        prefix,
        exists: false,
        entries: [],
      });
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
        };
      })
      .filter((e) =>
        prefix ? e.name.toLowerCase().startsWith(prefix.toLowerCase()) : true,
      )
      .sort((a, b) => {
        // diretórios primeiro, depois arquivos; ambos por nome
        if (a.kind !== b.kind) return a.kind === "dir" ? -1 : 1;
        return a.name.localeCompare(b.name);
      })
      .slice(0, limit);

    return res.json({
      input,
      baseDir,
      prefix,
      exists: true,
      entries,
    });
  } catch (error) {
    console.error("Erro em /fs/suggest:", error);
    return res.status(500).json({ error: "Falha ao listar diretório" });
  }
});

app.get("/projects", (_req, res) => {
  const projects = db
    .prepare("SELECT id, name, path FROM projects ORDER BY name")
    .all() as Project[];

  const linksAll = db
    .prepare("SELECT * FROM links ORDER BY id")
    .all() as Link[];

  const linksByProject = linksAll.reduce<Record<number, Link[]>>(
    (acc, link) => {
      if (!acc[link.project_id]) acc[link.project_id] = [];
      acc[link.project_id].push(link);
      return acc;
    },
    {},
  );

  res.json(
    projects.map((p) => ({
      ...p,
      links: linksByProject[p.id] ?? [],
    })),
  );
});

app.post("/projects", (req, res) => {
  const parseResult = projectSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res
      .status(400)
      .json({ error: "Dados inválidos", details: parseResult.error.flatten() });
  }

  const { name, path: projectPath } = parseResult.data;

  if (!fs.existsSync(projectPath)) {
    return res.status(400).json({ error: "Caminho do projeto não existe" });
  }

  const stmt = db.prepare("INSERT INTO projects (name, path) VALUES (?, ?)");
  const result = stmt.run(name, projectPath);

  const project: Project = {
    id: Number(result.lastInsertRowid),
    name,
    path: projectPath,
  };

  res.status(201).json({ ...project, links: [] });
});

app.put("/projects/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  const parseResult = projectSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res
      .status(400)
      .json({ error: "Dados inválidos", details: parseResult.error.flatten() });
  }

  const { name, path: projectPath } = parseResult.data;

  if (!fs.existsSync(projectPath)) {
    return res.status(400).json({ error: "Caminho do projeto não existe" });
  }

  const exists = db.prepare("SELECT id FROM projects WHERE id = ?").get(id) as
    | Pick<Project, "id">
    | undefined;

  if (!exists) {
    return res.status(404).json({ error: "Projeto não encontrado" });
  }

  db.prepare("UPDATE projects SET name = ?, path = ? WHERE id = ?").run(
    name,
    projectPath,
    id,
  );

  const links = db
    .prepare("SELECT * FROM links WHERE project_id = ? ORDER BY id")
    .all(id) as Link[];

  res.json({ id, name, path: projectPath, links });
});

app.delete("/projects/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  const result = db.prepare("DELETE FROM projects WHERE id = ?").run(id);

  if (result.changes === 0) {
    return res.status(404).json({ error: "Projeto não encontrado" });
  }

  res.status(204).send();
});

app.post("/projects/:projectId/links", (req, res) => {
  const projectId = Number(req.params.projectId);
  if (!Number.isInteger(projectId)) {
    return res.status(400).json({ error: "ID de projeto inválido" });
  }

  const parseResult = linkSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res
      .status(400)
      .json({ error: "Dados inválidos", details: parseResult.error.flatten() });
  }

  const project = db
    .prepare("SELECT id FROM projects WHERE id = ?")
    .get(projectId) as Pick<Project, "id"> | undefined;

  if (!project) {
    return res.status(404).json({ error: "Projeto não encontrado" });
  }

  const { name, url, terminal } = parseResult.data;

  const stmt = db.prepare(
    "INSERT INTO links (project_id, name, url, terminal) VALUES (?, ?, ?, ?)",
  );
  const result = stmt.run(projectId, name, url, terminal ? 1 : 0);

  const link: Link = {
    id: Number(result.lastInsertRowid),
    project_id: projectId,
    name,
    url,
    terminal: terminal ? 1 : 0,
  };

  res.status(201).json(link);
});

app.put("/links/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  const parseResult = linkSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res
      .status(400)
      .json({ error: "Dados inválidos", details: parseResult.error.flatten() });
  }

  const existing = db.prepare("SELECT * FROM links WHERE id = ?").get(id) as
    | Link
    | undefined;

  if (!existing) {
    return res.status(404).json({ error: "Link não encontrado" });
  }

  const { name, url, terminal } = parseResult.data;

  db.prepare(
    "UPDATE links SET name = ?, url = ?, terminal = ? WHERE id = ?",
  ).run(name, url, terminal ? 1 : 0, id);

  const updated = db.prepare("SELECT * FROM links WHERE id = ?").get(id) as
    | Link
    | undefined;

  res.json(updated);
});

app.get("/links/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  const link = db.prepare("SELECT * FROM links WHERE id = ?").get(id) as
    | Link
    | undefined;

  if (!link) {
    return res.status(404).json({ error: "Link não encontrado" });
  }

  res.json(link);
});

app.delete("/links/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  const result = db.prepare("DELETE FROM links WHERE id = ?").run(id);

  if (result.changes === 0) {
    return res.status(404).json({ error: "Link não encontrado" });
  }

  res.status(204).send();
});

app.post("/links/:id/terminal", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  const link = db.prepare("SELECT * FROM links WHERE id = ?").get(id) as
    | Link
    | undefined;

  if (!link) {
    return res.status(404).json({ error: "Link não encontrado" });
  }

  if (!link.terminal) {
    return res
      .status(400)
      .json({ error: "Este link não está configurado como TERMINAL" });
  }

  const project = db
    .prepare("SELECT * FROM projects WHERE id = ?")
    .get(link.project_id) as Project | undefined;

  if (!project) {
    return res.status(404).json({ error: "Projeto não encontrado" });
  }

  if (!fs.existsSync(project.path)) {
    return res.status(400).json({ error: "Caminho do projeto não existe" });
  }

  try {
    // Em Linux, o VS Code normalmente está disponível como `code`.
    // Usamos cwd para simular `cd caminho && code .`.
    spawn("code", ["."], {
      cwd: project.path,
      detached: true,
      stdio: "ignore",
    }).unref();

    res.status(202).json({ status: "ok" });
  } catch (error) {
    console.error("Erro ao executar code .:", error);
    res.status(500).json({ error: "Falha ao abrir o VS Code" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`);
});
