export default function determineSessionChanges({
  originalSession,
  updatedSession,
}) {
  const changes = {
    room: {},
    time: {},
  };
  changes.room.changed =
    originalSession?.location?.destination !==
    updatedSession?.location?.destination;
  changes.room.original = originalSession?.location?.destination || 'TBD';
  changes.room.updated = updatedSession?.location?.destination || 'TBD';
  const origStart =
    originalSession.startTime instanceof Date
      ? originalSession.startTime.getTime()
      : null;
  const updStart =
    updatedSession.startTime instanceof Date
      ? updatedSession.startTime.getTime()
      : null;
  changes.time.changed = origStart !== updStart;
  changes.time.original = originalSession.startTime;
  changes.time.updated = updatedSession.startTime;

  return changes;
}
