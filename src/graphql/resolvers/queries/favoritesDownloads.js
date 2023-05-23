import debug from 'debug';
import moment from 'moment';
import { dataSources } from '@thatconference/api';
import { writeToString } from '@fast-csv/format';

import favoriteStore from '../../../dataSources/cloudFirestore/favorite';

const dlog = debug('that:api:sessions:favoritesDownloads');
const memberStore = dataSources.cloudFirestore.member;

const sortSchedule = (a, b) => {
  const aStart = a.startTime instanceof Date ? a.startTime.getTime() : 0;
  const bStart = b.startTime instanceof Date ? b.startTime.getTime() : 0;
  return aStart - bStart;
};

export const fieldResolvers = {
  FavoritesDownloadsQuery: {
    csv: async (
      { eventId, historyDays },
      __,
      { dataSources: { firestore, sessionLoader }, user },
    ) => {
      dlog(
        'csv requested with event: %s, with history: %d',
        eventId,
        historyDays,
      );
      let favorites;
      if (eventId.toUpperCase() === 'ANY') {
        favorites = await favoriteStore(firestore).findAllFavoritesForMember(
          user,
        );
      } else {
        favorites = await favoriteStore(firestore).findFavoritesForMember(
          eventId,
          user,
        );
      }
      dlog('total favorites returned: %d', favorites.length);
      let favoriteSessions = await Promise.all(
        favorites.map(fav => sessionLoader.load(fav.sessionId)),
      ).then(fs =>
        fs.filter(s =>
          ['ACCEPTED', 'SCHEDULED', 'CANCELLED'].includes(s?.status),
        ),
      );
      dlog('favoriteSessions count: %d', favoriteSessions.length);
      if (Number.isInteger(historyDays)) {
        // valueOf() returns epoch in ms
        const favoritesAfter = moment().subtract(historyDays, 'd').valueOf();
        dlog('favorites after:: %O', favoritesAfter);
        favoriteSessions = favoriteSessions.filter(
          fs => moment(fs.startTime).valueOf() > favoritesAfter,
        );

        dlog(
          'favoriteSessions count: %o  (historyDays: %d)',
          favoriteSessions.length,
          historyDays,
        );
      }

      favoriteSessions.sort(sortSchedule);
      const rawIds = favoriteSessions.map(s => s.speakers).flat();
      const setIds = new Set(rawIds); // dedups id's
      const speakerIds = [...setIds];
      const speakersRaw = await memberStore(firestore).batchFind(speakerIds);
      const speakers = speakersRaw.map(s => ({
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        profileSlug: s.profileSlug,
      }));

      const schedule = favoriteSessions.map(r => {
        const isDate = r.startTime instanceof Date;
        const room = r.location?.destination || '';
        const speaker = r.speakers.map(spkrId => {
          const sp = speakers.find(sl => sl.id === spkrId) || '';
          return `${sp?.firstName || ''} ${sp?.lastName || ''}`;
        });

        return {
          id: r.id,
          startTime: r.startTime?.toISOString(),
          day: isDate ? moment(r.startTime).format('dddd') : '',
          slot: isDate ? moment(r.startTime).format('HH:mm') : '',
          room,
          speaker: speaker.join(';'),
          title: r.title,
          PriCategory: r.primaryCategory,
          targetLocation: r.targetLocation,
          sessionLink: `https://that.us/activities/${r.id}`,
          sessionType: r.type,
        };
      });
      const csvOptions = {
        headers: true,
        quoteColumns: true,
      };
      return writeToString(schedule, csvOptions);
    },
  },
};
