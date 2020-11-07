import { dataSources } from '@thatconference/api';
import localAssetStore from '../../../dataSources/cloudFirestore/asset';

const assetStore = dataSources.cloudFirestore.assets;
const entityType = 'SESSION';

export function findAssets({ entityId, firestore, assetLoader }) {
  return assetStore(firestore)
    .findEntityAssets({
      entityId,
      entityType,
    })
    .then(results =>
      localAssetStore(firestore).getBatch(results.map(id => id.id)),
    );
  // .then(results => results.forEach(id => assetLoader.load(id.id)));
  // .then(results => assetLoader.load(results.map(id => id.id)));
}
