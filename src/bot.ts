import { Client } from 'discord.js-light';
import { config } from './utils/Configuration';
import { DiscordListener } from './discord/DiscordListener';
import { ReadyListener } from './discord/listeners/ReadyListener';
import { InteractionCreateListener } from './discord/listeners/InteractionCreateListener';
import { DiscordCommand } from './discord/DiscordCommand';
import { DiscordButton } from './discord/DiscordButton';
import { HelpButton } from './discord/buttons/HelpButton';
import { HelpCommand } from './discord/commands/HelpCommand';
import { HelloCommand } from './discord/commands/HelloCommand';
import { HelloButton } from './discord/buttons/HelloButton';
import { SkipButton } from './discord/buttons/SkipButton';
import { MuzikCommand } from './discord/commands/MuzikCommand';
import { QuitButton } from './discord/buttons/QueueButton';
import { InfoCommand } from './discord/commands/InfoCommand';

export class MuzikBot {
    public readonly client: Client;
    public readonly commands: Map<string, DiscordCommand>;
    public readonly buttons: Map<string, DiscordButton>;

    constructor() {
        this.client = new Client({
            ws: {
                intents: ['GUILDS', 'GUILD_VOICE_STATES'],
            },
            shards: 'auto',
            presence: {
                status: 'online',
                activity: {
                    type: 'LISTENING',
                    name: 'muzik',
                },
            },
            cacheOverwrites: true,
            cacheRoles: true,
        });
        this.commands = new Map<string, DiscordCommand>();
        this.buttons = new Map<string, DiscordButton>();
        // Register the listeners
        this.registerListener(new InteractionCreateListener());
        this.registerListener(new ReadyListener());

        // Register commands
        this.registerCommand(new HelpCommand());
        this.registerCommand(new HelloCommand());
        this.registerCommand(new MuzikCommand());
        this.registerCommand(new InfoCommand());

        // Register buttons
        this.registerButton(new HelpButton());
        this.registerButton(new HelloButton());
        this.registerButton(new SkipButton());
        this.registerButton(new QuitButton());
    }

    async start(): Promise<void> {
        await this.client.login(config.discord.token);
    }

    registerListener(discordListener: DiscordListener): void {
        discordListener.registerListener(this);
    }

    registerCommand(discordCommand: DiscordCommand): void {
        this.commands.set(discordCommand.name, discordCommand);
    }

    registerButton(discordButton: DiscordButton): void {
        this.buttons.set(discordButton.name, discordButton);
    }
}

(async () => {
    const muzikBot = new MuzikBot();
    try {
        await muzikBot.start();
    } catch (e) {
        console.error(e);
    }
})();
