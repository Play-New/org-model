/** The right column — the largest. Shows the map by default; clicking a contract
 *  or node opens its file here. Toggle between Map and File. */

import { lazy, Suspense } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useT } from '../i18n';
import type { OrgModel } from '../orgmodel/model';
import { contractToMarkdown, nodeToMarkdown } from '../orgmodel/serializer';
import type { ItemKind } from '../orgmodel/viewmodel';

/** Drop the YAML frontmatter so the viewer shows the human-readable body, not the raw file. */
function body(markdown: string): string {
  const m = /^---\n[\s\S]*?\n---\n?/.exec(markdown);
  return m ? markdown.slice(m[0].length).trim() : markdown.trim();
}

const MapPane = lazy(() => import('./MapPane').then(m => ({ default: m.MapPane })));

export type WorkspaceView = 'map' | 'file';
export interface Selection {
  kind: ItemKind;
  id: string;
}

interface WorkspaceProps {
  model: OrgModel;
  selected: Selection | null;
  view: WorkspaceView;
  onView: (v: WorkspaceView) => void;
  onPick: (kind: ItemKind, id: string) => void;
}

export function Workspace({ model, selected, view, onView, onPick }: WorkspaceProps) {
  const t = useT();
  const markdown = (() => {
    if (!selected) return null;
    if (selected.kind === 'contract') {
      const c = model.contracts.find(x => x.id === selected.id);
      return c ? contractToMarkdown(c) : null;
    }
    const n = model.nodes.find(x => x.id === selected.id);
    return n ? nodeToMarkdown(n) : null;
  })();

  return (
    <section className="workspace">
      <div className="workspace__bar">
        <button className={view === 'map' ? 'is-active' : ''} onClick={() => onView('map')}>
          {t('ws.map')}
        </button>
        <button className={view === 'file' ? 'is-active' : ''} onClick={() => onView('file')}>
          {t('ws.file')}
        </button>
        {view === 'file' && selected && <span className="workspace__name">{selected.id}</span>}
      </div>
      <div className={`workspace__body ${view === 'map' ? 'is-flush' : ''}`}>
        {view === 'map' ? (
          <Suspense fallback={<div className="pane__placeholder">…</div>}>
            <MapPane model={model} selectedId={selected?.id ?? null} onPick={onPick} />
          </Suspense>
        ) : markdown ? (
          <div className="prose filedoc">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{body(markdown)}</ReactMarkdown>
          </div>
        ) : (
          <div className="pane__placeholder">{t('ws.pickItem')}</div>
        )}
      </div>
    </section>
  );
}
