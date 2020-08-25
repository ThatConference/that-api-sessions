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

function userEvents(postmark) {
  const userEventEmitter = new EventEmitter();
  dlog('user event emitter created');

  function sessionCreated({ user, session }) {
    dlog('new session created');

    return postmark
      .sendEmailWithTemplate({
        // TemplateId: 15581327,
        TemplateAlias: 'THATconferenceSessionCreated',
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
            createdAt: moment(session.createdAt).format('M/D/YYYY h:mm:ss A'),
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
    return postmark
      .sendEmailWithTemplate({
        // TemplateId: 15581957,
        TemplateAlias: 'THATconferenceSessionUpdated',
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
            lastUpdatedAt: moment(session.lastUpdatedAt).format(
              'M/D/YYYY h:mm:ss A',
            ),
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

  // userEventEmitter.on('sessionCreated', sessionCreated);
  userEventEmitter.on('sessionCreated', insertSharedCalendar);
  // userEventEmitter.on('sessionUpdated', sessionUpdated);
  userEventEmitter.on('sessionUpdated', updateSharedCalendar);
  userEventEmitter.on('sessionCancelled', cancelSharedCalendar);

  return userEventEmitter;
}

export default userEvents;
