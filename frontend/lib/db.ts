import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export type ProjectRow = {
  id: number;
  name: string;
  path: string;
};

export type LinkRow = {
  id: number;
  project_id: number;
  name: string;
  url: string;
  terminal: number; // 0 or 1 for SQLite boolean
};

let dbSingleton: Database.Database | null = null;

export function getDb() {
  if (dbSingleton) return dbSingleton;

  const dataDir = path.join(process.cwd(), "data");
  const dbPath = path.join(dataDir, "dashboard.sqlite");

  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

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
      type INTEGER NOT NULL CHECK (type IN (0, 1)),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
  `);

  dbSingleton = db;
  return dbSingleton;
}
