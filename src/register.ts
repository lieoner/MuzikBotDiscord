import fetch from 'node-fetch';
import { config } from './utils/Configuration';

const specifiedCommandArgs = process.argv.slice(2);

const mode = specifiedCommandArgs[0] || 'set';
const guildId = specifiedCommandArgs[1] || undefined;

(async () => {
    if (!['set', 'clear'].includes(mode.toLowerCase())) {
        return console.log("The mode specified must be one of 'set' or 'clear'");
    }
    if (guildId && !String(guildId).match(/^\d+$/g)) {
        return console.log('The guild id must be valid.');
    }

    const guildUrlPart = guildId ? '/guilds/' + String(guildId) : '';

    // Clear all of the commands if the mode is clear and then exit
    if (mode.toLowerCase() === 'clear') {
        const response = await fetch(
            'https://discord.com/api/v8/applications/' +
                config.discord.applicationId +
                guildUrlPart +
                '/commands',
            {
                method: 'put',
                headers: {
                    authorization: 'Bot ' + config.discord.token,
                    'content-type': 'application/json',
                },
                body: JSON.stringify([]),
            }
        );
        return console.log(await response.json());
    }

    // sound commands
    const commands: unknown[] = [];

    commands.push({
        name: 'muzik',
        description: 'Поищу на ютубе',
        options: [
            {
                type: 3,
                name: 'link',
                description: 'введи ссылку или название',
                options: [],
            },
        ],
    });

    commands.push({
        name: 'help_me_muzik',
        description: 'Проси помощи',
    });

    commands.push({
        name: 'hello',
        description: 'Поздороваюсь с тобой за сотку (100)',
    });
    commands.push({
        name: 'info',
        description: 'расскажу че почем',
    });

    const response = await fetch(
        'https://discord.com/api/v8/applications/' +
            config.discord.applicationId +
            guildUrlPart +
            '/commands',
        {
            method: 'put',
            headers: {
                authorization: 'Bot ' + config.discord.token,
                'content-type': 'application/json',
            },
            body: JSON.stringify(commands),
        }
    );

    console.log(await response.json());
})();
