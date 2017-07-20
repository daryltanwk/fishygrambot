import { Chat } from './chat';
import { Conversation } from "./conversation";

const Telebot = require('telebot');
const bot = new Telebot('408714976:AAH8YMXXtGmAiRgxFJMlBy0Jz_P2PryGNKw');

let chats: Array<Chat> = [];

// FUNCTIONS
function isInit(chatId: string) {
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
            Promise.resolve(true).then((res) => {
                return msg.reply.text('Hi! this is a ' + chatType + '.');
            }).then((res) => {
                return msg.reply.text('Checking if I know you guys...');
            }).then((res) => {
                if (isInit(msg.chat.id)) {
                    msg.reply.text('Yes! I\'ve previously been introduced to ' + msg.chat.title + '!');
                    throw "Chat previously initialized";
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

bot.start();
