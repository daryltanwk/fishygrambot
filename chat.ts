import { Activity } from './eventmgr';
import { Chooser } from './chooser';
import { GuessGame } from './guessgame';
import { Conversation, Topic } from "./conversation";

export class Chat {
    private conversations: Array<Conversation>;
    private guessGame: GuessGame;
    private chooser: Chooser;
    private events: Array<Activity>;

    constructor(public chatId: string) {
        this.conversations = [];
        this.chooser = new Chooser([]);
        this.events = [];
    }

    // CONVERSATION GETTER/SETTER
    getConversations(): Array<Conversation> {
        return this.conversations;
    };

    addConversation(topic: Topic, requestor: any, reply: any) {
        let convo = new Conversation(topic, requestor, reply);

        this.conversations.push(convo);
        // Set Timeout before forgetting the conversation
        setTimeout(() => {
            this.removeConversation(requestor);
        }, 45000);
    };

    removeConversation(requestor: any) {
        // Check if conversation is still present
        let forgetIndex = this.conversations.findIndex((convo) => {
            return (requestor.id === convo.requestor.id);
        });

        if (forgetIndex !== -1) {
            this.conversations.splice(forgetIndex, 1);
        }
    }

    // GUESS GAME GETTER/SETTERS
    addGuessGame(difficulty: number) {
        this.guessGame = new GuessGame(difficulty);
    }
    removeGuessGame() {
        delete this.guessGame;
    }
    getGuessGame(): GuessGame {
        return this.guessGame;
    }

    // CHOOSER GETTER/SETTERS
    getChooser(): Chooser {
        return this.chooser;
    }

    // EVENTMGR GETTER/SETTERS
    addEvent(name: string) {
        let newEvent = new Activity(name);
        this.events.push(newEvent);
    }

    removeEvent() { }
    getEvents() {
        return this.events;
    }
}
