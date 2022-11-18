/* eslint-disable import/prefer-default-export */
import debug from 'debug';

import favoriteStore from '../../../dataSources/cloudFirestore/favorite';
import sessionStore from '../../../dataSources/cloudFirestore/session';

const dlog = debug('that:api:sessions:mutation:favorite');

export const fieldResolvers = {
  FavoritingMutation: {
    toggle: async (
      { eventId },
      { sessionId },
      { dataSources: { firestore }, user },
    ) => {
      dlog('toggle favorite %s', sessionId);
      // see if favorite exists
      const fav = await favoriteStore(firestore).findSessionForMember(
        sessionId,
        user,
      );

      if (fav) {
        dlog('favorite exists, removing');
        const res = await favoriteStore(firestore).removeFavorite(fav.id);
        dlog('favorite deleted at ', res);
      } else {
        dlog('favorite not exist, adding new');

        const favSession = await sessionStore(firestore).findSession(sessionId);
        if (
          favSession &&
          ['ACCEPTED', 'SCHEDULED', 'CANCELLED'].includes(favSession.status)
        ) {
          const newFav = await favoriteStore(firestore).addSessionFavorite(
            eventId,
            sessionId,
            user,
          );
          dlog('new favorite %O', newFav);
          if (!newFav.id)
            throw new Error(
              'New favorite not created: eventId %s, sessionId %s, memberId %s',
              eventId,
              sessionId,
              user.sub,
            );
          // favSession doesn't need to be refreshed as the
          // favoriteCount and favortiedBy fields are updated by resolver
          return {
            id: sessionId,
            session: favSession,
          };
        }
      }

      return {
        id: sessionId,
        session: null,
      };
    },
  },
};
