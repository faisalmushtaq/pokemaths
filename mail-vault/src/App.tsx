import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Archive, ArrowDownToLine, Check, ChevronLeft, ChevronRight, FileArchive, FileDown,
  FolderOpen, HardDrive, Inbox, Mail, Paperclip, Plus, Search, ShieldCheck,
  Tag as TagIcon, Trash2, Upload, Users, X,
} from "lucide-react";
import type { ArchiveMessage, ArchiveMessageDetail, ArchiveOptions, ArchiveStats, ImportProgress, MessagePage, SearchFilters, Tag } from "../electron/shared";
import "./styles.css";

const PAGE_SIZE = 50;
const COLORS = ["#0f766e", "#0369a1", "#7c3aed", "#be123c", "#b45309", "#4d7c0f"];

const EMPTY_STATS: ArchiveStats = {
  totalMessages: 0, totalAttachments: 0, totalSizeBytes: 0, oldestDate: null, newestDate: null, folders: [], correspondents: [],
};
const EMPTY_OPTIONS: ArchiveOptions = { folders: [], senders: [] };

function formatDate(value: number | null, includeTime = false): string {
  if (!value) return "No date";
  return new Intl.DateTimeFormat(undefined, {
    month: "short", day: "numeric", year: "numeric", ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(new Date(value));
}

function formatCompactDate(value: number | null): string {
  if (!value) return "—";
  const date = new Date(value);
  const now = new Date();
  const sameYear = date.getFullYear() === now.getFullYear();
  return new Intl.DateTimeFormat(undefined, sameYear ? { month: "short", day: "numeric" } : { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const value = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** value).toFixed(value ? 1 : 0)} ${units[value]}`;
}

function toDateInput(value: number | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function messageSender(message: ArchiveMessage): string {
  return message.senderName || message.senderEmail || "Unknown sender";
}

function App() {
  const [stats, setStats] = useState<ArchiveStats>(EMPTY_STATS);
  const [options, setOptions] = useState<ArchiveOptions>(EMPTY_OPTIONS);
  const [tags, setTags] = useState<Tag[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({ page: 0, pageSize: PAGE_SIZE });
  const [queryInput, setQueryInput] = useState("");
  const [messagePage, setMessagePage] = useState<MessagePage>({ items: [], total: 0, page: 0, pageSize: PAGE_SIZE });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<ArchiveMessageDetail | null>(null);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showTagComposer, setShowTagComposer] = useState(false);
  const [tagName, setTagName] = useState("");
  const [tagColor, setTagColor] = useState(COLORS[0]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [archivePath, setArchivePath] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const reloadOverview = useCallback(async () => {
    const [nextStats, nextOptions, nextTags, location] = await Promise.all([
      window.mailVault.getStats(), window.mailVault.getOptions(), window.mailVault.listTags(), window.mailVault.getArchiveLocation(),
    ]);
    setStats(nextStats); setOptions(nextOptions); setTags(nextTags); setArchivePath(location);
  }, []);

  const loadMessages = useCallback(async () => {
    const page = await window.mailVault.searchMessages(filters);
    setMessagePage(page);
    if (selectedId && !page.items.some(message => message.id === selectedId)) {
      setSelectedId(null); setSelectedMessage(null);
    }
  }, [filters, selectedId]);

  useEffect(() => { void reloadOverview(); }, [reloadOverview]);
  useEffect(() => { void loadMessages(); }, [loadMessages]);
  useEffect(() => window.mailVault.onImportProgress(setImportProgress), []);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!selectedId) { setSelectedMessage(null); return; }
    let active = true;
    window.mailVault.getMessage(selectedId).then(message => { if (active) setSelectedMessage(message); });
    return () => { active = false; };
  }, [selectedId]);

  const hasArchive = stats.totalMessages > 0;
  const activeFolder = filters.folder ?? null;
  const activeTag = filters.tagId ?? null;
  const activeFilterCount = Number(Boolean(filters.folder)) + Number(Boolean(filters.sender)) + Number(Boolean(filters.tagId)) + Number(Boolean(filters.dateFrom || filters.dateTo));
  const matchingText = filters.query ? `matching “${filters.query}”` : "in your archive";
  const importPercentage = importProgress && importProgress.total ? Math.round((importProgress.current / importProgress.total) * 100) : 0;

  const importSelectedFiles = async () => {
    const paths = await window.mailVault.chooseEmailFiles();
    if (!paths?.length) return;
    await runImport(paths);
  };
  const importSelectedFolder = async () => {
    const paths = await window.mailVault.chooseEmailFolder();
    if (!paths?.length) return;
    await runImport(paths);
  };
  const runImport = async (paths: string[]) => {
    setNotice(null); setImportProgress({ phase: "scanning", current: 0, total: 0, imported: 0, skipped: 0, failed: 0 });
    try {
      const result = await window.mailVault.importPaths(paths);
      await reloadOverview();
      setFilters(current => ({ ...current, page: 0 }));
      setNotice(result.failed
        ? `Imported ${result.imported.toLocaleString()} messages; ${result.failed} could not be read. ${result.errors[0] ?? ""}`
        : `Imported ${result.imported.toLocaleString()} messages. ${result.skipped ? `${result.skipped.toLocaleString()} duplicates skipped.` : ""}`);
    } catch (error) {
      setNotice(`Import stopped: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally { setImportProgress(null); }
  };

  const applySearch = (event?: React.FormEvent) => {
    event?.preventDefault();
    setFilters(current => ({ ...current, query: queryInput.trim() || undefined, page: 0 }));
  };
  const clearFilters = () => { setQueryInput(""); setFilters({ page: 0, pageSize: PAGE_SIZE }); };
  const setFolder = (folder: string | null) => setFilters(current => ({ ...current, folder: folder || undefined, page: 0 }));
  const setTagFilter = (tagId: number | null) => setFilters(current => ({ ...current, tagId: tagId || undefined, page: 0 }));

  const saveTag = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const created = await window.mailVault.createTag(tagName, tagColor);
      setTags(current => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
      setTagName(""); setShowTagComposer(false); setNotice(`Created “${created.name}”.`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not create tag."); }
  };

  const toggleTag = async (tag: Tag) => {
    if (!selectedMessage) return;
    const attached = selectedMessage.tags.some(item => item.id === tag.id);
    if (attached) await window.mailVault.untagMessage(selectedMessage.id, tag.id);
    else await window.mailVault.tagMessage(selectedMessage.id, tag.id);
    const refreshed = await window.mailVault.getMessage(selectedMessage.id);
    setSelectedMessage(refreshed);
    void loadMessages();
  };

  const exportCsv = async () => {
    const result = await window.mailVault.exportCsv(filters);
    if (!result.cancelled) setNotice("Search results exported as CSV.");
  };
  const backupDatabase = async () => {
    const result = await window.mailVault.backupDatabase();
    if (!result.cancelled) setNotice("A portable database backup was saved.");
  };
  const clearArchive = async () => {
    await window.mailVault.clearArchive();
    setShowClearConfirm(false); setSelectedId(null); setSelectedMessage(null); await reloadOverview(); void loadMessages();
    setNotice("The local archive was cleared. Your original export files were not changed.");
  };

  const selectedTagIds = useMemo(() => new Set(selectedMessage?.tags.map(tag => tag.id) ?? []), [selectedMessage]);

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Archive navigation">
        <div className="brand"><div className="brand-mark"><Archive size={20} strokeWidth={2.3} /></div><span>Mail Vault</span></div>
        <div className="archive-chip"><ShieldCheck size={15} /><span>Local-only archive</span></div>

        <button className="import-primary" onClick={importSelectedFiles} disabled={Boolean(importProgress)}><Upload size={17} />Import mail</button>
        <button className="import-secondary" onClick={importSelectedFolder} disabled={Boolean(importProgress)}><FolderOpen size={16} />Import a folder</button>

        <nav className="sidebar-section">
          <p className="sidebar-label">Archive</p>
          <button className={`nav-row ${!activeFolder && !activeTag && !filters.sender ? "selected" : ""}`} onClick={clearFilters}>
            <Inbox size={16} /><span>All mail</span><em>{stats.totalMessages.toLocaleString()}</em>
          </button>
        </nav>

        <section className="sidebar-section folder-section">
          <div className="section-heading"><p className="sidebar-label">Folders</p><span>{options.folders.length}</span></div>
          <div className="folder-list">
            {stats.folders.map(folder => <button key={folder.name} className={`nav-row ${activeFolder === folder.name ? "selected" : ""}`} onClick={() => setFolder(folder.name)} title={folder.name}>
              <FolderOpen size={15} /><span>{folder.name}</span><em>{folder.count.toLocaleString()}</em>
            </button>)}
            {!stats.folders.length && <p className="sidebar-empty">Folders appear after import.</p>}
          </div>
        </section>

        <section className="sidebar-section tag-section">
          <div className="section-heading"><p className="sidebar-label">Tags</p><button className="icon-button compact" title="Create tag" onClick={() => setShowTagComposer(true)}><Plus size={15} /></button></div>
          <div className="tag-list">
            {tags.map(tag => <button key={tag.id} className={`tag-nav ${activeTag === tag.id ? "selected" : ""}`} onClick={() => setTagFilter(activeTag === tag.id ? null : tag.id)}><i style={{ backgroundColor: tag.color }} /><span>{tag.name}</span></button>)}
            {!tags.length && <p className="sidebar-empty">Use tags to group key mail.</p>}
          </div>
        </section>

        <div className="sidebar-bottom">
          <button className="location-row" onClick={() => void window.mailVault.showArchiveFolder()} title={archivePath}><HardDrive size={15} /><span>Open archive data</span></button>
          <p>Nothing leaves this Mac.</p>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <form className="search-box" onSubmit={applySearch}>
            <Search size={18} /><input ref={searchRef} value={queryInput} onChange={event => setQueryInput(event.target.value)} placeholder="Search subject, sender, or content" aria-label="Search archive" />
            {queryInput && <button type="button" className="clear-search" onClick={() => { setQueryInput(""); setFilters(current => ({ ...current, query: undefined, page: 0 })); }} aria-label="Clear search"><X size={15} /></button>}
            <kbd>⌘ K</kbd>
          </form>
          <div className="topbar-actions">
            <button className="quiet-button" onClick={exportCsv} disabled={!hasArchive}><FileDown size={16} />Export index</button>
            <button className="quiet-button" onClick={backupDatabase} disabled={!hasArchive}><FileArchive size={16} />Back up</button>
          </div>
        </header>

        {importProgress && <div className="import-status" role="status"><div className="import-status-copy"><span className="pulse-dot" /><strong>{importProgress.phase === "scanning" ? "Preparing import" : importProgress.phase === "complete" ? "Import complete" : "Indexing your archive"}</strong><span>{importProgress.filename || "Reading local files…"}</span></div><div className="progress-track"><div style={{ width: `${importPercentage}%` }} /></div><span>{importProgress.imported.toLocaleString()} added</span></div>}
        {notice && <div className="notice"><Check size={16} /><span>{notice}</span><button onClick={() => setNotice(null)} aria-label="Dismiss notification"><X size={15} /></button></div>}

        {!hasArchive && !importProgress ? <EmptyArchive onFiles={importSelectedFiles} onFolder={importSelectedFolder} /> : <>
          <section className="archive-overview">
            <div><p className="eyebrow">Private archive</p><h1>Your mail, searchable.</h1><p className="subtle">{stats.totalMessages.toLocaleString()} messages indexed locally. No account connection required.</p></div>
            <div className="overview-stats"><Stat label="Messages" value={stats.totalMessages.toLocaleString()} /><Stat label="Attachments" value={stats.totalAttachments.toLocaleString()} /><Stat label="Archive size" value={formatBytes(stats.totalSizeBytes)} /></div>
          </section>

          <div className="content-grid">
            <section className="message-panel">
              <div className="message-toolbar">
                <div><h2>{filters.query ? "Search results" : activeFolder || (activeTag ? tags.find(tag => tag.id === activeTag)?.name : "All mail")}</h2><p>{messagePage.total.toLocaleString()} messages {matchingText}</p></div>
                <div className="filter-controls">
                  <select value={filters.folder ?? ""} onChange={event => setFolder(event.target.value || null)} aria-label="Filter by folder"><option value="">All folders</option>{options.folders.map(folder => <option key={folder} value={folder}>{folder}</option>)}</select>
                  <select value={filters.sender ?? ""} onChange={event => setFilters(current => ({ ...current, sender: event.target.value || undefined, page: 0 }))} aria-label="Filter by sender"><option value="">All senders</option>{options.senders.map(sender => <option key={sender.email} value={sender.email}>{sender.name ? `${sender.name} · ${sender.email}` : sender.email}</option>)}</select>
                  <input className="date-filter" type="date" value={toDateInput(filters.dateFrom)} onChange={event => setFilters(current => ({ ...current, dateFrom: event.target.value ? new Date(`${event.target.value}T00:00:00`).getTime() : undefined, page: 0 }))} aria-label="Messages from date" title="From date" />
                  <input className="date-filter" type="date" value={toDateInput(filters.dateTo)} onChange={event => setFilters(current => ({ ...current, dateTo: event.target.value ? new Date(`${event.target.value}T23:59:59.999`).getTime() : undefined, page: 0 }))} aria-label="Messages to date" title="To date" />
                  {activeFilterCount > 0 && <button className="reset-filter" onClick={clearFilters}>Reset</button>}
                </div>
              </div>
              <MessageList messages={messagePage.items} selectedId={selectedId} onSelect={setSelectedId} />
              <div className="pagination"><span>{messagePage.total ? `${messagePage.page * PAGE_SIZE + 1}–${Math.min((messagePage.page + 1) * PAGE_SIZE, messagePage.total)} of ${messagePage.total.toLocaleString()}` : "No messages"}</span><div><button className="icon-button" disabled={messagePage.page === 0} onClick={() => setFilters(current => ({ ...current, page: Math.max((current.page ?? 0) - 1, 0) }))}><ChevronLeft size={17} /></button><button className="icon-button" disabled={(messagePage.page + 1) * PAGE_SIZE >= messagePage.total} onClick={() => setFilters(current => ({ ...current, page: (current.page ?? 0) + 1 }))}><ChevronRight size={17} /></button></div></div>
            </section>
            <MessageDetail message={selectedMessage} tags={tags} selectedTagIds={selectedTagIds} onToggleTag={toggleTag} />
          </div>
        </>}
      </section>

      {showTagComposer && <div className="modal-backdrop" role="presentation"><form className="modal" onSubmit={saveTag}><button type="button" className="modal-close" onClick={() => setShowTagComposer(false)}><X size={18} /></button><div className="modal-icon"><TagIcon size={21} /></div><h2>Create a tag</h2><p>Tags stay in your local Mail Vault database.</p><label>Tag name<input autoFocus value={tagName} onChange={event => setTagName(event.target.value)} placeholder="e.g. Dissertation" maxLength={50} /></label><span className="color-label">Colour</span><div className="color-options">{COLORS.map(color => <button type="button" key={color} className={tagColor === color ? "active" : ""} style={{ backgroundColor: color }} onClick={() => setTagColor(color)} aria-label={`Choose ${color}`}>{tagColor === color && <Check size={14} />}</button>)}</div><div className="modal-actions"><button type="button" className="quiet-button" onClick={() => setShowTagComposer(false)}>Cancel</button><button className="import-primary" type="submit">Create tag</button></div></form></div>}

      {showClearConfirm && <div className="modal-backdrop" role="presentation"><section className="modal danger-modal"><div className="modal-icon danger"><Trash2 size={21} /></div><h2>Clear this local archive?</h2><p>This removes indexed mail, tags, and search data from Mail Vault. It does not alter your original `.eml` or `.mbox` export files.</p><div className="modal-actions"><button className="quiet-button" onClick={() => setShowClearConfirm(false)}>Keep archive</button><button className="danger-button" onClick={() => void clearArchive()}>Clear local archive</button></div></section></div>}

      {hasArchive && <button className="danger-link" onClick={() => setShowClearConfirm(true)}><Trash2 size={14} />Clear archive</button>}
    </main>
  );
}

function EmptyArchive({ onFiles, onFolder }: { onFiles: () => void; onFolder: () => void }) {
  return <section className="empty-state"><div className="empty-illustration"><div className="mail-card card-back"><Mail size={25} /></div><div className="mail-card card-front"><Archive size={31} /></div><span className="spark one" /><span className="spark two" /></div><p className="eyebrow">Ready when you are</p><h1>Build a private mail archive.</h1><p>Import an approved `.eml` collection or `.mbox` file. Mail Vault indexes it entirely on this Mac—without signing in to Outlook or sending your messages anywhere.</p><div className="empty-actions"><button className="import-primary" onClick={onFiles}><Upload size={17} />Choose email files</button><button className="quiet-button dark-outline" onClick={onFolder}><FolderOpen size={17} />Choose a folder</button></div><div className="format-note"><ShieldCheck size={17} /><span><strong>Local by design.</strong> Supports `.eml`, `.mbox`, and `.mbx` archives. Original files stay untouched.</span></div><div className="start-steps"><div><i>1</i><span>Get an approved personal mail export</span></div><div><i>2</i><span>Choose it here</span></div><div><i>3</i><span>Search your archive instantly</span></div></div></section>;
}

function Stat({ label, value }: { label: string; value: string }) { return <div className="overview-stat"><span>{label}</span><strong>{value}</strong></div>; }

function MessageList({ messages, selectedId, onSelect }: { messages: ArchiveMessage[]; selectedId: number | null; onSelect: (id: number) => void }) {
  if (!messages.length) return <div className="no-results"><Search size={24} /><strong>No messages found</strong><span>Try a broader search or clear a filter.</span></div>;
  return <div className="message-list">{messages.map(message => <button className={`message-row ${selectedId === message.id ? "selected" : ""}`} key={message.id} onClick={() => onSelect(message.id)}><div className="sender-line"><strong>{messageSender(message)}</strong><time>{formatCompactDate(message.dateMs)}</time></div><div className="subject-line"><span>{message.subject}</span>{message.hasAttachments && <Paperclip size={14} />}</div><p>{message.snippet || "No plain-text preview available."}</p><div className="row-footer"><span className="folder-pill">{message.folder || "Imported mail"}</span>{message.tags.slice(0, 2).map(tag => <span className="tiny-tag" key={tag.id}><i style={{ backgroundColor: tag.color }} />{tag.name}</span>)}</div></button>)}</div>;
}

function MessageDetail({ message, tags, selectedTagIds, onToggleTag }: { message: ArchiveMessageDetail | null; tags: Tag[]; selectedTagIds: Set<number>; onToggleTag: (tag: Tag) => void }) {
  const [showTagMenu, setShowTagMenu] = useState(false);
  useEffect(() => setShowTagMenu(false), [message?.id]);
  if (!message) return <aside className="detail-panel detail-empty"><Mail size={29} /><h2>Select a message</h2><p>Choose a message from the archive to read it here.</p></aside>;
  const sender = message.senderName || message.senderEmail || "Unknown sender";
  return <aside className="detail-panel"><div className="detail-header"><div className="sender-avatar">{sender.slice(0, 1).toUpperCase()}</div><div><strong>{sender}</strong><span>{message.senderEmail || "No sender address"}</span></div><time>{formatDate(message.dateMs, true)}</time></div><div className="detail-subject"><h2>{message.subject}</h2><div className="detail-meta"><span><FolderOpen size={14} />{message.folder}</span>{message.attachmentCount > 0 && <span><Paperclip size={14} />{message.attachmentCount} attachment{message.attachmentCount === 1 ? "" : "s"} indexed</span>}</div></div><div className="tag-bar"><div className="message-tags">{message.tags.map(tag => <span className="message-tag" key={tag.id}><i style={{ backgroundColor: tag.color }} />{tag.name}</span>)}</div><div className="tag-menu-wrap"><button className="add-tag-button" onClick={() => setShowTagMenu(value => !value)}><Plus size={14} />Tag</button>{showTagMenu && <div className="tag-menu">{tags.length ? tags.map(tag => <button key={tag.id} onClick={() => void onToggleTag(tag)}><i style={{ backgroundColor: tag.color }} />{tag.name}{selectedTagIds.has(tag.id) && <Check size={14} />}</button>) : <span>Create a tag from the sidebar first.</span>}</div>}</div></div><div className="message-body">{message.recipients && <div className="recipient-line"><span>To</span>{message.recipients}</div>}<article>{message.bodyText || "This message has no readable plain-text body. Its headers and metadata are still indexed."}</article></div><footer className="message-footer"><span>Imported locally · {formatBytes(message.sizeBytes)}</span><span className="message-id">{message.messageId || "No Message-ID"}</span></footer></aside>;
}

export default App;
