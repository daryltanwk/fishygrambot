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

// let game = new GuessGame(3);
// console.log(game.getAnswer());
// game.submitGuess(GuessGame.newAnswer(3));
// console.log(game.getAttempts()[0].getGuess());
// console.log(game.getAttempts()[0].getResult());
