import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export type ProjectRow = {
  id: number;
  name: string;
  path: string;
  git_provider?: string | null;
  git_repo_id?: string | null;
  git_repo_full_name?: string | null;
  git_repo_url?: string | null;
  git_is_fork?: number | null;
  git_fork_of_full_name?: string | null;
  git_fork_of_url?: string | null;
  git_default_branch?: string | null;
  git_last_commit_sha?: string | null;
  git_last_commit_message?: string | null;
  git_last_commit_date?: string | null;
  git_ahead_count?: number | null;
  git_behind_count?: number | null;
  git_sync_status?: string | null;
};

export type LinkRow = {
  id: number;
  project_id: number;
  name: string;
  url: string;
  terminal: number; // 0 or 1 for SQLite boolean
};

export type GitConfigRow = {
  id: number;
  provider: "github" | "gitlab";
  token: string;
  gitlab_url?: string | null;
  username?: string | null;
  updated_at: string;
};

export type UserProfileRow = {
  id: number;
  name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type LinkedAccountRow = {
  id: number;
  user_id: number;
  provider: "github" | "gitlab";
  provider_username: string;
  provider_avatar_url: string | null;
  linked_at: string;
};

let dbSingleton: Database.Database | null = null;

export function getDb() {
  if (dbSingleton) return dbSingleton;

  const dataDir = path.join(process.cwd(), "data");
  const dbPath = path.join(dataDir, "dashboard.sqlite");

  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const db = new Database(dbPath);
  console.log("[DB] Database created at:", dbPath);
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

    CREATE TABLE IF NOT EXISTS git_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider TEXT NOT NULL UNIQUE CHECK (provider IN ('github', 'gitlab')),
      token TEXT NOT NULL,
      gitlab_url TEXT,
      username TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL DEFAULT '',
      avatar_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS linked_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      provider TEXT NOT NULL CHECK (provider IN ('github', 'gitlab')),
      provider_username TEXT NOT NULL,
      provider_avatar_url TEXT,
      linked_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
      UNIQUE(provider, provider_username)
    );
  `);
  console.log("[DB] Tables created/verified");

  // Migração: adicionar colunas Git se não existirem
  const tableInfo = db.prepare("PRAGMA table_info(projects)").all() as Array<{
    name: string;
  }>;
  const columnNames = new Set(tableInfo.map((col) => col.name));

  const gitColumns = [
    {
      name: "git_provider",
      sql: "TEXT CHECK (git_provider IN ('github', 'gitlab', NULL))",
    },
    { name: "git_repo_id", sql: "TEXT" },
    { name: "git_repo_full_name", sql: "TEXT" },
    { name: "git_repo_url", sql: "TEXT" },
    { name: "git_is_fork", sql: "INTEGER CHECK (git_is_fork IN (0, 1))" },
    { name: "git_fork_of_full_name", sql: "TEXT" },
    { name: "git_fork_of_url", sql: "TEXT" },
    { name: "git_default_branch", sql: "TEXT" },
    { name: "git_last_commit_sha", sql: "TEXT" },
    { name: "git_last_commit_message", sql: "TEXT" },
    { name: "git_last_commit_date", sql: "TEXT" },
    { name: "git_ahead_count", sql: "INTEGER DEFAULT 0" },
    { name: "git_behind_count", sql: "INTEGER DEFAULT 0" },
    {
      name: "git_sync_status",
      sql: "TEXT CHECK (git_sync_status IN ('synced', 'ahead', 'behind', 'diverged', NULL))",
    },
  ];

  for (const col of gitColumns) {
    if (!columnNames.has(col.name)) {
      try {
        db.exec(`ALTER TABLE projects ADD COLUMN ${col.name} ${col.sql}`);
      } catch (error) {
        // Ignora erros se a coluna já existir (pode acontecer em casos de concorrência)
        console.warn(`Erro ao adicionar coluna ${col.name}:`, error);
      }
    }
  }

  // Migração: corrigir tabela de links de "type" para "terminal"
  const linksInfo = db.prepare("PRAGMA table_info(links)").all() as Array<{
    name: string;
  }>;
  const linkColumnNames = new Set(linksInfo.map((col) => col.name));
  console.log("[DB] Colunas da tabela links:", Array.from(linkColumnNames));

  const hasTypeColumn = linkColumnNames.has("type");
  const hasTerminalColumn = linkColumnNames.has("terminal");
  console.log(
    "[DB] hasTypeColumn:",
    hasTypeColumn,
    "hasTerminalColumn:",
    hasTerminalColumn,
  );

  if (hasTerminalColumn) {
    console.log("[DB] Tabela links já tem coluna terminal");
    // Se também tiver a coluna type, removê-la (SQLite não suporta DROP COLUMN diretamente)
    if (hasTypeColumn) {
      console.log("[DB] Removendo coluna type obsoleta...");
      try {
        db.exec(`
          PRAGMA foreign_keys = OFF;
          CREATE TABLE IF NOT EXISTS links_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            url TEXT NOT NULL,
            terminal INTEGER NOT NULL CHECK (terminal IN (0, 1)),
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
          );
          INSERT INTO links_new (id, project_id, name, url, terminal)
          SELECT id, project_id, name, url, terminal FROM links;
          DROP TABLE links;
          ALTER TABLE links_new RENAME TO links;
          PRAGMA foreign_keys = ON;
        `);
        console.log("[DB] Coluna type removida com sucesso");
      } catch (error) {
        console.warn("[DB] Erro ao remover coluna type:", error);
      }
    }
  } else if (hasTypeColumn) {
    try {
      db.exec(`
        ALTER TABLE links ADD COLUMN terminal INTEGER DEFAULT 0;
        UPDATE links SET terminal = type WHERE type IS NOT NULL;
      `);
      console.log("[DB] Migração type->terminal concluída");
    } catch (error) {
      console.warn(
        "[DB] Erro ao migrar coluna de links (type -> terminal):",
        error,
      );
    }
  } else {
    // Tabela não tem type nem terminal - pode ser uma tabela antiga sem essas colunas
    console.warn(
      "[DB] Tabela links não tem coluna terminal nem type - pode falhar ao inserir",
    );
    // Adicionar a coluna terminal se estiver faltando
    try {
      db.exec(`ALTER TABLE links ADD COLUMN terminal INTEGER DEFAULT 0`);
      console.log("[DB] Coluna terminal adicionada com sucesso");
    } catch (error) {
      console.warn("[DB] Erro ao adicionar coluna terminal:", error);
    }
  }

  dbSingleton = db;
  return dbSingleton;
}
