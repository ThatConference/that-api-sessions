import { graph } from '@thatconference/api';
import canMutate from './canMutate';

export default {
  auth: graph.directives.auth,
  canMutate,
};
