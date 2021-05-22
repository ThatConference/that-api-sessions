import debug from 'debug';
import { findAssets } from '../shared/resolveSessionAssets';

const dlog = debug('that:api:sessions:query:AnonymizedSession');

export const fieldResolvers = {
  AnonymizedSession: {
    async __resolveReference({ id }, { dataSources: { sessionLoader } }) {
      dlog('resolveReference');

      const session = await sessionLoader.load(id);

      if (session.status === 'SUBMITTED') return session;

      return null;
    },
    tags: parent => {
      dlog('tags');

      if (!parent.tags) return [];
      return parent.tags;
    },
    assets: ({ id: entityId }, __, { dataSources: { firestore } }) => {
      dlog('session assets requested');
      return findAssets({ entityId, firestore });
    },
  },
};
