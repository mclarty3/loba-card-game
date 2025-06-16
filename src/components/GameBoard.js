// Component for displaying the main game board
import { createPlayerHandElement } from './PlayerHand.js';
import { createCardElement } from './Card.js';
import { isPierna, isEscalera } from '../game-logic/melds.js';
import { settings, setLanguage } from '../settings.js';

export function createGameBoardElement(gameState, handlers) {
    const lang = settings.language;
    const gameBoardElement = document.createElement('div');
    gameBoardElement.id = 'game-board-inner';

    // --- Header ---
    const headerElement = document.createElement('div');
    headerElement.classList.add('game-header');

    // Language Selector
    const langSelectorContainer = document.createElement('div');
    langSelectorContainer.classList.add('language-selector');

    const langLabel = document.createElement('label');
    langLabel.for = 'language-select';
    langLabel.textContent = lang.language_label + ':';
    langSelectorContainer.appendChild(langLabel);

    const langSelect = document.createElement('select');
    langSelect.id = 'language-select';

    for (const [code, langData] of Object.entries(settings.availableLanguages)) {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = langData.name;
        if (code === settings.currentLanguageCode) {
            option.selected = true;
        }
        langSelect.appendChild(option);
    }

    langSelect.addEventListener('change', (e) => {
        setLanguage(e.target.value);
    });

    langSelectorContainer.appendChild(langSelect);
    headerElement.appendChild(langSelectorContainer);
    gameBoardElement.appendChild(headerElement);

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
        statusDiv.textContent = lang.game_over(winner.id);
    } else if (gameState.turnPhase === 'round-over') {
        const winner = gameState.players.find(p => p.hand.length === 0);
        statusDiv.textContent = lang.round_over(winner.id);
    } else {
        const phaseText = gameState.turnPhase === 'draw' ? lang.draw_phase : lang.meld_phase;
        statusDiv.textContent = lang.player_turn(gameState.currentPlayerId, phaseText);
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
        if (isCurrentPlayer) {
            playerHandElement.classList.add('active-hand');
        }
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

        // Check if the selected cards can be laid off on this meld
        if (gameState.selectedCards.length > 0 && gameState.turnPhase !== 'draw') {
            if (meld.type === 'escalera') {
                const potentialNewMeld = [...meld.cards, ...gameState.selectedCards];
                if (isEscalera(potentialNewMeld)) {
                    meldContainer.classList.add('active-meld');
                }
            } else if (meld.type === 'pierna') {
                const selected = gameState.selectedCards;
                // For a pierna lay-off, the card must match the rank and be one of the existing suits.
                if (selected.length === 1 && selected[0].rank === meld.cards[0].rank) {
                    const piernaSuits = new Set(meld.cards.map(c => c.suit));
                    if (piernaSuits.has(selected[0].suit)) {
                        meldContainer.classList.add('active-meld');
                    }
                }
            }
        }

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
        newGameButton.textContent = lang.new_game;
        newGameButton.classList.add('action-button');
        newGameButton.addEventListener('click', handlers.onNewGame);
        centralArea.appendChild(newGameButton);
    } else if (gameState.turnPhase === 'round-over') {
        const nextRoundButton = document.createElement('button');
        nextRoundButton.textContent = lang.next_round;
        nextRoundButton.classList.add('action-button');
        nextRoundButton.addEventListener('click', handlers.onNextRound);
        centralArea.appendChild(nextRoundButton);
    } else {
        const selectedCards = gameState.selectedCards;
        const isMeldPhase = gameState.turnPhase !== 'draw';

        const meldButton = document.createElement('button');
        meldButton.textContent = lang.meld;
        meldButton.classList.add('action-button');
        meldButton.addEventListener('click', handlers.onMeld);
        meldButton.disabled = !isMeldPhase || !(isPierna(selectedCards) || isEscalera(selectedCards));
        centralArea.appendChild(meldButton);

        const discardButton = document.createElement('button');
        discardButton.textContent = lang.discard;
        discardButton.classList.add('action-button');
        discardButton.addEventListener('click', handlers.onDiscard);
        discardButton.disabled = !isMeldPhase || selectedCards.length !== 1;
        centralArea.appendChild(discardButton);

        const isDrawPhase = gameState.turnPhase === 'draw';

        const deckPile = document.createElement('div');
        deckPile.classList.add('deck-pile', 'card-pile');
        if (isDrawPhase) {
            deckPile.classList.add('active-pile');
        }
        deckPile.textContent = lang.deck;
        deckPile.addEventListener('click', handlers.onDrawFromDeck);
        centralArea.appendChild(deckPile);

        const discardPile = document.createElement('div');
        discardPile.classList.add('discard-pile', 'card-pile');
        if (isDrawPhase && gameState.discardPile.length > 0) {
            const topDiscard = gameState.discardPile[gameState.discardPile.length - 1];
            const potentialMeld = [...selectedCards, topDiscard];
            // Only make it active if the selected cards + top discard form a valid meld
            if (isPierna(potentialMeld) || isEscalera(potentialMeld)) {
                discardPile.classList.add('active-pile');
            }
        }
        discardPile.addEventListener('click', handlers.onDrawFromDiscard);

        if (gameState.discardPile.length > 0) {
            const topCard = gameState.discardPile[gameState.discardPile.length - 1];
            const cardElement = createCardElement(topCard);
            discardPile.innerHTML = '';
            discardPile.appendChild(cardElement);
        } else {
            discardPile.textContent = lang.discard_pile;
        }
        centralArea.appendChild(discardPile);
    }

    gameBoardElement.appendChild(centralArea);

    // --- Debug Area ---
    const debugArea = document.createElement('div');
    debugArea.classList.add('debug-area');

    const debugTitle = document.createElement('h4');
    debugTitle.textContent = lang.debug_controls;
    debugArea.appendChild(debugTitle);

    const rankInput = document.createElement('input');
    rankInput.id = 'rank-debug-input';
    rankInput.placeholder = lang.debug_rank_placeholder;
    debugArea.appendChild(rankInput);

    const suitInput = document.createElement('input');
    suitInput.id = 'suit-debug-input';
    suitInput.placeholder = lang.debug_suit_placeholder;
    debugArea.appendChild(suitInput);

    const setCardButton = document.createElement('button');
    setCardButton.textContent = lang.debug_set_card;
    setCardButton.addEventListener('click', () => {
        const rank = document.getElementById('rank-debug-input').value.charAt(0).toUpperCase() + document.getElementById('rank-debug-input').value.slice(1).toLowerCase();
        const suit = document.getElementById('suit-debug-input').value.toLowerCase();
        handlers.onSetNextCard({ rank, suit });
    });
    debugArea.appendChild(setCardButton);

    if (gameState.forcedNextCard) {
        const forcedCardStatus = document.createElement('p');
        forcedCardStatus.textContent = lang.debug_next_draw(gameState.forcedNextCard.rank, gameState.forcedNextCard.suit);
        debugArea.appendChild(forcedCardStatus);
    }

    gameBoardElement.appendChild(debugArea);

    return gameBoardElement;
}
