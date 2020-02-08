/* eslint-disable no-unused-vars */
/* eslint-disable import/prefer-default-export */
import debug from 'debug';

const dlog = debug('that:api:sessions:query:SessionsQuery');

export const fieldResolvers = {
  SessionsQuery: {
    me: (parent, args, { dataSources: { firestore, logger }, user }) => {
      dlog('me called');
      return {};
    },
  },
};
