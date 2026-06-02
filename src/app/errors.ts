/** Turn an LLM/network failure into a short, actionable line for the chat.
 *  The Anthropic SDK throws APIError (with `.status`) or a fetch TypeError; both
 *  stringify to something a user can't act on. Map the common cases to i18n keys;
 *  `t` translates them. An unrecognised error falls back to its raw message. */

type Translate = (key: string) => string;

export function humanizeError(e: unknown, t: Translate): string {
  const status =
    typeof e === 'object' && e !== null && 'status' in e ? (e as { status?: number }).status : undefined;
  const msg = (e instanceof Error ? e.message : String(e)).trim();

  if (status === 401 || /\b401\b|authentication|invalid.*api.?key/i.test(msg)) return t('err.keyRejected');
  if (status === 429 || /\b429\b|rate.?limit/i.test(msg)) return t('err.rateLimited');
  if (status === 529 || /\b529\b|overloaded/i.test(msg)) return t('err.overloaded');
  if (/failed to fetch|networkerror|network error|load failed/i.test(msg)) return t('err.network');
  return msg || t('err.generic');
}
