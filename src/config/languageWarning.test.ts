import { describe, expect, it } from 'vitest';
import { needsTranslationWarning } from './languageWarning';

describe('needsTranslationWarning', () => {
  it('warns when the model language changes and content already exists', () => {
    expect(needsTranslationWarning('en', 'it', true)).toBe(true);
  });

  it('stays silent when the language is unchanged', () => {
    expect(needsTranslationWarning('en', 'en', true)).toBe(false);
  });

  it('stays silent when there is no content yet', () => {
    expect(needsTranslationWarning('en', 'it', false)).toBe(false);
  });
});
