import { DiscordCommand } from '../DiscordCommand';
import { Client } from 'discord.js-light';
import { config } from '../../utils/Configuration';
import {
    CommandInteraction,
    convertButtonsIntoButtonGrid,
    DiscordCommandResponder,
    DiscordComponent,
} from '../DiscordInteraction';

export class HelpCommand extends DiscordCommand {
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
        const buttons: DiscordComponent[] = [];

        buttons.push({
            type: 2,
            style: 3,
            label: 'ПОМОГИ',
            custom_id: JSON.stringify({
                name: 'help',
            }),
        });
        const fullComponents = convertButtonsIntoButtonGrid(buttons);
        return discordCommandResponder.sendBackMessage(
            'Не помогу, не пиши мне...',
            true,
            fullComponents
        );
    }
}
