import { Conversation, TOPIC } from "./conversation";

export class Chat {
    public conversations: Array<Conversation>;
    public lunchItems: Array<string>;
    constructor(public chatId: string) {
        this.conversations = [];
        this.lunchItems = [];
    }

    addConversation(msg: any, topic?: TOPIC) {
        if (typeof topic === 'undefined') {
            topic = TOPIC.Generic;
        }
        let convo = new Conversation(msg, topic);
        this.conversations.push(convo);
    };
}
