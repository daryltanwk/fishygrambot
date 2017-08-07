import { bot } from './bot';
import { Topic, Conversation } from './conversation';
import { TheBot } from './main';
import * as moment from 'moment';

export class Activity {
    static maxDetailLength = 1500;
    static maxActivityLength = 100;

    private participants: Array<string>;
    private venue: string;
    private activityDetails: string;
    private status: EventStatus;
    private startDateTime: Date | string;
    private endDateTime: Date | string;
    private hasTime: boolean;

    constructor(
        private name: string
    ) {
        this.hasTime = false;
        this.participants = [];
        this.activityDetails = '';
        this.status = EventStatus.PENDING;
    }

    // Creation Logic
    static checkName(name: string): { isValid: boolean, reason: string } {
        let isValid = true;
        let reason = '';

        if (name.length > 100) {
            isValid = false;
            reason = 'Name exceeds 100 characters!';
        }
        return { isValid, reason };
    }

    // Participant Logic
    isAttending(name: string): boolean {
        return (this.participants.findIndex((person) => {
            return person === name;
        }) !== -1);
    }

    addParticipant(name: string) {
        this.participants.push(name);
    }

    removeParticipant(name: string) {
        let removeInd = this.participants.findIndex((participant) => {
            return participant === name;
        });
        this.participants.splice(removeInd, 1);
    }

    getParticipants() {
        return this.participants;
    }

    // Venue Logic
    getVenue() {
        return this.venue;
    }

    setVenue(venue: string) {
        this.venue = venue;
    }

    // Details Logic
    getDetails() {
        return this.activityDetails;
    }

    setDetails(details: string) {
        this.activityDetails = details
    }

    // Status Logic
    getStatus() {
        return this.status;
    }
    setStatus(status: EventStatus) {
        this.status = status;
    }

}

export enum EventStatus {
    PENDING = 0,
    CONFIRMED = 1,
    CANCELLED = 2,
    COMPLETED = 3
}

bot.on(['/evtadd', '/evtremove', '/evtlist', '/evtedit'], (msg: any) => {
    if (TheBot.isInit(msg)) {
        let command = TheBot.getCommand(msg).split('@')[0];
        let data = TheBot.getData(msg);
        let chatIndex = TheBot.getChatIndex(msg.chat.id);

        switch (command) {
            case 'evtadd':
                let replyToMessage: string = msg.message_id;
                let requestor: string = msg.from.id;
                let replyMarkup = { force_reply: true, selective: true };
                let parseMode = 'Markdown'

                return (<Promise<any>>bot.sendMessage(
                    msg.chat.id,
                    'Please enter the title/name of the event. (100 characters max)',
                    {
                        replyToMessage,
                        replyMarkup,
                    })).then((res) => {
                        TheBot.chats[chatIndex].addConversation(Topic.EVTADD, msg.from, res.result);
                    });
            case 'evtremove':
                break;
            case 'evtlist':
                break;
            case 'evtedit':
                break;
            default:
                break;
        }


    } else {
        msg.reply.text('Can\'t manage events without being initialized first. Please run /start to initialize.')
    }
});

bot.on('text', (msg: any) => {
    if (TheBot.isInit(msg)) {
        let chatIndex = TheBot.getChatIndex(msg.chat.id);
        if (TheBot.chats[chatIndex].getConversations().length > 0 && typeof msg.reply_to_message !== 'undefined') {
            let reply = msg.reply_to_message;
            let convoIndex = TheBot.chats[chatIndex].getConversations().findIndex((convo) => {
                return (convo.requestor.id === msg.from.id);
            });
            if (convoIndex !== -1) {
                switch (TheBot.chats[chatIndex].getConversations()[convoIndex].topic) {
                    case Topic.EVTADD:
                        // User replied to a legit EVTADD
                        let evtName = msg.text;
                        if (Activity.checkName(evtName).isValid) {
                            let activity = new Activity(evtName);
                            TheBot.chats[chatIndex].getEvents().push(activity);
                            TheBot.chats[chatIndex].removeConversation(msg.from);
                        }
                        break;
                    default:
                        break;
                }
            }

        }
    }
});
