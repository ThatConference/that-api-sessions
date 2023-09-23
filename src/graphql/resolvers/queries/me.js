import debug from 'debug';
import { dataSources } from '@thatconference/api';
import dayjs from 'dayjs';

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
      { eventId, historyDays },
      { dataSources: { firestore, sessionLoader }, user },
    ) => {
      dlog(
        'my favorite sessions called for %s, history: %o',
        eventId,
        historyDays,
      );
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

      let favoriteSessions = await Promise.all(
        favorites.map(fav => sessionLoader.load(fav.sessionId)),
      ).then(fs =>
        fs.filter(s =>
          ['ACCEPTED', 'SCHEDULED', 'CANCELLED'].includes(s?.status),
        ),
      );

      dlog('favoriteSessions count: %d', favoriteSessions.length);
      if (Number.isInteger(historyDays)) {
        // valueOf() returns epoch in ms
        const favoritesAfter = dayjs().subtract(historyDays, 'day').valueOf();
        dlog('favorites after:: %O', favoritesAfter);
        favoriteSessions = favoriteSessions.filter(
          fs => dayjs(fs.startTime).valueOf() > favoritesAfter,
        );

        dlog(
          'favoriteSessions count: %o  (historyDays: %d)',
          favoriteSessions.length,
          historyDays,
        );
      }

      return favoriteSessions.map(s => ({
        id: s.id,
        session: s,
      }));
    },

    submitted: async (_, __, { dataSources: { firestore }, user }) => {
      dlog('submitted called');
      return sessionStore(firestore).findMy({ user });
    },
  },
};
