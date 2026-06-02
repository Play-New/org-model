/** Decide how a picked/dropped file enters the chat: an image goes to the model
 *  as vision; a PDF goes as a native document block; a text document goes in as
 *  text the agent can read and cite; the rest is unsupported (e.g. Office formats
 *  — export them to PDF). */

export type AttachmentKind = 'image' | 'text' | 'pdf' | 'unsupported';

const TEXT_EXT = /\.(md|markdown|txt|text|csv|tsv|json|ya?ml|html?|log|xml)$/i;

export function classifyAttachment(name: string, type: string): AttachmentKind {
  if (type.startsWith('image/')) return 'image';
  if (type === 'application/pdf' || /\.pdf$/i.test(name)) return 'pdf';
  if (type.startsWith('text/') || type === 'application/json' || TEXT_EXT.test(name)) return 'text';
  return 'unsupported';
}
