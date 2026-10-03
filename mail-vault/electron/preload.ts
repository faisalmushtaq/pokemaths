import { contextBridge, ipcRenderer } from "electron";
import type { MailVaultApi } from "./shared";

const api: MailVaultApi = {
  chooseEmailFiles: () => ipcRenderer.invoke("archive:choose-email-files"),
  chooseEmailFolder: () => ipcRenderer.invoke("archive:choose-email-folder"),
  importPaths: paths => ipcRenderer.invoke("archive:import-paths", paths),
  getStats: () => ipcRenderer.invoke("archive:get-stats"),
  getOptions: () => ipcRenderer.invoke("archive:get-options"),
  searchMessages: filters => ipcRenderer.invoke("archive:search-messages", filters),
  getMessage: id => ipcRenderer.invoke("archive:get-message", id),
  listTags: () => ipcRenderer.invoke("archive:list-tags"),
  createTag: (name, color) => ipcRenderer.invoke("archive:create-tag", { name, color }),
  tagMessage: (messageId, tagId) => ipcRenderer.invoke("archive:tag-message", { messageId, tagId }),
  untagMessage: (messageId, tagId) => ipcRenderer.invoke("archive:untag-message", { messageId, tagId }),
  exportCsv: filters => ipcRenderer.invoke("archive:export-csv", filters),
  backupDatabase: () => ipcRenderer.invoke("archive:backup-database"),
  showArchiveFolder: () => ipcRenderer.invoke("archive:show-folder"),
  clearArchive: () => ipcRenderer.invoke("archive:clear"),
  getArchiveLocation: () => ipcRenderer.invoke("archive:get-location"),
  onImportProgress: listener => {
    const wrapped = (_event: Electron.IpcRendererEvent, progress: Parameters<typeof listener>[0]) => listener(progress);
    ipcRenderer.on("archive:import-progress", wrapped);
    return () => ipcRenderer.removeListener("archive:import-progress", wrapped);
  },
};

contextBridge.exposeInMainWorld("mailVault", api);
