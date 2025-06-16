import { createGameBoardElement } from '../components/GameBoard.js';
import { startGame, startNewRound } from './game.js';
import { drawFromDeck, drawFromDiscard, meldSelectedCards, layOffCards, discardCard } from './actions.js';
import { subscribe } from '../settings.js';

// --- Game State ---
let gameState;

// --- Actions Handlers ---
const actionHandlers = {
    onDrawFromDeck: () => {
        drawFromDeck(gameState);
        renderGame();
    },
    onDrawFromDiscard: () => {
        drawFromDiscard(gameState);
        renderGame();
    },
    onMeld: () => {
        meldSelectedCards(gameState);
        renderGame();
    },
    onDiscard: () => {
        discardCard(gameState);
        renderGame();
    },
    onLayOff: (meldIndex) => {
        layOffCards(gameState, meldIndex);
        renderGame();
    },
    onCardClick: (card) => {
        const cardIndex = gameState.selectedCards.findIndex(c => c.suit === card.suit && c.rank === card.rank);
        if (cardIndex > -1) {
            gameState.selectedCards.splice(cardIndex, 1);
        } else {
            gameState.selectedCards.push(card);
        }
        renderGame();
    },
    onSetNextCard: (card) => {
        const SUITS = ['hearts', 'diams', 'clubs', 'spades', 'joker'];
        const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'Joker'];
        var jokerError = false;
        if (card.rank === 'Joker' || card.suit === 'joker') {
            if (!(card.rank === 'Joker' && card.suit === 'joker')) {
                console.error("Debug: Invalid card specified.", card);
                jokerError = true;
            }
        }
        if (RANKS.includes(card.rank) && SUITS.includes(card.suit) && !jokerError) {
            gameState.forcedNextCard = card;
            console.log(`Debug: Next card to be drawn is set to: ${card.rank} of ${card.suit}`);
            renderGame(); // Re-render to show the status
        } else {
            console.error("Debug: Invalid card specified.", card);
        }
    },
    onNextRound: () => {
        gameState = startNewRound(gameState);
        renderGame();
    },
    onNewGame: () => {
        initializeApp();
    }
};

// --- Rendering ---
function renderGame() {
    const gameBoardContainer = document.getElementById('game-board');
    gameBoardContainer.innerHTML = ''; // Clear previous state

    const gameBoardElement = createGameBoardElement(gameState, actionHandlers);
    gameBoardContainer.appendChild(gameBoardElement);
}

// --- Initialization ---
function initializeApp() {
    gameState = startGame(2); // Start a game with 2 players
    gameState.forcedNextCard = null; // For debugging
    renderGame();
}

// Subscribe the render function to language changes
subscribe(renderGame);

// Start the application
initializeApp();
