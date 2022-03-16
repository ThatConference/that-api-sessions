import debug from 'debug';

import favoriteStore from '../../../dataSources/cloudFirestore/favorite';
import memberStore from '../../../dataSources/cloudFirestore/member';

const dlog = debug('that:api:sessions:resolvers:shared');

export default async function favoritedBy(sessionId, firestore) {
  dlog('shared favoritedBy');

  const sessionFavorites = await favoriteStore(
    firestore,
  ).findFavoritesForSession(sessionId);

  const featureableMembers = await memberStore(firestore)
    .batchFindMembers(sessionFavorites.map(sf => sf.memberId))
    .then(r => r.filter(f => f.canFeature));

  return featureableMembers.map(fm => ({ id: fm.id }));
}
