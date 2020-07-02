import debug from 'debug';

const dlog = debug('that:api:sessions:workshop');

export const fieldResolvers = {
  Workshop: {
    speakers: parent => {
      dlog('speakers');

      return parent.speakers.map(s => ({
        id: s,
      }));
    },
  },
};
