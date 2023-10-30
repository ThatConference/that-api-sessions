function configMissing(configKey) {
  throw new Error(`missing required .env setting for ${configKey}`);
}

const requiredConfig = () => ({
  postmarkApiToken:
    process.env.POSTMARK_API_TOKEN || configMissing('POSTMARK_API_TOKEN'),
  calendarCredentals:
    process.env.GCP_CALENDAR_CREDENTIALS ||
    configMissing('GCP_CALENDAR_CREDENTIALS'),
  sharedCalendarId:
    process.env.SHARED_CALENDAR_ID || configMissing('SHARED_CALENDAR_ID'),
  slackWebhookUrl:
    process.env.SLACK_WEBHOOK_URL || configMissing('SLACK_WEBHOOK_URL'),
  sessionNotifSlackChannel:
    process.env.SLACK_NOTIFICATION_CHANNEL || '#that_board',
  defaultProfileImage:
    'https://images.that.tech/members/person-placeholder.jpg',
  notificationEmailFrom:
    process.env.NOTIFICATION_EMAIL_FROM || 'hello@thatconference.com',
  ogImageBaseUrl:
    process.env.OG_IMAGE_BASE_URL || configMissing('OG_IMAGE_BASE_URL'),
  thatJoinDiscordBot: {
    baseUrl:
      process.env.THAT_JOIN_BOT_BASE_URL ??
      configMissing('THAT_JOIN_BOT_BASE_URL'),
  },
  thatRequestSigningKey:
    process.env.THAT_REQUEST_SIGNING_KEY ||
    configMissing('THAT_REQUEST_SIGNING_KEY'),
});

export default requiredConfig();
