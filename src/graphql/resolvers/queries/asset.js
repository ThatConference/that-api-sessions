import debug from 'debug';
import assetStore from '../../../dataSources/cloudFirestore/asset';

const dlog = debug('that:api:assets:query:asset');

export const fieldResolvers = {
  AssetQuery: {
    get: ({ assetId }, __, { dataSources: { firestore }, user }) => {
      dlog('get %s', assetId);
      return assetStore(firestore).get(assetId);
    },
  },

  Asset: {
    assignments: ({ id: assetId }, __, { dataSources: { firestore } }) => {
      dlog(`asset's assignments %s`, assetId);
      return assetStore(firestore).getAssetAssignments(assetId);
    },
  },
};
