import debug from 'debug';
import favoriteStore from '../../../dataSources/cloudFirestore/favorite';
import favoritedByFunc from '../shared/favoritedBy';
import { findAssets } from '../shared/resolveSessionAssets';

const dlog = debug('that:api:sessions:openspace');

export const fieldResolvers = {
  OpenSpace: {
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
    favoritedBy: ({ id }, __, { dataSources: { firestore } }) =>
      favoritedByFunc(id, firestore),

    favoriteCount: ({ id }, __, { dataSources: { firestore } }) => {
      dlog('favoriteCount');

      return favoriteStore(firestore).getSessionFavoriteCount(id);
    },
    assets: (
      { id: entityId },
      __,
      { dataSources: { firestore, assetLoader } },
    ) => {
      dlog('session assets requested');
      return findAssets({ entityId, firestore, assetLoader });
    },
    admin: parent => parent,
  },
};
