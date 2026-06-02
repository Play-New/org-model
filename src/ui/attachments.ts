/** Decide how a picked/dropped file enters the chat: an image goes to the model
 *  as vision; a text document goes in as text the agent can read and cite; the
 *  rest is unsupported (e.g. a PDF — no text/image representation here yet). */

export type AttachmentKind = 'image' | 'text' | 'unsupported';

const TEXT_EXT = /\.(md|markdown|txt|text|csv|tsv|json|ya?ml|html?|log|xml)$/i;

export function classifyAttachment(name: string, type: string): AttachmentKind {
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('text/') || type === 'application/json' || TEXT_EXT.test(name)) return 'text';
  return 'unsupported';
}
