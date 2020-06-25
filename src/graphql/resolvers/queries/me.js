import debug from 'debug';

import sessionStore from '../../../dataSources/cloudFirestore/session';
import eventStore from '../../../dataSources/cloudFirestore/event';

const dlog = debug('that:api:sessions:me');

export const fieldResolvers = {
  MeQuery: {
    all: (_, __, { dataSources: { firestore }, user }) => {
      dlog('my all called');
      return sessionStore(firestore).findMy({ user });
    },
    session: (_, { id }, { dataSources: { firestore }, user }) => {
      dlog('my session called');

      return sessionStore(firestore).findMySession({
        user,
        sessionId: id,
      });
    },
    voting: async (_, { eventId }, { dataSources: { firestore } }) => {
      const { isVotingOpen } = await eventStore(firestore).getEvent(eventId);

      return { eventId, isVotingOpen };
    },
  },
  // Base: {
  //   __resolveType(obj, __, ___) {
  //     dlog('Base inerface __resolveType');
  //     let result = null;
  //     switch (obj.type) {
  //       case 'REGULAR':
  //         result = 'Regular';
  //         break;
  //       case 'OPEN_SPACE':
  //         result = 'OpenSpace';
  //         break;
  //       case 'KEYNOTE':
  //         result = 'Keynote';
  //         break;
  //       default:
  //     }
  //     dog('result', result);
  //     return result;
  //   },
  // },
  TheSessions: {
    __resolveType(obj, context, info) {
      dlog('TheSessions __resolveType', obj);
      let result = null;
      switch (obj.type) {
        case 'REGULAR':
          result = 'Regular';
          break;
        case 'OPEN_SPACE':
          result = 'OpenSpace';
          break;
        case 'KEYNOTE':
          result = 'Keynote';
          break;
        case 'PANEL':
          result = 'Panel';
          break;
        case 'FULL_DAY_WORKSHOP' || 'HALF_DAY_WORKSHOP':
          result = 'Workshop';
          break;
        default:
      }
      dlog('result:', result);
      return result;
    },
  },
  MyQuery: {
    all: (_, __, { dataSources: { firestore }, user }) => {
      dlog('my all called');
      return sessionStore(firestore).findMy({ user });
    },
    session: (_, { id }, { dataSources: { firestore }, user }) => {
      dlog('my session called');

      return sessionStore(firestore).findMySession({
        user,
        sessionId: id,
      });
    },
  },
};
