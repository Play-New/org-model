/** The left pane (Org/): contracts, then nodes split into core / supporting / platform,
 *  each item with a fill-state dot and each group with a "to do / ✓" hint. */

import { useT } from '../i18n';
import type { OrgModel } from '../orgmodel/model';
import { buildSidebar, type FillState, incompleteCount, type ItemKind, type SidebarItem } from '../orgmodel/viewmodel';

interface FilesPaneProps {
  model: OrgModel;
  selectedId: string | null;
  onSelect: (kind: ItemKind, id: string) => void;
}

function Dot({ state }: { state: FillState }) {
  return <span className={`dot dot--${state}`} title={state} />;
}

function Group({
  label,
  items,
  selectedId,
  onSelect,
}: {
  label: string;
  items: SidebarItem[];
  selectedId: string | null;
  onSelect: (kind: ItemKind, id: string) => void;
}) {
  const t = useT();
  const missing = incompleteCount(items);
  const hint = items.length === 0 ? '—' : missing > 0 ? t('files.todo', missing) : '✓';
  return (
    <div className="org__group">
      <div className="org__title">
        <span>{label}</span>
        <span className={`org__count ${missing > 0 ? 'is-missing' : ''}`}>{hint}</span>
      </div>
      {items.map(it => (
        <button
          key={`${it.kind}:${it.id}`}
          className={`org__item ${selectedId === it.id ? 'is-selected' : ''}`}
          onClick={() => onSelect(it.kind, it.id)}
        >
          <Dot state={it.state} />
          <span className="org__label">{it.label}</span>
        </button>
      ))}
      {items.length === 0 && <div className="org__empty">{t('files.empty')}</div>}
    </div>
  );
}

export function FilesPane({ model, selectedId, onSelect }: FilesPaneProps) {
  const t = useT();
  const s = buildSidebar(model);
  return (
    <nav className="org">
      <Group label={t('files.contracts')} items={s.contracts} selectedId={selectedId} onSelect={onSelect} />
      <div className="org__section">{t('files.nodes')}</div>
      <Group label="Core" items={s.core} selectedId={selectedId} onSelect={onSelect} />
      <Group label="Supporting" items={s.supporting} selectedId={selectedId} onSelect={onSelect} />
      <Group label="Platform" items={s.platform} selectedId={selectedId} onSelect={onSelect} />
    </nav>
  );
}
