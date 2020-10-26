/* eslint-disable no-unused-vars */
import debug from 'debug';

const dlog = debug('that:api:asset:assetowner');

export const fieldResolvers = {
  AssetOwner: {
    __resolveType(obj, context, info) {
      dlog('__resolveType called');
      let result = null;
      switch (obj.OwnerType) {
        case 'PARTNER':
          result = 'Partner';
          break;
        case 'EVENT':
          result = 'Event';
          break;
        case 'COMMUNITY':
          result = 'Community';
          break;
        case 'MEMBER':
          result = 'Member';
          break;
        case 'SESSION':
          result = 'AcceptedSession';
          break;
        default:
      }
      dlog('type result %s', result);
      return result;
    },
  },
};
