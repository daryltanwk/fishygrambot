import { Game } from './game';
import { Player } from './player';

const Telebot = require('telebot');
const bot = new Telebot('408714976:AAH8YMXXtGmAiRgxFJMlBy0Jz_P2PryGNKw');
let spamVictims: Array<NodeJS.Timer> = [];
bot.on(['/start', '/hello'], (msg: any) => {
    console.log('received ' + msg.text);
    msg.reply.text('Welcome!')
});

bot.on(['/testclass'], (msg: any) => {
    let player = new Player('wildplayer99', '1212');
    let game = new Game('a wild game');
    game.players.push(player);
    return msg.reply.text(JSON.stringify(game));
});

bot.on(['/whattoeat'], (msg: any) => {
    let lunches = [
        'a knuckle sandwich',
        'five lightly toasted peanuts',
        'peanut butter jelly',
        'NEIN EATS. EU FATS.',
        'McSpicy Triple Upsize w/ AISU KURIMU',
        '1 slice of bread. raw.',
        'chicken rice, but without chicken.'
    ];
    const choice = Math.floor(Math.random() * lunches.length);
    return msg.reply.text(lunches[choice]);
});

bot.on(['/spamme'], (msg: any) => {
    msg.reply.text('Really? Okay...');
    let counter = 0;
    let result = setInterval(() => {
        msg.reply.text('spam #' + counter);
        counter++;
    }, 1000);
    spamVictims.push(result);
});

bot.on(['/stopspam'], (msg: any) => {
    msg.reply.text('Ohkay.');
    clearInterval(spamVictims[0]);
    spamVictims.pop();
});
bot.start();
