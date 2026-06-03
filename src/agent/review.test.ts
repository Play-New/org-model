import { describe, expect, it } from 'vitest';
import { emptyModel } from '../orgmodel/model';
import type { LlmProvider, ProviderTurn } from './types';
import { parseFindings, semanticFindings } from './review';

describe('parseFindings', () => {
  it('extracts a JSON array embedded in prose', () => {
    const text = 'Here is what I found:\n[{"target":"clients","kind":"gives-gets-mismatch","message":"The note describes a subscription but org-gets says one-off."}]\nThat is all.';
    const f = parseFindings(text);
    expect(f).toHaveLength(1);
    expect(f[0].target).toBe('clients');
    expect(f[0].kind).toBe('gives-gets-mismatch');
  });

  it('returns [] for an empty array or garbage', () => {
    expect(parseFindings('All coherent: []')).toEqual([]);
    expect(parseFindings('no json here')).toEqual([]);
    expect(parseFindings('[not valid json')).toEqual([]);
  });

  it('drops items without a message and defaults a missing kind', () => {
    const f = parseFindings('[{"target":"x"},{"target":"y","message":"off"}]');
    expect(f).toHaveLength(1);
    expect(f[0].target).toBe('y');
    expect(f[0].kind).toBe('incoherence');
  });
});

describe('semanticFindings', () => {
  it('asks the provider and parses its reply', async () => {
    const provider: LlmProvider = {
      run: async (): Promise<ProviderTurn> => ({
        content: [{ type: 'text', text: '[{"target":"donors","kind":"promise-louder","message":"org-gives claims impact the signals do not show."}]' }],
        stopReason: 'end_turn',
      }),
    };
    const findings = await semanticFindings({ provider, system: 'sys', model: emptyModel() });
    expect(findings).toEqual([
      { target: 'donors', kind: 'promise-louder', message: 'org-gives claims impact the signals do not show.' },
    ]);
  });
});
