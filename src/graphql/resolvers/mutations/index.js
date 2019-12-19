import rootMutations from './root';

import { fieldResolvers as sessionFields } from './session';
import { fieldResolvers as sessionsFields } from './sessions';

export default {
  ...rootMutations,
};

export const fieldResolvers = {
  ...sessionFields,
  ...sessionsFields,
};
