/* eslint-disable no-unused-vars */
import debug from 'debug';
import { resolveType } from '@thatconference/schema';

const dlog = debug('that:api:sessions:thesessions');

export const fieldResolvers = {
  TheSessions: {
    __resolveType(obj, context, info) {
      return resolveType.theSessionsType(obj.type);
    },
    __resolveReference({ id }, { dataSources: { sessionLoader } }) {
      return sessionLoader.load(id);
    },
  },
};
