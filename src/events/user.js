import { EventEmitter } from 'events';
import debug from 'debug';
import moment from 'moment';

const dlog = debug('that:api:sessions:events:user');

function userEvents(postmark) {
  const userEventEmitter = new EventEmitter();
  dlog('user event emitter created');

  function newSessionCreated({ user, session }) {
    dlog('new session created');

    postmark.sendEmailWithTemplate({
      TemplateId: 15581327,
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
    });
  }

  function sessionUpdated({ user, session }) {
    postmark.sendEmailWithTemplate({
      TemplateId: 15581957,
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
    });
    dlog('session updated event fired');
  }

  userEventEmitter.on('newSessionCreated', newSessionCreated);
  userEventEmitter.on('sessionUpdated', sessionUpdated);

  return userEventEmitter;
}

export default userEvents;
