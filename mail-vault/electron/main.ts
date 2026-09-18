import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import Database from "better-sqlite3";
import { createHash } from "node:crypto";
import { cp, mkdir, readdir, readFile, stat } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseEml, splitMbox } from "./mail-parser";
import type {
  ArchiveMessage,
  ArchiveMessageDetail,
  ArchiveOptions,
  ArchiveStats,
  ImportProgress,
  ImportResult,
  MessagePage,
  SearchFilters,
  Tag,
} from "./shared";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_NAME = "Mail Vault";
let mainWindow: BrowserWindow | null = null;
let db: Database.Database;

type ImportFile = { filePath: string; folder: string };
type MessageRow = Omit<ArchiveMessage, "tags">;

function archiveDirectory(): string {
  return path.join(app.getPath("userData"), "archive");
}

function databasePath(): string {
  return path.join(archiveDirectory(), "mail-vault.sqlite");
}

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function cleanSnippet(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 280);
}

function normalizeFolder(value: string): string {
  const normalized = value.replaceAll(path.sep, " / ").replace(/^\s*\.\s*\/\s*/, "").trim();
  return normalized || "Imported mail";
}

function queryForFts(raw: string): string | null {
  const terms = raw
    .trim()
    .split(/\s+/)
    .map(term => term.replace(/["'*:^(){}\[\]]/g, "").trim())
    .filter(Boolean)
    .slice(0, 16);
  return terms.length ? terms.map(term => `"${term}"*`).join(" AND ") : null;
}

function openDatabase(): void {
  db = new Database(databasePath());
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY,
      fingerprint TEXT NOT NULL UNIQUE,
      message_id TEXT,
      subject TEXT NOT NULL,
      sender_name TEXT,
      sender_email TEXT,
      recipients TEXT,
      date_ms INTEGER,
      folder TEXT NOT NULL,
      body_text TEXT,
      html TEXT,
      snippet TEXT NOT NULL,
      has_attachments INTEGER NOT NULL DEFAULT 0,
      attachment_count INTEGER NOT NULL DEFAULT 0,
      source_path TEXT,
      size_bytes INTEGER NOT NULL DEFAULT 0,
      imported_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS messages_date_idx ON messages(date_ms DESC);
    CREATE INDEX IF NOT EXISTS messages_sender_idx ON messages(sender_email);
    CREATE INDEX IF NOT EXISTS messages_folder_idx ON messages(folder);
    CREATE VIRTUAL TABLE IF NOT EXISTS message_fts USING fts5(
      subject, sender, recipients, folder, body,
      tokenize = 'unicode61 remove_diacritics 2'
    );
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL COLLATE NOCASE UNIQUE,
      color TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS message_tags (
      message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
      tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (message_id, tag_id)
    );
  `);
}

function getTagsForMessageIds(ids: number[]): Map<number, Tag[]> {
  const tags = new Map<number, Tag[]>();
  if (!ids.length) return tags;
  const placeholders = ids.map(() => "?").join(",");
  const rows = db.prepare(`
    SELECT mt.message_id AS messageId, t.id, t.name, t.color
    FROM message_tags mt JOIN tags t ON t.id = mt.tag_id
    WHERE mt.message_id IN (${placeholders}) ORDER BY t.name
  `).all(...ids) as Array<{ messageId: number } & Tag>;
  rows.forEach(row => {
    const existing = tags.get(row.messageId) ?? [];
    existing.push({ id: row.id, name: row.name, color: row.color });
    tags.set(row.messageId, existing);
  });
  return tags;
}

function mapMessages(rows: Array<Record<string, unknown>>): ArchiveMessage[] {
  const tagsById = getTagsForMessageIds(rows.map(row => Number(row.id)));
  return rows.map(row => ({
    id: Number(row.id),
    subject: String(row.subject || "(No subject)"),
    senderName: row.senderName ? String(row.senderName) : null,
    senderEmail: row.senderEmail ? String(row.senderEmail) : null,
    recipients: row.recipients ? String(row.recipients) : null,
    dateMs: typeof row.dateMs === "number" ? row.dateMs : row.dateMs ? Number(row.dateMs) : null,
    folder: row.folder ? String(row.folder) : null,
    snippet: String(row.snippet || ""),
    hasAttachments: Boolean(row.hasAttachments),
    attachmentCount: Number(row.attachmentCount || 0),
    tags: tagsById.get(Number(row.id)) ?? [],
  }));
}

function buildSearch(filters: SearchFilters): { where: string; params: unknown[] } {
  const clauses: string[] = [];
  const params: unknown[] = [];
  const ftsQuery = filters.query ? queryForFts(filters.query) : null;
  if (ftsQuery) {
    clauses.push("m.id IN (SELECT rowid FROM message_fts WHERE message_fts MATCH ?)");
    params.push(ftsQuery);
  }
  if (filters.folder) {
    clauses.push("m.folder = ?");
    params.push(filters.folder);
  }
  if (filters.sender) {
    clauses.push("m.sender_email = ?");
    params.push(filters.sender);
  }
  if (filters.tagId) {
    clauses.push("EXISTS (SELECT 1 FROM message_tags mt WHERE mt.message_id = m.id AND mt.tag_id = ?)");
    params.push(filters.tagId);
  }
  if (filters.dateFrom) {
    clauses.push("m.date_ms >= ?");
    params.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    clauses.push("m.date_ms <= ?");
    params.push(filters.dateTo);
  }
  return { where: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "", params };
}

function searchMessages(filters: SearchFilters): MessagePage {
  const pageSize = Math.min(Math.max(Math.floor(filters.pageSize ?? 50), 1), 100000);
  const page = Math.max(Math.floor(filters.page ?? 0), 0);
  const { where, params } = buildSearch(filters);
  const total = (db.prepare(`SELECT COUNT(*) AS total FROM messages m ${where}`).get(...params) as { total: number }).total;
  const rows = db.prepare(`
    SELECT m.id, m.subject, m.sender_name AS senderName, m.sender_email AS senderEmail,
      m.recipients, m.date_ms AS dateMs, m.folder, m.snippet,
      m.has_attachments AS hasAttachments, m.attachment_count AS attachmentCount
    FROM messages m ${where}
    ORDER BY CASE WHEN m.date_ms IS NULL THEN 1 ELSE 0 END, m.date_ms DESC, m.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, page * pageSize) as Array<Record<string, unknown>>;
  return { items: mapMessages(rows), total, page, pageSize };
}

function getStats(): ArchiveStats {
  const totals = db.prepare(`
    SELECT COUNT(*) AS totalMessages, COALESCE(SUM(attachment_count), 0) AS totalAttachments,
      COALESCE(SUM(size_bytes), 0) AS totalSizeBytes, MIN(date_ms) AS oldestDate, MAX(date_ms) AS newestDate
    FROM messages
  `).get() as Omit<ArchiveStats, "folders" | "correspondents">;
  const folders = db.prepare(`SELECT folder AS name, COUNT(*) AS count FROM messages GROUP BY folder ORDER BY count DESC, folder ASC LIMIT 12`).all() as ArchiveStats["folders"];
  const correspondents = db.prepare(`
    SELECT sender_email AS email, MAX(sender_name) AS name, COUNT(*) AS count
    FROM messages WHERE sender_email IS NOT NULL GROUP BY sender_email ORDER BY count DESC LIMIT 8
  `).all() as ArchiveStats["correspondents"];
  return { ...totals, folders, correspondents };
}

function getOptions(): ArchiveOptions {
  const folders = (db.prepare("SELECT DISTINCT folder FROM messages ORDER BY folder COLLATE NOCASE").all() as Array<{ folder: string }>).map(row => row.folder);
  const senders = db.prepare(`
    SELECT sender_email AS email, MAX(sender_name) AS name, COUNT(*) AS count
    FROM messages WHERE sender_email IS NOT NULL GROUP BY sender_email ORDER BY count DESC, email LIMIT 500
  `).all() as ArchiveOptions["senders"];
  return { folders, senders };
}

function sendProgress(progress: ImportProgress): void {
  mainWindow?.webContents.send("archive:import-progress", progress);
}

async function walkDirectory(directory: string, root = directory): Promise<ImportFile[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const result: ImportFile[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      result.push(...await walkDirectory(fullPath, root));
      continue;
    }
    if (!entry.isFile()) continue;
    const extension = path.extname(entry.name).toLowerCase();
    if ([".eml", ".mbox", ".mbx"].includes(extension) || extension === "" || entry.name.toLowerCase() === "mbox") {
      result.push({ filePath: fullPath, folder: normalizeFolder(path.relative(root, path.dirname(fullPath))) });
    }
  }
  return result;
}

async function collectImportFiles(paths: string[]): Promise<ImportFile[]> {
  const files: ImportFile[] = [];
  for (const input of paths) {
    const info = await stat(input);
    if (info.isDirectory()) {
      files.push(...await walkDirectory(input));
    } else if (info.isFile()) {
      files.push({ filePath: input, folder: normalizeFolder(path.basename(path.dirname(input))) });
    }
  }
  return files;
}

async function importPaths(paths: string[]): Promise<ImportResult> {
  const files = await collectImportFiles(paths);
  const result: ImportResult = { filesScanned: files.length, messagesFound: 0, imported: 0, skipped: 0, failed: 0, errors: [] };
  const insertMessage = db.prepare(`
    INSERT OR IGNORE INTO messages (
      fingerprint, message_id, subject, sender_name, sender_email, recipients, date_ms, folder,
      body_text, html, snippet, has_attachments, attachment_count, source_path, size_bytes, imported_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertFts = db.prepare("INSERT INTO message_fts(rowid, subject, sender, recipients, folder, body) VALUES (?, ?, ?, ?, ?, ?)");

  sendProgress({ phase: "scanning", current: 0, total: files.length, imported: 0, skipped: 0, failed: 0 });
  for (let fileIndex = 0; fileIndex < files.length; fileIndex += 1) {
    const file = files[fileIndex];
    try {
      const raw = await readFile(file.filePath);
      const extension = path.extname(file.filePath).toLowerCase();
      const firstLine = raw.subarray(0, 200).toString("utf8").split(/\r?\n/, 1)[0];
      const isMbox = extension === ".mbox" || extension === ".mbx" || path.basename(file.filePath).toLowerCase() === "mbox" || /^From\s+\S+\s+(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+/.test(firstLine);
      const messages = isMbox ? splitMbox(raw) : [raw];
      result.messagesFound += messages.length;
      for (let messageIndex = 0; messageIndex < messages.length; messageIndex += 1) {
        try {
          const parsed = await parseEml(messages[messageIndex]);
          const fingerprint = hash(parsed.fingerprintInput);
          const operation = insertMessage.run(
            fingerprint, parsed.messageId, parsed.subject, parsed.senderName, parsed.senderEmail,
            parsed.recipients, parsed.dateMs, file.folder, parsed.bodyText, parsed.html,
            cleanSnippet(parsed.bodyText), Number(parsed.hasAttachments), parsed.attachmentCount,
            file.filePath, parsed.sizeBytes, Date.now(),
          );
          if (operation.changes) {
            insertFts.run(operation.lastInsertRowid, parsed.subject, `${parsed.senderName ?? ""} ${parsed.senderEmail ?? ""}`.trim(), parsed.recipients ?? "", file.folder, parsed.bodyText);
            result.imported += 1;
          } else {
            result.skipped += 1;
          }
        } catch (error) {
          result.failed += 1;
          if (result.errors.length < 20) result.errors.push(`${path.basename(file.filePath)}: message ${messageIndex + 1} — ${error instanceof Error ? error.message : "could not be read"}`);
        }
      }
    } catch (error) {
      result.failed += 1;
      if (result.errors.length < 20) result.errors.push(`${path.basename(file.filePath)} — ${error instanceof Error ? error.message : "could not be read"}`);
    }
    sendProgress({ phase: "importing", current: fileIndex + 1, total: files.length, imported: result.imported, skipped: result.skipped, failed: result.failed, filename: path.basename(file.filePath) });
  }
  sendProgress({ phase: "complete", current: files.length, total: files.length, imported: result.imported, skipped: result.skipped, failed: result.failed });
  return result;
}

function escapeCsv(value: string | null | undefined): string {
  const safe = value ?? "";
  const guarded = /^[=+\-@]/.test(safe) ? `'${safe}` : safe;
  return `"${guarded.replaceAll('"', '""')}"`;
}

function toCsv(filters: SearchFilters): string {
  const page = searchMessages({ ...filters, page: 0, pageSize: 100000 });
  const headings = ["Date", "Subject", "From", "From email", "Recipients", "Folder", "Attachments", "Tags", "Snippet"];
  const lines = page.items.map(message => [
    message.dateMs ? new Date(message.dateMs).toISOString() : "", message.subject, message.senderName,
    message.senderEmail, message.recipients, message.folder, String(message.attachmentCount),
    message.tags.map(tag => tag.name).join("; "), message.snippet,
  ].map(escapeCsv).join(","));
  return [headings.map(escapeCsv).join(","), ...lines].join("\n");
}

async function openEmailFiles(): Promise<string[] | null> {
  const outcome = await dialog.showOpenDialog(mainWindow!, {
    title: "Choose approved email files",
    message: "Mail Vault imports local EML or MBOX exports only.",
    buttonLabel: "Import selected files",
    properties: ["openFile", "multiSelections"],
    filters: [{ name: "Email archives", extensions: ["eml", "mbox", "mbx"] }, { name: "All files", extensions: ["*"] }],
  });
  return outcome.canceled ? null : outcome.filePaths;
}

async function openEmailFolder(): Promise<string[] | null> {
  const outcome = await dialog.showOpenDialog(mainWindow!, {
    title: "Choose a folder of approved email files",
    message: "Subfolders are included. Only EML and MBOX files are read.",
    buttonLabel: "Import folder",
    properties: ["openDirectory", "createDirectory"],
  });
  return outcome.canceled ? null : outcome.filePaths;
}

function registerIpcHandlers(): void {
  ipcMain.handle("archive:choose-email-files", openEmailFiles);
  ipcMain.handle("archive:choose-email-folder", openEmailFolder);
  ipcMain.handle("archive:import-paths", (_event, paths: unknown) => {
    if (!Array.isArray(paths) || !paths.every(item => typeof item === "string")) throw new Error("Invalid import paths.");
    return importPaths(paths);
  });
  ipcMain.handle("archive:get-stats", () => getStats());
  ipcMain.handle("archive:get-options", () => getOptions());
  ipcMain.handle("archive:search-messages", (_event, filters: SearchFilters) => searchMessages(filters ?? {}));
  ipcMain.handle("archive:get-message", (_event, id: number): ArchiveMessageDetail | null => {
    const row = db.prepare(`
      SELECT id, subject, sender_name AS senderName, sender_email AS senderEmail, recipients, date_ms AS dateMs,
        folder, snippet, has_attachments AS hasAttachments, attachment_count AS attachmentCount,
        message_id AS messageId, body_text AS bodyText, html, source_path AS sourcePath, size_bytes AS sizeBytes
      FROM messages WHERE id = ?
    `).get(id) as Record<string, unknown> | undefined;
    if (!row) return null;
    const message = mapMessages([row])[0];
    return { ...message, messageId: row.messageId ? String(row.messageId) : null, bodyText: row.bodyText ? String(row.bodyText) : null, html: row.html ? String(row.html) : null, sourcePath: row.sourcePath ? String(row.sourcePath) : null, sizeBytes: Number(row.sizeBytes || 0) };
  });
  ipcMain.handle("archive:list-tags", () => db.prepare("SELECT id, name, color FROM tags ORDER BY name COLLATE NOCASE").all() as Tag[]);
  ipcMain.handle("archive:create-tag", (_event, input: { name: string; color: string }) => {
    const name = input?.name?.trim().slice(0, 50);
    const color = /^#[0-9a-fA-F]{6}$/.test(input?.color) ? input.color : "#0f766e";
    if (!name) throw new Error("A tag name is required.");
    db.prepare("INSERT INTO tags (name, color, created_at) VALUES (?, ?, ?)").run(name, color, Date.now());
    return db.prepare("SELECT id, name, color FROM tags WHERE name = ?").get(name) as Tag;
  });
  ipcMain.handle("archive:tag-message", (_event, input: { messageId: number; tagId: number }) => db.prepare("INSERT OR IGNORE INTO message_tags (message_id, tag_id) VALUES (?, ?)").run(input.messageId, input.tagId));
  ipcMain.handle("archive:untag-message", (_event, input: { messageId: number; tagId: number }) => db.prepare("DELETE FROM message_tags WHERE message_id = ? AND tag_id = ?").run(input.messageId, input.tagId));
  ipcMain.handle("archive:export-csv", async (_event, filters: SearchFilters) => {
    const output = await dialog.showSaveDialog(mainWindow!, { title: "Export message index", defaultPath: "mail-vault-index.csv", filters: [{ name: "CSV", extensions: ["csv"] }] });
    if (output.canceled || !output.filePath) return { cancelled: true };
    await import("node:fs/promises").then(fs => fs.writeFile(output.filePath!, toCsv(filters ?? {}), "utf8"));
    return { cancelled: false, path: output.filePath };
  });
  ipcMain.handle("archive:backup-database", async () => {
    const output = await dialog.showSaveDialog(mainWindow!, { title: "Back up Mail Vault", defaultPath: `mail-vault-backup-${new Date().toISOString().slice(0, 10)}.sqlite`, filters: [{ name: "SQLite archive", extensions: ["sqlite"] }] });
    if (output.canceled || !output.filePath) return { cancelled: true };
    db.pragma("wal_checkpoint(TRUNCATE)");
    await cp(databasePath(), output.filePath);
    return { cancelled: false, path: output.filePath };
  });
  ipcMain.handle("archive:show-folder", () => shell.openPath(archiveDirectory()));
  ipcMain.handle("archive:get-location", () => archiveDirectory());
  ipcMain.handle("archive:clear", () => {
    db.exec("DELETE FROM message_tags; DELETE FROM tags; DELETE FROM message_fts; DELETE FROM messages;");
    db.exec("VACUUM;");
  });
}

function createWindow(): void {
  const appIcon = app.isPackaged
    ? path.join(process.resourcesPath, "assets", "mail-vault-icon.png")
    : path.join(__dirname, "..", "assets", "mail-vault-icon.png");
  mainWindow = new BrowserWindow({
    width: 1460,
    height: 920,
    minWidth: 1080,
    minHeight: 700,
    title: APP_NAME,
    icon: appIcon,
    backgroundColor: "#f7f5f0",
    webPreferences: { preload: path.join(__dirname, "preload.cjs"), contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) mainWindow.loadURL(devServerUrl);
  else mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
}

app.setName(APP_NAME);
app.whenReady().then(async () => {
  await mkdir(archiveDirectory(), { recursive: true });
  openDatabase();
  registerIpcHandlers();
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => { if (db?.open) db.close(); });
