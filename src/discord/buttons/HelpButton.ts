import { config } from '../../utils/Configuration';
import { ComponentInteraction, DiscordCommandResponder } from '../DiscordInteraction';
import { DiscordButton } from '../DiscordButton';
import { Client } from 'discord.js-light';

export class HelpButton extends DiscordButton {
    constructor() {
        super('help');
    }

    async executeInteraction(
        client: Client,
        interaction: ComponentInteraction,
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
        return discordCommandResponder.sendBackMessage('Отвали а?', false);
    }
}
