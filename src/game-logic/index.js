import { createGameBoardElement } from '../components/GameBoard.js';
import { startGame, startNewRound } from './game.js';
import { drawFromDeck, drawFromDiscard, meldSelectedCards, layOffCards, discardCard } from './actions.js';
import { subscribe } from '../settings.js';
import { runGameTurn } from './engine.js';

// --- Game State ---
let gameState;

// --- Game Loop ---
async function executeTurn() {
    // Run the turn logic, passing the render function for the AI to use
    await runGameTurn(gameState, renderGame);
    // The final render after a turn is complete
    renderGame();

    // If the current player is an AI, and the game is not over, continue the loop
    const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);
    if (currentPlayer && currentPlayer.isAI && gameState.turnPhase !== 'game-over') {
        // The delay is now inside the AI's turn, so we can call the next turn directly.
        executeTurn();
    }
}

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
        // After a human discards, the turn should advance.
        executeTurn();
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
        // Explicitly start a new round.
        startNewRound(gameState);
        // Then, execute the first turn of that new round.
        executeTurn();
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
    // Start the first turn
    executeTurn();
}

// Subscribe the render function to language changes
subscribe(renderGame);

// Start the application
initializeApp();
