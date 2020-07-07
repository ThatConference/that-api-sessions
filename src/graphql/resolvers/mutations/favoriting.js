/* eslint-disable import/prefer-default-export */
import debug from 'debug';

// import voteStore from '../../../dataSources/cloudFirestore/favorites';

const dlog = debug('that:api:sessions:mutation:favorite');

export const fieldResolvers = {
  FavoritingMutation: {
    toggle: (
      { eventId },
      { favorite },
      { dataSources: { firestore }, user },
    ) => {
      dlog('toggle favorite %o', favorite);
      // return voteStore(firestore).castVote(eventId, user, vote);
      return {};
    },
  },
};
