import { describe, expect, it } from 'vitest';
import { classifyAttachment, officeKind } from './attachments';

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

  it('treats Office files as office — by mime or by extension', () => {
    expect(classifyAttachment('deck.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation')).toBe('office');
    expect(classifyAttachment('Bilancio.xlsx', '')).toBe('office');
    expect(classifyAttachment('statuto.docx', '')).toBe('office');
    expect(classifyAttachment('legacy.xls', '')).toBe('office');
  });

  it('leaves the rest unsupported', () => {
    expect(classifyAttachment('archive.zip', 'application/zip')).toBe('unsupported');
    expect(classifyAttachment('video.mp4', 'video/mp4')).toBe('unsupported');
  });

  it('classifies the Office family by mime first, then extension', () => {
    expect(officeKind('a.docx', '')).toBe('docx');
    expect(officeKind('a.xlsx', '')).toBe('xlsx');
    expect(officeKind('a.pptx', '')).toBe('pptx');
    expect(officeKind('mislabelled', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')).toBe('xlsx');
    expect(officeKind('notes.txt', 'text/plain')).toBeNull();
  });
});
