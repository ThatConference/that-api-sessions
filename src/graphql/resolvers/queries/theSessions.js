/* eslint-disable no-unused-vars */
import debug from 'debug';

const dlog = debug('that:api:sessions:thesessions');

export const fieldResolvers = {
  TheSessions: {
    __resolveType(obj, context, info) {
      let result = null;
      switch (obj.type) {
        case 'REGULAR':
          result = 'Regular';
          break;
        case 'OPEN_SPACE':
          result = 'OpenSpace';
          break;
        case 'KEYNOTE':
          result = 'Keynote';
          break;
        case 'PANEL':
          result = 'Panel';
          break;
        case 'FULL_DAY_WORKSHOP':
          result = 'Workshop';
          break;
        case 'HALF_DAY_WORKSHOP':
          result = 'Workshop';
          break;
        default:
          throw new Error(
            `Resolver encountered unknown session type ${obj.type}`,
          );
      }
      return result;
    },
  },
};
