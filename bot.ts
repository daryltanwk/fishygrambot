import { Chat } from './chat';
import { Conversation } from "./conversation";

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

function getData(msg: any): string {
    const offset: number = msg.entities[0].length;
    console.log('Got command offset as: ' + offset);
    const data: string = (<string>msg.text).slice(offset + 1);
    console.log('Got data as: ' + data);
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
                console.log(reason);
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

bot.on('/addFood', (msg: any) => {
    if (isInit(msg)) {
        Promise.resolve().then((res) => {
            return getData(msg);
        }).then((res: string) => {
            if (!res) {
                return msg.reply.text('You didn\'t specify any food to add!');
            } else {
                // Add item into the list
                chats[getChatIndex(msg.chat.id)].lunchItems.push(res);
                return msg.reply.text('Adding ' + res + ' to the list...');
            }
        }).then((res) => {
            bot.event('/listFood', msg);
        });
    } else {
        bot.event('/start', msg)
    }
});
bot.on('/listFood', (msg: any) => {
    if (isInit(msg)) {
        let result =
            'Current Menu Items\n' +
            '======================\n';
        chats[getChatIndex(msg.chat.id)].lunchItems.forEach((item) => {
            result = result + item + '\n';
        });
        msg.reply.text(result);
    }
});

bot.on('/removeFood', (msg: any) => {

});

bot.start();
