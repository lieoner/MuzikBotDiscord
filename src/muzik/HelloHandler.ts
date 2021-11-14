import { readFileSync } from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { VoiceChannel, VoiceConnection, StreamDispatcher } from 'discord.js';
import { config, playlist } from '../utils/Configuration';
import { randomInteger } from '../utils/func';

type GuildQueueItem = {
    voiceChannel: VoiceChannel;
    soundFileName: string;
};

class HelloHandler {
    audioBuffers: {
        [key: string]: Buffer;
    } = {};
    guildQueues = new Map<string, GuildQueueItem[]>();
    connection: VoiceConnection | undefined;
    dispatcher: StreamDispatcher;

    constructor() {
        const soundsKeys = playlist;
        for (let soundKeysIndex = 0; soundKeysIndex < soundsKeys.length; soundKeysIndex++) {
            const soundItem = soundsKeys[soundKeysIndex];
            this.audioBuffers[soundItem] = readFileSync(
                path.join(__dirname, '..', 'playlist', soundItem)
            );
        }
    }

    getGuildQueue = (guildId: string): GuildQueueItem[] => {
        return this.guildQueues.get(guildId) || [];
    };

    getRandomSound = (): {
        sound: string;
    } => {
        const chosenSound = randomInteger(0, playlist.length);
        return {
            sound: playlist[chosenSound],
        };
    };

    enqueueSound = async (voiceChannel: VoiceChannel, soundFileName: string): Promise<void> => {
        // Make sure the server queue exists
        if (!this.guildQueues.has(voiceChannel.guild.id)) {
            this.guildQueues.set(voiceChannel.guild.id, []);
        }
        const guildQueue = this.getGuildQueue(voiceChannel.guild.id);
        // Add the sound to the queue if the queue is less than the max
        if (guildQueue.length < config.settings.maxQueueSize) {
            guildQueue.push({
                voiceChannel,
                soundFileName,
            });
        }
        if (guildQueue.length < 2) {
            this.playSound(voiceChannel.guild.id);
        }
    };

    playSound = async (guildId: string): Promise<void> => {
        let voiceChannel: VoiceChannel | undefined;
        try {
            // Loop through the queue
            const guildQueue = this.getGuildQueue(guildId);
            while (guildQueue.length > 0) {
                const itemFromQueue = guildQueue[0];
                if (
                    !this.connection ||
                    this.connection.channel.id !== itemFromQueue.voiceChannel.id
                ) {
                    voiceChannel = itemFromQueue.voiceChannel;
                    this.connection = await voiceChannel.join();
                }
                // Play the sound from the queue
                this.dispatcher = this.connection.play(
                    Readable.from(this.audioBuffers[itemFromQueue.soundFileName]),
                    { volume: 0.4 }
                );
                // Wait until the sound finishes
                await new Promise<void>((resolve) => {
                    // The handler for when the dispatcher finishes
                    const finishHandler = () => {
                        this.dispatcher.off('finish', finishHandler);
                        if (this.connection) {
                            this.connection.off('disconnect', finishHandler);
                            this.connection.off('error', errorHandler);
                        }
                        resolve();
                    };
                    // The handler for this.connection errors
                    const errorHandler = (e: Error) => {
                        console.log(e);
                        if (voiceChannel) {
                            voiceChannel.leave();
                        }
                        this.dispatcher.off('finish', finishHandler);
                        if (this.connection) {
                            this.connection.off('disconnect', finishHandler);
                            this.connection.off('error', errorHandler);
                        }
                        this.connection = undefined;
                        resolve();
                    };
                    // On sound finish
                    this.dispatcher.on('finish', finishHandler);
                    if (this.connection) {
                        this.connection.on('disconnect', finishHandler);
                        this.connection.on('error', (e: Error) => {
                            console.log(e);
                            if (voiceChannel) {
                                voiceChannel.leave();
                            }
                            this.connection = undefined;
                            resolve();
                        });
                    }
                });
                guildQueue.shift();
            }
            // Remove the queue since we are done and leave the voice channel
            this.guildQueues.delete(guildId);
            if (voiceChannel) {
                voiceChannel.leave();
            }
        } catch (e) {
            console.error(e);
            this.guildQueues.delete(guildId);
            if (voiceChannel) {
                voiceChannel.leave();
            }
        }
    };

    skipSound = async (guildId: string): Promise<void> => {
        this.dispatcher.destroy();
        const guildQueue = this.getGuildQueue(guildId);
        const voiceChannel = guildQueue[0].voiceChannel;

        guildQueue.shift();

        if (guildQueue.length) {
            this.playSound(guildId);
        } else {
            voiceChannel.leave();
        }
    };
}

export const helloHandler = new HelloHandler();
