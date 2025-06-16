// Component for displaying the main game board
import { createPlayerHandElement } from './PlayerHand.js';
import { createCardElement } from './Card.js';
import { isPierna, isEscalera } from '../game-logic/melds.js';

export function createGameBoardElement(gameState, handlers) {
    const gameBoardElement = document.createElement('div');
    gameBoardElement.id = 'game-board-inner';

    // --- Status Bar ---
    const statusDiv = document.createElement('div');
    statusDiv.classList.add('status-bar');

    if (gameState.turnPhase === 'game-over') {
        let winner;
        if (gameState.gameMode === 'puntos') {
            winner = gameState.players.reduce((prev, curr) => prev.score < curr.score ? prev : curr);
        } else { // 'loba' mode
            winner = gameState.players.find(p => p.roundsWon >= gameState.gameSettings.maxRounds);
        }
        statusDiv.textContent = `Game Over! Player ${winner.id} wins the game!`;
    } else if (gameState.turnPhase === 'round-over') {
        const winner = gameState.players.find(p => p.hand.length === 0);
        statusDiv.textContent = `Round Over! Player ${winner.id} won.`;
    } else {
        const phaseText = gameState.turnPhase === 'draw' ? 'Draw a card' : 'Meld or discard';
        statusDiv.textContent = `Player ${gameState.currentPlayerId}'s Turn: ${phaseText}`;
    }

    gameBoardElement.appendChild(statusDiv);

    // Player areas
    const playersArea = document.createElement('div');
    playersArea.classList.add('players-area');
    gameState.players.forEach(player => {
        // Only allow card selection for the current player
        const isCurrentPlayer = player.id === gameState.currentPlayerId;
        const handler = isCurrentPlayer ? handlers.onCardClick : () => { };
        const playerHandElement = createPlayerHandElement(player, handler, gameState.selectedCards, gameState.gameMode);
        playersArea.appendChild(playerHandElement);
    });
    gameBoardElement.appendChild(playersArea);

    // --- Table Area for Melds ---
    const tableArea = document.createElement('div');
    tableArea.classList.add('table-area');
    gameState.melds.forEach((meld, index) => {
        const meldContainer = document.createElement('div');
        meldContainer.classList.add('meld-container');
        meldContainer.dataset.meldIndex = index;
        meldContainer.addEventListener('click', () => handlers.onLayOff(index));

        meld.cards.forEach(card => {
            meldContainer.appendChild(createCardElement(card));
        });
        tableArea.appendChild(meldContainer);
    });
    gameBoardElement.appendChild(tableArea);

    // Deck and discard pile area
    const centralArea = document.createElement('div');
    centralArea.classList.add('central-area');

    if (gameState.turnPhase === 'game-over') {
        const newGameButton = document.createElement('button');
        newGameButton.textContent = 'Start New Game';
        newGameButton.classList.add('action-button');
        newGameButton.addEventListener('click', handlers.onNewGame);
        centralArea.appendChild(newGameButton);
    } else if (gameState.turnPhase === 'round-over') {
        const nextRoundButton = document.createElement('button');
        nextRoundButton.textContent = 'Start Next Round';
        nextRoundButton.classList.add('action-button');
        nextRoundButton.addEventListener('click', handlers.onNextRound);
        centralArea.appendChild(nextRoundButton);
    } else {
        const selectedCards = gameState.selectedCards;
        const isMeldPhase = gameState.turnPhase !== 'draw';

        const meldButton = document.createElement('button');
        meldButton.textContent = 'Meld Selected Cards';
        meldButton.classList.add('action-button');
        meldButton.addEventListener('click', handlers.onMeld);
        meldButton.disabled = !isMeldPhase || !(isPierna(selectedCards) || isEscalera(selectedCards));
        centralArea.appendChild(meldButton);

        const discardButton = document.createElement('button');
        discardButton.textContent = 'Discard Selected Card';
        discardButton.classList.add('action-button');
        discardButton.addEventListener('click', handlers.onDiscard);
        discardButton.disabled = !isMeldPhase || selectedCards.length !== 1;
        centralArea.appendChild(discardButton);

        const deckPile = document.createElement('div');
        deckPile.classList.add('deck-pile', 'card-pile');
        deckPile.textContent = 'Deck';
        deckPile.addEventListener('click', handlers.onDrawFromDeck);
        centralArea.appendChild(deckPile);

        const discardPile = document.createElement('div');
        discardPile.classList.add('discard-pile', 'card-pile');
        discardPile.addEventListener('click', handlers.onDrawFromDiscard);

        if (gameState.discardPile.length > 0) {
            const topCard = gameState.discardPile[gameState.discardPile.length - 1];
            const cardElement = createCardElement(topCard);
            discardPile.innerHTML = '';
            discardPile.appendChild(cardElement);
        } else {
            discardPile.textContent = 'Discard';
        }
        centralArea.appendChild(discardPile);
    }

    gameBoardElement.appendChild(centralArea);

    // --- Debug Area ---
    const debugArea = document.createElement('div');
    debugArea.classList.add('debug-area');

    const debugTitle = document.createElement('h4');
    debugTitle.textContent = 'Debug Controls:';
    debugArea.appendChild(debugTitle);

    const rankInput = document.createElement('input');
    rankInput.id = 'rank-debug-input';
    rankInput.placeholder = 'Rank (e.g., A, 7)';
    debugArea.appendChild(rankInput);

    const suitInput = document.createElement('input');
    suitInput.id = 'suit-debug-input';
    suitInput.placeholder = 'Suit (hearts)';
    debugArea.appendChild(suitInput);

    const setCardButton = document.createElement('button');
    setCardButton.textContent = 'Set Next Card';
    setCardButton.addEventListener('click', () => {
        const rank = document.getElementById('rank-debug-input').value.charAt(0).toUpperCase() + document.getElementById('rank-debug-input').value.slice(1).toLowerCase();
        const suit = document.getElementById('suit-debug-input').value.toLowerCase();
        handlers.onSetNextCard({ rank, suit });
    });
    debugArea.appendChild(setCardButton);

    if (gameState.forcedNextCard) {
        const forcedCardStatus = document.createElement('p');
        forcedCardStatus.textContent = `Next draw: ${gameState.forcedNextCard.rank} of ${gameState.forcedNextCard.suit}`;
        debugArea.appendChild(forcedCardStatus);
    }

    gameBoardElement.appendChild(debugArea);

    return gameBoardElement;
}
