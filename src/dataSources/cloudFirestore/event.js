// ** DEPRECATED **
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

  async function findCommunityFromId(eventId) {
    dlog('findCommunityFromId %s', eventId);
    const docSnapshot = await dbInstance
      .doc(`${collectionName}/${eventId}`)
      .get();

    return {
      id: docSnapshot.id,
      community: docSnapshot.get('community'),
    };
  }

  return { getEvent, findCommunityFromId };
}

export default event;
