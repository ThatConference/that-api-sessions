import * as Sentry from '@sentry/node';
import fetch from 'node-fetch';
import debug from 'debug';
import envConfig from '../envConfig';

const dlog = debug('that:api:sessions:call-og-image');
const { ogImageBaseUrl } = envConfig;

export default function callOgImage(sessionId) {
  dlog('callOgImage called for %s', sessionId);

  const ogImageUrl = `${ogImageBaseUrl}/api/template/activity/?id=${sessionId}`;

  return fetch(ogImageUrl)
    .then(res => res.json())
    .then(res => {
      if (res.success !== true) {
        Sentry.withScope(scope => {
          scope.setContext('og-image response', { ...res });
          Sentry.captureException(
            new Error('Error calling og-image from user event'),
          );
        });
      }
      return res;
    });
}
