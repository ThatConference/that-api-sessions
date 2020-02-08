import debug from 'debug';
import _ from 'lodash';

const dlog = debug('that:api:sessions:datasources:firebase:voting');

function voting(dbInstance, logger) {
  dlog('sessions data source created');

  const collectionName = 'sessions';
  const sessionCollection = dbInstance.collection(collectionName);

  const votingCollectionName = 'votes';
  const votingCollection = dbInstance.collection(votingCollectionName);

  function findUnVoted(eventId, user) {
    dlog('findUnvoted');

    return Promise.all([
      votingCollection
        .where('memberId', '==', user.sub)
        .where('eventId', '==', eventId)
        .get(),

      sessionCollection
        .where('eventId', '==', eventId)
        .where('status', '==', 'SUBMITTED')
        .get(),
    ])
      .then(([{ docs: votes }, { docs: sessions }]) => {
        dlog(`${sessions.length} sessions, ${votes.length} votes`);
        return _.pullAllWith(
          sessions,
          votes,
          (a, b) => a.id === b.data().sessionId,
        );
      })
      .then(remaining => remaining.map(r => ({ id: r.id, ...r.data() })));
  }

  return { findUnVoted };
}

export default voting;
