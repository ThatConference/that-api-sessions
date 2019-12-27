import debug from 'debug';

const dlog = debug('that:api:sessions:query');

const resolvers = {
  sessions: () => {
    dlog('root:sessions query called');
    return {};
  },
};

export default resolvers;
