import { Chooser } from './chooser';
import { GuessGame, Attempt } from './guessgame';
import { Chat } from './chat';
import { Conversation, TOPIC } from "./conversation";

const Telebot = require('telebot');

require('dotenv').config()

const bot = new Telebot(process.env.BOT_API_KEY);

let chats: Array<Chat> = [];

// FUNCTIONS
function isInit(msg: any) {
    let chatId = msg.chat.id;
    if (chats.length === 0) {
        return false;
    } else {
        let index: number;
        index = chats.findIndex((chat: Chat) => {
            return (chat.chatId === chatId);
        });
        return !(index === -1);
    }
}

function hasGuessGame(msg: any) {
    let chatId = msg.chat.id;
    let chatIndex = getChatIndex(chatId);
    return (typeof chats[chatIndex].guessGame !== 'undefined');
}

function getCommand(msg: any): string {
    return (<string>msg.text).slice(1, msg.entities[0].length);
}

function getData(msg: any): string {
    const offset: number = msg.entities[0].length;
    const data: string = (<string>msg.text).slice(offset + 1);
    return data;
}

function getChatIndex(chatId: string): number {
    return chats.findIndex((chat) => {
        return (chat.chatId === chatId);
    });
}

// BOT LOGIC

bot.on('/start', (msg: any) => {
    /* 
    === Bot initialization ===
    If started in the Private Chat, the bot should provide instructions only
    If started in Group/Supergroup, the bot will initialize a Chat object and store it to session
    */
    let chatType: string = msg.chat.type;

    switch (chatType) {
        case 'private':
            msg.reply.text('Hi! This is a private chat.');
            break;
        case 'group':
        case 'supergroup':
            Promise.resolve().then((res) => {
                return msg.reply.text(
                    'Hi! this is a ' + chatType + '.\n' +
                    'Checking if I know you guys...'
                );
            }).then((res) => {
                if (isInit(msg)) {
                    msg.reply.text('Yes! I\'ve previously been introduced to ' + msg.chat.title + '!');
                    throw 'Chat previously initialized';
                } else {
                    let chat = new Chat(msg.chat.id);
                    chats.push(chat);
                    return msg.reply.text('Nope. Initializing now...');
                }
            }).then((res) => {
                msg.reply.text('Ok. All done!');
            }).catch((reason) => {
                // Do nothing. For now.
            });
            break;
        case 'channel':
            msg.reply.text('Hi! I shouldn\'t be here.');
            break;
        default:
            msg.reply.text('If you see this message, something is very wrong.');
            break;
    }

});

bot.on(['/additem', '/removeitem', '/listitem', '/pickitem'], (msg: any) => {
    if (isInit(msg)) {
        let chatIndex = getChatIndex(msg.chat.id);
        // Do Logic
        let rawCommand = getCommand(msg);
        let command = rawCommand.split('@')[0];
        switch (command) {
            case 'additem':
                Promise.resolve().then((res) => {
                    // Get the data
                    let data = getData(msg);
                    return Chooser.validateData(data);
                }).then((res) => {
                    if (res.isValid) {
                        chats[chatIndex].chooser.addItems(res.itemArr);
                        let reply = 'Added :\n';
                        res.itemArr.forEach((item) => {
                            reply += item + ', ';
                        });
                        return msg.reply.text(reply.slice(0, reply.length - 2));

                    } else {
                        throw 'Error: ' + res.reason;
                    }
                }).catch((reason) => {
                    console.log(reason);
                    msg.reply.text('Couldn\'t add the item(s).\n' + reason);
                });
                break;
            case 'removeitem':
                Promise.resolve().then((res) => {
                    // Get the data
                    let data = getData(msg);
                    return Chooser.validateIndices(data, chats[chatIndex].chooser.getItems())
                }).then((res) => {
                    if (res.isValid) {
                        let removedItems = chats[chatIndex].chooser.removeItems(res.indices);
                        let reply = 'Removed: \n';
                        removedItems.forEach((itm) => {
                            reply += itm + ', ';
                        });
                        return msg.reply.text(reply.slice(0, reply.length - 2));

                    } else {
                        throw 'Error: ' + res.reason;
                    }
                }).catch((reason) => {
                    console.log(reason);
                    msg.reply.text('Couldn\'t remove the item(s).\n' + reason);
                });
                break;
            case 'listitem':
                let itemsToList = chats[chatIndex].chooser.getItems();
                if (itemsToList.length <= 0) {
                    return msg.reply.text('List is empty! Use /additem to add some items!');
                }
                let reply = '=== Current Items ===\n';
                itemsToList.forEach((item, index) => {
                    reply += (index + 1) + ') ' + item + '\n';
                });
                return msg.reply.text(reply);
            case 'pickitem':
                let listOfItems = chats[chatIndex].chooser.getItems();
                if (listOfItems.length <= 0) {
                    return msg.reply.text('List is empty! Use /additem to add some items!');
                }
                let chosenOne = Math.floor(Math.random() * listOfItems.length);
                return msg.reply.text(listOfItems[chosenOne]);
            default:
                console.log('Disaster happened!');
                break;
        }
    } else {
        return msg.reply.text('I haven\'t been properly introduced to the group! Please run /start first!');
    }
});

// GUESSING GAME LOGIC
// Starts the guessing game
bot.on('/startguess', (msg: any) => {
    if (!isInit(msg)) {
        return msg.reply.text('Please initialize bot first? Stupid.');
    }

    let chatIndex: number = getChatIndex(msg.chat.id);
    if (hasGuessGame(msg)) {
        return msg.reply.text(
            'There is already an ongoing GuessGame!\n' +
            'Use /guessstatus to see your current progress!'
        );

    } else {
        let difficulty: number = 4; // TODO: ALLOW DIFFICULTY TO BE SET
        chats[chatIndex].guessGame = new GuessGame(difficulty);
        return msg.reply.text(
            '===New GuessGame===\n' +
            'Difficulty Level: ' + difficulty + ' digits.\n\n' +

            'Use /guess <number> to submit your guesses. I will let you know:\n' +
            '1) Correct digits, in correct positions\n' +
            '2) Correct digits, in wrong positions\n\n' +

            'Use /guessstatus to check how badly you\'re failing at this game\n\n' +

            'Use /stopguess to surrender to my superior intellect, and I will reveal the answer to your weak minds.\n\n' +

            'Good Luck! You\'re going to need it, noobcakes.'
        );
    }


});
// Makes a guess
bot.on('/guess', (msg: any) => {
    if (!isInit(msg)) {
        return msg.reply.text('Please initialize bot first? Stupid.');
    } else if (!hasGuessGame(msg)) {
        return msg.reply.text('There is no ongoing game now. Start one with /startguess!');
    } else {
        let chatIndex = getChatIndex(msg.chat.id);

        Promise.resolve().then((res) => {
            let valid: boolean = false;
            let result: Array<number> = [];

            let difficulty = chats[chatIndex].guessGame.getAnswer().length;
            let data = getData(msg);
            let strArr = data.split('');

            if (strArr.length !== difficulty) {
                throw 'Wrong length';
            }
            strArr.forEach((char) => {
                let digit = Number.parseInt(char);
                if (Number.isNaN(digit)) {
                    throw char + ' is not a digit!';
                }
                result.push(digit);
            });
            return result;

        }).then((res) => {
            // Submit valid data
            return chats[chatIndex].guessGame.submitGuess(res, msg.from.first_name);
        }).then((res) => {
            // Print updated status
            if (res) {
                // You Win
                delete chats[chatIndex].guessGame;
                return msg.reply.text('\u{1f389} \u{1f389} ' + msg.from.first_name + ' made a LUCKY GUESS of ' + getData(msg) + ' and won! \u{1f389} \u{1f389}');
            } else {
                // Continue guessing
                bot.event('/guessstatus', msg);
            }
        }).catch((rej) => {
            // Catch Invalid data
            msg.reply.text(
                'Something bad happened!\n' +
                'Reason: ' + rej);
        });
    }
});
// Ends the guessing game
bot.on('/stopguess', (msg: any) => {
    if (!isInit(msg)) {
        return msg.reply.text('Please initialize bot first? Stupid.');
    } else if (!hasGuessGame(msg)) {
        return msg.reply.text('There is no ongoing game now. Start one with /startguess!');
    } else {
        let chatIndex = getChatIndex(msg.chat.id);
        Promise.resolve().then((res) => {
            // Acknowledge command and reveal results
            return msg.reply.text(
                'I knew you guys couldn\'t solve it. Losers!\n' +
                'The answer was ' + chats[chatIndex].guessGame.getAnswer().toString());
        }).then((res) => {
            // Remove game
            delete chats[chatIndex].guessGame;
        });
    }
});
//  Replies with the current status of the game
bot.on('/guessstatus', (msg: any) => {
    if (!isInit(msg)) {
        return msg.reply.text('Please initialize bot first? Stupid.');
    } else if (!hasGuessGame(msg)) {
        return msg.reply.text('There is no ongoing game now. Start one with /startguess!');
    } else {
        // Prints updated status
        let chatIndex = getChatIndex(msg.chat.id);
        let attempts = chats[chatIndex].guessGame.getAttempts();
        let reply =
            '===GuessGame Status===\n' +
            'Difficulty: ' + chats[chatIndex].guessGame.getAnswer().length + '\n' +
            '==Legend==\n' +
            '\u{1f535}: Correct digit, correct position\n' +
            '\u{1f534}: Correct digit, wrong position\n\n';

        attempts.forEach((attempt: Attempt, index: number) => {
            let guessStr: string = '';
            attempt.getGuess().forEach((digit) => {
                guessStr = guessStr + digit;
            });

            let addOn: string =
                '[#' + (index + 1) + '] -- ' + attempt.getGuesser() + '\n' +
                '< ' + guessStr + ' >    \u{1f535} [' + attempt.getResult().correct + ']    \u{1f534} [' + attempt.getResult().numOnly + ']\n';
            reply += addOn;
        });
        return msg.reply.text(reply);
    }
});

bot.start();
