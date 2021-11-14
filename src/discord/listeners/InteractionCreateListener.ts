import { DiscordListener } from '../DiscordListener';
import { DiscordCommand } from '../DiscordCommand';
import { MuzikBot } from '../../bot';
import {
    DiscordCommandResponder,
    Interaction,
    InteractionComponentCustomIdData,
} from '../DiscordInteraction';
import { DiscordButton } from '../DiscordButton';
import { config } from '../../utils/Configuration';

export class InteractionCreateListener extends DiscordListener {
    registerListener(muzikBot: MuzikBot): void {
        muzikBot.client.ws.on('INTERACTION_CREATE' as never, async (interaction: Interaction) => {
            try {
                if (interaction.type === 2) {
                    // Commands
                    const commandName = interaction.data.name.toLowerCase();
                    // Check to make sure the command exists
                    if (!muzikBot.commands.has(commandName)) {
                        return new DiscordCommandResponder(
                            config.discord.applicationId,
                            interaction.id,
                            interaction.token
                        ).sendBackMessage('The command requested was not understood.', false);
                    }
                    // Execute the command
                    await (muzikBot.commands.get(commandName) as DiscordCommand).executeInteraction(
                        muzikBot.client,
                        interaction,
                        new DiscordCommandResponder(
                            config.discord.applicationId,
                            interaction.id,
                            interaction.token
                        )
                    );
                } else if (interaction.type === 3) {
                    // Components
                    let interactionCustomIdParsed;
                    try {
                        interactionCustomIdParsed = JSON.parse(
                            interaction.data.custom_id
                        ) as InteractionComponentCustomIdData;
                    } catch (e) {
                        // Ignore invalid JSON
                    }
                    if (interactionCustomIdParsed) {
                        if (interaction.data.component_type === 2) {
                            // Button
                            if (!muzikBot.buttons.has(interactionCustomIdParsed.name)) {
                                return new DiscordCommandResponder(
                                    config.discord.applicationId,
                                    interaction.id,
                                    interaction.token
                                ).sendBackMessage(
                                    'The button requested was not understood.',
                                    false
                                );
                            }
                            // Execute the button
                            await (
                                muzikBot.buttons.get(
                                    interactionCustomIdParsed.name
                                ) as DiscordButton
                            ).executeInteraction(
                                muzikBot.client,
                                interaction,
                                new DiscordCommandResponder(
                                    config.discord.applicationId,
                                    interaction.id,
                                    interaction.token
                                )
                            );
                        } else {
                            // Unknown
                            return new DiscordCommandResponder(
                                config.discord.applicationId,
                                interaction.id,
                                interaction.token
                            ).sendBackMessage(
                                'The component type requested was not understood.',
                                false
                            );
                        }
                    } else {
                        return new DiscordCommandResponder(
                            config.discord.applicationId,
                            interaction.id,
                            interaction.token
                        ).sendBackMessage('The component requested was not understood.', false);
                    }
                }
            } catch (e) {
                console.error(e);
                return new DiscordCommandResponder(
                    config.discord.applicationId,
                    interaction.id,
                    interaction.token
                ).sendBackMessage(
                    'The bot encountered an error when running the interaction.',
                    false
                );
            }
        });
    }
}
