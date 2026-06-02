/** Decide how a picked/dropped file enters the chat: an image goes to the model as
 *  vision; a PDF goes via the Files API as a native document; a text document goes in
 *  as text the agent can read and cite; an Office file (docx / xlsx / pptx) is text
 *  once extracted (see extractOffice.ts); the rest is unsupported. */

export type AttachmentKind = 'image' | 'text' | 'pdf' | 'office' | 'unsupported';
export type OfficeKind = 'docx' | 'xlsx' | 'pptx';

const TEXT_EXT = /\.(md|markdown|txt|text|csv|tsv|json|ya?ml|html?|log|xml)$/i;

const OFFICE_MIME: Record<string, OfficeKind> = {
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-excel': 'xlsx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
};

/** The Office family of a file, or null if it isn't one. By mime, else by extension. */
export function officeKind(name: string, type: string): OfficeKind | null {
  if (type && OFFICE_MIME[type]) return OFFICE_MIME[type];
  if (/\.docx$/i.test(name)) return 'docx';
  if (/\.(xlsx|xlsm|xls)$/i.test(name)) return 'xlsx';
  if (/\.pptx$/i.test(name)) return 'pptx';
  return null;
}

export function classifyAttachment(name: string, type: string): AttachmentKind {
  if (type.startsWith('image/')) return 'image';
  if (type === 'application/pdf' || /\.pdf$/i.test(name)) return 'pdf';
  if (officeKind(name, type)) return 'office';
  if (type.startsWith('text/') || type === 'application/json' || TEXT_EXT.test(name)) return 'text';
  return 'unsupported';
}
