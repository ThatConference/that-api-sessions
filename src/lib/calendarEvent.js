// Performs calendar CRUD operations against provided Google calendar
import debug from 'debug';
import { google } from 'googleapis';
import base32 from 'base32-encode';

const dlog = debug('that:api:sessions:calendar');
const salt = 'THAT-salt';
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
    let description = `${session.shortDescription}\n\n`;
    if (!session.location || session?.location?.isOnline === true)
      description += 'Join ';
    else description += 'Details ';
    description += `at: https://that.us/activities/${session.id}`;
    let location = 'THAT.us';
    if (session?.location?.destination && session?.location?.isOnline !== true)
      location = `Room: ${session.location.destination}`;

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
      location,
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
    return calendar.events
      .update({
        calendarId,
        eventId,
        requestBody: eventPayload,
      })
      .catch(res => {
        if (res.code === 404) {
          return create(session);
        }
        return res;
      });

    // 404 doesn't exist to update
  }

  function cancel(session) {
    dlog('cancel');

    const fakeTime = new Date('2000-01-01T06:00:00.000Z');
    const eventPayload = {
      start: {
        dateTime: fakeTime,
      },
      end: {
        dateTime: fakeTime,
      },
      status: 'cancelled',
      visibility: 'public',
      transparency: 'transparent',
    };
    const eventId = makeEventId(session.id);

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
