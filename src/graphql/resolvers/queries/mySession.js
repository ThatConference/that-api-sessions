import debug from 'debug';
import { findAssets } from '../shared/resolveSessionAssets';

const dlog = debug('that:api:sessions:query:MySession');

export const fieldResolvers = {
  MySession: {
    async __resolveReference({ id }, { dataSources: { sessionLoader } }) {
      dlog('resolveReference');

      const session = await sessionLoader.load(id);

      // todo.. fix this...
      if (session.status === 'WITHDREW') return session;

      return null;
    },
    speakers: parent => {
      dlog('speakers');

      return parent.speakers.map(s => ({
        id: s,
      }));
    },
    assets: (
      { id: entityId },
      __,
      { dataSources: { firestore, assetLoader } },
    ) => {
      dlog('session assets requested');
      return findAssets({ entityId, firestore, assetLoader });
    },
  },
};
