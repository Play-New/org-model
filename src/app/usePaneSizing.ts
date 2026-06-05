/**
 * Drag-to-resize for the two fixed columns (Org/ and Chat). The workspace is the
 * flexible rest. Resizing just drives the CSS variables `--org-w` / `--chat-w`, so
 * it composes with the responsive media queries (below 1100px the handles hide and
 * the CSS layout takes over).
 *
 * The chosen widths are a DEVICE preference (localStorage), never org data — the
 * app never writes UI state into the org (see ARCHITECTURE in CLAUDE.md).
 */

import { type CSSProperties, type PointerEvent, type RefObject, useCallback, useState } from 'react';

const KEY = 'org/pane-sizes';
const MIN_ORG = 180;
const MAX_ORG = 360;
const MIN_CHAT = 360;
const MAX_CHAT = 720;

interface Sizes {
  org: number;
  chat: number;
}

function load(): Sizes | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Sizes;
    if (typeof s.org === 'number' && typeof s.chat === 'number') return s;
  } catch {
    /* ignore malformed / unavailable storage */
  }
  return null;
}

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

export interface PaneSizing {
  /** Inline CSS vars to put on `.panes` — empty until the user has dragged (then the CSS defaults apply). */
  vars: CSSProperties;
  /** Begin a drag from a handle's onPointerDown. */
  startResize: (which: 'org' | 'chat', e: PointerEvent<HTMLElement>) => void;
}

export function usePaneSizing(
  orgRef: RefObject<HTMLElement | null>,
  chatRef: RefObject<HTMLElement | null>,
): PaneSizing {
  const [sizes, setSizes] = useState<Sizes | null>(load);

  const startResize = useCallback(
    (which: 'org' | 'chat', e: PointerEvent<HTMLElement>) => {
      e.preventDefault();
      const startX = e.clientX;
      const startOrg = orgRef.current?.offsetWidth ?? MIN_ORG;
      const startChat = chatRef.current?.offsetWidth ?? MIN_CHAT;

      const onMove = (ev: globalThis.PointerEvent) => {
        const dx = ev.clientX - startX;
        setSizes(() => {
          const org = which === 'org' ? clamp(startOrg + dx, MIN_ORG, MAX_ORG) : startOrg;
          const chat = which === 'chat' ? clamp(startChat + dx, MIN_CHAT, MAX_CHAT) : startChat;
          return { org, chat };
        });
      };
      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        setSizes(s => {
          if (s) {
            try {
              localStorage.setItem(KEY, JSON.stringify(s));
            } catch {
              /* ignore */
            }
          }
          return s;
        });
      };

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [orgRef, chatRef],
  );

  const vars: CSSProperties = sizes
    ? ({ '--org-w': `${sizes.org}px`, '--chat-w': `${sizes.chat}px` } as CSSProperties)
    : {};

  return { vars, startResize };
}
