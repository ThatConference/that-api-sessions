import debug from 'debug';

const dlog = debug('that:api:assets:query:asset');

export const fieldResolvers = {
  AssetQuery: {
    get: ({ assetId }, __, { dataSources: { firestore }, user }) => {
      dlog('get %s', assetId);
      return null;
    },
  },
};
