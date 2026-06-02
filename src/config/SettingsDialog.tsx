/** Settings as a real modal — all of the config in one place. The API key is
 *  never shown: the field is blank and only replaces the stored key if filled.
 *  Runs its own LangProvider, so the chat-language change previews live. */

import { useEffect, useRef, useState } from 'react';
import { type Conn, forgetConnection, getConnection } from '../app/connect';
import { isLang, type Lang, LangProvider, translate } from '../i18n';
import { applyBranding } from './branding';
import { type AppConfig, type ModelChoice } from './config';
import { saveOrgSettings, settingsFromConfig } from './orgSettings';
import { clearApiKey, clearGithubToken, setApiKey } from './secret';
import { SourceConnect } from './SourceConnect';
import { loadModel } from '../orgmodel/store';
import { needsTranslationWarning } from './languageWarning';
import type { StorageAdapter } from '../storage/adapter';
import { CloseIcon } from '../ui/icons';
import { Select } from '../ui/Select';

const LANG_OPTS = [
  { value: 'en', label: 'English' },
  { value: 'it', label: 'Italiano' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'pt', label: 'Português' },
];

const langName = (v: string) => LANG_OPTS.find(o => o.value === v)?.label ?? v;

interface Props {
  config: AppConfig;
  adapter: StorageAdapter;
  onClose: () => void;
  onSaved: (config: AppConfig) => void;
}

export function SettingsDialog({ config, adapter, onClose, onSaved }: Props) {
  const [c, setC] = useState<AppConfig>({ ...config, apiKey: '' }); // key blank, never shown
  const [busy, setBusy] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [source, setSource] = useState<{ source?: 'local' | 'github'; repo?: string; branch?: string }>();
  const [confirmReset, setConfirmReset] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<AppConfig>) => setC(prev => ({ ...prev, ...patch }));

  const lang: Lang = isLang(c.chatLanguage) ? c.chatLanguage : 'en';
  const t = (k: string, ...v: (string | number)[]) => translate(lang, k, ...v);

  useEffect(() => {
    let cancelled = false;
    void loadModel(adapter)
      .then(m => {
        if (!cancelled) setHasContent(m.contracts.length + m.nodes.length > 0);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [adapter]);

  useEffect(() => {
    let cancelled = false;
    void getConnection().then((conn: Conn | null) => {
      if (cancelled || !conn) return;
      setSource(conn.kind === 'github' ? { source: 'github', repo: `${conn.owner}/${conn.repo}`, branch: conn.branch } : { source: 'local' });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const onLogo = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set({ logoDataUrl: typeof reader.result === 'string' ? reader.result : null });
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setBusy(true);
    try {
      if (c.apiKey.trim()) await setApiKey(c.apiKey);
      const merged: AppConfig = { ...config, ...c, apiKey: c.apiKey.trim() ? c.apiKey : config.apiKey };
      await saveOrgSettings(adapter, settingsFromConfig(merged));
      applyBranding(merged);
      onSaved(merged);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  // Connecting a new source persists it (connect.ts); reload onto it.
  const onConnected = (a: StorageAdapter | null) => {
    if (a) window.location.reload();
  };

  const disconnect = async () => {
    await forgetConnection();
    await clearApiKey();
    await clearGithubToken();
    window.location.reload();
  };

  return (
    <LangProvider lang={lang}>
      <div className="modal" onClick={onClose}>
        <div className="modal__panel" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
          <header className="modal__head">
            <h2>{t('set.title')}</h2>
            <button className="iconbtn" onClick={onClose} aria-label={t('set.close')}>
              <CloseIcon />
            </button>
          </header>

          <div className="modal__body">
            <section className="set">
              <h3>{t('set.languages')}</h3>
              <div className="set__row">
                <label>
                  {t('wiz.chatLang')}
                  <Select ariaLabel={t('wiz.chatLang')} value={c.chatLanguage} options={LANG_OPTS} onChange={v => set({ chatLanguage: v })} />
                </label>
                <label>
                  {t('wiz.modelLang')}
                  <Select ariaLabel={t('wiz.modelLang')} value={c.modelLanguage} options={LANG_OPTS} onChange={v => set({ modelLanguage: v })} />
                </label>
              </div>
              {needsTranslationWarning(config.modelLanguage, c.modelLanguage, hasContent) && (
                <p className="set__warn">{t('set.langWarn', langName(config.modelLanguage), langName(c.modelLanguage))}</p>
              )}
            </section>

            <section className="set">
              <h3>{t('set.organization')}</h3>
              <label>
                {t('wiz.name')}
                <input value={c.orgName} onChange={e => set({ orgName: e.target.value })} />
              </label>
              <div className="set__field">
                <span>{t('wiz.logo')}</span>
                <div className="uploader">
                  {c.logoDataUrl && <img className="uploader__preview" src={c.logoDataUrl} alt="" />}
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => logoRef.current?.click()}>
                    {c.logoDataUrl ? t('wiz.replace') : t('wiz.upload')}
                  </button>
                  {c.logoDataUrl && (
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => set({ logoDataUrl: null })}>
                      {t('wiz.remove')}
                    </button>
                  )}
                  <input ref={logoRef} type="file" accept="image/*" hidden onChange={e => onLogo(e.target.files?.[0])} />
                </div>
                <p className="set__hint">{t('wiz.logo.hint')}</p>
              </div>
            </section>

            <section className="set">
              <h3>{t('set.model')}</h3>
              <div className="set__choice">
                {(['opus', 'sonnet'] as ModelChoice[]).map(m => (
                  <label key={m} className={c.model === m ? 'is-selected' : ''}>
                    <input type="radio" name="set-model" checked={c.model === m} onChange={() => set({ model: m })} />
                    <span><strong>{m === 'opus' ? 'Opus' : 'Sonnet'}</strong>{t(m === 'opus' ? 'wiz.opus.desc' : 'wiz.sonnet.desc')}</span>
                  </label>
                ))}
              </div>
              <label>
                {t('wiz.apiKey')} <span className="set__opt">{t('wiz.keepCurrent')}</span>
                <input type="password" value={c.apiKey} placeholder="••••••••" onChange={e => set({ apiKey: e.target.value })} />
              </label>
            </section>

            <section className="set">
              <h3>{t('set.source')}</h3>
              <SourceConnect initial={source} onConnected={onConnected} />
              <p className="set__hint">{t('set.folderHint')}</p>
              {confirmReset ? (
                <div className="set__confirm">
                  <span>{t('set.disconnectConfirm')}</span>
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConfirmReset(false)}>{t('chat.cancel')}</button>
                  <button type="button" className="btn btn--ghost btn--sm set__danger" onClick={disconnect}>{t('set.disconnectDo')}</button>
                </div>
              ) : (
                <button type="button" className="btn btn--ghost btn--sm set__danger" onClick={() => setConfirmReset(true)}>
                  {t('set.disconnect')}
                </button>
              )}
            </section>
          </div>

          <footer className="modal__foot">
            <button className="btn btn--ghost" onClick={onClose}>{t('chat.cancel')}</button>
            <button className="btn btn--primary" disabled={busy} onClick={save}>{t('chat.save')}</button>
          </footer>
        </div>
      </div>
    </LangProvider>
  );
}
