import { playAITurn } from './ai.js';
import { startNewRound } from './game.js';

/**
 * Manages the game flow, advancing turns and handling AI players.
 * @param {object} gameState The current state of the game.
 * @param {function} renderCallback The function to call to re-render the UI.
 * @returns {object} The updated game state after a turn.
 */
export async function runGameTurn(gameState, renderCallback) {
    if (gameState.turnPhase === 'game-over') {
        console.log("Game is over. No more turns.");
        // In a real app, you might show a "Game Over" screen
        return gameState;
    }

    if (gameState.turnPhase === 'round-over') {
        console.log("Round is over. Starting a new round...");
        startNewRound(gameState);
        // No turn is played, just the state is reset for the new round
        return gameState;
    }

    const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);

    if (!currentPlayer) {
        console.error("Could not find the current player.");
        return gameState;
    }

    if (currentPlayer.isAI) {
        console.log(`--- AI Player ${currentPlayer.id}'s Turn ---`);
        await playAITurn(gameState, renderCallback);
        console.log(`--- End of AI Player ${currentPlayer.id}'s Turn ---`);
    } else {
        console.log(`--- Player ${currentPlayer.id}'s Turn ---`);
        // For human players, the game will wait for UI interaction.
        // The UI will call the action functions directly.
    }

    return gameState;
}
