import { describe, expect, it } from 'vitest';
import { classifyAttachment } from './attachments';

describe('classifyAttachment', () => {
  it('treats images as vision', () => {
    expect(classifyAttachment('photo.png', 'image/png')).toBe('image');
    expect(classifyAttachment('scan.jpg', 'image/jpeg')).toBe('image');
  });

  it('treats documents as text — by mime or by extension', () => {
    expect(classifyAttachment('chi-siamo.md', '')).toBe('text');
    expect(classifyAttachment('note.txt', 'text/plain')).toBe('text');
    expect(classifyAttachment('data.json', 'application/json')).toBe('text');
    expect(classifyAttachment('NUMBERS.CSV', '')).toBe('text');
  });

  it('treats PDFs as a native document', () => {
    expect(classifyAttachment('report.pdf', 'application/pdf')).toBe('pdf');
    expect(classifyAttachment('REPORT.PDF', '')).toBe('pdf');
  });

  it('leaves Office and the rest unsupported', () => {
    expect(classifyAttachment('deck.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation')).toBe('unsupported');
    expect(classifyAttachment('archive.zip', 'application/zip')).toBe('unsupported');
  });
});
