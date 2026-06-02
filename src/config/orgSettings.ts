/**
 * The portable part of the config: the org's identity. Written as `org-model.json`
 * inside the org folder, so opening the same folder anywhere restores the name,
 * logo, languages, and model — only the API key is asked again (it stays on the
 * device, encrypted). The key is never written here.
 */

import type { StorageAdapter } from '../storage/adapter';
import { type AppConfig, defaultConfig, type ModelChoice } from './config';

export interface OrgSettings {
  orgName: string;
  logoDataUrl: string | null;
  chatLanguage: string;
  modelLanguage: string;
  model: ModelChoice;
}

export const SETTINGS_FILE = 'org-model.json';

export function settingsFromConfig(c: AppConfig): OrgSettings {
  return {
    orgName: c.orgName,
    logoDataUrl: c.logoDataUrl,
    chatLanguage: c.chatLanguage,
    modelLanguage: c.modelLanguage,
    model: c.model,
  };
}

export function configFrom(s: OrgSettings, apiKey: string): AppConfig {
  return { ...defaultConfig(), ...s, apiKey };
}

export function serializeSettings(s: OrgSettings): string {
  return `${JSON.stringify(s, null, 2)}\n`;
}

export function parseSettings(json: string): OrgSettings {
  const base = settingsFromConfig(defaultConfig());
  try {
    const raw = JSON.parse(json) as Partial<OrgSettings>;
    return { ...base, ...raw };
  } catch {
    return base;
  }
}

export async function loadOrgSettings(a: StorageAdapter): Promise<OrgSettings | null> {
  const json = await a.read(SETTINGS_FILE);
  return json ? parseSettings(json) : null;
}

export async function saveOrgSettings(a: StorageAdapter, s: OrgSettings): Promise<void> {
  await a.write(SETTINGS_FILE, serializeSettings(s));
}
