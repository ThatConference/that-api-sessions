import debug from 'debug';

const dlog = debug('that:api:sessions:datasources:members');

const member = dbInstance => {
  const collectionName = 'members';

  async function find(memberId) {
    dlog('call find on %s', memberId);
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

  async function batchFindMembers(memberIds) {
    dlog('batchFindMembers %o', memberIds);

    const docRefs = memberIds.map(id =>
      dbInstance.doc(`${collectionName}/${id}`),
    );

    return Promise.all(docRefs.map(d => d.get())).then(res =>
      res.map(r => ({
        id: r.id,
        ...r.data(),
      })),
    );
  }

  return { find, batchFindMembers };
};

export default member;
