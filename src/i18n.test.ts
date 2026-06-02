import { describe, expect, it } from 'vitest';
import { LANGS, STRINGS, translate } from './i18n';

describe('i18n dictionary', () => {
  it('every key is translated, non-empty, in all six languages', () => {
    for (const [key, entry] of Object.entries(STRINGS)) {
      for (const lang of LANGS) {
        expect(entry[lang], `${key} / ${lang}`).toBeTruthy();
      }
    }
  });

  it('fills {0} placeholders with vars', () => {
    expect(translate('it', 'wiz.missing', 'un nome')).toBe('Manca ancora un nome.');
    expect(translate('en', 'chat.images', 3)).toBe('3 image(s)');
  });

  it('falls back to the key when missing', () => {
    expect(translate('en', 'does.not.exist')).toBe('does.not.exist');
  });
});
