import debug from 'debug';

const dlog = debug('that-api-reporting:mutation');

const resolvers = {
  events: () => {
    dlog('root:sessions mutation called');
    return {};
  },
};

export default resolvers;
