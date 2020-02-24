import debug from 'debug';

const dlog = debug('that:api:sessions:datasources:firebase');

function scrubSession(session, isNew) {
  const scrubbedSession = session;

  const modifiedAt = new Date().toISOString();
  if (isNew) scrubbedSession.createdAt = modifiedAt;

  scrubbedSession.lastUpdatedAt = modifiedAt;

  return scrubbedSession;
}

function sessions(dbInstance) {
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

  async function findSessionBySlug(slug) {
    const docSnap = await sessionsCol
      .where('sessionSlug', '==', slug.toLowerCase())
      .where('status', '==', 'ACCEPTED')
      .get();

    let results = null;

    if (docSnap.size === 1) {
      dlog('found session by slug %o', slug);
      const session = docSnap.docs[0].data();
      session.id = docSnap.docs[0].id;

      results = session;
    }

    return results;
  }

  async function batchFindSessions(sessionIds) {
    dlog('batchFindSessions %o', sessionIds);

    const docRefs = sessionIds.map(id =>
      dbInstance.doc(`${collectionName}/${id}`),
    );

    return Promise.all(docRefs.map(d => d.get())).then(res =>
      res
        .filter(r => r.exists)
        .map(r => ({
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

  function getTotalProfessionalSubmittedForEvent(eventId) {
    dlog('getTotalProfessionalSubmittedForEvent');

    return sessionsCol
      .where('eventId', '==', eventId)
      .where('status', '==', 'SUBMITTED')
      .where('category', '==', 'PROFESSIONAL')
      .get()
      .then(snap => snap.size);
  }

  return {
    create,
    update,
    findMy,
    findMySession,
    findSessionBySlug,
    batchFindSessions,
    getTotalProfessionalSubmittedForEvent,
  };
}

export default sessions;
