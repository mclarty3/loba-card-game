import { getModelMove } from './ai.js';
import { startNewRound } from './game.js';
import { drawFromDeck, meldSelectedCards, discardCard } from './actions.js';
import { findPossibleMelds } from './melds.js'; // We'll need this for the meld action

/**
 * Manages the game flow, advancing turns and handling AI players.
 * @param {object} gameState The current state of the game.
 * @param {function} renderCallback The function to call to re-render the UI.
 * @returns {object} The updated game state after a turn.
 */
export async function runGameTurn(gameState, renderCallback) {
    // The engine should only halt if the entire game is over.
    // Round transitions are handled by the UI event.
    if (gameState.turnPhase === 'game-over') {
        console.log("Game is over. No more turns.");
        return gameState;
    }

    const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);

    if (!currentPlayer) {
        console.error("Could not find the current player.");
        return gameState;
    }

    if (currentPlayer.isAI) {
        console.log(`--- RL Agent ${currentPlayer.id}'s Turn ---`);

        // 1. Draw Phase
        if (gameState.turnPhase === 'draw') {
            drawFromDeck(gameState);
            renderCallback();
            await new Promise(res => setTimeout(res, 500)); // Short delay for UI
        }

        // 2. Play Phase Loop
        while (gameState.turnPhase === 'play') {
            const stateForModel = {
                hand: currentPlayer.hand,
                discard_top: gameState.discardPile[gameState.discardPile.length - 1],
                melds: gameState.melds,
                turn_phase: gameState.turn_phase,
            };

            const [action_type, card_idx] = await getModelMove(stateForModel);
            console.log(`RL Agent chose action: type ${action_type}, card ${card_idx}`);

            let moveMade = false;
            if (action_type === 1) { // Meld
                const allMelds = findPossibleMelds(currentPlayer.hand);
                const possibleMelds = allMelds.piernas.concat(allMelds.escaleras);
                if (possibleMelds.length > 0) {
                    gameState.selectedCards = possibleMelds[0];
                    meldSelectedCards(gameState);
                    moveMade = true;
                }
            } else if (action_type === 2) { // Discard
                const cardToDiscard = card_idx < currentPlayer.hand.length
                    ? currentPlayer.hand[card_idx]
                    : currentPlayer.hand[0]; // Failsafe
                gameState.selectedCards = [cardToDiscard];
                discardCard(gameState); // This action ends the 'play' phase.
                moveMade = true;
            }

            if (!moveMade) {
                // If agent chose an invalid move (e.g., meld when none exists),
                // we must force a discard to prevent an infinite loop.
                console.log("RL Agent chose an invalid move. Forcing discard.");
                gameState.selectedCards = [currentPlayer.hand[0]];
                discardCard(gameState);
            }

            renderCallback();
            await new Promise(res => setTimeout(res, 500)); // Short delay for UI

            // If the player's hand is empty, the round is over, so break the loop.
            if (currentPlayer.hand.length === 0) {
                break;
            }
        }

        console.log(`--- End of RL Agent ${currentPlayer.id}'s Turn ---`);
    } else {
        console.log(`--- Player ${currentPlayer.id}'s Turn ---`);
        // For human players, the game will wait for UI interaction.
        // The UI will call the action functions directly.
    }

    return gameState;
}
