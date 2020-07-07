import debug from 'debug';

const dlog = debug('that:api:sessions:datasources:firebase:favorites');

function favorites(dbInstance) {
  dlog('favorites data source created');

  const collectionName = 'sessions';
  const sessionCollection = dbInstance.collection(collectionName);

  const favoriteCollectionName = 'favorites';
  const favoriteCollection = dbInstance.collection(favoriteCollectionName);

  async function findFavoritesForMember(eventId, user) {
    dlog('findFavoritesForMember() %s, %s', eventId, user.sub);

    const { docs } = await favoriteCollection
      .where('memberId', '==', user.sub)
      .where('eventId', '==', eventId);
    return {};
  }
}

export default favorites;
