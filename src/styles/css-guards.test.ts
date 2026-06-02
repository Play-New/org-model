/** Regression guards for CSS specificity traps caught by eye. */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const css = readFileSync(fileURLToPath(new URL('./app.css', import.meta.url)), 'utf8');

describe('app.css guards', () => {
  it('no generic ".set input" rule (it leaked padding onto the custom radios → ovals)', () => {
    // the text-input rule must be scoped ".set input:not([type=\"radio\"])"
    expect(/\.set input\s*\{/.test(css)).toBe(false);
  });

  it('the custom radio is explicitly unpadded and sized', () => {
    expect(css).toMatch(/input\[type="radio"\][^{]*\{[^}]*padding:\s*0/);
  });
});
