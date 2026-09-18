import PostalMime from "postal-mime";

export type ParsedEmail = {
  messageId: string | null;
  subject: string;
  senderName: string | null;
  senderEmail: string | null;
  recipients: string | null;
  dateMs: number | null;
  bodyText: string;
  html: string | null;
  attachmentCount: number;
  hasAttachments: boolean;
  sizeBytes: number;
  fingerprintInput: string;
};

type Address = { name?: string; address?: string };

function addressList(value: unknown): Address[] {
  const input = Array.isArray(value) ? value : value ? [value] : [];
  return input
    .filter((item): item is Address => Boolean(item && typeof item === "object"))
    .filter(item => Boolean(item.address || item.name));
}

function formatAddresses(value: unknown): string | null {
  const addresses = addressList(value);
  if (!addresses.length) return null;
  return addresses
    .map(item => item.name && item.address ? `${item.name} <${item.address}>` : item.address || item.name || "")
    .filter(Boolean)
    .join(", ");
}

function firstAddress(value: unknown): Address | null {
  return addressList(value)[0] ?? null;
}

function headerValue(raw: string, name: string): string | null {
  const pattern = new RegExp(`^${name}:\\s*([^\\r\\n]*(?:\\r?\\n[ \\t][^\\r\\n]*)*)`, "im");
  const match = raw.match(pattern);
  return match ? match[1].replace(/\r?\n[ \t]+/g, " ").trim() : null;
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>|<\/div>|<\/li>|<\/tr>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function asDateMs(value: unknown): number | null {
  if (!value) return null;
  const date = new Date(String(value));
  const ms = date.getTime();
  return Number.isFinite(ms) ? ms : null;
}

/** Parses one RFC 5322 email message. No network access is used. */
export async function parseEml(raw: Buffer): Promise<ParsedEmail> {
  const parser = new PostalMime();
  const mail = await parser.parse(raw);
  const typed = mail as Record<string, unknown>;
  const sender = firstAddress(typed.from);
  const html = typeof typed.html === "string" ? typed.html : null;
  const text = typeof typed.text === "string" ? typed.text : "";
  const bodyText = (text || (html ? htmlToText(html) : "")).trim();
  const attachments = Array.isArray(typed.attachments) ? typed.attachments : [];
  const messageId = headerValue(raw.toString("utf8", 0, Math.min(raw.length, 65536)), "Message-ID");
  const subject = typeof typed.subject === "string" && typed.subject.trim() ? typed.subject.trim() : "(No subject)";

  return {
    messageId,
    subject,
    senderName: sender?.name?.trim() || null,
    senderEmail: sender?.address?.trim().toLowerCase() || null,
    recipients: [formatAddresses(typed.to), formatAddresses(typed.cc)].filter(Boolean).join(", ") || null,
    dateMs: asDateMs(typed.date) ?? asDateMs(headerValue(raw.toString("utf8", 0, Math.min(raw.length, 65536)), "Date")),
    bodyText,
    html,
    attachmentCount: attachments.length,
    hasAttachments: attachments.length > 0,
    sizeBytes: raw.length,
    fingerprintInput: `${messageId ?? ""}\n${subject}\n${sender?.address ?? ""}\n${typed.date ?? ""}\n${bodyText.slice(0, 4096)}`,
  };
}

/**
 * Splits common MBOX/MBOXRD files. MBOX separator lines include a sender and
 * weekday; this avoids treating ordinary body text beginning with "From " as a
 * new email. MBOXRD escaping is then reversed before parsing each message.
 */
export function splitMbox(content: Buffer): Buffer[] {
  const text = content.toString("binary");
  const separator = /^From\s+\S+\s+(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+/gm;
  const starts = [...text.matchAll(separator)].map(match => match.index ?? 0);
  if (!starts.length) return [content];

  const messages: Buffer[] = [];
  for (let index = 0; index < starts.length; index += 1) {
    const lineEnd = text.indexOf("\n", starts[index]);
    const bodyStart = lineEnd === -1 ? text.length : lineEnd + 1;
    const nextStart = index + 1 < starts.length ? starts[index + 1] : text.length;
    const email = text.slice(bodyStart, nextStart).replace(/^>(>*From )/gm, "$1");
    if (email.trim()) messages.push(Buffer.from(email, "binary"));
  }
  return messages;
}
