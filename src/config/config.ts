/**
 * Runtime app configuration. Generic by design — nothing about any specific org
 * is baked into the code; the brand (name, logo) and languages come from here.
 *
 * Persistence is split (see orgSettings.ts + secret.ts):
 *   - org identity (name, logo, languages, model) → a file in the org folder, so
 *     it travels with the data;
 *   - the Anthropic key → encrypted on the device, never in the folder, never shown.
 * `apiKey` lives on this object only at runtime.
 */

export type ModelChoice = 'opus' | 'sonnet';

export interface AppConfig {
  /** Language the user talks to the agent in / the UI language. */
  chatLanguage: string;
  /** Language the org model is written in (can differ from the chat language). */
  modelLanguage: string;
  orgName: string;
  logoDataUrl: string | null;
  model: ModelChoice;
  /** Runtime only — loaded from the encrypted secret store, never persisted here. */
  apiKey: string;
}

export function defaultConfig(): AppConfig {
  return {
    chatLanguage: 'en',
    modelLanguage: 'en',
    orgName: '',
    logoDataUrl: null,
    model: 'opus',
    apiKey: '',
  };
}

/** Enough to run: a name and a key. (The folder is handled separately.) */
export function isReady(c: AppConfig): boolean {
  return c.orgName.trim() !== '' && c.apiKey.trim() !== '';
}
