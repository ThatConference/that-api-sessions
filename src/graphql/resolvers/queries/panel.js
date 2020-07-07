import debug from 'debug';

const dlog = debug('that:api:sessions:panel');

export const fieldResolvers = {
  Panel: {
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
