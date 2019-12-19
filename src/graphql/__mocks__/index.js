import faker from 'faker';

// import event from './event';
// import milestone from './milestone';
// import venue from './venue';

const mocks = {
  URL: () => faker.internet.url(),

  // Event: event,
  // Milestone: milestone,
  // Venue: venue,
};

export default () => mocks;
