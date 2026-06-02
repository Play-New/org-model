/** Load the model + lint from an adapter, with a reload the chat calls after writes. */

import { useCallback, useEffect, useState } from 'react';
import { lint, type LintFinding } from '../orgmodel/lint';
import { emptyModel, type OrgModel } from '../orgmodel/model';
import { listSourceIds, loadModel } from '../orgmodel/store';
import type { StorageAdapter } from '../storage/adapter';

export interface ModelState {
  model: OrgModel;
  findings: LintFinding[];
  loading: boolean;
  reload: () => Promise<void>;
}

export function useModel(adapter: StorageAdapter): ModelState {
  const [model, setModel] = useState<OrgModel>(emptyModel());
  const [findings, setFindings] = useState<LintFinding[]>([]);
  const [loading, setLoading] = useState(true);

  // Awaits before any setState, so it's safe to call straight from the effect
  // (no synchronous state updates inside the effect body).
  const reload = useCallback(async () => {
    const m = await loadModel(adapter);
    const sources = await listSourceIds(adapter);
    setModel(m);
    setFindings(lint(m, sources));
    setLoading(false);
  }, [adapter]);

  useEffect(() => {
    // Canonical "sync with an external system" effect: load the model from the
    // adapter on mount / when it changes. reload() awaits before any setState;
    // the lint heuristic can't see past the call, so it's disabled here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
  }, [reload]);

  return { model, findings, loading, reload };
}
