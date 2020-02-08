import debug from 'debug';

const dlog = debug('that:api:sessions:query:AnonymizedSession');

export const fieldResolvers = {
  AnonymizedSession: {
    async __resolveReference({ id }, { dataSources: { sessionLoader } }) {
      dlog('resolveReference');

      const session = await sessionLoader.load(id);

      if (session.status === 'SUBMITTED') return session;

      return null;
    },

    speakers: parent => {
      dlog('speakers');

      return parent.speakers.map(s => ({
        __typename: 'PublicProfile',
        id: s,
      }));
    },
  },
};
