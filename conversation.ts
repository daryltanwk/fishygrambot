export class Conversation {
    constructor(public msg: any, public topic: TOPIC) { }
}

export enum TOPIC {
    Generic = 0,
    RemoveFood = 1,
}
