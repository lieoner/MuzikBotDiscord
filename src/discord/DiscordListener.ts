import { MuzikBot } from '../bot';

export abstract class DiscordListener {
    abstract registerListener(muzikBot: MuzikBot): void;
}
