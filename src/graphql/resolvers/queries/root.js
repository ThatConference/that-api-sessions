import debug from 'debug';

const dlog = debug('that-api-reporting:query');

const resolvers = {
  sessions: () => {
    dlog('root:sessions query called');
    return {};
  },
};

export default resolvers;
