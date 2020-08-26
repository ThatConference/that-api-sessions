import { EventEmitter } from 'events';
import debug from 'debug';
import moment from 'moment';
import envConfig from '../envConfig';
import calendarEvent from '../lib/calendarEvent';

const dlog = debug('that:api:sessions:events:user');
const calEvent = calendarEvent(
  envConfig.calendarCredentals,
  envConfig.sharedCalendarId,
);

const baseUris = {
  thatus: {
    session: 'https://that.us/sessions/',
    join: 'https://that.us/join/',
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

function userEvents(postmark) {
  const userEventEmitter = new EventEmitter();
  dlog('user event emitter created');

  function sessionCreated({ user, session }) {
    dlog('new session created');

    let TemplateAlias;
    let link;

    if (user.site === 'www.thatconference.com') {
      TemplateAlias = pmTemplates.thatconference.created;
      link = `${baseUris.thatconference.session}`;
    } else if (user.site === 'that.us') {
      TemplateAlias = pmTemplates.thatus.created;
      link = `${baseUris.thatus.session}/${session.id}`;
    } else {
      dlog('unknown or missing user.site value %s', user.site);
      // TODO:Add Sentry info warning here
      return undefined;
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
            link,
          },
          // Optional (hard coded in email now)
          // event: {
          //   name: 'Events name',
          //   year: 'Event year',
          //   cfpOpens: 'CallForCounselorOpenDate',
          //   cfpCloses: 'CallForCounselorCloseDate',
          //   announceDate: 'scheduleAnnouncedDate',
          // },
        },
      })
      .then(dlog('email sent'))
      .catch(e => process.nextTick(() => userEventEmitter.emit('error', e)));
  }

  function sessionUpdated({ user, session }) {
    dlog('session updated event fired');

    let TemplateAlias;
    let link;

    if (user.site === 'www.thatconference.com') {
      TemplateAlias = pmTemplates.thatconference.updated;
      link = `${baseUris.thatconference.session}`;
    } else if (user.site === 'that.us') {
      TemplateAlias = pmTemplates.thatus.updated;
      link = `${baseUris.thatus.session}/${session.id}`;
    } else {
      dlog('unknown or missing user.site value %s', user.site);
      // TODO:Add Sentry info warning here
      return undefined;
    }

    return postmark
      .sendEmailWithTemplate({
        // TemplateId: 15581957,
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
        },
      })
      .then(dlog('email sent'))
      .catch(e => process.nextTick(() => userEventEmitter.emit('error', e)));
  }

  // Creates a new event on a shared google calendar
  function insertSharedCalendar({ session }) {
    dlog('insertSharedCalendar');

    calEvent
      .create(session)
      .then(result => dlog('Event created %d, %O', result.status, result.data))
      .catch(error =>
        process.nextTick(() => userEventEmitter.emit('error', error)),
      );
  }

  // Updates an event on a shared google calendar
  function updateSharedCalendar({ session }) {
    dlog('updateSharedCalendar');

    calEvent
      .update(session)
      .then(result => dlog('Event updated %d, %O', result.status, result.data))
      .catch(error =>
        process.nextTick(() => userEventEmitter.emit('error', error)),
      );
  }

  // Cancels an event on a shared google calendar
  function cancelSharedCalendar({ session }) {
    dlog('cancelSharedCalendar');

    calEvent
      .cancel(session)
      .then(result =>
        dlog('Event cancelled %d, %O', result.status, result.data),
      )
      .catch(error =>
        process.nextTick(() => userEventEmitter.emit('error', error)),
      );
  }

  userEventEmitter.on('error', err => {
    throw new Error(err);
  });

  userEventEmitter.on('sessionCreated', sessionCreated);
  userEventEmitter.on('sessionCreated', insertSharedCalendar);
  userEventEmitter.on('sessionUpdated', sessionUpdated);
  userEventEmitter.on('sessionUpdated', updateSharedCalendar);
  userEventEmitter.on('sessionCancelled', cancelSharedCalendar);

  return userEventEmitter;
}

export default userEvents;
