/* eslint-disable import/prefer-default-export */
import debug from 'debug';
import moment from 'moment';
import sessionStore from '../../../dataSources/cloudFirestore/session';

const dlog = debug('that:api:sessions:mutation');

export const fieldResolvers = {
  SessionsMutation: {
    create: async (
      parent,
      { eventId, session },
      { dataSources: { firestore, logger, postmark }, user },
    ) => {
      dlog('SessionsMutation:create called');

      const newSession = await sessionStore(firestore, logger).create({
        eventId,
        user,
        session,
      });

      // TODO: provide object with member's information
      // await postmark.sendEmailWithTemplate({
      //   // TemplateId: 15581327,
      //   TemplateAlias: 'THATconferenceSessionCreated',
      //   From: 'hello@thatconference.com',
      //   To: 'Users-email-address',
      //   TemplateModel: {
      //     member: {
      //       firstName: 'first-name',
      //       lastName: 'last-name',
      //     },
      //     session: {
      //       id: newSession.id,
      //       title: newSession.title,
      //       createdAt: moment(newSession.createdAt).format(
      //         'M/D/YYYY h:mm:ss A',
      //       ),
      //     },
      //     // Optional (hard coded in email now)
      //     event: {
      //       name: 'Events name',
      //       year: 'Event year',
      //       cfpOpens: 'CallForCounselorOpenDate',
      //       cfpCloses: 'CallForCounselorCloseDate',
      //       announceDate: 'scheduleAnnouncedDate',
      //     },
      //   },
      // });

      return newSession;
    },
    delete: async (parent, { id }, { dataSources: { firestore, logger } }) => {
      dlog('SessionsMutation:delete called');
      throw new Error('not implemented yet');
      // sessionStore(firestore, logger).get(id),
    },
    session: (parent, { id }) => {
      dlog('SessionsMutation:session called');
      return { sessionId: id };
    },
  },
};
