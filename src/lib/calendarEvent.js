// Performs calendar CRUD operations against provided Google calendar
import debug from 'debug';
import { google } from 'googleapis';
import base32 from 'base32-encode';

const dlog = debug('that:api:sessions:calendar');
const salt = 'THAT-salt';
const inPersonEventTypes = ['MULTI_DAY', 'HYBRID_MULTI_DAY', 'SINGLE_DAY'];

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
    retryOptions: {
      autoRetry: true,
      maxRetries: 10,
    },
  });

  // Utility functions
  function makeEventId(sessionId) {
    return base32(Buffer.from(sessionId + salt), 'RFC4648-HEX', {
      padding: false,
    }).toLowerCase();
  }

  function makeEventPayload(session, event) {
    const endTime = new Date(
      session.startTime.getTime() + 60000 * session.durationInMinutes,
    );

    let baseActivityUrl = 'https://that.us/activities';
    if (
      inPersonEventTypes.includes(event.type) &&
      session?.location?.isOnline !== true
    ) {
      baseActivityUrl = 'https://thatconference.com/activities';
    }

    let description = `${session.shortDescription}\n\n`;
    let location = 'THAT.us';
    if (!session.location || session?.location?.isOnline === true) {
      description += 'Join ';
    } else {
      description += 'Details ';
      location = `Room: ${session.location.destination ?? 'TBD'}`;
    }
    description += `at: ${baseActivityUrl}/${session.id}`;

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
  function create(session, event) {
    dlog('create');

    const eventPayload = makeEventPayload(session, event);

    return calendar.events.insert({
      calendarId,
      resource: eventPayload,
    });

    // code 409, already exists
  }

  function update(session, event) {
    dlog('update');

    const eventPayload = makeEventPayload(session, event);
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
