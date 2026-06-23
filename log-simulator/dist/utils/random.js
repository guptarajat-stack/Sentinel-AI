"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomInt = randomInt;
exports.randomElement = randomElement;
exports.randomSample = randomSample;
exports.weightedRandom = weightedRandom;
exports.randomChance = randomChance;
/**
 * Generates a random integer between min and max (inclusive).
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
/**
 * Returns a random element from an array.
 */
function randomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}
/**
 * Returns a subset of unique elements from an array.
 */
function randomSample(array, size) {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, size);
}
/**
 * Performs a weighted random selection.
 * Expects an array of items and an array of corresponding weights (should sum up to 1, or relative values).
 */
function weightedRandom(items, weights) {
    const totalWeight = weights.reduce((acc, w) => acc + w, 0);
    let r = Math.random() * totalWeight;
    for (let i = 0; i < items.length; i++) {
        if (r < weights[i]) {
            return items[i];
        }
        r -= weights[i];
    }
    return items[items.length - 1];
}
/**
 * Returns true with the given probability (0.0 to 1.0).
 */
function randomChance(probability) {
    return Math.random() < probability;
}
