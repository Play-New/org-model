/** A custom dropdown — no native <select>. The popover is rendered in a portal
 *  with fixed positioning, so an overflow:hidden ancestor (the wizard card, the
 *  settings modal) can never clip it; it scrolls when long and flips up when
 *  there isn't room below. Full keyboard support (arrows / Enter / Esc / Home / End). */

import { type CSSProperties, type KeyboardEvent, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from './icons';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  variant?: 'field' | 'ghost';
  ariaLabel?: string;
}

export function Select({ value, options, onChange, placeholder, variant = 'field', ariaLabel }: SelectProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<CSSProperties | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const current = options.find(o => o.value === value);
  const currentIdx = Math.max(0, options.findIndex(o => o.value === value));

  // Position the portalled menu against the trigger; keep it pinned on scroll/resize.
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const r = triggerRef.current?.getBoundingClientRect();
      if (!r) return;
      const gap = 6;
      const spaceBelow = window.innerHeight - r.bottom;
      const openUp = spaceBelow < 220 && r.top > spaceBelow;
      const maxHeight = Math.max(120, Math.min(280, (openUp ? r.top : spaceBelow) - gap - 8));
      setPos(
        openUp
          ? { position: 'fixed', left: r.left, bottom: window.innerHeight - r.top + gap, width: r.width, maxHeight }
          : { position: 'fixed', left: r.left, top: r.bottom + gap, width: r.width, maxHeight },
      );
    };
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const openMenu = () => {
    setActive(currentIdx);
    setOpen(true);
  };
  const choose = (i: number) => {
    const o = options[i];
    if (o) onChange(o.value);
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
      case 'ArrowDown':
        e.preventDefault();
        setActive(a => Math.min(a + 1, options.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActive(a => Math.max(a - 1, 0));
        break;
      case 'Home':
        e.preventDefault();
        setActive(0);
        break;
      case 'End':
        e.preventDefault();
        setActive(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        choose(active);
        break;
    }
  };

  return (
    <div className={`select select--${variant} ${open ? 'is-open' : ''}`} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="select__trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
      >
        <span className="select__value">{current?.label ?? placeholder ?? 'Select…'}</span>
        <span className="select__chev" aria-hidden="true">
          <ChevronDown />
        </span>
      </button>
      {open &&
        pos &&
        createPortal(
          <ul ref={menuRef} className="select__menu" role="listbox" style={pos}>
            {options.map((o, i) => (
              <li
                key={o.value}
                role="option"
                aria-selected={o.value === value}
                className={`select__opt ${o.value === value ? 'is-active' : ''} ${i === active ? 'is-highlight' : ''}`}
                onMouseEnter={() => setActive(i)}
                onMouseDown={e => {
                  e.preventDefault();
                  choose(i);
                }}
              >
                {o.label}
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </div>
  );
}
