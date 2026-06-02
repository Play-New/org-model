/** A scripted provider for tests: returns the given turns in order. */

import type { LlmProvider, ProviderTurn } from './types';

export class MockProvider implements LlmProvider {
  private turns: ProviderTurn[];
  private i = 0;
  public requests = 0;

  constructor(turns: ProviderTurn[]) {
    this.turns = turns;
  }

  async run(): Promise<ProviderTurn> {
    this.requests++;
    return this.turns[Math.min(this.i++, this.turns.length - 1)];
  }
}
