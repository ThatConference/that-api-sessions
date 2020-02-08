import root from './root';

import { fieldResolvers as sessionsFields } from './sessions';
import { fieldResolvers as meFields } from './me';
import { fieldResolvers as mySessionFields } from './mySession';

import { fieldResolvers as votingFields } from './voting';
import { fieldResolvers as acceptedSessionFields } from './acceptedSession';

export default {
  ...root,
};

export const fieldResolvers = {
  ...sessionsFields,
  ...meFields,
  ...acceptedSessionFields,
  ...mySessionFields,
  ...votingFields,
};
