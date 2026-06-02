/** A proposed write, shown for approval before it touches disk (AGENT-SPEC posture). */

import { useT } from '../i18n';

const LABELS: Record<string, string> = {
  write_contract: 'Write contract',
  write_node: 'Write node',
  save_source: 'Save source',
  append_log: 'Log entry',
};

function show(v: unknown): string {
  if (Array.isArray(v)) return v.map(x => (typeof x === 'string' ? x : JSON.stringify(x))).join(', ');
  if (v && typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

interface DiffCardProps {
  name: string;
  input: Record<string, unknown>;
  onApply: () => void;
  onReject: () => void;
}

export function DiffCard({ name, input, onApply, onReject }: DiffCardProps) {
  const t = useT();
  const fields = Object.entries(input).filter(([, v]) => v != null && show(v) !== '');
  return (
    <div className="diffcard">
      <div className="diffcard__head">{LABELS[name] ?? name}</div>
      <dl className="diffcard__fields">
        {fields.map(([k, v]) => (
          <div key={k} className="diffcard__row">
            <dt>{k}</dt>
            <dd>{show(v)}</dd>
          </div>
        ))}
      </dl>
      <div className="diffcard__actions">
        <button className="btn btn--ghost" onClick={onReject}>
          {t('diff.reject')}
        </button>
        <button className="btn btn--primary" onClick={onApply}>
          {t('diff.apply')}
        </button>
      </div>
    </div>
  );
}
