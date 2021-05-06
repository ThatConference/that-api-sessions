export const fieldResolvers = {
  SessionAdminFields: {
    speakers: parent => parent.speakers.map(id => ({ id })),
  },
};
