/**
 * Pick a source — a local folder or a GitHub repo — and connect it. Shared by the
 * wizard (first run) and the settings dialog (change source / repo / token). The
 * connect helpers persist the choice; the parent decides what to do once connected
 * (the wizard keeps the adapter; settings reloads onto the new source).
 */

import { useState } from 'react';
import { connectGithub, connectLocalFolder } from '../app/connect';
import { useT } from '../i18n';
import { FolderIcon } from '../ui/icons';
import type { StorageAdapter } from '../storage/adapter';
import { parseRepoRef } from '../storage/github';

interface SourceConnectProps {
  initial?: { source?: 'local' | 'github'; repo?: string; branch?: string };
  onConnected: (adapter: StorageAdapter | null) => void;
}

export function SourceConnect({ initial, onConnected }: SourceConnectProps) {
  const t = useT();
  const [source, setSource] = useState<'local' | 'github'>(initial?.source ?? 'local');
  const [connected, setConnected] = useState(false);
  const [connLabel, setConnLabel] = useState<string | null>(null);
  const [connNote, setConnNote] = useState<string | null>(null);
  const [repo, setRepo] = useState(initial?.repo ?? '');
  const [branch, setBranch] = useState(initial?.branch ?? 'main');
  const [token, setToken] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connErr, setConnErr] = useState<string | null>(null);

  const summarize = (files: string[]): string => {
    if (files.length === 0) return t('wiz.summary.empty');
    if (files.some(f => f === 'org-model.json' || f.startsWith('contracts/') || f.startsWith('nodes/')))
      return t('wiz.summary.model', files.length);
    return t('wiz.summary.files', files.length);
  };

  const chooseSource = (s: 'local' | 'github') => {
    setSource(s);
    setConnected(false);
    setConnLabel(null);
    setConnNote(null);
    setConnErr(null);
    onConnected(null);
  };

  const pickFolder = async () => {
    try {
      const a = await connectLocalFolder();
      setConnected(true);
      setConnLabel(a.name);
      setConnNote(summarize(await a.list('')));
      setConnErr(null);
      onConnected(a);
    } catch {
      // user cancelled the picker
    }
  };

  const connectRepo = async () => {
    setConnErr(null);
    const ref = parseRepoRef(repo, branch.trim() || 'main');
    if (!ref) {
      setConnErr(t('wiz.gh.badRepo'));
      return;
    }
    if (!token.trim()) {
      setConnErr(t('wiz.gh.noToken'));
      return;
    }
    setConnecting(true);
    try {
      const a = await connectGithub(ref, token.trim());
      setConnected(true);
      setConnLabel(a.repoLabel);
      setConnNote(`${ref.branch} · ${summarize(await a.list(''))}`);
      onConnected(a);
    } catch (e) {
      setConnErr(e instanceof Error ? e.message : String(e));
    } finally {
      setConnecting(false);
    }
  };

  const ok = connected && connLabel && (
    <span className="wizard__ok">
      ✓ {connLabel}
      {connNote && <span className="wizard__note"> · {connNote}</span>}
    </span>
  );

  return (
    <>
      <div className="wizard__sources" role="tablist">
        <button type="button" className={source === 'local' ? 'is-active' : ''} onClick={() => chooseSource('local')}>
          {t('wiz.source.local')}
        </button>
        <button type="button" className={source === 'github' ? 'is-active' : ''} onClick={() => chooseSource('github')}>
          {t('wiz.source.github')}
        </button>
      </div>

      {source === 'local' ? (
        <>
          <div className="wizard__connect">
            <button type="button" className="btn btn--ghost" onClick={pickFolder}>
              <FolderIcon />
              {connected ? t('wiz.changeFolder') : t('wiz.chooseFolder')}
            </button>
            {ok}
          </div>
          <p className="wizard__hint">{t('wiz.folder.hint')}</p>
        </>
      ) : (
        <div className="wizard__gh">
          <label>
            {t('wiz.gh.repo')} <span className="wizard__req">{t('wiz.required')}</span>
            <input value={repo} placeholder="owner/repo" onChange={e => setRepo(e.target.value)} />
          </label>
          <label>
            {t('wiz.gh.branch')}
            <input value={branch} placeholder="main" onChange={e => setBranch(e.target.value)} />
          </label>
          <label>
            {t('wiz.gh.token')} <span className="wizard__req">{t('wiz.required')}</span>
            <input type="password" value={token} placeholder="github_pat_…" onChange={e => setToken(e.target.value)} />
          </label>

          <div className="wizard__connect">
            <button type="button" className="btn btn--ghost" onClick={connectRepo} disabled={connecting}>
              {connecting ? t('wiz.gh.connecting') : connected ? t('wiz.gh.reconnect') : t('wiz.gh.connect')}
            </button>
            {ok}
          </div>
          {connErr && <p className="wizard__err">{connErr}</p>}

          <div className="wizard__help">
            <p>
              {t('wiz.gh.help')}{' '}
              <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer">
                {t('wiz.gh.openPage')}
              </a>
            </p>
            <p className="wizard__hint">{t('wiz.gh.tokenNote')}</p>
          </div>
        </div>
      )}
    </>
  );
}
