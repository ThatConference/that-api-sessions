import constants from '../../../constants';

export function parseDiscordInfo(discordInfo) {
  let discordInfoResult = null;
  if (discordInfo) {
    const { guildId, channelId, guildScheduledEventId, inviteUrl } =
      discordInfo;
    discordInfoResult = {
      guildId: guildId ?? '',
      channelId: channelId ?? '',
      guildScheduledEventId: guildScheduledEventId ?? null,
      inviteUrl: inviteUrl ?? '',
      channelUrl: null,
      guildScheduledEventUrl: null,
      guildScheduledEventInviteUrl: null,
    };
    if (guildId && channelId) {
      discordInfoResult.channelUrl = `${constants.discord.baseUrl}/channels/${guildId}/${channelId}`;
    }
    if (guildId && guildScheduledEventId) {
      discordInfoResult.guildScheduledEventUrl = `${constants.discord.baseUrl}/events/${guildId}/${guildScheduledEventId}`;
    }
    if (inviteUrl && guildScheduledEventId) {
      discordInfoResult.guildScheduledEventInviteUrl = `${inviteUrl}?event=${guildScheduledEventId}`;
    }
  }

  return discordInfoResult;
}
