import debug from 'debug';

const dlog = debug('that:api:sessions:datasources:firebase');

function scrubSession(session, isNew) {
  const scrubbedSession = session;

  const modifiedAt = new Date();
  if (isNew) scrubbedSession.createdAt = modifiedAt.toISOString();

  scrubbedSession.lastUpdatedAt = modifiedAt.toISOString();

  return scrubbedSession;
}

function sessions(dbInstance, logger) {
  dlog('sessions data source created');

  const collectionName = 'sessions';
  const sessionsCol = dbInstance.collection(collectionName);

  async function create({ eventId, user, session }) {
    dlog('creating session %o', { eventId, user, session });

    const scrubbedSession = scrubSession(session, true);
    scrubbedSession.speaker = [user.sub];
    scrubbedSession.eventId = eventId;

    dlog('saving session %o', scrubbedSession);

    const newDocument = await sessionsCol.add(scrubbedSession);
    dlog(`created new session: ${newDocument.id}`);
    return {
      id: newDocument.id,
      ...scrubbedSession,
    };
  }

  async function find(sessionId) {
    const docRef = dbInstance.doc(`${collectionName}/${sessionId}`);
    const doc = await await docRef.get();
    return {
      id: doc.id,
      ...doc.data(),
    };
  }

  async function findAllByEventId(eventID) {
    // const { docs } = await eventsCol.get();
    // const results = docs.map(d => ({
    //   id: d.id,
    //   ...d.data(),
    // }));
    // return results;
  }

  async function update({ user, sessionId, session }) {
    // TODO: ADD USER SESSION CHECK
    const scrubbedSession = scrubSession(session);

    const docRef = dbInstance.doc(`${collectionName}/${sessionId}`);
    await docRef.update(scrubbedSession);
    dlog(`updated session: ${sessionId}`);

    const updatedDoc = await docRef.get();

    return {
      id: updatedDoc.id,
      ...updatedDoc.data(),
    };
  }

  return { create, update, find };
}

export default sessions;
