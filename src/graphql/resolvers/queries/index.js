import root from './root';

import { fieldResolvers as sessionsFields } from './sessions';

export default {
  ...root,
};

export const fieldResolvers = {
  ...sessionsFields,
};
