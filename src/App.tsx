import { type ReactNode, useEffect, useState } from 'react';
import { connectLocalFolder, restoreAdapter } from './app/connect';
import { applyBranding } from './config/branding';
import { type AppConfig, defaultConfig } from './config/config';
import { configFrom, loadOrgSettings, saveOrgSettings, settingsFromConfig } from './config/orgSettings';
import { getApiKey, hasApiKey, setApiKey } from './config/secret';
import { SettingsDialog } from './config/SettingsDialog';
import { Welcome } from './config/Welcome';
import { Wizard } from './config/Wizard';
import { detectLang, isLang, type Lang, LangProvider, translate, useT } from './i18n';
import type { StorageAdapter } from './storage/adapter';
import { Shell } from './ui/Shell';
import './styles/tokens.css';
import './styles/app.css';

type Phase = 'loading' | 'welcome' | 'wizard' | 'key' | 'ready';

export default function App() {
  const [config, setConfig] = useState<AppConfig>(() => ({ ...defaultConfig(), chatLanguage: detectLang() }));
  const [adapter, setAdapter] = useState<StorageAdapter | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const uiLang: Lang = isLang(config.chatLanguage) ? config.chatLanguage : 'en';

  useEffect(() => {
    applyBranding(config);
  }, [config]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const a = await restoreAdapter().catch(() => null);
      if (cancelled) return;
      const settings = a ? await loadOrgSettings(a).catch(() => null) : null;
      if (cancelled) return;
      if (!a || !settings) {
        setPhase('welcome'); // first run — intro before the wizard
        return;
      }
      const key = await getApiKey().catch(() => null);
      if (cancelled) return;
      setAdapter(a);
      setConfig(configFrom(settings, key ?? ''));
      setPhase(key ? 'ready' : 'key');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onWizardComplete = async (c: AppConfig, a: StorageAdapter) => {
    setError(null);
    try {
      if (c.apiKey.trim()) await setApiKey(c.apiKey);
      else if (!(await hasApiKey())) throw new Error('an API key is required');
      await saveOrgSettings(a, settingsFromConfig(c));
      const key = c.apiKey.trim() || (await getApiKey()) || '';
      setAdapter(a);
      setConfig({ ...c, apiKey: key });
      setPhase('ready');
    } catch (e) {
      setError(String(e));
    }
  };

  const onKeySubmit = async (key: string) => {
    setError(null);
    try {
      await setApiKey(key);
      setConfig(prev => ({ ...prev, apiKey: key }));
      setPhase('ready');
    } catch (e) {
      setError(String(e));
    }
  };

  const wrap = (node: ReactNode) => <LangProvider lang={uiLang}>{node}</LangProvider>;

  if (phase === 'loading') {
    return <div className="screen screen--boot">…</div>;
  }

  if (phase === 'welcome') {
    return wrap(<Welcome onStart={() => setPhase('wizard')} />);
  }

  if (phase === 'wizard') {
    return wrap(
      <div className="screen screen--wizard">
        <Wizard initial={config} onComplete={onWizardComplete} />
        {error && <p className="error">{error}</p>}
      </div>,
    );
  }

  if (phase === 'key') {
    return wrap(<KeyGate orgName={config.orgName} error={error} onSubmit={onKeySubmit} onReset={() => setPhase('wizard')} />);
  }

  if (!adapter) {
    return wrap(
      <div className="screen screen--connect">
        <div className="connect">
          <h1>{translate(uiLang, 'connect.title')}</h1>
          <button className="btn btn--primary" onClick={async () => setAdapter(await connectLocalFolder())}>
            {translate(uiLang, 'connect.choose')}
          </button>
        </div>
      </div>,
    );
  }

  return wrap(
    <>
      <Shell config={config} adapter={adapter} onOpenSettings={() => setSettingsOpen(true)} />
      {settingsOpen && (
        <SettingsDialog
          config={config}
          adapter={adapter}
          onClose={() => setSettingsOpen(false)}
          onSaved={c => setConfig(c)}
        />
      )}
    </>,
  );
}

function KeyGate({
  orgName,
  error,
  onSubmit,
  onReset,
}: {
  orgName: string;
  error: string | null;
  onSubmit: (key: string) => void;
  onReset: () => void;
}) {
  const t = useT();
  const [key, setKey] = useState('');
  return (
    <div className="screen screen--connect">
      <div className="connect">
        <h1>{orgName || 'Org/'}</h1>
        <p>{t('key.prompt')}</p>
        <input
          type="password"
          value={key}
          placeholder="sk-ant-…"
          onChange={e => setKey(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && key.trim()) onSubmit(key);
          }}
        />
        <button className="btn btn--primary" disabled={!key.trim()} onClick={() => onSubmit(key)}>
          {t('key.continue')}
        </button>
        <button className="btn btn--ghost" onClick={onReset}>
          {t('key.settings')}
        </button>
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
