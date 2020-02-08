import debug from 'debug';

const dlog = debug('that:api:sessions:query:AcceptedSession');

export const fieldResolvers = {
  AcceptedSession: {
    async __resolveReference({ id }, { dataSources: { sessionLoader } }) {
      dlog('resolveReference');

      const session = await sessionLoader.load(id);

      if (
        session.status === 'ACCEPTED' ||
        session.status === 'SCHEDULED' ||
        session.status === 'CANCELLED'
      )
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
