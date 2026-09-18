import { describe, expect, it } from "vitest";
import { parseEml, splitMbox } from "../electron/mail-parser";

const first = `From: Ada Lovelace <ada@example.edu>\nTo: Student <student@example.edu>\nSubject: First message\nDate: Mon, 1 Jan 2024 09:30:00 +0000\nMessage-ID: <first@example.edu>\nContent-Type: text/plain; charset=utf-8\n\nHello from the first message.\n`;
const second = `From: Grace Hopper <grace@example.edu>\nTo: Student <student@example.edu>\nSubject: Second message\nDate: Tue, 2 Jan 2024 10:30:00 +0000\nMessage-ID: <second@example.edu>\nContent-Type: text/plain; charset=utf-8\n\n>From is preserved in original text.\n`;

describe("email import parser", () => {
  it("parses RFC 5322 headers and body from an EML message", async () => {
    const parsed = await parseEml(Buffer.from(first));
    expect(parsed.subject).toBe("First message");
    expect(parsed.senderEmail).toBe("ada@example.edu");
    expect(parsed.messageId).toBe("<first@example.edu>");
    expect(parsed.bodyText).toContain("Hello from the first message.");
  });

  it("splits an MBOXRD archive and reverses one level of From escaping", () => {
    const mbox = `From ada@example.edu Mon Jan  1 09:30:00 2024\n${first}From grace@example.edu Tue Jan  2 10:30:00 2024\n${second}`;
    const messages = splitMbox(Buffer.from(mbox));
    expect(messages).toHaveLength(2);
    expect(messages[1].toString()).toContain("From is preserved in original text.");
  });
});
