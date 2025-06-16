// Component for displaying a player's hand
import { createCardElement } from './Card.js';

export function createPlayerHandElement(player, onCardClick, selectedCards, gameMode) {
    const playerHandElement = document.createElement('div');
    playerHandElement.classList.add('player-hand');
    playerHandElement.dataset.playerId = player.id;

    const playerName = document.createElement('h3');
    if (gameMode === 'puntos') {
        playerName.textContent = `Player ${player.id} (Score: ${player.score})`;
    } else { // 'loba' mode
        playerName.textContent = `Player ${player.id} (Wins: ${player.roundsWon})`;
    }
    playerHandElement.appendChild(playerName);

    const cardsContainer = document.createElement('div');
    cardsContainer.classList.add('cards-container');

    player.hand.forEach((card, index) => {
        const cardElement = createCardElement(card);
        cardElement.dataset.cardIndex = index;
        cardElement.addEventListener('click', () => onCardClick(card));

        // Add 'selected' class if the card is in the selectedCards array
        if (selectedCards.includes(card)) {
            cardElement.classList.add('selected');
        }

        cardsContainer.appendChild(cardElement);
    });

    playerHandElement.appendChild(cardsContainer);

    return playerHandElement;
}
