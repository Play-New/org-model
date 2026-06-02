/**
 * First-run wizard: languages, identity, model + key, and the source — a local
 * folder or a GitHub repo. Editorial Play New hierarchy: each step opens with a
 * masthead (progress · headline · lead). The connected adapter is handed to
 * onComplete, so the app doesn't have to reconnect.
 *
 * The wizard runs its own LangProvider bound to the chosen chat language, so the
 * interface switches live as you pick a language on the first step.
 */

import { useRef, useState } from 'react';
import { isLang, type Lang, LangProvider, translate, Tx } from '../i18n';
import { ArrowRight } from '../ui/icons';
import { Select } from '../ui/Select';
import { SourceConnect } from './SourceConnect';
import type { StorageAdapter } from '../storage/adapter';
import type { AppConfig, ModelChoice } from './config';
import { defaultConfig } from './config';

interface WizardProps {
  initial?: AppConfig;
  keyAlreadySet?: boolean;
  onComplete: (config: AppConfig, adapter: StorageAdapter) => void;
}

type Step = 'languages' | 'identity' | 'model' | 'storage';
const ORDER: Step[] = ['languages', 'identity', 'model', 'storage'];

// Language names show in their own language, whatever the UI language is.
const LANG_OPTS = [
  { value: 'en', label: 'English' },
  { value: 'it', label: 'Italiano' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'pt', label: 'Português' },
];

export function Wizard({ initial, keyAlreadySet, onComplete }: WizardProps) {
  const [c, setC] = useState<AppConfig>(initial ?? defaultConfig());
  const [step, setStep] = useState<Step>('languages');
  const logoRef = useRef<HTMLInputElement>(null);

  const [adapter, setAdapter] = useState<StorageAdapter | null>(null);

  const lang: Lang = isLang(c.chatLanguage) ? c.chatLanguage : 'en';
  const t = (k: string, ...v: (string | number)[]) => translate(lang, k, ...v);

  const idx = ORDER.indexOf(step);
  const set = (patch: Partial<AppConfig>) => setC(prev => ({ ...prev, ...patch }));
  const nextStep = () => setStep(ORDER[Math.min(idx + 1, ORDER.length - 1)]);
  const back = () => setStep(ORDER[Math.max(idx - 1, 0)]);

  const onLogo = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set({ logoDataUrl: typeof reader.result === 'string' ? reader.result : null });
    reader.readAsDataURL(file);
  };

  const missing: string[] = [];
  if (!c.orgName.trim()) missing.push(t('wiz.need.name'));
  if (!c.apiKey.trim() && !keyAlreadySet) missing.push(t('wiz.need.key'));
  if (!adapter) missing.push(t('wiz.need.source'));
  const canFinish = missing.length === 0;

  return (
    <LangProvider lang={lang}>
      <div className="wizard">
        <div className="wizard__masthead">
          <span className="wizard__meta">{idx + 1} / {ORDER.length} · {t(`wiz.${step}.title`)}</span>
          <h2 className="wizard__headline"><Tx s={t(`wiz.${step}.headline`)} /></h2>
          <p className="wizard__lead">{t(`wiz.${step}.lead`)}</p>
        </div>

        <div className="wizard__panel">
          {step === 'languages' && (
            <fieldset className="wizard__field">
              <label>
                {t('wiz.chatLang')}
                <Select ariaLabel={t('wiz.chatLang')} value={c.chatLanguage} options={LANG_OPTS} onChange={v => set({ chatLanguage: v })} />
              </label>
              <label>
                {t('wiz.modelLang')}
                <Select ariaLabel={t('wiz.modelLang')} value={c.modelLanguage} options={LANG_OPTS} onChange={v => set({ modelLanguage: v })} />
              </label>
            </fieldset>
          )}

          {step === 'identity' && (
            <fieldset className="wizard__field">
              <label>
                {t('wiz.name')} <span className="wizard__req">{t('wiz.required')}</span>
                <input value={c.orgName} placeholder={t('wiz.namePlaceholder')} onChange={e => set({ orgName: e.target.value })} />
              </label>
              <div className="wizard__field-row">
                <span>{t('wiz.logo')} <span className="wizard__opt">{t('wiz.optional')}</span></span>
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
                <p className="wizard__hint">{t('wiz.logo.hint')}</p>
              </div>
            </fieldset>
          )}

          {step === 'model' && (
            <fieldset className="wizard__field">
              <label>
                {t('wiz.apiKey')} {keyAlreadySet ? <span className="wizard__opt">{t('wiz.keepCurrent')}</span> : <span className="wizard__req">{t('wiz.required')}</span>}
                <input
                  type="password"
                  value={c.apiKey}
                  placeholder={keyAlreadySet ? '••••••••' : 'sk-ant-…'}
                  onChange={e => set({ apiKey: e.target.value })}
                />
              </label>
              <div className="wizard__group">
                <span className="wizard__grouplabel">{t('set.model')}</span>
                <div className="wizard__choice">
                  {(['opus', 'sonnet'] as ModelChoice[]).map(m => (
                    <label key={m} className={c.model === m ? 'is-selected' : ''}>
                      <input type="radio" name="model" checked={c.model === m} onChange={() => set({ model: m })} />
                      <span>
                        <strong>{m === 'opus' ? 'Opus' : 'Sonnet'}</strong>
                        {t(m === 'opus' ? 'wiz.opus.desc' : 'wiz.sonnet.desc')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </fieldset>
          )}

          {step === 'storage' && (
            <fieldset className="wizard__field">
              <SourceConnect onConnected={setAdapter} />
            </fieldset>
          )}
        </div>

        <div className="wizard__nav">
          {idx > 0 && (
            <button type="button" className="btn btn--ghost" onClick={back}>
              {t('wiz.back')}
            </button>
          )}
          {step !== 'storage' ? (
            <button type="button" className="btn btn--primary" onClick={nextStep}>
              {t('wiz.continue')}
              <ArrowRight />
            </button>
          ) : (
            <div className="wizard__finish">
              {!canFinish && <span className="wizard__missing">{t('wiz.missing', missing.join(', '))}</span>}
              <button
                type="button"
                className="btn btn--primary"
                disabled={!canFinish}
                onClick={() => adapter && onComplete(c, adapter)}
              >
                {t('wiz.enter')}
                <ArrowRight />
              </button>
            </div>
          )}
        </div>
      </div>
    </LangProvider>
  );
}
