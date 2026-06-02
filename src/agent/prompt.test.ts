import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../config/config';
import { buildSystemPrompt } from './prompt';

describe('buildSystemPrompt', () => {
  const config = { ...defaultConfig(), orgName: 'Acme', chatLanguage: 'it', modelLanguage: 'en' };

  it('names the org and both languages', () => {
    const p = buildSystemPrompt({ config });
    expect(p).toContain('Acme');
    expect(p).toContain('Talk with the user in Italian');
    expect(p).toContain('in English, ALWAYS'); // model content written in the model language regardless of the docs
  });

  it('states the lens and the five-step method', () => {
    const p = buildSystemPrompt({ config });
    expect(p).toContain('set of contracts it has with the world');
    expect(p).toContain('core / service / platform');
    expect(p).toContain('documents first');
  });

  it('falls back gracefully when no org name is set', () => {
    const p = buildSystemPrompt({ config: defaultConfig() });
    expect(p).toContain('this organization');
  });

  it('embeds the current model when provided', () => {
    const p = buildSystemPrompt({ config, modelJson: '{"contracts":[],"nodes":[]}' });
    expect(p).toContain('CURRENT MODEL');
    expect(p).toContain('"contracts":[]');
  });
});
