import { createDeck, shuffleDeck } from './deck.js';

/**
 * Initializes and starts a new game of Loba.
 * @param {number} numPlayers The number of players in the game (2-5).
 * @returns {object} The initial game state.
 */
export function startGame(numPlayers) {
    if (numPlayers < 2 || numPlayers > 5) {
        throw new Error("Loba must be played with 2 to 5 players.");
    }

    const deck = createDeck();
    shuffleDeck(deck);

    const players = [];
    for (let i = 1; i <= numPlayers; i++) {
        const isAI = i !== 1; // Player 1 is human, others are AI
        players.push({
            id: `player${i}`,
            hand: [],
            score: 0,
            roundsWon: 0,
            isAI: isAI,
            autoSort: true
        });
    }

    // Deal 9 cards to each player
    for (let i = 0; i < 9; i++) {
        for (const player of players) {
            player.hand.push(deck.pop());
        }
    }

    const discardPile = [deck.pop()];

    return {
        players,
        deck,
        discardPile,
        currentPlayerId: 'player1',
        // gameMode: 'puntos', // or 'loba'
        gameMode: 'loba', // or 'loba'
        gameSettings: {
            maxScore: 100,
            maxRounds: 5
        },
        selectedCards: [], // To track selected cards for melding
        melds: [], // To store melds played on the table
        turnPhase: 'draw' // Can be 'draw' or 'play'
    };
}

/**
 * Resets the game for a new round, preserving player scores.
 * @param {object} currentState The current game state.
 * @returns {object} The state for the new round.
 */
export function startNewRound(currentState) {
    const deck = createDeck();
    shuffleDeck(deck);

    // Reset hands and deal new cards
    currentState.players.forEach(player => {
        player.hand = [];
    });
    for (let i = 0; i < 9; i++) {
        for (const player of currentState.players) {
            player.hand.push(deck.pop());
        }
    }

    // Reset deck, piles, and phase
    currentState.deck = deck;
    currentState.discardPile = [deck.pop()];
    currentState.melds = [];
    currentState.selectedCards = [];
    currentState.turnPhase = 'draw';

    // Optional: rotate the starting player
    // currentState.currentPlayerId = (currentState.roundWinnerId % currentState.players.length) + 1;

    return currentState;
}
