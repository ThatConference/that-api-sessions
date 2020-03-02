import debug from 'debug';
import lodash from 'lodash';

import votingStore from '../../../dataSources/cloudFirestore/voting';
import sessionStore from '../../../dataSources/cloudFirestore/session';
import shuffle from '../../../lib/shuffle';

const dlog = debug('that:api:sessions:me');

export const fieldResolvers = {
  VotingQuery: {
    isVotingOpen: ({ isVotingOpen }) => isVotingOpen,
    totalSubmitted: ({ eventId }, _, { dataSources: { firestore } }) => {
      dlog('totalSubmitted');
      return sessionStore(firestore).getTotalProfessionalSubmittedForEvent(
        eventId,
      );
    },

    unVoted: async (
      { eventId, isVotingOpen },
      _,
      { dataSources: { firestore }, user },
    ) => {
      dlog('sessions');

      if (!isVotingOpen) {
        throw new Error('Voting is not currently open');
      }

      const sessions = await votingStore(firestore).findUnVoted(eventId, user);

      return shuffle(sessions);
    },

    voted: async (
      { eventId, isVotingOpen },
      _,
      { dataSources: { firestore, sessionLoader }, user },
    ) => {
      dlog('sessions');

      if (!isVotingOpen) {
        throw new Error('Voting is not currently open');
      }

      const userVotes = await votingStore(firestore)
        .findVoted(eventId, user)
        .then(r =>
          r.reduce((acc, current) => {
            acc[current.sessionId] = {
              ...current,
            };

            return acc;
          }, {}),
        );

      const votedSessionsDetails = await Promise.all(
        Object.keys(userVotes).map(s => sessionLoader.load(s)),
      ).then(sd =>
        sd
          .filter(s => s !== null)
          .reduce((acc, current) => {
            acc[current.id] = {
              ...current,
            };

            return acc;
          }, {}),
      );

      const mergedDetails = lodash.merge(userVotes, votedSessionsDetails);

      return Object.keys(mergedDetails)
        .map(k => mergedDetails[k])
        .filter(f => f.title);
    },
  },
};
