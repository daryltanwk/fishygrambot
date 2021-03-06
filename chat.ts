import { Chooser } from './chooser';
import { GuessGame } from './guessgame';
import { Conversation, TOPIC } from "./conversation";

export class Chat {
    public conversations: Array<Conversation>;
    public guessGame: GuessGame;
    public chooser: Chooser;

    constructor(public chatId: string) {
        this.conversations = [];
        this.chooser = new Chooser([]);
    }

    addConversation(msg: any, topic?: TOPIC) {
        if (typeof topic === 'undefined') {
            topic = TOPIC.Generic;
        }
        let convo = new Conversation(msg, topic);
        this.conversations.push(convo);
        // Set Timeout before forgetting the conversation
        setTimeout(() => {
            // Check if conversation is still present
            let forgetIndex = this.conversations.findIndex((convo) => {
                return (convo.msg.message_id === msg.message_id);
            });
            if (forgetIndex !== -1) {
                this.conversations.splice(forgetIndex, 1);
            }
        }, 600000);
    };
}
