import { bot } from './bot';
import { TheBot } from './main';

export class Attempt {
    constructor(
        private guesser: string,
        private guess: Array<number>,
        private result: {
            correct: number,
            numOnly: number
        }
    ) { }

    getGuesser() {
        return this.guesser;
    }

    getGuess() {
        return this.guess;
    }

    getResult() {
        return this.result;
    }
}

export class GuessGame {
    private answer: Array<number>;
    private attempts: Array<Attempt>;
    private displayMsg: number;
    static maxDiff: number = 50;
    static minDiff: number = 1;

    constructor(size: number) {
        this.answer = GuessGame.newAnswer(size);
        this.attempts = [];
        this.displayMsg = -1;
    };

    static checkDifficulty(data: string): { isValid: boolean, value: number, reason: string } {
        let difficulty = Number.parseInt(data);
        let result = { isValid: true, value: difficulty, reason: '' };
        if (Number.isNaN(difficulty)) {
            result.isValid = false;
            result.reason = '\'' + data + '\' could not be parsed into a number!';
        } else if (difficulty > this.maxDiff || difficulty < this.minDiff) {
            result.isValid = false;
            result.reason = 'Difficulty level should be between ' + this.minDiff + ' and ' + this.maxDiff + ', but got ' + difficulty + ' instead!';
        }
        return result;
    }

    checkData(data: string): { isValid: boolean, numArr: Array<number>, reason: string } {
        let isValid: boolean = true;
        let numArr: Array<number> = [];
        let reason: string = '';

        let strArr = data.split('');

        if (strArr.length !== this.answer.length) {
            reason = 'Submission is not the correct size. Should be ' + this.answer.length + ', got ' + strArr.length + '.';
            isValid = false;
            return { isValid, numArr, reason };
        }

        strArr.forEach((char) => {
            let digit = Number.parseInt(char);
            if (Number.isNaN(digit)) {
                reason = char + ' is not a digit!';
                isValid = false;
                return { isValid, numArr, reason };
            }
            numArr.push(digit);
        });

        return { isValid, numArr, reason };
    }


    getStatusText(): string {
        let result: string =
            '=== GuessGame Status ===\n' +
            'Difficulty: ' + this.answer.length + '\n' +
            '==Legend==\n' +
            '\u{1f535}: Correct digit, correct position\n' +
            '\u{1f534}: Correct digit, wrong position\n\n';

        this.attempts.forEach((attempt: Attempt, index: number) => {
            let guessStr: string = '';
            attempt.getGuess().forEach((digit) => {
                guessStr = guessStr + digit;
            });

            let addOn: string =
                '[#' + (index + 1) + '] -- ' + attempt.getGuesser() + '\n' +
                '< ' + guessStr + ' >    \u{1f535} [' + attempt.getResult().correct + ']    \u{1f534} [' + attempt.getResult().numOnly + ']\n';
            result += addOn;
        });

        return result;
    }

    getDisplayMsg(): number {
        return this.displayMsg;
    }

    setDisplayMsg(msgId: number) {
        this.displayMsg = msgId;
    }

    getAnswer() {
        return this.answer;
    }

    getAttempts() {
        return this.attempts;
    }

    submitGuess(guess: Array<number>, name: string): boolean {
        // Check for correct
        let corrects = 0;
        this.answer.forEach((digit, index) => {
            if (digit === guess[index]) {
                corrects++;
            }
        });
        // Check for numOnly
        let numOnly = 0;
        let answerCount = GuessGame.getCount(this.answer);
        let guessCount = GuessGame.getCount(guess);
        answerCount.forEach((digit, index) => {
            numOnly += Math.min(digit, guessCount[index]);
        });
        // Remove duplicates which are already reflected in corrects
        numOnly -= corrects;

        let result = {
            correct: corrects,
            numOnly: numOnly
        };

        let attempt = new Attempt(name, guess, result);
        this.attempts.push(attempt);

        return (result.correct === this.answer.length);

    }

    static getCount(numArr: Array<number>): Array<number> {
        let result = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        numArr.forEach((num) => {
            result[num] = result[num] + 1;
        });
        return result;
    };

    static newAnswer(size: number): Array<number> {
        let result: Array<number> = [];
        for (let i = 0; i < size; i++) {
            result.push(Math.floor(Math.random() * 10));
        }
        return result;
    }
}

// GUESSGAME MODULE COMMANDS
bot.on(['/ggstart', '/ggstop', '/gg', '/ggstatus'], (msg: any) => {
    if (TheBot.isInit(msg)) {
        let noGuessGameText = 'There is no ongoing game at the moment. Run /ggstart to start a new GuessGame!';

        let chatIndex = TheBot.getChatIndex(msg.chat.id);
        let data = TheBot.getData(msg);
        let command = TheBot.getCommand(msg).split('@')[0];

        switch (command) {
            case 'ggstart':
                if (!TheBot.hasGuessGame(msg)) {
                    let difficulty = 10;
                    let data = TheBot.getData(msg);
                    if (data.length > 0) {
                        let checkResult = GuessGame.checkDifficulty(data);
                        if (!checkResult.isValid) {
                            return msg.reply.text(
                                'DISASTER STRIKES!\n' +
                                checkResult.reason
                            );
                        } else {
                            difficulty = checkResult.value;
                        }
                    }

                    TheBot.chats[chatIndex].addGuessGame(difficulty);
                    return msg.reply.text(
                        '=== GuessGame ===\n' +
                        'Difficulty: ' + difficulty + ' digits\n\n' +

                        'Use /gg <number> to make a guess\n' +
                        'Use /ggstatus to check status of the game\n' +
                        'Use /ggstop to end the game and reveal the answer\n\n' +

                        'Good luck! You\'re going to need it'
                    );
                } else {
                    return msg.reply.text('There is already an ongoing game! Type /ggstatus to check the status of the game!');
                }
            case 'ggstop':
                if (TheBot.hasGuessGame(msg)) {
                    Promise.resolve().then((res) => {
                        let answerString: string = '';
                        TheBot.chats[chatIndex].getGuessGame().getAnswer().forEach((num) => {
                            answerString += num;
                        });
                        return msg.reply.text(
                            'Looks like ' + msg.from.first_name + ' decided to give up.\n' +
                            'The answer was: ' + answerString + '. Better luck next time!'
                        );
                    }).then((res) => {
                        TheBot.chats[chatIndex].removeGuessGame();
                    });
                } else {
                    return msg.reply.text(noGuessGameText);
                }
                break;
            case 'gg':
                if (TheBot.hasGuessGame(msg)) {
                    Promise.resolve().then((res) => {
                        // Get data and check for validity
                        let data = TheBot.getData(msg);
                        return TheBot.chats[chatIndex].getGuessGame().checkData(data);
                    }).then((res) => {
                        if (res.isValid) {
                            // Submit the answer 
                            return TheBot.chats[chatIndex].getGuessGame().submitGuess(res.numArr, msg.from.first_name);
                        } else {
                            // Invalid data, throw!
                            throw res.reason;
                        }
                    }).then((res) => {
                        if (res) {
                            return msg.reply.text(
                                '\u{1f389} \u{1f38a} \u{1f389} \u{1f38a} \u{1f389} \u{1f38a} \n' +
                                msg.from.first_name + ' made a LUCKY GUESS of ' + TheBot.getData(msg) + ' and won!\n' +
                                '\u{1f389} \u{1f38a} \u{1f389} \u{1f38a} \u{1f389} \u{1f38a}').then((res: any) => {
                                    TheBot.chats[chatIndex].removeGuessGame();
                                });
                        } else {
                            let dispMsg = TheBot.chats[chatIndex].getGuessGame().getDisplayMsg();
                            let dispText = TheBot.chats[chatIndex].getGuessGame().getStatusText();
                            if (dispMsg !== -1) {
                                return bot.editMessageText({ chatId: msg.chat.id, messageId: dispMsg }, dispText);
                            } else {
                                msg.reply.text(dispText).then((res: any) => {
                                    TheBot.chats[chatIndex].getGuessGame().setDisplayMsg(res.result.message_id);
                                });
                            }
                        }
                    }).then((res) => {
                        return bot.deleteMessage(msg.chat.id, msg.message_id);
                    }).catch((reason) => {
                        msg.reply.text(
                            'Sorry ' + msg.from.first_name + ', a disaster occured!\n' +
                            'Error: ' + reason
                        ).then((res: any) => {
                            return setTimeout(() => {
                                bot.deleteMessage(msg.chat.id, res.result.message_id);
                            }, 3000);
                        });
                        console.log(reason);
                    });
                } else {
                    return msg.reply.text(noGuessGameText)
                }
                break;
            case 'ggstatus':
                if (TheBot.hasGuessGame(msg)) {
                    let dispText = TheBot.chats[chatIndex].getGuessGame().getStatusText();
                    let oldDispMsg = TheBot.chats[chatIndex].getGuessGame().getDisplayMsg();
                    msg.reply.text(dispText).then((res: any) => {
                        TheBot.chats[chatIndex].getGuessGame().setDisplayMsg(res.result.message_id);
                        bot.deleteMessage(msg.chat.id, oldDispMsg);
                    });
                } else {
                    return msg.reply.text(noGuessGameText);
                }
                break;
            default:
                console.log('G R E A T   D I S A S T E R !')
        }
    } else {
        return msg.reply.text('Sorry pal, looks like I don\'t know you guys yet. Please run /start first.');
    }
});
