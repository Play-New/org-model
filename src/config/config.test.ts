import { describe, expect, it } from 'vitest';
import { defaultConfig, isReady } from './config';

describe('config', () => {
  it('has sane defaults and no persisted key', () => {
    const c = defaultConfig();
    expect(c.model).toBe('opus');
    expect(c.orgName).toBe('');
    expect(c.apiKey).toBe('');
  });

  it('isReady needs a name and a key', () => {
    expect(isReady(defaultConfig())).toBe(false);
    expect(isReady({ ...defaultConfig(), orgName: 'Acme', apiKey: 'sk' })).toBe(true);
    expect(isReady({ ...defaultConfig(), orgName: 'Acme' })).toBe(false);
    expect(isReady({ ...defaultConfig(), apiKey: 'sk' })).toBe(false);
  });
});
