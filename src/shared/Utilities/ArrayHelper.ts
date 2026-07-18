export namespace ArrayHelper {
    export function makeUnique(arr: string[]): void {
        const seen = new Map<string, boolean>();
        for (let i = arr.size(); i >= 1; i--) {
            const v = arr[i - 1];
            if (seen.has(v)) {
                arr.remove(i - 1);
            } else {
                seen.set(v, true);
            }
        }
    }

    export function addString(arr: string[], value: string, unique = false): void {
        arr.push(value);
        if (unique) {
            makeUnique(arr);
        }
    }

    export function removeString(arr: string[], value: string, unique = false): void {
        for (let i = arr.size(); i >= 1; i--) {
            if (arr[i - 1] === value) {
                arr.remove(i - 1);
            }
        }
        if (unique) {
            makeUnique(arr);
        }
    }

    export function has(arr: string[], value: string): boolean {
        for (let i = 0; i < arr.size(); i++) {
            if (arr[i] === value) return true;
        }
        return false;
    }
}
