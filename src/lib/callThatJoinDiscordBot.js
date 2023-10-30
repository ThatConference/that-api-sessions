/**
 * Calls the that-join-discord-bot service to add a voice channel, etc. for an
 * on-the-line `Activity`
 */
import debug from 'debug';
import * as Sentry from '@sentry/node';
import { security } from '@thatconference/api';
import nodeFetch from 'node-fetch';
import fetchRetry from 'fetch-retry';
import dayjs from 'dayjs';
import envConfig from '../envConfig';
import { findDateAtNextHour } from './findDateAtNextHour';

const dlog = debug('that:api:sessions:call-that-join-bot');
const fetch = fetchRetry(nodeFetch, {
  retries: 5,
  retryDelay: (attempt, error, response) => {
    if (response?.status === 429) {
      const retryAfter = response.headers.get('retry-after');
      if (retryAfter) {
        const delay = Number.parseInt(retryAfter, 10) * 1000;
        return delay > 0 ? delay : 1000;
      }
    }
    return 125 * attempt;
  },
  retryOn: (attempt, error, response) => {
    if (response?.status === 429 || response?.status >= 500 || error) {
      return true;
    }
    return false;
  },
});

const headers = {
  'content-type': 'application/json',
};

async function callAddActivityChannel({ sessionId }) {
  dlog('callAddActivityChannel called on %s', sessionId);
  const url = `${envConfig.thatJoinDiscordBot.baseUrl}/addActivityChannel`;
  const payload = { sessionId };
  const signingKey = envConfig.thatRequestSigningKey;
  const thatSigning = security.requestSigning;
  const requestSigning = thatSigning({ signingKey });
  const signature = requestSigning.signRequest(payload);
  if (signature?.isOk !== true || !signature?.thatSig) {
    throw new Error(`unable to sign request: ${signature?.message}`);
  }
  headers['that-request-signature'] = signature.thatSig;

  try {
    dlog('fetch headers: %o', headers);
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (res.status >= 200 && res.status < 500) {
      if (res.ok) {
        dlog('callAddActivityChannel res.ok');
        return;
      }
      // record why not successful
      const json = await res.json();
      dlog('callAddActivityChannel, non-200 error %o', { json });
      Sentry.withScope(scope => {
        scope.setTag('sessionId', sessionId);
        scope.setContext('create channel response', {
          status: res.status,
          statusText: res.statusText,
          json,
        });
        scope.setLevel('warning');
        Sentry.captureMessage('Non-200 result creating Discord voice channel');
      });
    }
  } catch (err) {
    dlog('error: %o', err);
    Sentry.setTag('sessionId', sessionId);
    Sentry.captureException(err);
  }
}

/**
 * Adds a new voice channel, guild scheduled event, and for the provided session.
 * @param {session} param0
 * @returns {*}
 */
export function createVoiceChannelForSession({ session }) {
  dlog(
    'createVoiceChannelForSession called for session (%s) "%s"',
    session?.id,
    session?.title,
  );
  const { id: sessionId } = session;
  if (!sessionId) throw new Error('sessionId is required and not provied');

  // logic to see if we do this.
  // is ACCEPTED, OPEN_SPACE
  // startTime > now
  // startTime < time of next batch
  // time of next batch (assuming batches are at 08:00)
  const sessionStart = dayjs(session.startTime);
  const nextBatchTime = dayjs(findDateAtNextHour(8));
  if (
    session.status === 'ACCEPTED' &&
    session.type === 'OPEN_SPACE' &&
    sessionStart > dayjs() &&
    sessionStart.diff(nextBatchTime, 'minute') < 0
  ) {
    // create it
    return callAddActivityChannel({ sessionId: session.id });
  }
  dlog('criteria not met, not creating discord channel');
  return Promise.resolve();
}
