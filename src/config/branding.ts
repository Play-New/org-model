/**
 * Apply the org's brand to the page at runtime: title, meta description, favicon.
 * Generic — every value comes from the wizard, none is hardcoded.
 */

import type { AppConfig } from './config';

function setMeta(doc: Document, name: string, content: string): void {
  let el = doc.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = doc.createElement('meta');
    el.setAttribute('name', name);
    doc.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setFavicon(doc: Document, href: string): void {
  let el = doc.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!el) {
    el = doc.createElement('link');
    el.setAttribute('rel', 'icon');
    doc.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function pageTitle(c: AppConfig): string {
  return c.orgName.trim() ? `${c.orgName} · Org/` : 'Org/';
}

export function applyBranding(c: AppConfig, doc: Document = document): void {
  doc.title = pageTitle(c);
  setMeta(
    doc,
    'description',
    c.orgName.trim() ? `The org model of ${c.orgName}` : 'Build a model of your organization',
  );
  if (c.logoDataUrl) setFavicon(doc, c.logoDataUrl);
}
