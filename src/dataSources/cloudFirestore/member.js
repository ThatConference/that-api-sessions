import debug from 'debug';
import { utility } from '@thatconference/api';

const dlog = debug('that:api:sessions:datasources:members');
const memberDateForge = utility.firestoreDateForge.members;

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
    dlog('batchFindMembers called on %d ids', memberIds?.length);
    if (!Array.isArray(memberIds))
      throw new Error('batchFindMembers parameter must be an array');

    const docRefs = memberIds.map(id =>
      dbInstance.doc(`${collectionName}/${id}`),
    );
    if (docRefs.length < 1) return [];

    return dbInstance.getAll(...docRefs).then(docSnaps =>
      docSnaps.map(r => {
        const result = {
          id: r.id,
          ...r.data(),
        };

        return memberDateForge(result);
      }),
    );
  }

  return { find, batchFindMembers };
};

export default member;
