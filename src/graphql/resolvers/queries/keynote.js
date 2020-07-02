import debug from 'debug';

const dlog = debug('that:api:sessions:keynote');

export const fieldResolvers = {
  Keynote: {
    speakers: parent => {
      dlog('speakers');

      return parent.speakers.map(s => ({
        id: s,
      }));
    },
  },
};
