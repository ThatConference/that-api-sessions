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
    scrubbedSession.speakers = [user.sub];
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

  async function findMy({ user }) {
    const { docs } = await sessionsCol
      .where('speakers', 'array-contains', user.sub)
      .get();

    const results = docs.map(d => ({
      id: d.id,
      ...d.data(),
    }));

    return results;
  }

  async function update({ user, sessionId, session }) {
    const docRef = dbInstance.doc(`${collectionName}/${sessionId}`);

    const currentDoc = (await docRef.get()).data();
    if (!currentDoc.speakers.includes(user.sub))
      throw new Error('Requested Session Update Not Found for User');

    const scrubbedSession = scrubSession(session);

    await docRef.update(scrubbedSession);
    dlog(`updated session: ${sessionId}`);

    return {
      id: sessionId,
      ...currentDoc,
      ...scrubbedSession,
    };
  }

  return { create, update, findMy };
}

export default sessions;
