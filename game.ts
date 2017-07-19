import { Player } from './player';

export class Game {
    public players: Array<Player>;
    constructor(public name: string) {
        this.players = [];
    };
}
