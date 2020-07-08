import debug from 'debug';
import _ from 'lodash';

const dlog = debug('that:api:sessions:datasources:firebase:voting');

function voting(dbInstance) {
  dlog('voting data source created');

  const collectionName = 'sessions';
  const sessionCollection = dbInstance.collection(collectionName);

  const votingCollectionName = 'votes';
  const votingCollection = dbInstance.collection(votingCollectionName);

  function findUnVoted(eventId, user) {
    dlog('findUnvoted');

    return Promise.all([
      votingCollection
        .where('memberId', '==', user.sub)
        .where('eventId', '==', eventId)
        .get(),

      sessionCollection
        .where('eventId', '==', eventId)
        .where('status', '==', 'SUBMITTED')
        .where('category', '==', 'PROFESSIONAL')
        .get(),
    ])
      .then(([{ docs: votes }, { docs: sessions }]) => {
        dlog(`${sessions.length} sessions, ${votes.length} votes`);
        return _.pullAllWith(
          sessions,
          votes,
          (a, b) => a.id === b.data().sessionId,
        );
      })
      .then(remaining => remaining.map(r => ({ id: r.id, ...r.data() })));
  }

  async function findVoted(eventId, user) {
    dlog('findVoted');

    const { docs } = await votingCollection
      .where('memberId', '==', user.sub)
      .where('eventId', '==', eventId)
      .get();

    return docs.map(r => ({ id: r.id, ...r.data() }));
  }

  async function castVote(eventId, user, vote) {
    dlog('castVote');

    const voteSnap = await votingCollection
      .where('sessionId', '==', vote.sessionId)
      .where('memberId', '==', user.sub)
      .where('eventId', '==', eventId)
      .get();

    const modifiedAtDate = new Date().toISOString();

    let scrubbedVote = {
      eventId,
      memberId: user.sub,
      lastUpdatedAt: modifiedAtDate,
      ...vote,
    };

    let results;

    if (voteSnap.size === 0) {
      // NO votes found, creating new...
      dlog('no vote found');

      scrubbedVote = {
        createdAt: modifiedAtDate,
        ...scrubbedVote,
      };

      results = await votingCollection.add(scrubbedVote);
    } else if (voteSnap.size === 1) {
      // found a vote, updating
      dlog('1 vote found');
      const docRef = voteSnap.docs[0].ref;
      await docRef.update(scrubbedVote);
      results = docRef;
    } else {
      dlog('vote > 1');
      throw new Error('invalid votes found');
    }

    const updateDoc = await results.get();

    return {
      id: results.id,
      ...updateDoc.data(),
    };
  }

  return { findUnVoted, findVoted, castVote };
}

export default voting;
