import { describe, expect, it } from 'vitest';
import { humanizeError } from './errors';

// Identity translator: assert which i18n key each error maps to (wording is the
// dictionary's concern, tested elsewhere).
const k = (key: string) => key;

describe('humanizeError', () => {
  it('maps a 401 by status', () => {
    expect(humanizeError({ status: 401, message: 'unauthorized' }, k)).toBe('err.keyRejected');
  });

  it('maps a 401 by message when there is no status', () => {
    expect(humanizeError(new Error('401 invalid x-api-key'), k)).toBe('err.keyRejected');
  });

  it('maps rate limiting', () => {
    expect(humanizeError({ status: 429 }, k)).toBe('err.rateLimited');
  });

  it('maps overloaded', () => {
    expect(humanizeError(new Error('529 overloaded_error'), k)).toBe('err.overloaded');
  });

  it('maps a network failure', () => {
    expect(humanizeError(new TypeError('Failed to fetch'), k)).toBe('err.network');
  });

  it('falls back to the raw message', () => {
    expect(humanizeError(new Error('something specific broke'), k)).toBe('something specific broke');
  });

  it('never returns an empty string', () => {
    expect(humanizeError('', k)).toBe('err.generic');
  });
});
