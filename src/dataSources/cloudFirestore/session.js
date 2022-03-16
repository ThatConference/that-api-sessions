import debug from 'debug';
import slugify from 'slugify';
import * as Sentry from '@sentry/node';
import { utility, mentions } from '@thatconference/api';
import eventStore from './event';

const { entityDateForge } = utility.firestoreDateForge;
const forgeFields = ['createdAt', 'lastUpdatedAt', 'startTime'];
const sessionDateForge = entityDateForge({ fields: forgeFields });
const dlog = debug('that:api:sessions:datasources:firebase');
const approvedSessionStatuses = ['ACCEPTED', 'SCHEDULED', 'CANCELLED'];
const mentionFields = ['shortDescription', 'longDescription', 'title', 'tags'];

function validateStatuses(statuses) {
  dlog('validateStatuses %o', statuses);
  if (!Array.isArray(statuses) || statuses.length === 0) {
    throw new Error('statuses must be in the form of an array with a value.');
  }
  const inStatus = statuses;
  const isIndex = inStatus.indexOf('APPROVED');
  if (isIndex >= 0) {
    inStatus.splice(isIndex, 1);
    inStatus.push(...approvedSessionStatuses);
  }
  if (inStatus > 10)
    throw new Error(`A maximum of 10 statuses may be queried for. ${statuses}`);

  dlog('statuses valdated %o', inStatus);
  return inStatus;
}

function scrubSession(session, isNew) {
  const scrubbedSession = session;

  const modifiedAt = new Date();
  if (isNew) scrubbedSession.createdAt = modifiedAt;
  scrubbedSession.lastUpdatedAt = modifiedAt;

  if (scrubbedSession?.location?.url?.href)
    scrubbedSession.location.url = scrubbedSession.location.url.href;
  if (scrubbedSession?.location?.digitalSign?.href)
    scrubbedSession.location.digitalSign =
      scrubbedSession.location.digitalSign.href;

  return scrubbedSession;
}

async function parseAndPersistMentions({ scrubbedSession, firestore }) {
  const promiseSlug = [];
  if (scrubbedSession.shortDescription)
    promiseSlug.push(
      mentions.parseToSlug({
        text: scrubbedSession.shortDescription,
        firestore,
      }),
    );
  if (scrubbedSession.longDescription)
    promiseSlug.push(
      mentions.parseToSlug({
        text: scrubbedSession.longDescription,
        firestore,
      }),
    );
  if (scrubbedSession.title || scrubbedSession.tags) {
    let text = '';
    text += scrubbedSession.title ? scrubbedSession.title : ' ';
    text += scrubbedSession.tags ? ` ${scrubbedSession.tags.join(' ')}` : ' ';
    promiseSlug.push(
      mentions.parseToSlug({
        text,
        firestore,
      }),
    );
  }
  const slugResult = await Promise.all(promiseSlug);
  const allMentions = slugResult.reduce((acc, cur) => acc.concat(cur), []);
  dlog('allMentions %o', allMentions);

  const communitySlugs = allMentions
    .filter(m => m.type === 'community')
    .map(m => m.slug);
  dlog('communitySlugs %o', communitySlugs);

  const workingSession = scrubbedSession;
  if (!scrubbedSession.communities || scrubbedSession.communities.length === 0)
    workingSession.communities = ['that'];
  const [c0] = workingSession.communities;
  workingSession.communities = [...new Set([c0, ...communitySlugs])];
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
          'duplicate slug creating session, will use sessionId instead',
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
    if (!scrubbedSession.startTime) scrubbedSession.startTime = null;
    const slug = await genUniqueSlug(eventId, scrubbedSession.title);
    if (slug) {
      scrubbedSession.slug = slug;
    }

    // mentions
    await parseAndPersistMentions({ scrubbedSession, firestore: dbInstance });

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
        result = sessionDateForge(result);
      }
    }

    return result;
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
      result = sessionDateForge(result);
    }

    return result;
  }

  async function findAcceptedSession(sessionId) {
    dlog('find accepted session %s', sessionId);
    const session = await findSession(sessionId);
    dlog('session returned %o', session);
    if (session && approvedSessionStatuses.includes(session.status)) {
      return session;
    }

    return null;
  }

  async function batchFindSessions(sessionIds) {
    dlog('batchFindSessions called on %d ids', sessionIds?.length);
    if (!Array.isArray(sessionIds))
      throw new Error('batchFindSessions parameter must be an array');

    const docRefs = sessionIds.map(id =>
      dbInstance.doc(`${collectionName}/${id}`),
    );
    if (docRefs.length < 1) return [];

    return dbInstance.getAll(...docRefs).then(docSnaps =>
      docSnaps.map(r => {
        const result = {
          id: r.id,
          ...r.data(),
        };

        return sessionDateForge(result);
      }),
    );
  }

  function findWithStatuses({ statuses, orderBy, eventId }) {
    dlog('findWithStatuses, %o; orderby, %s', statuses, orderBy);
    const inStatus = validateStatuses(statuses);
    let startTimeOrder;
    if (orderBy === 'START_TIME_ASC') startTimeOrder = 'asc';
    else if (orderBy === 'START_TIME_DESC') startTimeOrder = 'desc';
    let query = sessionsCol.where('status', 'in', inStatus);
    if (eventId) query = query.where('eventId', '==', eventId);
    if (startTimeOrder) query = query.orderBy('startTime', startTimeOrder);

    return query.get().then(qrySnap => {
      dlog('size of query result:: %d', qrySnap.size);
      return qrySnap.docs.map(d => {
        const r = {
          id: d.id,
          ...d.data(),
        };
        return sessionDateForge(r);
      });
    });
  }

  async function findWithStatusesPaged({
    statuses,
    orderBy,
    filter,
    asOfDate,
    pageSize,
    cursor,
  }) {
    dlog('findWithStatusesPaged %o, %s', statuses, asOfDate);
    const inStatus = validateStatuses(statuses);
    const truePSize = Math.min(pageSize || 20, 100); // max page: 100
    let allOrderBy = 'desc';
    if (orderBy === 'START_TIME_ASC') allOrderBy = 'asc';

    let startTimeOrder = 'asc';
    if (filter === 'PAST') {
      startTimeOrder = 'desc';
    } else if (filter === 'ALL') {
      startTimeOrder = allOrderBy;
    }

    let query = sessionsCol
      .where('status', 'in', inStatus)
      .orderBy('startTime', startTimeOrder)
      .orderBy('createdAt', 'asc')
      .limit(truePSize);

    if (asOfDate && !cursor) {
      query = query.startAfter(new Date(asOfDate));
    } else if (cursor) {
      const curObject = Buffer.from(cursor, 'base64').toString('utf8');
      const { curStartTime, curCreatedAt, curFilter } = JSON.parse(curObject);
      dlog('decoded cursor:%s, %s, %s', curObject, curStartTime, curCreatedAt);
      if (!curStartTime || !curCreatedAt || (curFilter && curFilter !== filter))
        throw new Error('Invalid cursor provided as cursor value');

      query = query.startAfter(new Date(curStartTime), new Date(curCreatedAt));
    }

    const { size, docs } = await query.get();
    dlog('query returned %d documents', size);

    const sessionList = docs.map(s => {
      const r = {
        id: s.id,
        ...s.data(),
      };
      return sessionDateForge(r);
    });
    const lastDoc = sessionList[sessionList.length - 1];
    let newCursor = '';
    if (lastDoc) {
      const cpieces = JSON.stringify({
        curStartTime: lastDoc.startTime,
        curCreatedAt: lastDoc.createdAt,
        curFilter: filter,
      });
      newCursor = Buffer.from(cpieces, 'utf8').toString('base64');
    }
    return {
      cursor: newCursor,
      sessions: sessionList,
      count: sessionList.length,
    };
  }

  async function update({ user, sessionId, session }) {
    dlog(`updating session ${sessionId} with %o`, session);
    const docRef = dbInstance.doc(`${collectionName}/${sessionId}`);

    const currentDoc = (await docRef.get()).data();
    if (!currentDoc.speakers.includes(user.sub))
      throw new Error('Requested Session Update Not Found for User');

    const scrubbedSession = scrubSession(session);

    // mentions
    await parseAndPersistMentions({ scrubbedSession, firestore: dbInstance });

    await docRef.update(scrubbedSession);
    dlog(`updated session: ${sessionId}`);

    const result = {
      id: sessionId,
      ...currentDoc,
      ...scrubbedSession,
    };

    return sessionDateForge(result);
  }

  // This is an admin batch function which will not continue if
  // mention fields are included.
  // One use, schedule updates.
  // id required and passed in sessions object
  function updateNonMentionBatch(batchSessions) {
    if (!Array.isArray(batchSessions))
      throw new Error('batchSessions must be in the form of an array');
    dlog('updateNonMentionBatch called on %d sessions', batchSessions.length);
    const batchWrite = dbInstance.batch();
    batchSessions.forEach((bs, idx) => {
      if (Object.keys(bs).some(k => mentionFields.includes(k))) {
        throw new Error(
          `Batch contains a mention parsed field, cannot continue. Mention fields are: ${mentionFields.join(
            ', ',
          )}`,
        );
      }
      if (!bs.id) {
        throw new Error(
          `Batch session value missing id, cannot update batch. Index: ${idx}`,
        );
      }
      scrubSession(bs, false);
      const docRef = sessionsCol.doc(bs.id);
      const upSession = bs;
      delete upSession.id;

      batchWrite.update(docRef, upSession);
    });

    return batchWrite.commit().then(() => true);
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
    if (!scrubbedSession.startTime) scrubbedSession.startTime = null;
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
    findMy,
    findMySession,
    findSession,
    findAcceptedSession,
    batchFindSessions,
    findWithStatuses,
    findWithStatusesPaged,
    update,
    updateNonMentionBatch,
    getTotalProfessionalSubmittedForEvent,
    addInAttendance,
    adminCreate,
    adminUpdate,
  };
}

export default sessions;
export { parseAndPersistMentions };
