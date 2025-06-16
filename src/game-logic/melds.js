/**
 * Validates if a set of cards constitutes a valid "Pierna".
 * A Pierna must:
 * - Contain 3 or more cards.
 * - All cards must have the same rank.
 * - The cards must be from exactly three different suits.
 * - Jokers are not allowed.
 * @param {Array<object>} cards - An array of card objects to validate.
 * @returns {boolean} - True if the cards form a valid Pierna, false otherwise.
 */
export function isPierna(cards) {
    if (cards.length < 3) return false;
    if (cards.some(c => c.rank === 'Joker')) return false;

    const firstRank = cards[0].rank;
    if (!cards.every(c => c.rank === firstRank)) return false;

    const suits = new Set(cards.map(c => c.suit));
    return suits.size === 3;
}

const RANK_VALUES = { 'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13 };

/**
 * Validates if a set of cards constitutes a valid "Escalera".
 * An Escalera must:
 * - Contain 3 or more cards.
 * - All cards (except one optional Joker) must be of the same suit.
 * - The cards must form a continuous sequence.
 * - Aces can be high (after K) or low (before 2), but not wrap around (K-A-2).
 * @param {Array<object>} cards - An array of card objects to validate.
 * @returns {boolean} - True if the cards form a valid Escalera, false otherwise.
 */
export function isEscalera(cards) {
    if (cards.length < 3) return false;

    const jokers = cards.filter(c => c.rank === 'Joker');
    if (jokers.length > 1) return false;

    const regularCards = cards.filter(c => c.rank !== 'Joker');
    if (regularCards.length < 2 && jokers.length > 0) return true;
    if (regularCards.length === 0) return false; // Cannot have a meld of only jokers

    // Explicitly check for duplicate regular cards
    const regularCardRanks = regularCards.map(c => c.rank);
    if (new Set(regularCardRanks).size !== regularCardRanks.length) {
        return false;
    }

    const suit = regularCards[0].suit;
    if (!regularCards.every(c => c.suit === suit)) return false;

    const values = regularCards.map(c => RANK_VALUES[c.rank]).sort((a, b) => a - b);

    // If Ace is present, check both low and high possibilities
    if (values.includes(1)) {
        const highAceValues = values.map(v => v === 1 ? 14 : v).sort((a, b) => a - b);
        const isWrapAround = highAceValues.includes(2) && highAceValues.includes(13) && highAceValues.includes(14);

        if (!isWrapAround && checkSequence(highAceValues, cards.length)) {
            return true;
        }
    }

    return checkSequence(values, cards.length);
}

function checkSequence(values, totalCardCount) {
    if (values.length === 0) return true;
    const min = values[0];
    const max = values[values.length - 1];

    const requiredSpan = max - min + 1;

    // The span of the sequence (e.g., from 9 to J is 3) must be
    // less than or equal to the total number of cards available.
    return requiredSpan <= totalCardCount;
}

/**
 * Takes an array of cards known to be a valid Escalera and sorts them,
 * placing the Joker in the correct position.
 * @param {Array<object>} cards - An array of card objects.
 * @returns {Array<object>} A new array with the cards sorted.
 */
export function sortEscalera(cards) {
    const joker = cards.find(c => c.rank === 'Joker');
    const regularCards = cards.filter(c => c.rank !== 'Joker');
    const suit = regularCards.length > 0 ? regularCards[0].suit : 'joker';

    const values = [...new Set(regularCards.map(c => RANK_VALUES[c.rank]))].sort((a, b) => a - b);

    // Determine if high-ace or low-ace sequence is a better fit
    const lowAceSpan = values.length > 0 ? values[values.length - 1] - values[0] : 0;

    const highAceValues = values.map(v => (v === 1 ? 14 : v)).sort((a, b) => a - b);
    const highAceSpan = highAceValues.length > 0 ? highAceValues[highAceValues.length - 1] - highAceValues[0] : 0;

    let useHighAce = false;
    if (values.includes(1)) { // Only consider high-ace if an Ace is present
        // Prefer the sequence with the smaller span (it's more "compact")
        if (highAceSpan < lowAceSpan) {
            useHighAce = true;
        }
    }

    const finalValues = useHighAce ? highAceValues : values;
    let min = finalValues.length > 0 ? finalValues[0] : 1;
    let max = finalValues.length > 0 ? finalValues[finalValues.length - 1] : min + cards.length - 1;

    // Expand the sequence to include the joker
    if (joker && finalValues.length === (max - min + 1)) { // No internal gaps
        if (max < 14 && !(useHighAce && max === 13)) {
            max++; // Prefer adding to the high end
        } else {
            min--;
        }
    }

    const fullSequence = [];
    for (let i = min; i <= max; i++) {
        fullSequence.push(i);
    }

    const valueToCardMap = new Map(regularCards.map(c => [(RANK_VALUES[c.rank] === 1 && useHighAce) ? 14 : RANK_VALUES[c.rank], c]));

    const sortedCards = fullSequence.map(val => {
        return valueToCardMap.get(val) || joker;
    });

    return sortedCards;
}
