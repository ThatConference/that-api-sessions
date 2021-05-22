import { dataSources } from '@thatconference/api';

const assetStore = dataSources.cloudFirestore.assets;
const entityType = 'SESSION';

export function findAssets({ entityId, firestore }) {
  return assetStore(firestore).findEntityAssets({
    entityId,
    entityType,
  });
}
