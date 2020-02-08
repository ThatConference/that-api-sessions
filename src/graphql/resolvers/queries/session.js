import debug from 'debug';

const dlog = debug('that:api:sessions:query:Session');

export const fieldResolvers = {
  Session: {
    speakers: parent => {
      dlog('speakers');

      return parent.speakers.map(s => ({
        __typename: 'PublicProfile',
        id: s,
      }));
    },
  },
};
