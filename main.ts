import { Chat } from './chat';
import { bot } from './bot';

module TheBot {
    export let chats: Array<Chat> = [];

    export function getChats() {
        return chats;
    }
    export function addChat(chat: Chat) {
        chats.push(chat);
    }

    export function isInit(msg: any): boolean {
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

    export function hasGuessGame(msg: any) {
        let chatId = msg.chat.id;
        let chatIndex = getChatIndex(chatId);
        return (typeof chats[chatIndex].getGuessGame() !== 'undefined');
    }

    export function getCommand(msg: any): string {
        return (<string>msg.text).slice(1, msg.entities[0].length);
    }

    export function getData(msg: any): string {
        const offset: number = msg.entities[0].length;
        const data: string = (<string>msg.text).slice(offset + 1);
        return data;
    }

    export function getChatIndex(chatId: string): number {
        return chats.findIndex((chat) => {
            return (chat.chatId === chatId);
        });
    }
}

// FUNCTIONS


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
                if (TheBot.isInit(msg)) {
                    msg.reply.text('Yes! I\'ve previously been introduced to ' + msg.chat.title + '!');
                    throw 'Chat previously initialized';
                } else {
                    let chat = new Chat(msg.chat.id);
                    TheBot.addChat(chat);
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

