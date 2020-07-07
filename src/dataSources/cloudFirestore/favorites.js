import debug from 'debug';

const dlog = debug('that:api:sessions:datasources:firebase:favorites');

function favorites(dbInstance) {
  dlog('favorites data source created');

  const collectionName = 'sessions';
  const sessionCollection = dbInstance.collection(collectionName);

  const favoriteCollectionName = 'favorites';
  const favoriteCollection = dbInstance.collection(favoriteCollectionName);

  async function findFavoritesForMember(eventId, memberId) {
    dlog('findFavoritesForMember() %s, %s', eventId, memberId);

    const { docs } = await favoriteCollection.where('memberId', '==', memberId);
    return [];
  }
}

export default favorites;
