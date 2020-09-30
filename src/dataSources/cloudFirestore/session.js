import debug from 'debug';
import slugify from 'slugify';
import * as Sentry from '@sentry/node';
import eventStore from './event';
import sessionDateForge from '../../lib/sessionDateForge';

const dlog = debug('that:api:sessions:datasources:firebase');
const approvedSessionStatuses = ['ACCEPTED', 'SCHEDULED', 'CANCELLED'];

function scrubSession(session, isNew) {
  const scrubbedSession = session;

  const modifiedAt = new Date();
  if (isNew) scrubbedSession.createdAt = modifiedAt;

  scrubbedSession.lastUpdatedAt = modifiedAt;

  return scrubbedSession;
}

function sessions(dbInstance) {
  dlog('sessions data source created');

  const collectionName = 'sessions';
  const sessionsCol = dbInstance.collection(collectionName);
  const attendedSubColName = 'inAttendance';

  async function genUniqueSlug(eventId, title) {
    dlog('generate unique slug for title %s in event %s', title, eventId);

    const slug = slugify(title, { lower: true, strict: true });
    const docSnap = await sessionsCol
      .where('eventId', '==', eventId)
      .where('slug', '==', slug)
      .get();
    if (docSnap.size > 0) {
      dlog('slug %s is not unique for eventId %s', slug, eventId);
      Sentry.withScope(scope => {
        scope.setLevel('info');
        scope.setFingerprint(['duplicate_slug']);
        scope.setContext('duplicate_slug_create_session', {
          title,
          eventId,
          slug,
        });
        Sentry.captureMessage(
          'duplicate slug creating event, will use eventId instead',
        );
      });
      return undefined;
    }

    return slug;
  }

  async function create({ eventId, user, session }) {
    dlog('creating session %o', { eventId, user, session });

    const scrubbedSession = scrubSession(session, true);
    scrubbedSession.speakers = [user.sub];
    scrubbedSession.eventId = eventId;
    const { community } = await eventStore(dbInstance).findCommunityFromId(
      eventId,
    );
    scrubbedSession.communities = community ? [community] : [];
    const slug = await genUniqueSlug(eventId, scrubbedSession.title);
    if (slug) {
      scrubbedSession.slug = slug;
    }
    dlog('saving session %o', scrubbedSession);

    const newDocument = await sessionsCol.add(scrubbedSession);
    dlog(`created new session: ${newDocument.id}`);

    if (!slug) {
      dlog(`saving id, ${newDocument.id} as slug`);
      const docRef = dbInstance.doc(`${collectionName}/${newDocument.id}`);
      await docRef.update({ slug: newDocument.id });
      scrubbedSession.slug = newDocument.id;
    }
    const result = {
      id: newDocument.id,
      ...scrubbedSession,
    };

    return sessionDateForge(result);
  }

  async function findMy({ user }) {
    const docSnapshot = await sessionsCol
      .where('speakers', 'array-contains', user.sub)
      .get();

    let results = null;

    if (docSnapshot.size > 0) {
      results = docSnapshot.docs.map(d => {
        const result = {
          id: d.id,
          ...d.data(),
        };
        return sessionDateForge(result);
      });
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

    return sessionDateForge(result);
  }

  async function findSession(sessionId) {
    const docRef = await dbInstance.doc(`${collectionName}/${sessionId}`).get();
    dlog('find session %s, is found: %o', sessionId, docRef.exists);
    let result = null;

    if (docRef.exists) {
      result = {
        id: docRef.id,
        ...docRef.data(),
      };
    }

    return sessionDateForge(result);
  }

  async function findAcceptedSession(sessionId) {
    dlog('find accepted session %s', sessionId);
    const session = await findSession(sessionId);
    dlog('session returned', session);
    if (session && approvedSessionStatuses.includes(session.status)) {
      return session;
    }

    return null;
  }

  async function batchFindSessions(sessionIds) {
    dlog('batchFindSessions %o', sessionIds);

    const docRefs = sessionIds.map(id =>
      dbInstance.doc(`${collectionName}/${id}`),
    );

    return Promise.all(docRefs.map(d => d.get())).then(res =>
      res
        .filter(r => r.exists)
        .map(r => {
          const result = {
            id: r.id,
            ...r.data(),
          };
          return sessionDateForge(result);
        }),
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

    const result = {
      id: sessionId,
      ...currentDoc,
      ...scrubbedSession,
    };

    return sessionDateForge(result);
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

  async function addInAttendance(sessionId, user) {
    dlog(
      'addInAttendance called on session %s for user %s',
      sessionId,
      user.sub,
    );

    dbInstance
      .doc(`${collectionName}/${sessionId}`)
      .set({ join: 1 }, { merge: true });

    const docRef = dbInstance.doc(
      `${collectionName}/${sessionId}/${attendedSubColName}/${user.sub}`,
    );

    return docRef
      .set({ attended: true })
      .then(() => true)
      .catch(() => false);
  }

  async function adminCreate({ eventId, session }) {
    dlog('creating as ADMIN session %o', { eventId, session });

    const scrubbedSession = scrubSession(session, true);
    scrubbedSession.eventId = eventId;
    const { community } = await eventStore(dbInstance).findCommunityFromId(
      eventId,
    );
    scrubbedSession.communities = community ? [community] : [];
    const slug = await genUniqueSlug(eventId, scrubbedSession.title);
    if (slug) {
      scrubbedSession.slug = slug;
    }
    dlog('saving session %o', scrubbedSession);

    const newDocument = await sessionsCol.add(scrubbedSession);
    dlog(`created new session: ${newDocument.id}`);

    if (!slug) {
      dlog(`saving id, ${newDocument.id} as slug`);
      const docRef = dbInstance.doc(`${collectionName}/${newDocument.id}`);
      await docRef.update({ slug: newDocument.id });
      scrubbedSession.slug = newDocument.id;
    }
    const result = {
      id: newDocument.id,
      ...scrubbedSession,
    };

    return sessionDateForge(result);
  }

  async function adminUpdate({ sessionId, session }) {
    dlog(`updating session ${sessionId} as ADMIN with %o`, session);
    const docRef = dbInstance.doc(`${collectionName}/${sessionId}`);
    const scrubbedSession = scrubSession(session);
    await docRef.update(scrubbedSession);

    const updatedDoc = await docRef.get();

    const result = {
      id: sessionId,
      ...updatedDoc.data(),
    };

    return sessionDateForge(result);
  }

  return {
    create,
    update,
    findMy,
    findMySession,
    findSession,
    findAcceptedSession,
    batchFindSessions,
    addInAttendance,
    getTotalProfessionalSubmittedForEvent,
    adminUpdate,
    adminCreate,
  };
}

export default sessions;
