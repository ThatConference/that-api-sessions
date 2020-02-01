import debug from 'debug';

const dlog = debug('that:api:sessions:query:Session');

export const fieldResolvers = {
  Session: {
    async __resolveReference({ id }, { dataSources: { sessionLoader } }) {
      dlog('resolverReference');

      const session = await sessionLoader.load(id);

      if (session.status === 'ACCEPTED' || session.status === 'SCHEDULED')
        return session;

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
