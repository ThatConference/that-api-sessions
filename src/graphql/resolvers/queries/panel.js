import debug from 'debug';
import favoriteStore from '../../../dataSources/cloudFirestore/favorite';
import favoritedByFunc from '../shared/favoritedBy';

const dlog = debug('that:api:sessions:panel');

export const fieldResolvers = {
  Panel: {
    speakers: parent => {
      dlog('speakers');

      return parent.speakers.map(s => ({
        id: s,
      }));
    },
    tags: parent => {
      dlog('tags');

      if (!parent.tags) return [];
      return parent.tags;
    },
    favoritedBy: async ({ id }, __, { dataSources: { firestore } }) =>
      favoritedByFunc(id, firestore),

    favoriteCount: async ({ id }, __, { dataSources: { firestore } }) => {
      dlog('favoriteCount');

      return favoriteStore(firestore).getSessionFavoriteCount(id);
    },
  },
};
