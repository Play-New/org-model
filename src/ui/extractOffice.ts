/** Extract readable text from Office files in the browser, so .docx / .xlsx / .pptx
 *  drop into the chat like any text document. The heavy parsers are loaded lazily
 *  (dynamic import → their own chunks) — nothing ships in the main bundle, and they
 *  load only when an Office file is actually attached. Returns null for non-Office
 *  input; throws if a file is recognised but can't be parsed (caller shows it skipped).
 *
 *  docx → mammoth (raw text) · xlsx → SheetJS (each sheet as CSV) · pptx → JSZip
 *  (slide XML, text runs in slide order). */

import { officeKind } from './attachments';

export async function extractOffice(file: File): Promise<string | null> {
  const kind = officeKind(file.name, file.type);
  if (!kind) return null;
  const buf = await file.arrayBuffer();
  if (kind === 'docx') return extractDocx(buf);
  if (kind === 'xlsx') return extractXlsx(buf);
  return extractPptx(buf);
}

async function extractDocx(buf: ArrayBuffer): Promise<string> {
  const mammoth = await import('mammoth');
  const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
  return value.trim();
}

async function extractXlsx(buf: ArrayBuffer): Promise<string> {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(new Uint8Array(buf), { type: 'array' });
  const parts: string[] = [];
  for (const name of wb.SheetNames) {
    const csv = XLSX.utils.sheet_to_csv(wb.Sheets[name]).trim();
    if (csv) parts.push(`## ${name}\n${csv}`);
  }
  return parts.join('\n\n');
}

async function extractPptx(buf: ArrayBuffer): Promise<string> {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(buf);
  const slideFiles = Object.keys(zip.files)
    .filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => slideNumber(a) - slideNumber(b));
  const slides: string[] = [];
  for (let i = 0; i < slideFiles.length; i++) {
    const xml = await zip.files[slideFiles[i]].async('string');
    const text = slideText(xml);
    if (text) slides.push(`## Slide ${i + 1}\n${text}`);
  }
  return slides.join('\n\n');
}

function slideNumber(path: string): number {
  const m = path.match(/slide(\d+)\.xml$/);
  return m ? Number(m[1]) : 0;
}

/** Pull the text runs (<a:t>…</a:t>) out of a slide's XML, one line per paragraph. */
export function slideText(xml: string): string {
  return xml
    .split(/<\/a:p>/)
    .map(p => [...p.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map(m => decodeXml(m[1])).join('').trim())
    .filter(Boolean)
    .join('\n');
}

function decodeXml(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}
