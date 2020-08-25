// Performs calendar CRUD operations against provided Google calendar
import debug from 'debug';
import { google } from 'googleapis';
import base32 from 'base32-encode';

const dlog = debug('that:api:sessions:calendar');
const salt = 'THATConference-salt';
//

function calendarEvent(credentials, calendarId) {
  dlog('calendar Event created');
  // expected credentials value is a
  // base64 encoded version of the json google api credential file.
  const credentialsObject = JSON.parse(
    Buffer.from(credentials, 'base64').toString('ascii'),
  );
  if (!credentialsObject.client_email) {
    throw new Error('Invalid credentials provided');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      ...credentialsObject,
    },
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  const calendar = google.calendar({
    version: 'v3',
    auth,
  });

  // Utility functions
  function makeEventId(sessionId) {
    return base32(Buffer.from(sessionId + salt), 'RFC4648-HEX', {
      padding: false,
    }).toLowerCase();
  }

  function makeEventPayload(session) {
    const endTime = new Date(
      session.startTime.getTime() + 60000 * session.durationInMinutes,
    );
    const description = `${session.shortDescription}
    
    Join at: https://that.us/session/${session.id}`;

    const payload = {
      start: {
        dateTime: session.startTime,
      },
      end: {
        dateTime: endTime,
      },
      id: makeEventId(session.id),
      description,
      summary: session.title,
      location: 'Internet',
      visibility: 'public',
      transparency: 'transparent',
      status: 'confirmed',
    };

    return payload;
  }

  // Action functions
  function create(session) {
    dlog('create');

    const eventPayload = makeEventPayload(session);

    return calendar.events.insert({
      calendarId,
      resource: eventPayload,
    });

    // code 409, already exists
  }

  function update(session) {
    dlog('update');

    const eventPayload = makeEventPayload(session);
    const eventId = eventPayload.id;
    delete eventPayload.id;

    // Make call
    return calendar.events.update({
      calendarId,
      eventId,
      requestBody: eventPayload,
    });

    // 404 doesn't exist to update
  }

  function cancel(session) {
    dlog('cancel');

    const eventPayload = makeEventPayload(session);
    const eventId = eventPayload.id;
    delete eventPayload.id;
    eventPayload.status = 'cancelled';

    // Make call
    return calendar.events.update({
      calendarId,
      eventId,
      requestBody: eventPayload,
    });
  }

  return {
    create,
    update,
    cancel,
  };
}

export default calendarEvent;
