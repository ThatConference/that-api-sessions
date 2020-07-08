/* eslint-disable import/prefer-default-export */
import debug from 'debug';

import favoriteStore from '../../../dataSources/cloudFirestore/favorite';
import sessionStore from '../../../dataSources/cloudFirestore/session';

const dlog = debug('that:api:sessions:mutation:favorite');

export const fieldResolvers = {
  FavoritingMutation: {
    toggle: async (
      { eventId },
      { favorite },
      { dataSources: { firestore }, user },
    ) => {
      dlog('toggle favorite %o', favorite);
      // see if favorite exists
      const fav = await favoriteStore(firestore).findSessionForMember(
        favorite.sessionId,
        user,
      );

      if (fav) {
        dlog('favorite exists, removing');
        const res = await favoriteStore(firestore).removeFavorite(fav.id);
        dlog('favorite deleted at ', res);
      } else {
        dlog('favorite not exist, adding new');
        const newFav = await favoriteStore(firestore).addSessionFavorite(
          eventId,
          favorite.sessionId,
          user,
        );
        dlog('new favorite %O', newFav);
        if (!newFav.id)
          throw new Error(
            'New favorite not created: eventId %s, sessionId %s, memberId %s',
            eventId,
            favorite.sessionId,
            user.sub,
          );
        return sessionStore(firestore).findSession(favorite.sessionId);
      }

      return null;
    },
  },
};
