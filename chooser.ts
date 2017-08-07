import { bot } from './bot';
import { TheBot } from './main';

export class Chooser {
    static maxLength: number = 30;
    constructor(private items: Array<string>) { }

    getItems(): Array<string> {
        return this.items;
    }

    addItems(items: Array<string>) {
        // Add each item into the actual item list
        items.forEach((item) => {
            this.items.push(item);
        });
    }

    removeItems(indices: Array<number>): Array<string> {
        // Iterate through the list of indices
        let removedItems: Array<string> = [];
        indices.forEach((targetIndex) => {
            removedItems.push(this.items.splice(targetIndex - 1, 1)[0]);
        });
        // Update actual item list
        return removedItems;
    }

    static validateData(data: string): { isValid: boolean, itemArr: Array<string>, reason?: string } {
        let isValid = true;
        let reason: string = '';

        let itemArr: Array<string> = data.split(',').map((item) => {
            return item.trim();
        });;

        let hasErrors = itemArr.some((data) => {
            // Validation Here
            if (data.search(/https?:\/\//) !== -1) {
                reason = 'http:// or https:// detected';
            } else if (data.search('\n') !== -1) {
                reason = 'multi-line detected';
            } else if (data.length > Chooser.maxLength) {
                reason = 'too long! ' + Chooser.maxLength + ' characters max!';
            } else if (data.length <= 0) {
                reason = 'no data!'
            } else {
                return false;
            }
            return true;
        });
        isValid = !hasErrors;

        return { isValid, itemArr, reason };
    };

    static validateIndices(data: string, items: Array<string>): { isValid: boolean, indices: Array<number>, reason?: string } {
        let isValid = true;
        let indices: Array<number> = [];

        let reason = '';

        let dataArr = data.split(',');
        // Validation Here
        dataArr.forEach((element) => {
            indices.push(Number.parseInt(element));
        });
        if (indices.length === 0) {
            isValid = false;
            reason = 'empty data detected';
        } else {
            // Check if each index is parseable into an acceptable integer value
            let hasFaults = indices.some((num, index) => {
                if (Number.isNaN(num)) {
                    reason = 'NaN was detected at element index: ' + (index + 1);
                } else if (num > items.length) {
                    reason = 'element value exceeded list size at element ' + (index + 1) + ' with value: ' + num;
                } else {
                    return false;
                }
                return true;
            });
            isValid = !hasFaults;
        }
        indices.sort((a, b) => {
            return b - a;
        });
        let finalIndices: Array<number> = [];
        indices.forEach((ind) => {
            let result = finalIndices.findIndex((fInd) => {
                return (fInd === ind);
            });
            if (result === -1) {
                finalIndices.push(ind);
            }
        });

        return { isValid, indices: finalIndices, reason };
    }
}

// CHOOSER MODULE COMMANDS
bot.on(['/additem', '/removeitem', '/listitem', '/pickitem'], (msg: any) => {
    if (TheBot.isInit(msg)) {
        let chatIndex = TheBot.getChatIndex(msg.chat.id);
        // Do Logic
        let rawCommand = TheBot.getCommand(msg);
        let command = rawCommand.split('@')[0];
        switch (command) {
            case 'additem':
                Promise.resolve().then((res) => {
                    // Get the data
                    let data = TheBot.getData(msg);
                    return Chooser.validateData(data);
                }).then((res) => {
                    if (res.isValid) {
                        TheBot.chats[chatIndex].getChooser().addItems(res.itemArr);
                        let reply = 'Added:\n';
                        res.itemArr.forEach((item) => {
                            reply += item + ', ';
                        });
                        return msg.reply.text(reply.slice(0, reply.length - 2));

                    } else {
                        throw 'Error: ' + res.reason;
                    }
                }).catch((reason) => {
                    console.log(reason);
                    msg.reply.text('Couldn\'t add the item(s).\n' + reason);
                });
                break;
            case 'removeitem':
                Promise.resolve().then((res) => {
                    // Get the data
                    let data = TheBot.getData(msg);
                    return Chooser.validateIndices(data, TheBot.chats[chatIndex].getChooser().getItems())
                }).then((res) => {
                    if (res.isValid) {
                        let removedItems = TheBot.chats[chatIndex].getChooser().removeItems(res.indices);
                        let reply = 'Removed:\n';
                        removedItems.forEach((itm) => {
                            reply += itm + ', ';
                        });
                        return msg.reply.text(reply.slice(0, reply.length - 2));

                    } else {
                        throw 'Error: ' + res.reason;
                    }
                }).catch((reason) => {
                    console.log(reason);
                    msg.reply.text('Couldn\'t remove the item(s).\n' + reason);
                });
                break;
            case 'listitem':
                let itemsToList = TheBot.chats[chatIndex].getChooser().getItems();
                if (itemsToList.length <= 0) {
                    return msg.reply.text('List is empty! Use /additem to add some items!');
                }
                let reply = '=== Current Items ===\n';
                itemsToList.forEach((item, index) => {
                    reply += (index + 1) + ') ' + item + '\n';
                });
                return msg.reply.text(reply);
            case 'pickitem':
                let listOfItems = TheBot.chats[chatIndex].getChooser().getItems();
                if (listOfItems.length <= 0) {
                    return msg.reply.text('List is empty! Use /additem to add some items!');
                }
                let chosenOne = Math.floor(Math.random() * listOfItems.length);
                return msg.reply.text(listOfItems[chosenOne]);
            default:
                console.log('Disaster happened!');
                break;
        }
    } else {
        return msg.reply.text('I haven\'t been properly introduced to the group! Please run /start first!');
    }
});
