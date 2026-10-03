# Mail Vault

**Mail Vault** is a private desktop email archive for macOS. It imports **approved local email exports** into a SQLite database on the same Mac, then provides fast full-text search, filters, tags, message reading, CSV index export, and database backups.

> **Privacy boundary:** Mail Vault has no Outlook sign-in screen, OAuth flow, background mailbox polling, web API, cloud service, analytics, or telemetry. It does not open network connections to Microsoft or to any other service. It only reads files you explicitly choose through the macOS file picker.

## What it supports

| Capability | Details |
|---|---|
| Import formats | Individual `.eml` messages, `.mbox` / `.mbx` mailbox archives, extensionless MBOX files such as `Inbox`, or a folder tree containing them |
| Message database | A local SQLite database with full-text search across subject, sender, recipients, folder name, and readable message content |
| Organisation | Folder, sender, tag, and date filters; user-created coloured tags |
| Attachments | Indexes attachment counts for each message. It does **not** copy attachments or modify the original export. |
| Duplicates | Skips previously indexed messages using a stable message/content fingerprint |
| Exports | CSV message index for the current search; complete portable SQLite backup |
| Storage | `~/Library/Application Support/Mail Vault/archive/mail-vault.sqlite` on macOS |

## What it deliberately does not do

Mail Vault **cannot and does not attempt to** access Outlook, Microsoft 365, or a university mailbox directly. It also does not accept Outlook `.olm` archives; `.olm` is a proprietary Mac archive format that needs a university-approved conversion to `.eml` or `.mbox` first.

This is intentional. If your institution has disabled export in New Outlook for Mac, do not try to work around that restriction. Ask the IT team for an approved export of **your own** mailbox in `.eml` or `.mbox` format, then import it locally.

### IT request template

> My university Outlook for Mac has New Outlook enforced and the Export command disabled. I need an institution-approved personal archive of my own mailbox for academic-record keeping. Could you provide or permit an export as `.mbox` or a folder of `.eml` files? I will import it into a local-only Mac database; it will not be uploaded or connected to another service. I am not requesting OAuth, API credentials, delegated access, or a bypass of institutional controls.

## Running the app on a Mac

### Requirements

Install the current **Node.js 22 LTS** release from [nodejs.org](https://nodejs.org/). macOS includes the other tools required for development and packaging.

### Run from source

```bash
cd mail-vault
npm install
npm run dev
```

The app opens as a desktop window. Choose **Import mail** for one or more `.eml` / `.mbox` files, or **Import a folder** to include a folder and all its subfolders.

### Package a Mac installer

```bash
cd mail-vault
npm install
npm run package:mac
```

This creates a `.dmg` installer and a `.zip` build in `mail-vault/release/`. The first packaging step creates the native macOS application icon from the supplied source image using built-in `sips` and `iconutil`.

The application is unsigned unless you configure an Apple Developer signing identity. macOS may therefore require you to Control-click the app and choose **Open** after installation. This is expected for a personally built application.

## Daily use

1. Obtain an approved `.eml` / `.mbox` export from your university IT team.
2. Open Mail Vault and import the selected files or folder.
3. Use the search bar to find messages by content, sender, recipient, subject, or folder.
4. Apply filters or create tags for items such as module correspondence, deadlines, or dissertation material.
5. Select **Back up** periodically to write a copy of the SQLite archive to a location you control.

The original email export is never changed. Clearing Mail Vault removes only its **local index and stored readable message content**, not the source export files.

## Security notes

The archive database contains email content. Treat it like the mailbox itself:

- Keep the Mac user account protected with a strong login password and FileVault enabled.
- Store database backups in an encrypted location you control.
- Do not import mail from an untrusted source.
- Keep an original approved export in a separate safe location; the Mail Vault database is a useful searchable copy, not a replacement for the export.

## Development checks

```bash
npm test
npm run typecheck
npm run build
```

The import parser test covers RFC 5322 `.eml` message parsing and standard MBOXRD splitting. No real email data is included in this repository.

## Technology

The app uses Electron, React, SQLite (`better-sqlite3`), and `postal-mime`. Electron’s secure preload bridge exposes a small, named IPC API; the renderer has no direct Node, filesystem, database, shell, or network access.
