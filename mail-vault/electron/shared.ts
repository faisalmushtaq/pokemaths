export type ArchiveMessage = {
  id: number;
  subject: string;
  senderName: string | null;
  senderEmail: string | null;
  recipients: string | null;
  dateMs: number | null;
  folder: string | null;
  snippet: string;
  hasAttachments: boolean;
  attachmentCount: number;
  tags: Tag[];
};

export type ArchiveMessageDetail = ArchiveMessage & {
  messageId: string | null;
  bodyText: string | null;
  html: string | null;
  sourcePath: string | null;
  sizeBytes: number;
};

export type Tag = {
  id: number;
  name: string;
  color: string;
};

export type SearchFilters = {
  query?: string;
  folder?: string | null;
  sender?: string | null;
  tagId?: number | null;
  dateFrom?: number | null;
  dateTo?: number | null;
  page?: number;
  pageSize?: number;
};

export type MessagePage = {
  items: ArchiveMessage[];
  total: number;
  page: number;
  pageSize: number;
};

export type ArchiveStats = {
  totalMessages: number;
  totalAttachments: number;
  totalSizeBytes: number;
  oldestDate: number | null;
  newestDate: number | null;
  folders: Array<{ name: string; count: number }>;
  correspondents: Array<{ email: string; name: string | null; count: number }>;
};

export type ArchiveOptions = {
  folders: string[];
  senders: Array<{ email: string; name: string | null; count: number }>;
};

export type ImportProgress = {
  phase: "scanning" | "importing" | "complete";
  current: number;
  total: number;
  imported: number;
  skipped: number;
  failed: number;
  filename?: string;
};

export type ImportResult = {
  filesScanned: number;
  messagesFound: number;
  imported: number;
  skipped: number;
  failed: number;
  errors: string[];
};

export type MailVaultApi = {
  chooseEmailFiles: () => Promise<string[] | null>;
  chooseEmailFolder: () => Promise<string[] | null>;
  importPaths: (paths: string[]) => Promise<ImportResult>;
  getStats: () => Promise<ArchiveStats>;
  getOptions: () => Promise<ArchiveOptions>;
  searchMessages: (filters: SearchFilters) => Promise<MessagePage>;
  getMessage: (id: number) => Promise<ArchiveMessageDetail | null>;
  listTags: () => Promise<Tag[]>;
  createTag: (name: string, color: string) => Promise<Tag>;
  tagMessage: (messageId: number, tagId: number) => Promise<void>;
  untagMessage: (messageId: number, tagId: number) => Promise<void>;
  exportCsv: (filters: SearchFilters) => Promise<{ cancelled: boolean; path?: string }>;
  backupDatabase: () => Promise<{ cancelled: boolean; path?: string }>;
  showArchiveFolder: () => Promise<void>;
  clearArchive: () => Promise<void>;
  getArchiveLocation: () => Promise<string>;
  onImportProgress: (listener: (progress: ImportProgress) => void) => () => void;
};

declare global {
  interface Window {
    mailVault: MailVaultApi;
  }
}
