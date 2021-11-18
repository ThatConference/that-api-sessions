import { EventEmitter } from 'events';
import debug from 'debug';
import moment from 'moment';
import iCal from 'ical-generator';
import * as Sentry from '@sentry/node';
import envConfig from '../envConfig';
import calendarEvent from '../lib/calendarEvent';
import slackNotifications from '../lib/slackNotifications';
import { SharedCalendarError, SendEmailError } from '../lib/errors';

const dlog = debug('that:api:sessions:events:user');
const calEvent = calendarEvent(
  envConfig.calendarCredentals,
  envConfig.sharedCalendarId,
);

const baseUris = {
  thatus: {
    session: 'https://that.us/activities',
    join: 'https://that.us/join',
  },
  thatconference: {
    session: 'https://www.thatconference.com/member/my-sessions',
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

function createIcal({ session, user }) {
  dlog('create ical for postmark email');
  const iEvent = {
    uid: `that-${session.id}@${user.site}`,
    start: moment(session.startTime),
    end: moment(session.startTime).add(session.durationInMinutes, 'minutes'),
    summary: session.title,
    description: session.shortDescription,
    location: 'THAT.us',
  };
  let link;
  if (user.site === 'www.thatconference.com') {
    link = `${baseUris.thatconference.session}`;
  } else {
    link = `${baseUris.thatus.session}/${session.id}`;
  }
  iEvent.url = link;

  const ical = iCal();
  ical.prodId('//THAT Conference//THAT.us//EN');
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

    if (['MULTI_DAY', 'HYBRID_MULTI_DAY', 'SINGLE_DAY'].includes(event.type)) {
      TemplateAlias = pmTemplates.thatconference.created;
      link = baseUris.thatconference.session;
    } else if (['ONLINE', 'DAILY'].includes(event.type)) {
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
            createdAt: moment
              .utc(session.createdAt)
              .format('M/D/YYYY h:mm:ss A'),
            startTime: moment
              .utc(session.startTime)
              .format('M/D/YYYY h:mm:ss A'),
            duration: session.durationInMinutes,
            shortDescription: session.shortDescription,
            link,
          },
          event: {
            name: event.name,
            startDate: moment.utc(event.startDate).format('M/D/YYYY h:mm:ss A'),
            cfpOpen: moment
              .utc(event.callForSpeakersOpenDate)
              .format('M/D/YYYY'),
            cfpClose: moment
              .utc(event.callForSpeakersCloseDate)
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

    if (['MULTI_DAY', 'HYBRID_MULTI_DAY', 'SINGLE_DAY'].includes(event.type)) {
      TemplateAlias = pmTemplates.thatconference.updated;
      link = `${baseUris.thatconference.session}`;
    } else if (['ONLINE', 'DAILY'].includes(event.type)) {
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
            lastUpdatedAt: moment
              .utc(session.lastUpdatedAt)
              .format('M/D/YYYY h:mm:ss A'),
            link,
          },
          event: {
            name: event.name,
            startDate: moment.utc(event.startDate).format('M/D/YYYY h:mm:ss A'),
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
      ['ONLINE', 'DAILY'].includes(event.type)
    ) {
      calEvent
        .create(session)
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
        .update(session)
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
  userEventEmitter.on('sessionUpdated', sendSessionUpdatedEmail);
  userEventEmitter.on('sessionUpdated', updateSharedCalendar);
  userEventEmitter.on('sessionCancelled', cancelSharedCalendar);
  // on admin events
  userEventEmitter.on('adminSessionCreated', insertSharedCalendar);
  userEventEmitter.on('adminSessionUpdated', updateSharedCalendar);
  userEventEmitter.on('adminSessionCancelled', cancelSharedCalendar);

  return userEventEmitter;
}

export default userEvents;
