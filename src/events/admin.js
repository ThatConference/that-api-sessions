import { EventEmitter } from 'events';
import debug from 'debug';
import * as Sentry from '@sentry/node';
import dayjs from 'dayjs';
import djsUTC from 'dayjs/plugin/utc';
import djsTimezone from 'dayjs/plugin/timezone';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import { NotificationError, SharedCalendarError } from '../lib/errors';
import favoriteStore from '../dataSources/cloudFirestore/favorite';
import memberStore from '../dataSources/cloudFirestore/member';
import envConfig from '../envConfig';
import calendarEvent from '../lib/calendarEvent';
import determineSessionChanges from '../lib/determineSessionChanges';
import slackNotifications from '../lib/slackNotifications';
import callOgImage from '../lib/callOgImage';
import { createVoiceChannelForSession } from '../lib/callThatJoinDiscordBot';

const dlog = debug('that:api:sessions:events:admin');
const calEvent = calendarEvent(
  envConfig.calendarCredentals,
  envConfig.sharedCalendarId,
);
dayjs.extend(djsUTC);
dayjs.extend(djsTimezone);
dayjs.extend(advancedFormat);
const inPersonEventTypes = ['MULTI_DAY', 'HYBRID_MULTI_DAY', 'SINGLE_DAY'];
const onlineEventTypes = ['ONLINE', 'DAILY'];

export default function adminEvents(postmark) {
  const adminEventEmitter = new EventEmitter();
  dlog('admin event emitter created');

  // *********
  // email goo
  async function sendFavoritesSessionUpdateEmail({
    session,
    originalSession,
    speaker,
    event,
    sendNotification,
    firestore,
  }) {
    dlog('sendFavoritesSessionUpdateEmail called %o', session);
    if (sendNotification !== true || session?.status === 'WITHDREW') {
      dlog(
        `sendNotification: ${sendNotification}, session.status: ${session?.status}, returning`,
      );
      return undefined;
    }

    Sentry.configureScope(scope => {
      scope.setTag('adminEvents', 'sessionUpdate');
      scope.setContext('session info', {
        sessionId: session?.id,
        sessionTitle: session?.title,
        sessionStatus: session?.status,
      });
      scope.setLevel('error');
    });

    if (!firestore || !firestore.collection) {
      Sentry.captureException(
        new NotificationError(`firestore parameter is required`),
      );
      return undefined;
    }

    if (!session) {
      Sentry.captureException(
        new NotificationError(`session parameter is required`),
      );
      return undefined;
    }

    const { id: sessionId, status: sessionStatus } = session;

    let baseActivityUrl = 'https://that.us/activities';
    if (
      inPersonEventTypes.includes(event.type) &&
      session?.location?.isOnline !== true
    ) {
      baseActivityUrl = 'https://thatconference.com/activities';
    }

    // get list of session's followers
    const favorited = await favoriteStore(firestore).findFavoritesForSession(
      sessionId,
    );
    const fIds = new Set(favorited.map(f => f.memberId));
    fIds.add(speaker.id);

    // get member records
    const members = await memberStore(firestore).batchFindMembers([...fIds]);
    if (members.length !== fIds.size) {
      Sentry.withScope(scope => {
        scope.setContext('followerIdCount', { size: fIds.size });
        scope.setContext('memberCount', { length: members.length });
        Sentry.captureMessage(
          `Members retrieved count doesn't match follower count`,
          {
            level: 'warning',
          },
        );
      });
    }
    let timezone = 'US/Central';
    if (onlineEventTypes.includes(event.type)) timezone = 'UTC';
    const timeFormat = 'dddd, MMMM Do @ HH:mm z';
    let sendMail;

    // send of notifications based on status
    if (['ACCEPTED', 'SCHEDULED'].includes(sessionStatus)) {
      // updated sessions
      const changes = determineSessionChanges({
        originalSession,
        updatedSession: session,
      });
      changes.time.original = dayjs(changes.time.original)
        .tz(timezone)
        .format(timeFormat);
      changes.time.updated = dayjs(changes.time.updated)
        .tz(timezone)
        .format(timeFormat);
      const room = changes.room.changed
        ? `${changes.room.original} ➡️ ${changes.room.updated}`
        : changes.room.updated;
      const startTime = changes.time.changed
        ? `${changes.time.original} ➡️ ${changes.time.updated}`
        : changes.time.updated;
      const targetLocation = changes.targetLocation.changed
        ? `${changes.targetLocation.original} ➡️ ${changes.targetLocation.updated}`
        : changes.targetLocation.updated;

      sendMail = postmark.sendEmailBatchWithTemplates(
        members.map(m => ({
          from: envConfig.notificationEmailFrom,
          to: m.email,
          templateAlias: 'notification-session-updated',
          trackOpens: true,
          tag: 'notification_update',
          templateModel: {
            session: {
              id: session.id,
              title: session.title,
              room,
              startTime,
              targetLocation,
              link: `${baseActivityUrl}/${session.id}`,
            },
            event: {
              name: event.name,
            },
            speaker: {
              firstName: speaker.firstName,
              lastName: speaker.lastName,
              slug: speaker.profileSlug,
            },
          },
          metadata: {
            sessionId: session.id,
          },
        })),
      );
    } else if (sessionStatus === 'CANCELLED') {
      // cancelled session
      let startTime = originalSession.startTime
        ? dayjs(originalSession.startTime).tz(timezone).format(timeFormat)
        : '';
      startTime += ' ➡️ CANCELLED';

      sendMail = postmark.sendEmailBatchWithTemplates(
        members.map(m => ({
          from: envConfig.notificationEmailFrom,
          to: m.email,
          templateAlias: 'notification-session-cancelled',
          trackOpens: true,
          tag: 'notification_cancel',
          templateModel: {
            session: {
              id: session.id,
              title: session.title,
              room: originalSession?.location?.destination || 'THAT.us',
              startTime,
              link: `${baseActivityUrl}/${session.id}`,
            },
            event: {
              name: event.name,
            },
            speaker: {
              firstName: speaker.firstName,
              lastName: speaker.lastName,
              slug: speaker.profileSlug,
            },
          },
          metadata: {
            sessionId: session.id,
          },
        })),
      );
    }

    return sendMail;
  }

  // ***************
  // Calendar things
  // Creates a new event on a shared google calendar
  function insertSharedCalendar({ session, event }) {
    dlog('insertSharedCalendar');

    if (session.status === 'ACCEPTED' && session.startTime instanceof Date) {
      calEvent
        .create(session, event)
        .then(result =>
          dlog('Event created %d, %o', result.status, result.data),
        )
        .catch(error =>
          process.nextTick(() =>
            adminEventEmitter.emit('calendarError', error),
          ),
        );
    }
  }

  // Updates an event on a shared google calendar
  function updateSharedCalendar({ session, event }) {
    dlog('updateSharedCalendar');

    if (session.status === 'ACCEPTED' && session.startTime instanceof Date) {
      calEvent
        .update(session, event)
        .then(result =>
          dlog('Event updated %d, %o', result.status, result.data),
        )
        .catch(error =>
          process.nextTick(() =>
            adminEventEmitter.emit('calendarError', error),
          ),
        );
    }
  }

  // Cancels an event on a shared google calendar
  function cancelSharedCalendar({ session }) {
    dlog('cancelSharedCalendar');

    calEvent
      .cancel(session)
      .then(result =>
        dlog('Event cancelled %d, %o', result.status, result.data),
      )
      .catch(error =>
        process.nextTick(() => adminEventEmitter.emit('calendarError', error)),
      );
  }

  // ***********
  // Slack stuff
  function sendSessionUpdatedSlack({
    session,
    originalSession,
    speaker,
    event,
    sendNotification,
  }) {
    dlog('call sendSessionUpdatedSlack');
    if (sendNotification !== true || session?.status === 'WITHDREW') {
      dlog(
        `sendNotification: ${sendNotification}, session.status: ${session?.status}, returning`,
      );
      return;
    }

    let timezone = 'US/Central';
    if (onlineEventTypes.includes(event.type)) timezone = 'UTC';
    const timeFormat = 'dddd, MMMM Do @ HH:mm z';
    const changes = determineSessionChanges({
      originalSession,
      updatedSession: session,
    });
    changes.time.original = changes.time.original
      ? dayjs(changes.time.original).tz(timezone).format(timeFormat)
      : 'TBD';
    changes.time.updated = changes.time.updated
      ? dayjs(changes.time.updated).tz(timezone).format(timeFormat)
      : 'TBD';
    changes.room.value = changes.room.changed
      ? `${changes.room.original}  :arrow_right:  ${changes.room.updated}`
      : changes.room.updated;
    changes.time.value = changes.time.changed
      ? `${changes.time.original}  :arrow_right:  ${changes.time.updated}`
      : changes.time.updated;

    slackNotifications.sessionUpdated({
      session,
      changes,
      speaker,
      event,
    });
  }

  function sendSessionCancelledSlack({
    session,
    speaker,
    event,
    sendNotification,
  }) {
    dlog('call sendSessionCancelledSlack');
    if (!sendNotification) {
      dlog(`sendNotification is ${sendNotification}, returning`);
      return;
    }

    slackNotifications.sessionCancelled({
      session,
      speaker,
      event,
    });
  }

  function setOgImage({ session }) {
    dlog('call setOgImage');
    if (session.status !== 'ACCEPTED') {
      dlog('session not accepted, leaving setOgImage');
      return;
    }

    callOgImage(session.id)
      .then(res => dlog('setOgImage result: %o', res))
      .catch(e => process.nextTick(() => adminEventEmitter.emit('error', e)));
  }

  function createDiscordVoiceChannel({ session }) {
    dlog('createDiscordVoiceChannel called');
    if (session.status === 'ACCEPTED') {
      createVoiceChannelForSession({ session })
        .then(() => dlog('creteVoiceChannelForSessions done. %o'))
        .catch(err =>
          process.nextTick(() => adminEventEmitter.emit('error', err)),
        );
    } else {
      dlog('session not accepted, not creating discord channel');
    }
  }

  // ********************
  // Intiaialize emitters
  adminEventEmitter.on('calendarError', err => {
    dlog('calendarError %O', err);
    Sentry.setTag('section', 'adminEventEmitter');
    Sentry.captureException(new SharedCalendarError(err.message));
  });

  adminEventEmitter.on('error', err => {
    dlog('error %O', err);
    Sentry.setTag('section', 'adminEventEmitter');
    Sentry.captureException(new Error(err.message));
  });

  adminEventEmitter.on('sessionCreated', insertSharedCalendar);
  adminEventEmitter.on('sessionCreated', setOgImage);
  adminEventEmitter.on('sessionCreated', createDiscordVoiceChannel);
  adminEventEmitter.on('sessionUpdated', sendFavoritesSessionUpdateEmail);
  adminEventEmitter.on('sessionUpdated', updateSharedCalendar);
  adminEventEmitter.on('sessionUpdated', sendSessionUpdatedSlack);
  adminEventEmitter.on('sessionUpdated', setOgImage);
  adminEventEmitter.on('sessionUpdated', createDiscordVoiceChannel);
  adminEventEmitter.on('sessionCancelled', sendFavoritesSessionUpdateEmail);
  adminEventEmitter.on('sessionCancelled', cancelSharedCalendar);
  adminEventEmitter.on('sessionCancelled', sendSessionCancelledSlack);

  return adminEventEmitter;
}
