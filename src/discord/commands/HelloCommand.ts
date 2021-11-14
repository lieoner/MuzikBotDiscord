import { Client } from 'discord.js-light';
import { enqueueSound, getRandomSound } from '../../muzik/HelloHandler';
import { config } from '../../utils/Configuration';
import { DiscordCommand } from '../DiscordCommand';
import {
    CommandInteraction,
    convertButtonsIntoButtonGrid,
    DiscordCommandResponder,
    DiscordComponent,
} from '../DiscordInteraction';

export class HelloCommand extends DiscordCommand {
    constructor() {
        super('hello');
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
        const sound = getRandomSound();
        if (!sound) {
            return discordCommandResponder.sendBackMessage(
                'Да я ниче играть буду, я не могу вспомнить.',
                false
            );
        }

        const buttons: DiscordComponent[] = [];

        buttons.push({
            type: 2,
            style: 3,
            label: 'еще можно приветик?)',
            custom_id: JSON.stringify({
                name: 'hello',
            }),
        });
        const fullComponents = convertButtonsIntoButtonGrid(buttons);
        discordCommandResponder.sendBackMessage(
            'Играет привет от Русланчика',
            true,
            fullComponents
        );

        enqueueSound(voiceChannel, sound.sound);
    }
}
