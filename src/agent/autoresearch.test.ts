import { describe, expect, it } from 'vitest';
import { cleanModel } from '../orgmodel/fixtures';
import type { LintFinding } from '../orgmodel/lint';
import { saveContract, saveNode } from '../orgmodel/store';
import { MemoryAdapter } from '../storage/memory';
import { improveUntilClean, planImprovements } from './autoresearch';
import { MockProvider } from './mock';
import type { ProviderTurn } from './types';

describe('planImprovements', () => {
  it('turns findings into instructions, errors first', () => {
    const findings: LintFinding[] = [
      { level: 'warn', code: 'contract.no-get', target: 'clients', message: 'no get' },
      { level: 'error', code: 'node.bad-dependency', target: 'ops', message: 'bad dep' },
      { level: 'warn', code: 'gate.uncovered-contract', target: 'partners', message: 'uncovered' },
    ];
    const tasks = planImprovements(findings);
    expect(tasks[0].target).toBe('ops'); // error first
    expect(tasks[0].priority).toBe(0);
    expect(tasks.find(t => t.code === 'contract.no-get')!.instruction).toContain('get-leg');
    // gate findings outrank plain warnings
    expect(tasks[1].code).toBe('gate.uncovered-contract');
  });
});

describe('improveUntilClean', () => {
  async function seedClean(): Promise<MemoryAdapter> {
    const a = new MemoryAdapter();
    const m = cleanModel();
    for (const c of m.contracts) await saveContract(a, c);
    for (const n of m.nodes) await saveNode(a, n);
    for (const id of ['site', 'accounts', 'org-chart', 'contract-doc']) await a.write(`sources/${id}.md`, 'doc');
    return a;
  }

  it('returns clean immediately when the model is already clean', async () => {
    const a = await seedClean();
    const idle = new MockProvider([{ stopReason: 'end_turn', content: [{ type: 'text', text: 'ok' }] }]);
    const res = await improveUntilClean({ provider: idle, system: 's', adapter: a });
    expect(res).toEqual({ rounds: 0, clean: true, remaining: 0 });
    expect(idle.requests).toBe(0); // never needed the model
  });

  it('stops without looping forever when the agent makes no progress', async () => {
    const a = new MemoryAdapter();
    await saveContract(a, {
      id: 'x', parties: 'X', give: 'a', get: '', terms: [], signals: { outbound: [], inbound: [] }, sources: [],
    });
    const noop: ProviderTurn = { stopReason: 'end_turn', content: [{ type: 'text', text: 'cannot' }] };
    const res = await improveUntilClean({ provider: new MockProvider([noop]), system: 's', adapter: a, maxRounds: 5 });
    expect(res.clean).toBe(false);
    expect(res.remaining).toBeGreaterThan(0);
    expect(res.rounds).toBeLessThan(5); // bailed on no-progress, didn't burn all rounds
  });
});
