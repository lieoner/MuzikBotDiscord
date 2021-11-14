import { Client } from 'discord.js-light';
import { muzikHandler } from '../../muzik/MuzikHandler';
import { config } from '../../utils/Configuration';
import { DiscordButton } from '../DiscordButton';
import { ComponentInteraction, DiscordCommandResponder } from '../DiscordInteraction';

export class QuitButton extends DiscordButton {
    constructor() {
        super('queue');
    }

    async executeInteraction(
        client: Client,
        interaction: ComponentInteraction,
        discordCommandResponder: DiscordCommandResponder
    ): Promise<void> {
        // Make sure they are in a guild
        if (!interaction.member || !interaction.guild_id) {
            return discordCommandResponder.sendBackMessage('Че ты сюда пишешь клоун.', false);
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

        const muzikQueue = muzikHandler.getGuildQueue(voiceChannel.guild.id);
        if (muzikQueue && muzikQueue.length > 0) {
            let formattedQueueInfo = '';
            muzikQueue.forEach((item, index) => {
                formattedQueueInfo += `${index + 1}. **${item.videoInfo.videoDetails.title}**\n`;
            });
            return discordCommandResponder.sendBackMessage(
                'В очереди сейчас это:\n' + formattedQueueInfo,
                true
            );
        }

        return discordCommandResponder.sendBackMessage('В очереди ничего нет, добавь ДОРУ)', false);
    }
}
