import { RANKS } from './deck.js';

const SUITS_ORDER = ['hearts', 'diams', 'clubs', 'spades', 'joker'];

function getRankValue(rank) {
    const rankIndex = RANKS.indexOf(rank);
    if (rankIndex !== -1) {
        return rankIndex;
    }
    if (rank === 'Joker') {
        return RANKS.length; // Jokers are highest
    }
    return -1; // Should not happen
}

function getSuitValue(suit) {
    return SUITS_ORDER.indexOf(suit);
}


/**
 * Sorts a hand of cards, first by rank, then by suit.
 * @param {Array} hand Array of card objects.
 * @returns {Array} A new array with the sorted cards.
 */
export function sortHand(hand) {
    return [...hand].sort((a, b) => {
        const rankValueA = getRankValue(a.rank);
        const rankValueB = getRankValue(b.rank);

        if (rankValueA !== rankValueB) {
            return rankValueA - rankValueB;
        }

        // If ranks are equal, sort by suit
        const suitValueA = getSuitValue(a.suit);
        const suitValueB = getSuitValue(b.suit);
        return suitValueA - suitValueB;
    });
}
