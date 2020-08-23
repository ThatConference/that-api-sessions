// Performs calendar CRUD operations against provided Google calendar
import debug from 'debug';
import { google } from 'googleapis';
import base32 from 'base32-encode';
import * as Sentry from '@sentry/node';

const dlog = debug('that:api:sessions:calendar');
const salt = 'THATConference-salt';
//

function calendarCrud(credentials, calendarId) {
  dlog('calendar CRUD created');
  // expected credentials value is a
  // base64 encoded version of the json google api credential file.
  const credentialsObject = JSON.parse(
    Buffer.from(credentials).toString('ascii'),
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
    const payload = {
      start: {
        dateTime: session.startTime,
      },
      end: {
        dateTime: '',
      },
      id: makeEventId(session.id),
      description: '',
      summary: '',
      location: '',
      visibility: 'public',
      status: 'confirmed',
    };

    return payload;
  }

  // Action functions
  function create(session) {
    dlog('create');

    const eventPayload = makeEventPayload(session);

    calendar.events
      .insert({
        calendarId,
        resource: eventPayload,
      })
      .then(result => result)
      .catch(error => error);

    // code 409, already exists
  }

  function update(session) {
    dlog('update');

    const eventPayload = makeEventPayload(session);
    const eventId = eventPayload.id;
    delete eventPayload.id;

    // Make call
    calendar.events
      .update({
        calendarId,
        eventId,
        requestBody: eventPayload,
      })
      .then(result => result)
      .catch(error => error);

    // 404 doesn't exist to update
  }

  function cancel(session) {
    dlog('cancel');

    const eventPayload = makeEventPayload(session);
    eventPayload.status = 'cancelled';
    const eventId = eventPayload.id;
    delete eventPayload.id;

    // Make call
    calendar.events
      .update({
        calendarId,
        eventId,
        requestBody: eventPayload,
      })
      .then(result => result)
      .catch(error => error);
  }

  return {
    create,
    update,
    cancel,
  };
}

export default calendarCrud;
