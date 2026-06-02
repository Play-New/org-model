/**
 * Test fixtures. Deliberately generic (a small design studio) — not tied to any
 * real org. Used to prove the serializer round-trips and a complete model lints
 * clean.
 */

import type { OrgModel } from './model';

export const KNOWN_SOURCES = new Set(['site', 'accounts', 'org-chart', 'contract-doc']);

/** A complete, well-formed model: lint() should return []. */
export function cleanModel(): OrgModel {
  return {
    contracts: [
      {
        id: 'clients',
        withParty: 'Clients',
        give: 'delivered design work',
        get: 'fees',
        constraints: ['agreed scope', 'deadlines'],
        measures: {
          give: [{ what: 'projects shipped', value: '24/yr' }],
          get: [{ what: 'revenue', value: '€1.2M' }],
        },
        sources: [{ sourceId: 'site', locator: 'work' }, { sourceId: 'accounts' }],
      },
      {
        id: 'partners',
        withParty: 'Partners',
        give: 'referrals and co-delivery',
        get: 'leads and extra capacity',
        constraints: ['quality bar'],
        measures: {
          give: [{ what: 'joint projects' }],
          get: [{ what: 'referred leads' }],
        },
        sources: [{ sourceId: 'contract-doc' }],
      },
    ],
    nodes: [
      {
        id: 'delivery',
        name: 'Delivery',
        orientation: 'core',
        supports: ['clients'],
        dependsOn: ['ops'],
        composition: 'designers, PMs, the studio method',
        needsToday: 'staffed designers, a filled pipeline',
        sources: [{ sourceId: 'org-chart' }],
      },
      {
        id: 'bizdev',
        name: 'Business development',
        orientation: 'core',
        supports: ['partners', 'clients'],
        dependsOn: [],
        composition: 'partnerships lead, the network',
        needsToday: 'active partner relationships',
        sources: [{ sourceId: 'org-chart' }],
      },
      {
        id: 'ops',
        name: 'Operations',
        orientation: 'service',
        supports: ['clients'],
        dependsOn: [],
        composition: 'project tooling, scheduling',
        needsToday: 'the toolchain running',
        sources: [{ sourceId: 'org-chart' }],
      },
      {
        id: 'admin',
        name: 'Admin',
        orientation: 'platform',
        supports: [],
        dependsOn: [],
        composition: 'finance, legal',
        needsToday: 'compliance up to date',
        sources: [{ sourceId: 'org-chart' }],
      },
    ],
  };
}
