import debug from 'debug';

const dlog = debug('that:api:sessions:mutation');

const resolvers = {
  sessions: () => {
    dlog('root:sessions mutation called');
    return {};
  },
};

export default resolvers;
