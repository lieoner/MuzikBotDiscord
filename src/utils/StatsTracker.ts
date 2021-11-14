import {redis} from "./RedisUtils";
import {config} from "./Configuration";

export function trackPlay(guildId: string, channelId: string, userId: string, soundName: string): void {
  // Overall
  redis.incr([config.redis.prefix, "total"].join(":"));
  // Per sound
  redis.incr([config.redis.prefix, "counts", "sound", soundName].join(":"));
  // Per user per sound
  redis.incr([config.redis.prefix, "counts", "user", userId, "sound", soundName].join(":"));
  // Per guild per sound
  redis.incr([config.redis.prefix, "counts", "guild", guildId, "sound", soundName].join(":"));
  // Per guild per channel per sound
  redis.incr([config.redis.prefix, "counts", "guild", userId, "channel", channelId, "sound", soundName].join(":"));
  // Unique guilds/channels/users
  redis.sadd([config.redis.prefix, "guilds"].join(":"), guildId);
  redis.sadd([config.redis.prefix, "channels"].join(":"), channelId);
  redis.sadd([config.redis.prefix, "users"].join(":"), userId);
}
