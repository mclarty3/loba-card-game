// Component for displaying a player's hand
import { createCardElement } from './Card.js';
import { settings } from '../settings.js';
import { sortHand } from '../game-logic/utils.js';

export function createPlayerHandElement(player, onCardClick, selectedCards, gameMode, handlers, gameState) {
    const lang = settings.language;
    const playerHandElement = document.createElement('div');
    playerHandElement.classList.add('player-hand');
    playerHandElement.dataset.playerId = player.id;

    const playerInfoContainer = document.createElement('div');
    playerInfoContainer.classList.add('player-info-container');

    const playerName = document.createElement('h3');
    const title = lang.player_hand_title(player.id);
    let metric;

    if (gameMode === 'puntos') {
        metric = `(${lang.score}: ${player.score})`;
    } else { // 'loba' mode
        metric = `(${lang.rounds_won}: ${player.roundsWon})`;
    }
    playerName.textContent = `${title} ${metric}`;
    playerInfoContainer.appendChild(playerName);

    // Add sort controls for human player
    if (player.id === 'player1') {
        const controlsContainer = document.createElement('div');
        controlsContainer.classList.add('hand-controls');

        const sortButton = document.createElement('button');
        sortButton.textContent = lang.sort_hand;
        sortButton.classList.add('sort-button');
        sortButton.addEventListener('click', () => handlers.onSort(player.id));
        controlsContainer.appendChild(sortButton);

        const autoSortLabel = document.createElement('label');
        autoSortLabel.textContent = lang.auto_sort;
        const autoSortCheckbox = document.createElement('input');
        autoSortCheckbox.type = 'checkbox';
        autoSortCheckbox.checked = player.autoSort;
        autoSortCheckbox.addEventListener('change', (e) => handlers.onToggleAutoSort(player.id, e.target.checked));
        autoSortLabel.appendChild(autoSortCheckbox);
        controlsContainer.appendChild(autoSortLabel);

        playerInfoContainer.appendChild(controlsContainer);
    }

    playerHandElement.appendChild(playerInfoContainer);

    const cardsContainer = document.createElement('div');
    cardsContainer.classList.add('cards-container');

    let handToRender = [...player.hand];
    if (player.autoSort) {
        handToRender = sortHand(handToRender);
    }

    handToRender.forEach((card) => {
        const cardElement = createCardElement(card);
        cardElement.addEventListener('click', () => onCardClick(card));

        // Add 'selected' class if the card is in the selectedCards array
        if (selectedCards.some(selectedCard => selectedCard.id === card.id)) {
            cardElement.classList.add('selected');
        }

        // Add 'newly-drawn' class if the card was just drawn
        if (player.id === 'player1' && gameState.recentlyDrawnCard &&
            gameState.recentlyDrawnCard.id === card.id) {
            cardElement.classList.add('newly-drawn');
        }

        cardsContainer.appendChild(cardElement);
    });

    playerHandElement.appendChild(cardsContainer);

    return playerHandElement;
}
