/* eslint-disable import/prefer-default-export */
import debug from 'debug';

import voteStore from '../../../dataSources/cloudFirestore/voting';

const dlog = debug('that:api:sessions:mutation:voting');

export const fieldResolvers = {
  VotingMutation: {
    cast: ({ eventId }, { vote }, { dataSources: { firestore }, user }) => {
      dlog('cast');
      return voteStore(firestore).castVote(eventId, user, vote);
    },
  },
};
