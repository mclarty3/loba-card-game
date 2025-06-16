// Component for displaying a single card

export function createCardElement(card) {
    const cardElement = document.createElement('div');
    cardElement.classList.add('card');

    const rank = document.createElement('span');
    rank.textContent = card.rank;
    rank.classList.add('rank');

    const suit = document.createElement('span');
    suit.innerHTML = getSuitSymbol(card.suit);
    suit.classList.add('suit');

    cardElement.appendChild(rank);
    cardElement.appendChild(suit);

    if (card.suit === 'hearts' || card.suit === 'diams') {
        cardElement.classList.add('red');
    }

    return cardElement;
}

function getSuitSymbol(suit) {
    switch (suit) {
        case 'hearts': return '&hearts;';
        case 'diams': return '&diams;';
        case 'clubs': return '&clubs;';
        case 'spades': return '&spades;';
        default: return '';
    }
}
