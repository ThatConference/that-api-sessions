import rootMutations from './root';

import { fieldResolvers as sessionFields } from './session';
import { fieldResolvers as sessionsFields } from './sessions';
import { fieldResolvers as votingFields } from './voting';

export default {
  ...rootMutations,
};

export const fieldResolvers = {
  ...sessionFields,
  ...sessionsFields,
  ...votingFields,
};
