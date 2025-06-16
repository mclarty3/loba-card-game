// Component for displaying a player's hand
import { createCardElement } from './Card.js';
import { settings } from '../settings.js';

export function createPlayerHandElement(player, onCardClick, selectedCards, gameMode) {
    const lang = settings.language;
    const playerHandElement = document.createElement('div');
    playerHandElement.classList.add('player-hand');
    playerHandElement.dataset.playerId = player.id;

    const playerName = document.createElement('h3');
    const title = lang.player_hand_title(player.id);
    let metric;

    if (gameMode === 'puntos') {
        metric = `(${lang.score}: ${player.score})`;
    } else { // 'loba' mode
        metric = `(${lang.rounds_won}: ${player.roundsWon})`;
    }
    playerName.textContent = `${title} ${metric}`;
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
