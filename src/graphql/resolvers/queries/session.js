/* eslint-disable no-underscore-dangle */
/* eslint-disable import/prefer-default-export */
import debug from 'debug';

const dlog = debug('that:api:sessions:query');

export const fieldResolvers = {
  Session: {
    __resolveReference({ id }) {
      dlog('Profile:federated resolveRef');

      const data = {
        '1': {
          title: 'session #1',
          shortDescription: 'this is my short desc',
          speakers: [
            {
              __typename: 'Profile',
              id: '1234',
            },
            {
              __typename: 'Profile',
              id: '4321',
            },
          ],
        },
        '2': {
          title: 'session #2',
          shortDescription: 'this is my short desc',
          speakers: [
            {
              __typename: 'Profile',
              id: '1234',
            },
            {
              __typename: 'Profile',
              id: '4321',
            },
          ],
        },
      };

      if (id === '1' || id === '2') {
        return data[id];
      }

      return {};
    },
  },
};
