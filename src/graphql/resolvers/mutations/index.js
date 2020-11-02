import rootMutations from './root';

import { fieldResolvers as sessionFields } from './session';
import { fieldResolvers as sessionsFields } from './sessions';
import { fieldResolvers as votingFields } from './voting';
import { fieldResolvers as sessionUpdate } from './sessionUpdate';
import { fieldResolvers as sessionCreate } from './sessionCreate';
import { fieldResolvers as adminSession } from './adminSession';
import { fieldResolvers as adminSessions } from './adminSessions';
import { fieldResolvers as adminSessionCreate } from './adminSessionCreate';
import { fieldResolvers as adminSessionUpdate } from './adminSessionUpdate';
import { fieldResolvers as favoritingFields } from './favoriting';
import { fieldResolvers as assetsFields } from './assets';
import { fieldResolvers as assetFields } from './asset';

export default {
  ...rootMutations,
};

export const fieldResolvers = {
  ...sessionFields,
  ...sessionsFields,
  ...votingFields,
  ...sessionUpdate,
  ...sessionCreate,
  ...adminSession,
  ...adminSessions,
  ...adminSessionCreate,
  ...adminSessionUpdate,
  ...favoritingFields,
  ...assetsFields,
  ...assetFields,
};
