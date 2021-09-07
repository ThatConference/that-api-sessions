import debug from 'debug';
import { dataSources } from '@thatconference/api';

import sessionStore from '../../../dataSources/cloudFirestore/session';
import favoriteStore from '../../../dataSources/cloudFirestore/favorite';

const eventStore = dataSources.cloudFirestore.event;
const dlog = debug('that:api:sessions:me');

export const fieldResolvers = {
  MeQuery: {
    all: (_, __, { dataSources: { firestore }, user }) => {
      dlog('my all called');
      return sessionStore(firestore).findMy({ user });
    },
    session: (_, { id }, { dataSources: { firestore }, user }) => {
      dlog('my session called');

      return sessionStore(firestore).findMySession({
        user,
        sessionId: id,
      });
    },
    voting: async (_, { eventId }, { dataSources: { firestore } }) => {
      const { isVotingOpen } = await eventStore(firestore).get(eventId);

      return { eventId, isVotingOpen };
    },
    favorites: async (
      _,
      { eventId },
      { dataSources: { firestore, sessionLoader }, user },
    ) => {
      dlog('my favorite sessions called');
      let favorites;
      if (eventId.toUpperCase() === 'ANY') {
        favorites = await favoriteStore(firestore).findAllFavoritesForMember(
          user,
        );
      } else {
        favorites = await favoriteStore(firestore).findFavoritesForMember(
          eventId,
          user,
        );
      }
      dlog('total favorites returned: %d', favorites.length);

      const favoriteSessions = await Promise.all(
        favorites.map(fav => sessionLoader.load(fav.sessionId)),
      ).then(fs =>
        fs
          .filter(s => s != null)
          .filter(s =>
            ['ACCEPTED', 'SCHEDULED', 'CANCELLED'].includes(s.status),
          ),
      );
      dlog('favoriteSessions count: %d', favoriteSessions.length);

      return favoriteSessions;
    },

    submitted: async (_, __, { dataSources: { firestore }, user }) => {
      dlog('submitted called');
      return sessionStore(firestore).findMy({ user });
    },
  },
};
