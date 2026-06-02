/** Warn before a model-language switch only when it would actually create a mix:
 *  the language changed AND there is already content written in the old one. */
export function needsTranslationWarning(originalLang: string, nextLang: string, hasContent: boolean): boolean {
  return hasContent && nextLang !== originalLang;
}
