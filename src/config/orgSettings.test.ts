import { describe, expect, it } from 'vitest';
import { MemoryAdapter } from '../storage/memory';
import { defaultConfig } from './config';
import {
  configFrom,
  loadOrgSettings,
  parseSettings,
  saveOrgSettings,
  serializeSettings,
  settingsFromConfig,
} from './orgSettings';

describe('orgSettings', () => {
  const settings = settingsFromConfig({ ...defaultConfig(), orgName: 'Acme', chatLanguage: 'it', model: 'sonnet' });

  it('round-trips through serialize/parse', () => {
    expect(parseSettings(serializeSettings(settings))).toEqual(settings);
  });

  it('never carries the api key', () => {
    expect(JSON.stringify(settings)).not.toContain('apiKey');
    expect('apiKey' in settings).toBe(false);
  });

  it('merges defaults on bad json', () => {
    expect(parseSettings('not json')).toEqual(settingsFromConfig(defaultConfig()));
  });

  it('configFrom puts the key back only at runtime', () => {
    const c = configFrom(settings, 'sk-x');
    expect(c.apiKey).toBe('sk-x');
    expect(c.orgName).toBe('Acme');
    expect(c.model).toBe('sonnet');
  });

  it('saves to and loads from the folder', async () => {
    const a = new MemoryAdapter();
    expect(await loadOrgSettings(a)).toBeNull();
    await saveOrgSettings(a, settings);
    expect(await loadOrgSettings(a)).toEqual(settings);
    expect(await a.read('org-model.json')).toContain('Acme');
  });
});
