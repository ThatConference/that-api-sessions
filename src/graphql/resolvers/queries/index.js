import root from './root';

import { fieldResolvers as sessionsFields } from './sessions';
import { fieldResolvers as meFields } from './me';
import { fieldResolvers as mySessionFields } from './mySession';
import { fieldResolvers as votingFields } from './voting';
import { fieldResolvers as acceptedSessionFields } from './acceptedSession';
import { fieldResolvers as anonymizedSessionFields } from './anonymizedSession';
import { fieldResolvers as theSessionsFields } from './theSessions';
import { fieldResolvers as regularFields } from './regular';
import { fieldResolvers as openSpaceFields } from './openSpace';
import { fieldResolvers as keynoteFields } from './keynote';
import { fieldResolvers as panelFields } from './panel';
import { fieldResolvers as workshopFields } from './workshop';
import { fieldResolvers as adminFields } from './sessionAdminFields';
import { fieldResolvers as adminSessionsFields } from './adminSessions';
import { fieldResolvers as eventDestinationFields } from './eventDestination';

export default {
  ...root,
};

export const fieldResolvers = {
  ...sessionsFields,
  ...meFields,
  ...acceptedSessionFields,
  ...mySessionFields,
  ...votingFields,
  ...anonymizedSessionFields,
  ...theSessionsFields,
  ...regularFields,
  ...openSpaceFields,
  ...keynoteFields,
  ...panelFields,
  ...workshopFields,
  ...adminFields,
  ...adminSessionsFields,
  ...eventDestinationFields,
};
