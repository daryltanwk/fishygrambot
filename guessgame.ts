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

    constructor(size: number) {
        this.answer = GuessGame.newAnswer(size);
        this.attempts = [];
    };

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
