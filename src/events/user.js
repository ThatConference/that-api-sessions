import { EventEmitter } from 'events';
import debug from 'debug';
import dayjs from 'dayjs';
import djsUTC from 'dayjs/plugin/utc';
import djsTimezone from 'dayjs/plugin/timezone';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import iCal from 'ical-generator';
import * as Sentry from '@sentry/node';
import { orbitLove } from '@thatconference/api';
import envConfig from '../envConfig';
import calendarEvent from '../lib/calendarEvent';
import slackNotifications from '../lib/slackNotifications';
import callOgImage from '../lib/callOgImage';
import { SharedCalendarError, SendEmailError } from '../lib/errors';

const dlog = debug('that:api:sessions:events:user');
const calEvent = calendarEvent(
  envConfig.calendarCredentals,
  envConfig.sharedCalendarId,
);
dayjs.extend(djsUTC);
dayjs.extend(djsTimezone);
dayjs.extend(advancedFormat);
const inPersonEventTypes = ['MULTI_DAY', 'HYBRID_MULTI_DAY', 'SINGLE_DAY'];
const onlineEventTypes = ['ONLINE', 'DAILY'];

const baseUris = {
  thatus: {
    session: 'https://that.us/activities',
    join: 'https://that.us/join',
  },
  thatconference: {
    session: 'https://thatconference.com/activities',
    mySessions: 'https://thatconference.com/my/submissions',
  },
};

const pmTemplates = {
  thatconference: {
    created: 'THATconferenceSessionCreated',
    updated: 'THATconferenceSessionUpdated',
  },
  thatus: {
    created: 'that.us-session-created',
    updated: 'that.us-session-updated',
    canceled: 'that.us-session-cancelled',
  },
};

function createIcal({ session, user, event }) {
  dlog('create ical for postmark email');
  let link;
  let location;
  if (
    inPersonEventTypes.includes(event.type) &&
    session?.location?.isOnline !== true
  ) {
    location = event.name;
    link = `${baseUris.thatconference.session}/${session.id}`;
  } else {
    location = 'THAT.us';
    link = `${baseUris.thatus.session}/${session.id}`;
  }

  const iEvent = {
    uid: `that-${session.id}@${user.site}`,
    start: dayjs(session.startTime).utc(),
    end: dayjs(session.startTime)
      .utc()
      .add(session.durationInMinutes, 'minute'),
    summary: session.title,
    description: session.shortDescription,
    link,
    location,
  };

  const ical = iCal();
  ical.prodId('//THAT Conference//THAT//EN');
  ical.createEvent(iEvent);
  const icalString = ical.toString();

  return Buffer.from(icalString, 'ascii').toString('base64');
}

function userEvents(postmark) {
  const userEventEmitter = new EventEmitter();
  dlog('user event emitter created');

  function sendSessionCreatedEmail({ user, session, event }) {
    dlog('new session created');

    let TemplateAlias;
    let link;

    if (inPersonEventTypes.includes(event.type)) {
      TemplateAlias = pmTemplates.thatconference.created;
      link = `${baseUris.thatconference.session}/${session.id}`;
    } else if (onlineEventTypes.includes(event.type)) {
      TemplateAlias = pmTemplates.thatus.created;
      link = `${baseUris.thatus.session}/${session.id}`;
    } else {
      dlog(
        'unknown or missing event.type value %s (site: %s)',
        event.type,
        user.site,
      );
      Sentry.withScope(scope => {
        scope.setLevel('info');
        scope.setContext('event information', {
          title: session.title,
          sessionId: session.id,
          'that-site': user.site,
          eventType: event.type,
          eventId: event.id,
          memberId: user.id,
        });
        scope.setTag('correlationId', user.correlationId);
        Sentry.captureMessage(
          'No or invalid that-site present when sending session email',
        );
      });
      return undefined;
    }

    const attachments = [];
    if (session.startTime && session.durationInMinutes) {
      attachments.push({
        Name: `${session.slug}@${user.site}.ics`,
        Content: createIcal({ session, user, event }),
        ContentType: 'text/calendar; charset=utf-8; method=REQUEST',
      });
    }

    return postmark
      .sendEmailWithTemplate({
        TemplateAlias,
        From: 'Hello@THATConference.com',
        To: user.email,
        Tag: 'session',
        TemplateModel: {
          member: {
            firstName: user.firstName,
            lastName: user.lastName,
          },
          session: {
            id: session.id,
            title: session.title,
            createdAt: dayjs(session.createdAt)
              .utc()
              .format('M/D/YYYY h:mm:ss A'),
            startTime: dayjs(session.startTime)
              .utc()
              .format('M/D/YYYY h:mm:ss A'),
            duration: session.durationInMinutes,
            shortDescription: session.shortDescription,
            link,
          },
          event: {
            name: event.name,
            startDate: dayjs(event.startDate)
              .utc()
              .format('M/D/YYYY h:mm:ss A'),
            cfpOpen: dayjs(event.callForSpeakersOpenDate)
              .utc()
              .format('M/D/YYYY'),
            cfpClose: dayjs(event.callForSpeakersCloseDate)
              .utc()
              .format('M/D/YYYY'),
          },
        },
        Attachments: attachments,
      })
      .then(dlog('email sent'))
      .catch(e =>
        process.nextTick(() => userEventEmitter.emit('emailError', e)),
      );
  }

  function sendSessionUpdatedEmail({ user, session, event }) {
    dlog('session updated event fired');

    let TemplateAlias;
    let link;

    if (inPersonEventTypes.includes(event.type)) {
      TemplateAlias = pmTemplates.thatconference.updated;
      link = `${baseUris.thatconference.session}/${session.id}`;
    } else if (onlineEventTypes.includes(event.type)) {
      TemplateAlias = pmTemplates.thatus.updated;
      link = `${baseUris.thatus.session}/${session.id}`;
    } else {
      dlog(
        'unknown or missing event.type value %s (site: %s)',
        event.type,
        user.site,
      );
      Sentry.withScope(scope => {
        scope.setLevel('info');
        scope.setContext('event information', {
          title: session.title,
          sessionId: session.id,
          'that-site': user.site,
          eventType: event.type,
          eventId: event.id,
          memberId: user.id,
        });
        scope.setTag('correlationId', user.correlationId);
        Sentry.captureMessage(
          'No or invalid that-site present when sending session email',
        );
      });
      return undefined;
    }

    const attachments = [];
    if (session.StartTime && session.durationInMinutes) {
      attachments.push({
        Name: `${session.slug}@${user.site}.ics`,
        Content: createIcal({ session, user }),
        ContentType: 'text/calendar; charset=utf-8; method=REQUEST',
      });
    }

    return postmark
      .sendEmailWithTemplate({
        TemplateAlias,
        From: 'Hello@THATConference.com',
        To: user.email,
        TemplateModel: {
          member: {
            firstName: user.firstName,
            lastName: user.lastName,
          },
          session: {
            id: session.id,
            title: session.title,
            lastUpdatedAt: dayjs(session.lastUpdatedAt)
              .utc()
              .format('M/D/YYYY h:mm:ss A'),
            link,
          },
          event: {
            name: event.name,
            startDate: dayjs(event.startDate)
              .utc()
              .format('M/D/YYYY h:mm:ss A'),
          },
        },
        Attachments: attachments,
      })
      .then(dlog('email sent'))
      .catch(e =>
        process.nextTick(() => userEventEmitter.emit('emailError', e)),
      );
  }

  // Creates a new event on a shared google calendar
  function insertSharedCalendar({ session, event }) {
    dlog('insertSharedCalendar');

    if (
      session.status === 'ACCEPTED' &&
      onlineEventTypes.includes(event.type)
    ) {
      calEvent
        .create(session, event)
        .then(result =>
          dlog('Event created %d, %o', result.status, result.data),
        )
        .catch(error =>
          process.nextTick(() => userEventEmitter.emit('calendarError', error)),
        );
    }
  }

  // Updates an event on a shared google calendar
  function updateSharedCalendar({ session, event }) {
    dlog('updateSharedCalendar');

    if (
      session.status === 'ACCEPTED' &&
      ['ONLINE', 'DAILY'].includes(event.type)
    ) {
      calEvent
        .update(session, event)
        .then(result =>
          dlog('Event updated %d, %o', result.status, result.data),
        )
        .catch(error =>
          process.nextTick(() => userEventEmitter.emit('calendarError', error)),
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
        process.nextTick(() => userEventEmitter.emit('calendarError', error)),
      );
  }

  function sendSessionCreatedSlack({ session, user, event }) {
    dlog('call createdSessionSlack()');

    if (session.status === 'ACCEPTED') {
      slackNotifications.sessionCreated({ session, user, event });
    }
  }

  function setOgImage({ session }) {
    dlog('call setOgImage');
    if (session.status !== 'ACCEPTED') {
      dlog('session not accepted, leaving setOgImage');
      return;
    }

    callOgImage(session.id)
      .then(res => dlog('setOgImage result: %o', res))
      .catch(e => process.nextTick(() => userEventEmitter.emit('error', e)));
  }

  function sendOrbitLoveActivityOnCreate({ session, user, event, firestore }) {
    dlog('call sendOrbitLove Activity, on create');
    const orbitLoveApi = orbitLove.orbitLoveApi({ firestore });

    let getOrbitActivityType = null;
    if (session.status === 'ACCEPTED')
      getOrbitActivityType = orbitLove.activityTypes.session.createOpenSpace;
    else if (session.status === 'SUBMITTED')
      getOrbitActivityType = orbitLove.activityTypes.session.submit;
    else return undefined;

    return (
      orbitLoveApi
        .addSessionActivity({
          activityType: getOrbitActivityType(),
          user,
          session,
          event,
        })
        // .then(res => dlog('sendOrbitLove result: %o', res))
        .catch(err =>
          process.nextTick(() => userEventEmitter.emit('error', err)),
        )
    );
  }

  function sendOrbitLoveActivtyOnUpdate({ session, user, event, firestore }) {
    dlog('call sendOrbitLove Activty, onUpdate');
    const orbitLoveApi = orbitLove.orbitLoveApi({ firestore });

    let getOrbitActivityType = null;
    if (session.status === 'ACCEPTED' && session.type === 'OPENSPACE')
      getOrbitActivityType = orbitLove.activityTypes.session.createOpenSpace;
    else if (session.status === 'SUBMITTED')
      getOrbitActivityType = orbitLove.activityTypes.session.submit;
    else return undefined;

    return orbitLoveApi
      .addSessionActivity({
        activityType: getOrbitActivityType(),
        user,
        session,
        event,
      })
      .then(res => dlog('sendOrbitLove result: %o', res))
      .catch(err =>
        process.nextTick(() => userEventEmitter.emit('error', err)),
      );
  }

  userEventEmitter.on('emailError', err => {
    Sentry.setTag('section', 'userEventEmitter');
    Sentry.captureException(new SendEmailError(err.message));
  });

  userEventEmitter.on('calendarError', err => {
    Sentry.setTag('section', 'userEventEmitter');
    Sentry.captureException(new SharedCalendarError(err.message));
  });
  userEventEmitter.on('error', err => {
    Sentry.setTag('section', 'adminEventEmitter');
    Sentry.captureException(new Error(err.message));
  });

  userEventEmitter.on('sessionCreated', sendSessionCreatedEmail);
  userEventEmitter.on('sessionCreated', insertSharedCalendar);
  userEventEmitter.on('sessionCreated', sendSessionCreatedSlack);
  userEventEmitter.on('sessionCreated', setOgImage);
  userEventEmitter.on('sessionCreated', sendOrbitLoveActivityOnCreate);
  userEventEmitter.on('sessionUpdated', sendSessionUpdatedEmail);
  userEventEmitter.on('sessionUpdated', updateSharedCalendar);
  userEventEmitter.on('sessionUpdated', setOgImage);
  userEventEmitter.on('sessionUpdated', sendOrbitLoveActivtyOnUpdate);
  userEventEmitter.on('sessionCancelled', cancelSharedCalendar);
  // on admin events
  userEventEmitter.on('adminSessionCreated', insertSharedCalendar);
  userEventEmitter.on('adminSessionCreated', setOgImage);
  userEventEmitter.on('adminSessionUpdated', updateSharedCalendar);
  userEventEmitter.on('adminSessionUpdated', setOgImage);
  userEventEmitter.on('adminSessionCancelled', cancelSharedCalendar);

  return userEventEmitter;
}

export default userEvents;
