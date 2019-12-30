/* eslint-disable import/prefer-default-export */
import debug from 'debug';
import moment from 'moment';

import sessionStore from '../../../dataSources/cloudFirestore/session';

const dlog = debug('that:api:sessions:mutation');

export const fieldResolvers = {
  SessionMutation: {
    update: async (
      { sessionId },
      { session },
      { dataSources: { firestore, logger, postmark }, user },
    ) => {
      dlog('SessionMutation:update called');

      const results = await sessionStore(firestore, logger).update({
        user,
        sessionId,
        session,
      });

      // TODO: provide object with member's information
      // await postmark.sendEmailWithTemplate({
      //   // TemplateId: 15581957,
      //   TemplateAlias: 'THATconferenceSessionUpdated',
      //   From: 'hello@thatconference.com',
      //   To: 'Users-email-address',
      //   TemplateModel: {
      //     member: {
      //       firstName: 'first-name',
      //       lastName: 'last-name',
      //     },
      //     session: {
      //       id: results.id,
      //       title: results.title,
      //       lastUpdatedAt: moment(results.lastUpdatedAt).format(
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

      return results;
    },
    cancel: async (
      { sessionId },
      args,
      { dataSources: { firestore, logger } },
    ) => {
      dlog('SessionMutation:cancel called');
      throw new Error('not implemented yet');
      // sessionStore(firestore, logger).get(id),
    },
    castVote: async (
      { sessionId },
      { session },
      { dataSources: { firestore, logger } },
    ) => {
      dlog('SessionMutation:castVote called');
      throw new Error('not implemented yet');
      // sessionStore(firestore, logger).get(id),
    },
  },
};
