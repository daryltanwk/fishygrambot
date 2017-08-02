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

// CHOOSER MODULE COMMANDS
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
                        let reply = 'Added:\n';
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
                        let reply = 'Removed:\n';
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

// GUESSGAME MODULE COMMANDS
bot.on(['/ggstart', '/ggstop', '/gg', '/ggstatus'], (msg: any) => {
    if (isInit(msg)) {
        let noGuessGameText = 'There is no ongoing game at the moment. Run /ggstart to start a new GuessGame!';

        let chatIndex = getChatIndex(msg.chat.id);
        let data = getData(msg);
        let command = getCommand(msg).split('@')[0];

        switch (command) {
            case 'ggstart':
                if (!hasGuessGame(msg)) {
                    let difficulty = 5; // TODO: allow player to select difficulty?
                    chats[chatIndex].guessGame = new GuessGame(difficulty);
                    return msg.reply.text(
                        '=== GuessGame ===\n' +
                        'Difficulty: ' + difficulty + ' digits\n\n' +

                        'Use /gg <number> to make a guess\n' +
                        'Use /ggstatus to check status of the game\n' +
                        'Use /ggstop to end the game and reveal the answer\n\n' +

                        'Good luck! You\'re going to need it'
                    );
                } else {
                    return msg.reply.text('There is already an ongoing game! Type /ggstatus to check the status of the game!');
                }
            case 'ggstop':
                if (hasGuessGame(msg)) {
                    Promise.resolve().then((res) => {
                        let answerString: string = '';
                        chats[chatIndex].guessGame.getAnswer().forEach((num) => {
                            answerString += num;
                        });
                        return msg.reply.text(
                            'Looks like ' + msg.from.first_name + ' decided to give up.\n' +
                            'The answer was: ' + answerString + '. Better luck next time!'
                        );
                    }).then((res) => {
                        delete chats[chatIndex].guessGame;
                    });
                } else {
                    return msg.reply.text(noGuessGameText);
                }
                break;
            case 'gg':
                if (hasGuessGame(msg)) {
                    Promise.resolve().then((res) => {
                        // Get data and check for validity
                        let data = getData(msg);
                        return chats[chatIndex].guessGame.checkData(data);
                    }).then((res) => {
                        if (res.isValid) {
                            // Submit the answer 
                            return chats[chatIndex].guessGame.submitGuess(res.numArr, msg.from.first_name);
                        } else {
                            // Invalid data, throw!
                            throw res.reason;
                        }
                    }).then((res) => {
                        if (res) {
                            return msg.reply.text(
                                '\u{1f389} \u{1f38a} \u{1f389} \u{1f38a} \u{1f389} \u{1f38a} \n' +
                                msg.from.first_name + ' made a LUCKY GUESS of ' + getData(msg) + ' and won!\n' +
                                '\u{1f389} \u{1f38a} \u{1f389} \u{1f38a} \u{1f389} \u{1f38a}').then((res: any) => {
                                    delete chats[chatIndex].guessGame;
                                });
                        } else {
                            let dispMsg = chats[chatIndex].guessGame.getDisplayMsg();
                            let dispText = chats[chatIndex].guessGame.getStatusText();
                            if (dispMsg !== -1) {
                                return bot.editMessageText({ chatId: msg.chat.id, messageId: dispMsg }, dispText);
                            } else {
                                msg.reply.text(dispText).then((res: any) => {
                                    chats[chatIndex].guessGame.setDisplayMsg(res.result.message_id);
                                });
                            }
                        }
                    }).then((res) => {
                        return bot.deleteMessage(msg.chat.id, msg.message_id);
                    }).catch((reason) => {
                        msg.reply.text(
                            'Sorry ' + msg.from.first_name + ', a disaster occured!' +
                            'Error: ' + reason
                        ).then((res: any) => {
                            return setTimeout(() => {
                                bot.deleteMessage(msg.chat.id, res.result.message_id);
                            }, 3000);
                        });
                        console.log(reason);
                    });
                } else {
                    return msg.reply.text(noGuessGameText)
                }
                break;
            case 'ggstatus':
                if (hasGuessGame(msg)) {
                    let dispText = chats[chatIndex].guessGame.getStatusText();
                    msg.reply.text(dispText).then((res: any) => {
                        chats[chatIndex].guessGame.setDisplayMsg(res.result.message_id);
                    });
                } else {
                    return msg.reply.text(noGuessGameText);
                }
                break;
            default:
                console.log('G R E A T   D I S A S T E R !')
        }
    } else {
        return msg.reply.text('Sorry pal, looks like I don\'t know you guys yet. Please run /start first.');
    }
});

bot.start();
