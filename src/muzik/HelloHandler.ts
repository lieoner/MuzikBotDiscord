import { readFileSync } from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { VoiceChannel, VoiceConnection } from 'discord.js';
import { config, playlist } from '../utils/Configuration';
import { randomInteger } from '../utils/func';

const audioBuffers: {
    [key: string]: Buffer;
} = {};

type GuildQueueItem = {
    voiceChannel: VoiceChannel;
    soundFileName: string;
};

const guildQueues = new Map<string, GuildQueueItem[]>();

const soundsKeys = playlist;
for (let soundKeysIndex = 0; soundKeysIndex < soundsKeys.length; soundKeysIndex++) {
    const soundItem = soundsKeys[soundKeysIndex];
    audioBuffers[soundItem] = readFileSync(path.join(__dirname, '..', 'playlist', soundItem));
}
console.log(audioBuffers);

function getGuildQueue(guildId: string): GuildQueueItem[] {
    return guildQueues.get(guildId) || [];
}

export function getRandomSound(): {
    sound: string;
} {
    const chosenSound = randomInteger(0, playlist.length);
    return {
        sound: playlist[chosenSound],
    };
}

export async function enqueueSound(
    voiceChannel: VoiceChannel,
    soundFileName: string
): Promise<void> {
    // Make sure the server queue exists
    if (!guildQueues.has(voiceChannel.guild.id)) {
        guildQueues.set(voiceChannel.guild.id, []);
    }
    const guildQueue = getGuildQueue(voiceChannel.guild.id);
    // Add the sound to the queue if the queue is less than the max
    if (guildQueue.length < config.settings.maxQueueSize) {
        guildQueue.push({
            voiceChannel,
            soundFileName,
        });
    }
    if (guildQueue.length < 2) {
        playSound(voiceChannel.guild.id);
    }
}

async function playSound(guildId: string): Promise<void> {
    let voiceChannel: VoiceChannel | undefined;
    try {
        // Loop through the queue
        let connection: VoiceConnection | undefined;
        const guildQueue = getGuildQueue(guildId);
        while (guildQueue.length > 0) {
            const itemFromQueue = guildQueue[0];
            if (!connection || connection.channel.id !== itemFromQueue.voiceChannel.id) {
                voiceChannel = itemFromQueue.voiceChannel;
                connection = await voiceChannel.join();
            }
            // Play the sound from the queue
            const dispatcher = connection.play(
                Readable.from(audioBuffers[itemFromQueue.soundFileName]),
                { volume: 0.4 }
            );
            // Wait until the sound finishes
            await new Promise<void>((resolve) => {
                // The handler for when the dispatcher finishes
                const finishHandler = () => {
                    dispatcher.off('finish', finishHandler);
                    if (connection) {
                        connection.off('disconnect', finishHandler);
                        connection.off('error', errorHandler);
                    }
                    resolve();
                };
                // The handler for connection errors
                const errorHandler = (e: Error) => {
                    console.log(e);
                    if (voiceChannel) {
                        voiceChannel.leave();
                    }
                    dispatcher.off('finish', finishHandler);
                    if (connection) {
                        connection.off('disconnect', finishHandler);
                        connection.off('error', errorHandler);
                    }
                    connection = undefined;
                    resolve();
                };
                // On sound finish
                dispatcher.on('finish', finishHandler);
                if (connection) {
                    connection.on('disconnect', finishHandler);
                    connection.on('error', (e: Error) => {
                        console.log(e);
                        if (voiceChannel) {
                            voiceChannel.leave();
                        }
                        connection = undefined;
                        resolve();
                    });
                }
            });
            guildQueue.shift();
        }
        // Remove the queue since we are done and leave the voice channel
        guildQueues.delete(guildId);
        if (voiceChannel) {
            voiceChannel.leave();
        }
    } catch (e) {
        console.error(e);
        guildQueues.delete(guildId);
        if (voiceChannel) {
            voiceChannel.leave();
        }
    }
}
