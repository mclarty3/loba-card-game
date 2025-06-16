const CARD_VALUES = {
    'A': 10, 'K': 10, 'Q': 10, 'J': 10,
    '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2,
    'Joker': 10
};

/**
 * Calculates the total point value of a hand of cards.
 * @param {Array<object>} hand - An array of card objects.
 * @returns {number} The total score of the hand.
 */
export function calculateHandScore(hand) {
    return hand.reduce((total, card) => total + (CARD_VALUES[card.rank] || 0), 0);
}
