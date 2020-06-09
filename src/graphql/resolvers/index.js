import { resolvers as graphScalars } from 'graphql-scalars';
import { graph } from '@thatconference/api';

import queries, { fieldResolvers as qFieldResolvers } from './queries';
import mutations, { fieldResolvers as mFieldResolvers } from './mutations';

const createServer = {
  ...graphScalars,
  ...graph.scalars.date,
  ...graph.scalars.slug,

  ...qFieldResolvers,
  ...mFieldResolvers,

  Query: {
    ...queries,
  },

  Mutation: {
    ...mutations,
  },
};

export default createServer;
