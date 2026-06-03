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
        parties: 'Clients',
        give: 'delivered design work',
        get: 'fees',
        terms: ['agreed scope', 'deadlines'],
        signals: {
          outbound: [{ what: 'projects shipped', value: '24/yr' }],
          inbound: [{ what: 'revenue', value: '€1.2M' }],
        },
        sources: [{ sourceId: 'site', locator: 'work' }, { sourceId: 'accounts' }],
      },
      {
        id: 'partners',
        parties: 'Partners',
        give: 'referrals and co-delivery',
        get: 'leads and extra capacity',
        terms: ['quality bar'],
        signals: {
          outbound: [{ what: 'joint projects' }],
          inbound: [{ what: 'referred leads' }],
        },
        sources: [{ sourceId: 'contract-doc' }],
      },
    ],
    nodes: [
      {
        id: 'delivery',
        name: 'Delivery',
        archetype: 'core',
        keeps: ['clients'],
        reliesOn: ['ops'],
        madeOf: 'designers, PMs, the studio method',
        needs: 'staffed designers, a filled pipeline',
        sources: [{ sourceId: 'org-chart' }],
      },
      {
        id: 'bizdev',
        name: 'Business development',
        archetype: 'core',
        keeps: ['partners', 'clients'],
        reliesOn: [],
        madeOf: 'partnerships lead, the network',
        needs: 'active partner relationships',
        sources: [{ sourceId: 'org-chart' }],
      },
      {
        id: 'ops',
        name: 'Operations',
        archetype: 'supporting',
        keeps: ['clients'],
        reliesOn: [],
        madeOf: 'project tooling, scheduling',
        needs: 'the toolchain running',
        sources: [{ sourceId: 'org-chart' }],
      },
      {
        id: 'admin',
        name: 'Admin',
        archetype: 'platform',
        keeps: [],
        reliesOn: [],
        madeOf: 'finance, legal',
        needs: 'compliance up to date',
        sources: [{ sourceId: 'org-chart' }],
      },
    ],
  };
}
