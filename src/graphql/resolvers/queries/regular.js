import debug from 'debug';

const dlog = debug('that:api:sessions:regular');

export const fieldResolvers = {
  Regular: {
    speakers: parent => {
      dlog('speakers');

      return parent.speakers.map(s => ({
        id: s,
      }));
    },
    tags: parent => {
      dlog('tags');

      if (!parent.tags) return [];
      return parent.tags;
    },
  },
};
