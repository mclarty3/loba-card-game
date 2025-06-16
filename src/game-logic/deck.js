// src/game-logic/deck.js

const SUITS = ['hearts', 'diams', 'clubs', 'spades'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

/**
 * Creates a new Loba deck, which consists of two standard 52-card decks
 * plus four jokers.
 * @returns {Array} An array of card objects.
 */
export function createDeck() {
    let deck = [];
    // Two standard decks
    for (let i = 0; i < 2; i++) {
        for (const suit of SUITS) {
            for (const rank of RANKS) {
                deck.push({ suit, rank });
            }
        }
    }
    // Four jokers
    for (let i = 0; i < 4; i++) {
        deck.push({ suit: 'joker', rank: 'Joker' });
    }
    return deck;
}

/**
 * Shuffles a deck of cards in place.
 * @param {Array} deck The deck to shuffle.
 */
export function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}
