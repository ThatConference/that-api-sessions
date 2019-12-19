const event = (dbInstance, logger) => {
  const collectionName = 'sessions';
  const sessionsCol = dbInstance.collection(collectionName);

  const create = async newSession => {
    // const scrubbedEvent = newEvent;
    // if (newEvent.website) scrubbedEvent.website = newEvent.website.href;
    // const newDocument = await eventsCol.add(scrubbedEvent);
    // logger.debug(`created new event: ${newDocument.id}`);
    // return {
    //   id: newDocument.id,
    //   ...newEvent,
    // };
  };

  const get = async id => {
    // const docRef = dbInstance.doc(`${collectionName}/${id}`);
    // const doc = await await docRef.get();
    // return {
    //   id: doc.id,
    //   ...doc.data(),
    // };
  };

  const getAll = async () => {
    // const { docs } = await eventsCol.get();
    // const results = docs.map(d => ({
    //   id: d.id,
    //   ...d.data(),
    // }));
    // return results;
  };

  const update = (id, eventInput) => {
    // const scrubbedEvent = eventInput;
    // if (eventInput.website) scrubbedEvent.website = eventInput.website.href;
    // const docRef = dbInstance.doc(`${collectionName}/${id}`);
    // return docRef.update(eventInput).then(res => {
    //   logger.debug(`updated event: ${id}`);
    //   return {
    //     id,
    //     ...eventInput,
    //   };
    // });
  };

  return { create, getAll, get, update };
};

export default event;
