/* eslint-disable no-unused-vars */
/* eslint-disable import/prefer-default-export */
import debug from 'debug';

const dlog = debug('that:api:sessions:query:SessionsQuery');

export const fieldResolvers = {
  SessionsQuery: {
    me: (parent, args, { dataSources: { firestore }, user }) => {
      dlog('me called');
      return {};
    },
    my: () => {
      dlog('my called');
      return {};
    },
  },
};
