import root from './root';

import { fieldResolvers as sessionsFields } from './sessions';
import { fieldResolvers as sessionFields } from './session';
import { fieldResolvers as acceptedSessionFields } from './acceptedSession';
import { fieldResolvers as mySessionFields } from './mySession';
import { fieldResolvers as meFields } from './me';
import { fieldResolvers as votingFields } from './voting';

export default {
  ...root,
};

export const fieldResolvers = {
  ...sessionsFields,
  ...meFields,
  ...sessionFields,
  ...acceptedSessionFields,
  ...mySessionFields,
  ...votingFields,
};
