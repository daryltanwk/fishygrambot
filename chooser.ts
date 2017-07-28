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
