import {
  URLResolver as URL,
  DateTimeResolver as DateTime,
} from 'graphql-scalars';
import { graph } from '@thatconference/api';

import queries, { fieldResolvers as qFieldResolvers } from './queries';
import mutations, { fieldResolvers as mFieldResolvers } from './mutations';

const createServer = {
  URL,
  DateTime,
  ...graph.scalars.Date,
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
