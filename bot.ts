import { Chat } from './chat';
import { Conversation, TOPIC } from "./conversation";

const Telebot = require('telebot');

require('dotenv').config()

const bot = new Telebot(process.env.BOT_API_KEY);

let chats: Array<Chat> = [];
const maxDataLength: number = 30;
const bodyParts: Array<string> = [
    'head',
    'knee',
    'torso',
    'eyelashes',
    'pinkie',
    'toenails',
    'left earlobe, chewed once',
    'nosehair',
    'preserved poop samples'
];

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

function dataHasHyperlink(data: string): boolean {
    return (data.search(/https?:\/\//) !== -1);
}

function dataHasNextline(data: string): boolean {
    return (data.search('\n') !== -1);
}

function dataIsTooLong(data: string): boolean {
    return (data.length > maxDataLength);
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

function removeFood(chatIndex: number, removeIndex: number, msg: any) {
    if (chats[chatIndex].lunchItems.length >= removeIndex && removeIndex > 0) {
        let removedItem = chats[chatIndex].lunchItems.splice(removeIndex - 1, 1)[0];
        return msg.reply.text('Removed ' + removedItem + ' from the list.');
    } else {
        return msg.reply.text('Sorry, didn\'t quite get that. Nothing was removed.');
    }
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
                return msg.reply.text('Hi! this is a ' + chatType + '.');
            }).then((res) => {
                return msg.reply.text('Checking if I know you guys...');
            }).then((res) => {
                if (isInit(msg)) {
                    msg.reply.text('Yes! I\'ve previously been introduced to ' + msg.chat.title + '!');
                    throw 'Chat previously initialized';
                } else {
                    let chat = new Chat(msg.chat.id);
                    chats.push(chat);
                    return msg.reply.text('Nope, so initializing now...');
                }
            }).then((res) => {
                msg.reply.text('Ok. Done! Try again!');
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

bot.on('/addfood', (msg: any) => {
    if (isInit(msg)) {
        Promise.resolve().then((res) => {
            return getData(msg);
        }).then((res: string) => {
            if (!res) {
                return msg.reply.text('You didn\'t specify any food to add!');
            } else {
                // Check for hyperlinks
                if (dataHasHyperlink(res) || dataHasNextline(res) || dataIsTooLong(res)) {
                    // Add a troll message
                    let bodyPartIndex = Math.floor(Math.random() * bodyParts.length);
                    let trollMsg = msg.from.first_name + '\'s ' + bodyParts[bodyPartIndex];
                    chats[getChatIndex(msg.chat.id)].lunchItems.push(trollMsg);
                    return msg.reply.text('Adding ' + trollMsg + ' to the list...');

                } else {
                    // Add item into the list
                    chats[getChatIndex(msg.chat.id)].lunchItems.push(res);
                    return msg.reply.text('Adding ' + res + ' to the list...');
                }
            }
        }).then((res) => {
            bot.event('/listfood', msg);
        });
    } else {
        bot.event('/start', msg)
    }
});
bot.on('/listfood', (msg: any) => {
    if (isInit(msg)) {
        let result =
            'Current Menu Items\n' +
            '======================\n';
        chats[getChatIndex(msg.chat.id)].lunchItems.forEach((item, index) => {
            result = result + (index + 1) + ') ' + item + '\n';
        });
        return msg.reply.text(result);
    }
});

bot.on('/removefood', (msg: any) => {
    if (isInit(msg)) {
        let data = getData(msg);
        if (data) {
            // If data provided
            let removeIndex = Number.parseInt(data);
            removeFood(getChatIndex(msg.chat.id), removeIndex, msg);
        } else {
            // If no data provided
            Promise.resolve().then((res) => {
                return bot.event('/listfood', msg);
            }).then((res) => {
                let forceReply = {
                    force_reply: true,
                    selective: true
                };
                return bot.sendMessage(
                    msg.chat.id,
                    'Enter the number of the item you wish to remove.',
                    {
                        replyMarkup: forceReply,
                        replyToMessage: msg.message_id
                    }
                )
            }).then((res) => {
                // Create a conversation
                let message = res.result;
                chats[getChatIndex(message.chat.id)].addConversation(message, TOPIC.RemoveFood);
            });
        }
    }
});

bot.on('/whattoeat', (msg: any) => {
    if (isInit(msg)) {
        // Check if there are lunch items
        let chatIndex = getChatIndex(msg.chat.id);
        if (chats[chatIndex].lunchItems.length > 0) {
            let chosenIndex = Math.floor(Math.random() * chats[chatIndex].lunchItems.length);
            return msg.reply.text(chats[chatIndex].lunchItems[chosenIndex]);
        }
    }
});

bot.on('text', (msg: any) => {
    let chatId: string = msg.chat.id;
    let chatIndex: number = getChatIndex(chatId);
    let incomingReplyMsgId: string;
    if (typeof msg.reply_to_message !== 'undefined') {
        incomingReplyMsgId = msg.reply_to_message.message_id;
    }

    // Check if any conversations are open
    if (typeof chats[chatIndex] !== 'undefined' &&
        typeof chats[chatIndex].conversations !== 'undefined' &&
        chats[chatIndex].conversations.length > 0) {
        let convoIndex: number = chats[chatIndex].conversations.findIndex((convo) => {
            return (convo.msg.message_id === incomingReplyMsgId);
        });

        // Check if incomingReplyMsgId is valid
        if (convoIndex !== -1) {
            // Check TOPIC
            switch (chats[chatIndex].conversations[convoIndex].topic) {
                case TOPIC.RemoveFood:
                    let removeIndex: number = Number.parseInt(msg.text);
                    // Check if item is valid
                    Promise.resolve().then((res) => {
                        return removeFood(chatIndex, removeIndex, msg)
                    }).then((res) => {
                        // End the conversation
                        chats[chatIndex].conversations.splice(convoIndex, 1);
                    });
                    break;
                case TOPIC.Generic:
                    // Do nothing. For now.    
                    break;

                default:
                    break;
            }
        }
    }
});

bot.start();
