import debug from 'debug';

const dlog = debug('that:api:sessions:datasources:firebase:event');

function event(dbInstance) {
  dlog('sessions data source created');

  const collectionName = 'events';

  async function getEvent(eventId) {
    dlog('isVotingOpen');

    const docRef = dbInstance.doc(`${collectionName}/${eventId}`);
    const doc = await docRef.get();

    return {
      id: doc.id,
      ...doc.data(),
    };
  }

  return { getEvent };
}

export default event;
