/**
 * The app shell: a brand topbar (logo + “Org/”) over three columns —
 * Org/ (left), the chat (centre, narrow), and the workspace (right, largest:
 * the map by default, or the clicked file).
 */

import { useState } from 'react';
import { useT } from '../i18n';
import { useChat } from '../app/useChat';
import { useModel } from '../app/useModel';
import type { AppConfig } from '../config/config';
import type { ItemKind } from '../orgmodel/viewmodel';
import type { StorageAdapter } from '../storage/adapter';
import { ChatPane } from './ChatPane';
import { FilesPane } from './FilesPane';
import { ConstellationMark, SettingsIcon } from './icons';
import { type Selection, Workspace, type WorkspaceView } from './Workspace';

interface ShellProps {
  config: AppConfig;
  adapter: StorageAdapter;
  onOpenSettings: () => void;
}

export function Shell({ config, adapter, onOpenSettings }: ShellProps) {
  const t = useT();
  const { model, loading, reload } = useModel(adapter);
  const chat = useChat(adapter, config, () => void reload());
  const [sel, setSel] = useState<Selection | null>(null);
  const [view, setView] = useState<WorkspaceView>('map');
  const [mtab, setMtab] = useState<'org' | 'chat' | 'workspace'>('chat'); // which pane shows on a phone
  const readOnly = !adapter.writable;

  const onSelect = (kind: ItemKind, id: string) => {
    setSel({ kind, id });
    setView('file');
    setMtab('workspace'); // on a phone, jump to the file the user just tapped
  };
  const onPick = (kind: ItemKind, id: string) => setSel({ kind, id });

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          {config.logoDataUrl ? (
            <img className="brand__logo" src={config.logoDataUrl} alt="" />
          ) : (
            <span className="brand__mark" aria-hidden="true">
              <ConstellationMark size={26} />
            </span>
          )}
          <span className="brand__name">Org/</span>
          {readOnly && <span className="badge">{t('shell.readonly')}</span>}
        </div>
        <button className="iconbtn iconbtn--lg" onClick={onOpenSettings} aria-label={t('shell.settings')} title={t('shell.settings')}>
          <SettingsIcon />
        </button>
      </header>

      <div className="panes" data-mtab={mtab}>
        <aside className="pane pane--org">
          <div className="pane__head">Org/</div>
          <div className="pane__body">
            {loading ? (
              <div className="pane__placeholder">{t('shell.loading')}</div>
            ) : (
              <FilesPane model={model} selectedId={sel?.id ?? null} onSelect={onSelect} />
            )}
          </div>
        </aside>

        <main className="pane pane--chat">
          <ChatPane chat={chat} />
        </main>

        <section className="pane pane--workspace">
          <Workspace model={model} selected={sel} view={view} onView={setView} onPick={onPick} />
        </section>
      </div>

      <nav className="mobilenav" aria-label={t('nav.sections')}>
        <button className={mtab === 'org' ? 'is-active' : ''} onClick={() => setMtab('org')}>
          {t('nav.org')}
        </button>
        <button className={mtab === 'chat' ? 'is-active' : ''} onClick={() => setMtab('chat')}>
          {t('nav.chat')}
        </button>
        <button className={mtab === 'workspace' ? 'is-active' : ''} onClick={() => setMtab('workspace')}>
          {t('nav.map')}
        </button>
      </nav>
    </div>
  );
}
