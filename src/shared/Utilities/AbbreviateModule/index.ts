// AbbreviateModule.ts

import { SUFFIXES } from "./Suffixes";

function formatFixed(value: number, decimals: number): string {
    const multiplier = math.pow(10, decimals);
    const rounded = math.floor(value * multiplier + 0.5);

    const intPart = math.floor(rounded / multiplier);
    const fracPart = rounded % multiplier;

    if (decimals <= 0) {
        return tostring(intPart);
    }

    let fracStr = tostring(fracPart);

    while (fracStr.size() < decimals) {
        fracStr = "0" + fracStr;
    }

    return `${intPart}.${fracStr}`;
}

function trimZeros(value: string): string {
    while (string.sub(value, -1) === "0" && string.find(value, "%.") !== undefined) {
        value = string.sub(value, 1, -2);
    }

    if (string.sub(value, -1) === ".") {
        value = string.sub(value, 1, -2);
    }

    return value;
}

function joinParts(parts: string[], maxParts: number): string {
    let result = "";
    let count = 0;

    for (const part of parts) {
        if (count >= maxParts) break;

        if (count > 0) {
            result += " ";
        }

        result += part;
        count++;
    }

    return result;
}

export namespace AbbreviateModule {
    export function Currency(amount: number, decimals = 2, trimTrailingZeros = true): string {
        if (amount !== amount) return "0";

        const negative = amount < 0;
        let value = math.abs(amount);

        if (value < 1000) {
            return `${negative ? "-" : ""}${math.floor(value)}`;
        }

        let suffixIndex = 0;

        while (value >= 1000) {
            if (SUFFIXES[suffixIndex + 1] === undefined) {
                return `${negative ? "-" : ""}${SUFFIXES[suffixIndex]}`;
            }

            value /= 1000;
            suffixIndex++;
        }

        let result = formatFixed(value, decimals);

        if (trimTrailingZeros) {
            result = trimZeros(result);
        }

        return `${negative ? "-" : ""}${result}${SUFFIXES[suffixIndex]}`;
    }

    export function Time(seconds: number, maxParts = 2): string {
        if (seconds !== seconds || seconds <= 0) return "0s";
        if (seconds === math.huge) return "∞";

        let remaining = math.floor(seconds);

        const days = math.floor(remaining / 86400);
        remaining %= 86400;

        const hours = math.floor(remaining / 3600);
        remaining %= 3600;

        const minutes = math.floor(remaining / 60);
        remaining %= 60;

        const secs = remaining;

        const parts = new Array<string>();

        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (secs > 0) parts.push(`${secs}s`);

        if (parts.size() === 0) return "0s";

        return joinParts(parts, maxParts);
    }
}
