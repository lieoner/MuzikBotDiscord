import { DiscordListener } from '../DiscordListener';
import { MuzikBot } from '../../bot';

export class ReadyListener extends DiscordListener {
    registerListener(muzikBot: MuzikBot): void {
        muzikBot.client.on('ready', async () => {
            console.log('Is ready.');
        });
        muzikBot.client.on('shardReady', async (shardId: number) => {
            console.log('Shard ID ' + shardId + ' is ready.');
        });
    }
}
