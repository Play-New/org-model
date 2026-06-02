/** The first thing a new user sees — what Org/ is, in two lines, then in.
 *  Generic by design: no brand yet (that arrives in the wizard). */

import { Tx, useT } from '../i18n';
import { ArrowRight } from '../ui/icons';

export function Welcome({ onStart }: { onStart: () => void }) {
  const t = useT();
  return (
    <div className="screen screen--wizard">
      <div className="welcome">
        <h1 className="welcome__headline">
          <Tx s={t('welcome.headline')} />
        </h1>
        <p className="welcome__lead">{t('welcome.lead')}</p>
        <button className="btn btn--primary welcome__cta" onClick={onStart}>
          {t('welcome.cta')} <ArrowRight />
        </button>
        <p className="welcome__privacy">{t('welcome.privacy')}</p>
      </div>
    </div>
  );
}
