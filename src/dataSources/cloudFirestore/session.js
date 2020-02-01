import debug from 'debug';

const dlog = debug('that:api:sessions:datasources:firebase');

function scrubSession(session, isNew) {
  const scrubbedSession = session;

  const modifiedAt = new Date().toISOString();
  if (isNew) scrubbedSession.createdAt = modifiedAt;

  scrubbedSession.lastUpdatedAt = modifiedAt;

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

  async function findMy({ user }) {
    const docSnapshot = await sessionsCol
      .where('speakers', 'array-contains', user.sub)
      .get();

    let results = null;

    if (docSnapshot.size > 0) {
      results = docSnapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
      }));
    }

    return results;
  }

  async function findMySession({ user, sessionId }) {
    const docRef = await dbInstance.doc(`${collectionName}/${sessionId}`).get();

    let result = null;

    if (docRef.exists) {
      const doc = docRef.data();

      if (doc.speakers.includes(user.sub)) {
        result = {
          id: docRef.id,
          ...doc,
        };
      }
    }

    return result;
  }

  async function batchFindSessions(sessionIds) {
    dlog('batchFindSessions %o', sessionIds);

    const docRefs = sessionIds.map(id =>
      dbInstance.doc(`${collectionName}/${id}`),
    );

    return Promise.all(docRefs.map(d => d.get())).then(res =>
      res.map(r => ({
        id: r.id,
        ...r.data(),
      })),
    );
  }

  async function update({ user, sessionId, session }) {
    dlog(`updating session ${sessionId} with %o`, session);
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

  return { create, update, findMy, findMySession, batchFindSessions };
}

export default sessions;
