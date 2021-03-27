import debug from 'debug';

const dlog = debug('that:api:sessions:datasources:firebase:favorites');

function favorites(dbInstance) {
  dlog('favorites data source created');

  const collectionName = 'favorites';
  const favoriteCollection = dbInstance.collection(collectionName);

  async function findFavoritesForMember(eventId, user) {
    dlog('findFavoritesForMember() %s, %s', eventId, user.sub);

    const { docs } = await favoriteCollection
      .where('memberId', '==', user.sub)
      .where('eventId', '==', eventId)
      .get();
    dlog('favorites docs count %d', docs.length);

    return docs.map(r => ({ id: r.id, ...r.data() }));
  }

  function findAllFavoritesForMember(user) {
    dlog('findAllFavoritesForMember %s', user.sub);

    return favoriteCollection
      .where('memberId', '==', user.sub)
      .where('sessionId', '!=', '')
      .get()
      .then(querySnap => querySnap.docs.map(r => ({ id: r.id, ...r.data() })));
  }

  async function findFavoritesForSession(sessionId) {
    dlog('findFavoritesForSession() %s', sessionId);

    const { docs } = await favoriteCollection
      .where('sessionId', '==', sessionId)
      .get();
    dlog('favorites docs count %d', docs.length);

    return docs.map(r => ({ id: r.id, ...r.data() }));
  }

  async function getSessionFavoriteCount(sessionId) {
    dlog('getSessionFavoriteCount %s', sessionId);
    const snapshot = await favoriteCollection
      .where('sessionId', '==', sessionId)
      .get();

    dlog('docRef Size: %d', snapshot.size);
    return snapshot.size;
  }

  async function findSessionForMember(sessionId, user) {
    dlog('findSessionForMember');
    const { docs } = await favoriteCollection
      .where('sessionId', '==', sessionId)
      .where('memberId', '==', user.sub)
      .get();

    if (docs.length > 1)
      throw new Error(
        'Session, %s, favorited multiple times for user, %s',
        user.sub,
      );

    if (docs.length === 1) return { id: docs[0].id, ...docs[0].data() };

    return null;
  }

  async function addSessionFavorite(eventId, sessionId, user) {
    dlog('addSessionForMember');
    const newFavorite = {
      eventId,
      sessionId,
      memberId: user.sub,
      createdAt: new Date(),
    };

    const newDoc = await favoriteCollection.add(newFavorite);

    return {
      id: newDoc.id,
      ...newFavorite,
    };
  }

  function removeFavorite(id) {
    dlog('delete favorite %s', id);
    return favoriteCollection.doc(id).delete();
  }

  return {
    findFavoritesForMember,
    findAllFavoritesForMember,
    findFavoritesForSession,
    getSessionFavoriteCount,
    findSessionForMember,
    addSessionFavorite,
    removeFavorite,
  };
}

export default favorites;
