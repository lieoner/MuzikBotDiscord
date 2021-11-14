import { Client } from 'discord.js-light';
import { muzikHandler } from '../../muzik/MuzikHandler';
import { config } from '../../utils/Configuration';
import { DiscordCommand } from '../DiscordCommand';
import {
    CommandInteraction,
    convertButtonsIntoButtonGrid,
    DiscordCommandResponder,
    DiscordComponent,
} from '../DiscordInteraction';

export class MuzikCommand extends DiscordCommand {
    constructor() {
        super('muzik');
    }

    async executeInteraction(
        client: Client,
        interaction: CommandInteraction,
        discordCommandResponder: DiscordCommandResponder
    ): Promise<void> {
        // Make sure they are in a guild
        if (!interaction.member || !interaction.guild_id) {
            return discordCommandResponder.sendBackMessage('Нахуй ты сюда пишешь клоун.', false);
        }
        if (!client.guilds.cache.has(interaction.guild_id)) {
            return discordCommandResponder.sendBackMessage('Где я?', false);
        }
        // Get the guild for the command
        const guild = await client.guilds.fetch(interaction.guild_id);
        // Get the member from the command
        const guildMember = await guild.members.fetch(interaction.member.user.id);
        if (!guildMember) {
            return discordCommandResponder.sendBackMessage('Я знать тебя не знаю...', false);
        }
        const botGuildMember = await guild.members.fetch(config.discord.botId);
        if (!botGuildMember) {
            return discordCommandResponder.sendBackMessage('Я знать тебя не знаю...', false);
        }

        // Run the command

        const voiceChannel = guildMember.voice.channel;
        if (!voiceChannel) {
            return discordCommandResponder.sendBackMessage('В войс зайди, заебал, дон.', false);
        }
        let fetchedVoiceChannel;
        try {
            fetchedVoiceChannel = await client.channels.fetch(voiceChannel.id, {
                withOverwrites: true,
            });
        } catch (e) {
            return discordCommandResponder.sendBackMessage(
                'Круто троллишь, я зайти не могу.',
                false
            );
        }
        if (!fetchedVoiceChannel) {
            return discordCommandResponder.sendBackMessage('В войс зайди, заебал, дон.', false);
        }
        if (!botGuildMember.permissionsIn(fetchedVoiceChannel).has('CONNECT')) {
            return discordCommandResponder.sendBackMessage(
                'Круто троллишь, я зайти не могу.',
                false
            );
        }

        const link: string = interaction.data.options?.[0].value as string;

        if (!link || link.length == 0) {
            return discordCommandResponder.sendBackMessage(
                'Че не понял? ссылку или название ',
                false
            );
        }
        const info = await muzikHandler.findVideo(link);
        const queueInfo = muzikHandler.getGuildQueue(voiceChannel.guild.id);

        const infoText =
            `Добавлено в очередь: [${info.videoDetails.title}](${info.videoDetails.video_url})\n` +
            (queueInfo.length > 0 ? `В очереди ${queueInfo.length} треков` : '');

        const buttons: DiscordComponent[] = [];

        buttons.push({
            type: 2,
            style: 3,
            label: 'ОЧЕРЕДЬ',
            custom_id: JSON.stringify({
                name: 'queue',
            }),
        });
        buttons.push({
            type: 2,
            style: 4,
            label: 'СКИП',
            custom_id: JSON.stringify({
                name: 'skip',
            }),
        });
        const fullComponents = convertButtonsIntoButtonGrid(buttons);

        if (infoText.length > 0) {
            discordCommandResponder.sendBackMessage(infoText, true, fullComponents);
        }

        if (!!info) {
            muzikHandler.enqueueSound(voiceChannel, info);
        }
    }
}
