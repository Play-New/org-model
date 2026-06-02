import { describe, expect, it } from 'vitest';
import { slideText } from './extractOffice';

// The pptx parser is pure over the slide XML; the docx/xlsx paths are thin wrappers
// over mammoth/SheetJS (loaded lazily, exercised live). This locks the run/paragraph
// extraction and XML-entity decoding that we hand-rolled.
describe('slideText (pptx slide XML)', () => {
  it('joins runs within a paragraph and puts each paragraph on its own line', () => {
    const xml =
      '<a:p><a:r><a:t>Our </a:t></a:r><a:r><a:t>mission</a:t></a:r></a:p>' +
      '<a:p><a:r><a:t>Fund cancer research</a:t></a:r></a:p>';
    expect(slideText(xml)).toBe('Our mission\nFund cancer research');
  });

  it('decodes XML entities and skips empty paragraphs', () => {
    const xml = '<a:p><a:r><a:t>Donors &amp; partners</a:t></a:r></a:p><a:p></a:p>';
    expect(slideText(xml)).toBe('Donors & partners');
  });

  it('returns empty string when there is no text', () => {
    expect(slideText('<a:p></a:p>')).toBe('');
  });
});
