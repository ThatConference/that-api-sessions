import { dataSources } from '@thatconference/api';

const assetStore = dataSources.cloudFirestore.assets;
const entityType = 'SESSION';

export function findAssets({ entityId, firestore, assetLoader }) {
  return assetStore(firestore)
    .findEntityAssets({
      entityId,
      entityType,
    })
    .then(results => results.map(r => assetLoader.load(r.id)));
}
