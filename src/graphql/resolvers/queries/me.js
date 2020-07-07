import debug from 'debug';

import sessionStore from '../../../dataSources/cloudFirestore/session';
import eventStore from '../../../dataSources/cloudFirestore/event';
import favoriteStore from '../../../dataSources/cloudFirestore/favorites';

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
      const { isVotingOpen } = await eventStore(firestore).getEvent(eventId);

      return { eventId, isVotingOpen };
    },
    favorites: async (
      _,
      { eventId },
      { dataSources: { firestore, sessionLoader }, user },
    ) => {
      dlog('my favorite sessions called');

      const favorites = await favoriteStore(firestore).findFavoritesForMember(
        eventId,
        user,
      );

      const favoriteSessions = await Promise.all(
        favorites.map(fav => {
          dlog('fav %O', fav);

          return sessionLoader.load(fav.id);
        }),
      ).then(aa => aa);

      dlog('favoriteSesions: %O', favoriteSessions);

      return [];
    },
    submitted: async (_, __, { dataSources: { firestore }, user }) => {
      dlog('submitted called');
      return sessionStore(firestore).findMy({ user });
    },
  },
};
