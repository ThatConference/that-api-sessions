import debug from 'debug';

const dlog = debug('that:api:sessions:openspace');

export const fieldResolvers = {
  OpenSpace: {
    speakers: parent => {
      dlog('speakers');

      return parent.speakers.map(s => ({
        id: s,
      }));
    },
  },
};
