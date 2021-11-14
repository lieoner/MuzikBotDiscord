import { VoiceChannel, VoiceConnection, StreamDispatcher } from 'discord.js';
import { config } from '../utils/Configuration';
//@ts-ignore
import searchYoutube from 'youtube-api-v3-search';
import ytdl, { videoInfo } from 'ytdl-core';

type GuildQueueItem = {
    voiceChannel: VoiceChannel;
    videoInfo: videoInfo;
};

type ShortVideoInfo = {
    videoId: string;
    videoName: string;
};

class MuzikHandler {
    audioBuffers: {
        [key: string]: Buffer;
    } = {};
    guildQueues = new Map<string, GuildQueueItem[]>();
    connection: VoiceConnection | undefined;
    dispatcher: StreamDispatcher | undefined;
    currentVideoName: string;

    constructor() {}

    getGuildQueue = (guildId: string): GuildQueueItem[] => {
        return this.guildQueues.get(guildId) || [];
    };

    findVideo = async (link: string): Promise<videoInfo> => {
        let url = link;
        console.log(link);
        if (!link.startsWith('https://')) {
            const shortInfo = await this.searchYouTubeVideoID(link);
            url = `https://www.youtube.com/watch?v=${shortInfo.videoId}`;
        }
        const info = await ytdl.getInfo(url);

        return info;
    };

    enqueueSound = async (voiceChannel: VoiceChannel, videoInfo: videoInfo): Promise<void> => {
        // Make sure the server queue exists
        if (!this.guildQueues.has(voiceChannel.guild.id)) {
            this.guildQueues.set(voiceChannel.guild.id, []);
        }
        const guildQueue = this.getGuildQueue(voiceChannel.guild.id);

        // Add the sound to the queue if the queue is less than the max
        if (guildQueue.length < config.settings.maxQueueSize) {
            guildQueue.push({
                voiceChannel,
                videoInfo,
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
                    await ytdl(itemFromQueue.videoInfo.videoDetails.video_url, {
                        filter: 'audioonly',
                    }),
                    {
                        volume: 0.4,
                    }
                );
                // Wait until the sound finishes
                await new Promise<void>((resolve) => {
                    // The handler for when the dispatcher finishes
                    const finishHandler = () => {
                        this.dispatcher?.off('finish', finishHandler);
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
                        this.dispatcher?.off('finish', finishHandler);
                        if (this.connection) {
                            this.connection.off('disconnect', finishHandler);
                            this.connection.off('error', errorHandler);
                        }
                        this.connection = undefined;
                        this.dispatcher = undefined;
                        resolve();
                    };
                    // On sound finish
                    this.dispatcher?.on('finish', finishHandler);
                    if (this.connection) {
                        this.connection.on('disconnect', finishHandler);
                        this.connection.on('error', (e: Error) => {
                            console.log(e);
                            if (voiceChannel) {
                                voiceChannel.leave();
                            }
                            this.connection = undefined;
                            this.dispatcher = undefined;
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
            this.connection = undefined;
            this.dispatcher = undefined;
        } catch (e) {
            console.error(e);
            this.guildQueues.delete(guildId);
            if (voiceChannel) {
                voiceChannel.leave();
            }
            this.connection = undefined;
            this.dispatcher = undefined;
        }
    };

    skipSound = async (guildId: string): Promise<void> => {
        this.dispatcher?.destroy();
        const guildQueue = this.getGuildQueue(guildId);
        const voiceChannel = guildQueue[0].voiceChannel;

        guildQueue.shift();

        if (guildQueue.length) {
            this.playSound(guildId);
        } else {
            if (voiceChannel) {
                voiceChannel.leave();
            }
            this.connection = undefined;
            this.dispatcher = undefined;
        }
    };

    searchYouTubeVideoID = async (link: string): Promise<ShortVideoInfo> => {
        let res = await searchYoutube(config.youtube.token, {
            q: link,
            type: 'video',
        });
        return {
            videoId: res.items[0].id.videoId,
            videoName: res.items[0].snippet.title,
        };
    };
}

export const muzikHandler = new MuzikHandler();
