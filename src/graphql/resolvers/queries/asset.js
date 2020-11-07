import debug from 'debug';
import assetStore from '../../../dataSources/cloudFirestore/asset';
import sessionStore from '../../../dataSources/cloudFirestore/session';

const dlog = debug('that:api:assets:query:asset');

export const fieldResolvers = {
  AssetQuery: {
    get: ({ assetId }, __, { dataSources: { firestore } }) => {
      dlog('get %s', assetId);
      return assetStore(firestore).get(assetId);
    },
  },

  Asset: {
    __resolveReference({ id }, { dataSources: { assetLoader } }) {
      dlog('resolveReference %s', id);
      return assetLoader.load(id);
    },

    assignments: async (
      { id: assetId },
      __,
      { dataSources: { firestore } },
    ) => {
      dlog(`asset's assignments %s`, assetId);
      const assignments = await assetStore(firestore).getAssetAssignments(
        assetId,
      );
      // return assignments.map(a => a);
      dlog('***** assignments', assignments);
      return assignments.map(a => {
        if (a.entityType === 'SESSION') {
          return sessionStore(firestore)
            .findSession(a.id)
            .then(session => ({ ...session, entityType: a.entityType }));
        }
        dlog('*****  this is a', a);
        return a;
      });
    },

    createdBy: ({ createdBy }) => ({ id: createdBy }),

    lastUpdatedBy: ({ lastUpdatedBy }) => ({ id: lastUpdatedBy }),
  },
};
