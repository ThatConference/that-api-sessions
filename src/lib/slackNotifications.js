import fetch from 'node-fetch';
import debug from 'debug';
import envConfig from '../envConfig';

const dlog = debug('that:api:sessions:slack-notifications');

function callSlackHook(hookBody) {
  dlog('calling Slack hook');
  if (
    process.env.NODE_ENV === 'production' ||
    process.env.TEST_SLACK_NOTIFICATIONS
  ) {
    const slackUrl = envConfig.slackWebhookUrl;
    fetch(slackUrl, {
      method: 'post',
      body: JSON.stringify(hookBody),
      headers: { 'Content-Type': 'application/json' },
    })
      .then(res => res.text())
      .then(res => dlog('Slack webhood response: %o', res))
      .catch(err => dlog('ERROR sending slack notifcation: %O', err));
  } else {
    dlog('DEVELOPMENT Env: SLACK PAYLOAD TO SEND: %o', hookBody);
  }
}

export default {
  sessionCreated: ({ session, user }) => {
    dlog('sessionCreated notification called');

    let userProfileImage = user.profileImage;
    if (!userProfileImage || userProfileImage.length < 7)
      userProfileImage = envConfig.defaultProfileImage;

    const slackBody = {
      channel: envConfig.sessionNotifSlackChannel,
      username: 'THAT.us Session Bot',
      icon_emoji: ':that-blue:',
      text: ':that-blue: New Activity Added :tada:',
      attachments: [
        {
          color: '#26529a',
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*<https://that.us/activities/${session.id}|${session.title}>*`,
              },
            },
            {
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: `*Start Time:*\n<!date^${new Date(
                    session.startTime,
                  ).getTime() / 1000}^{date} @ {time}|time is hard>`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Duration:*\n${session.durationInMinutes} minutes`,
                },
              ],
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Description:*\n${session.shortDescription}`,
              },
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Submitted by:*\n<https://www.thatconference.com/member/${user.profileSlug}|${user.firstName} ${user.lastName}>`,
              },
              accessory: {
                type: 'image',
                image_url: userProfileImage,
                alt_text: `${user.firstName} ${user.lastName}`,
              },
            },
          ],
        },
      ],
    };

    callSlackHook(slackBody);
  },

  sessionCancelled: () => {
    dlog('sessionCancelled notification called');
  },
};
