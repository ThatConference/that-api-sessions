import root from './root';

import { fieldResolvers as sessionsFields } from './sessions';
import { fieldResolvers as meFields } from './me';

export default {
  ...root,
};

export const fieldResolvers = {
  ...sessionsFields,
  ...meFields,
};
