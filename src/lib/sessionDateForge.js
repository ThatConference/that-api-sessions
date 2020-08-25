import debug from 'debug';

const dlog = debug('that:api:sessions:utility');

// Determins provided date type ensures a Date type is returned
// or undefined if unrecognized
export default function sessionDateForge(session) {
  dlog('call sessionDateForge');

  if (!session) return session;

  function dateForge(date) {
    let result;

    if (typeof date === 'object') {
      // either Date or Timestamp
      if (date.toDate) {
        // Firestore Timestamp type
        result = date.toDate();
      } else if (date.getTime()) {
        // JS Date type
        result = date;
      }
    } else if (typeof date === 'string') {
      result = new Date(date);
    }

    return result;
  }

  const sessionOut = session;
  if (session.createdAt) sessionOut.createdAt = dateForge(session.createdAt);
  if (session.lastUpdatedAt)
    sessionOut.lastUpdatedAt = dateForge(session.lastUpdatedAt);
  if (session.startTime) sessionOut.startTime = dateForge(session.startTime);

  return sessionOut;
}
