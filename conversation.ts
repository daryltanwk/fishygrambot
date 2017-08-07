export class Conversation {
    public date: Date;
    constructor(
        public topic: Topic, // Topic of the conversation
        public requestor: any, // User object of requestor
        public reply: any, // Bot's Reply
    ) {
        this.date = new Date();
    }
}

export enum Topic {
    GENERIC = 0,
    EVTADD = 1
}
