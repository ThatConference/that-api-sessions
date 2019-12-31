import debug from 'debug';

const dlog = debug('that:api:sessions:datasources:members');

const member = (dbInstance, logger) => {
  const collectionName = 'members';

  async function find(memberId) {
    const docRef = await dbInstance.doc(`${collectionName}/${memberId}`).get();

    const result = null;

    if (docRef.exists) {
      return {
        id: docRef.id,
        ...docRef.data(),
      };
    }

    return result;
  }

  return { find };
};

export default member;
