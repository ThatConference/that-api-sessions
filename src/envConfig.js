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
  sessionNotifSlackChannel: '#that_board',
});

export default requiredConfig();
