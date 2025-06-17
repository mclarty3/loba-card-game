import { isPierna, isEscalera, sortEscalera, getRankValue, RANK_VALUES } from './melds.js';
import { calculateHandScore } from './scoring.js';
import { RANKS } from './deck.js';

/**
 * Allows the current player to draw a card from the top of the deck.
 * @param {object} gameState The current state of the game.
 * @returns {void} Modifies the gameState directly.
 */
export function drawFromDeck(gameState) {
    if (gameState.turnPhase !== 'draw') {
        console.log("You have already drawn a card this turn.");
        return;
    }

    // Clear any highlight from the previous turn
    gameState.recentlyDrawnCard = null;

    const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);
    if (!currentPlayer) return;

    if (gameState.deck.length > 0) {
        let drawnCard;

        if (gameState.forcedNextCard) {
            const forcedCard = gameState.forcedNextCard;
            const cardIndexInDeck = gameState.deck.findIndex(c => c.rank === forcedCard.rank && c.suit === forcedCard.suit);

            if (cardIndexInDeck > -1) {
                // Remove the specific card from the deck
                drawnCard = gameState.deck.splice(cardIndexInDeck, 1)[0];
                console.log(`Debug: Forced card ${drawnCard.rank} of ${drawnCard.suit} was drawn.`);
            } else {
                console.warn(`Debug: Forced card ${forcedCard.rank} of ${forcedCard.suit} not found in deck. Drawing from top instead.`);
                drawnCard = gameState.deck.pop();
            }
            gameState.forcedNextCard = null; // Reset after use
        } else {
            // Standard draw
            drawnCard = gameState.deck.pop();
        }

        currentPlayer.hand.push(drawnCard);
        gameState.turnPhase = 'play';
        // Highlight the drawn card
        gameState.recentlyDrawnCard = drawnCard;
    } else {
        console.warn("The deck is empty!");
    }
}

/**
 * Allows the current player to draw the top card from the discard pile,
 * provided they can immediately form a valid meld with it.
 * @param {object} gameState The current state of the game.
 * @returns {void} Modifies the gameState directly.
 */
export function drawFromDiscard(gameState) {
    if (gameState.turnPhase !== 'draw') {
        console.log("You have already drawn a card this turn.");
        return;
    }
    // Clear any highlight from the previous turn
    gameState.recentlyDrawnCard = null;
    const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);
    if (!currentPlayer || gameState.discardPile.length === 0) return;

    const topDiscard = gameState.discardPile[gameState.discardPile.length - 1];
    const potentialMeld = [...gameState.selectedCards, topDiscard];

    let meldType = null;
    if (isPierna(potentialMeld)) {
        meldType = 'pierna';
    } else if (isEscalera(potentialMeld)) {
        meldType = 'escalera';
    }

    if (meldType) {
        // It's a valid meld. Form it on the table automatically.
        const drawnCard = gameState.discardPile.pop();
        const potentialMeld = [...gameState.selectedCards, drawnCard];

        // Add the new meld to the table, sorting if it's an escalera
        const meldCards = meldType === 'escalera' ? sortEscalera(potentialMeld) : potentialMeld;
        gameState.melds.push({ type: meldType, cards: meldCards });

        // Remove the selected cards from the player's hand
        const selectedSet = new Set(gameState.selectedCards);
        currentPlayer.hand = currentPlayer.hand.filter(card => !selectedSet.has(card));

        console.log("Meld from discard successful!");

        // Clear selection and transition to the next phase
        gameState.selectedCards = [];
        gameState.turnPhase = 'play';
    } else {
        console.log("Invalid meld. Cannot take from discard pile.");
    }
}

/**
 * Attempts to form a meld from the current player's selected cards.
 * If successful, removes the cards from the player's hand and adds them
 * to the table's melds.
 * @param {object} gameState The current state of the game.
 */
export function meldSelectedCards(gameState) {
    if (gameState.turnPhase !== 'play') {
        console.log("You must draw a card before you can meld.");
        return;
    }
    const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);
    if (!currentPlayer || gameState.selectedCards.length < 3) return;

    const selected = gameState.selectedCards;
    let meldType = null;

    if (isPierna(selected)) {
        meldType = 'pierna';
    } else if (isEscalera(selected)) {
        meldType = 'escalera';
    }

    if (meldType) {
        // Add the new meld to the table, sorting if it's an escalera
        const meldCards = meldType === 'escalera' ? sortEscalera(selected) : selected;
        gameState.melds.push({ type: meldType, cards: meldCards });

        // Remove the cards from the player's hand
        const selectedSet = new Set(selected);
        currentPlayer.hand = currentPlayer.hand.filter(card => !selectedSet.has(card));

        // Clear the selection
        gameState.selectedCards = [];
        console.log("Meld successful!");

        // Check for round end
        if (currentPlayer.hand.length === 0) {
            endRound(gameState, currentPlayer);
        }
    } else {
        console.log("Invalid meld. The selected cards do not form a valid Pierna or Escalera.");
    }
}

/**
 * Lays off the player's selected cards onto an existing meld on the table.
 * @param {object} gameState The current state of the game.
 * @param {number} meldIndex The index of the meld on the table to lay off on.
 */
export function layOffCards(gameState, meldIndex) {
    if (gameState.turnPhase !== 'play') {
        console.log("You must draw a card first.");
        return;
    }

    const meldToAddTo = gameState.melds[meldIndex];
    const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);

    if (!meldToAddTo || !currentPlayer || gameState.selectedCards.length === 0) return;

    // --- Escalera Lay Off ---
    if (meldToAddTo.type === 'escalera') {
        const hasJoker = meldToAddTo.cards.some(c => c.rank === 'Joker');
        const suit = meldToAddTo.cards.find(c => c.rank !== 'Joker').suit;

        // If the meld has a joker, we need more specific logic
        if (hasJoker) {
            if (gameState.selectedCards.length !== 1) {
                console.log("Invalid lay off. Select one card.");
                return;
            }
            const cardToLayOff = gameState.selectedCards[0];
            if (cardToLayOff.rank === 'Joker') {
                console.log("Invalid move: Cannot lay off a Joker on a meld that already has one.");
                return;
            }
            if (cardToLayOff.suit !== suit) {
                console.log("Invalid lay off. Card suit must match.");
                return;
            }

            // Determine if the joker is in the middle by checking if the non-joker cards are NOT continuous.
            const nonJokerCards = meldToAddTo.cards.filter(c => c.rank !== 'Joker');
            const nonJokerRanks = nonJokerCards.map(c => RANK_VALUES[c.rank]).sort((a, b) => a - b);

            let jokerFillsRank = null;
            // Find the gap that the joker must be filling.
            for (let i = 0; i < nonJokerRanks.length - 1; i++) {
                if (nonJokerRanks[i + 1] - nonJokerRanks[i] === 2) {
                    jokerFillsRank = nonJokerRanks[i] + 1;
                    break;
                }
            }

            // Check for Ace-low case (e.g., A, 2, Joker, 4)
            if (jokerFillsRank === null && nonJokerRanks.includes(1) && nonJokerRanks.includes(2) && !nonJokerRanks.includes(3)) {
                // very specific case of A, 2, J, 4... joker must be 3.
            }


            const layOffRankValue = RANK_VALUES[cardToLayOff.rank];

            if (jokerFillsRank !== null && layOffRankValue === jokerFillsRank) {
                console.log("Invalid move: Cannot replace the Joker in the middle of a run.");
                return;
            }
        }


        const potentialNewMeld = [...meldToAddTo.cards, ...gameState.selectedCards];
        if (isEscalera(potentialNewMeld)) {
            // Replace the old meld with the new, sorted one
            meldToAddTo.cards = sortEscalera(potentialNewMeld);

            const selectedSet = new Set(gameState.selectedCards);
            currentPlayer.hand = currentPlayer.hand.filter(card => !selectedSet.has(card));
            gameState.selectedCards = [];
            console.log("Lay off to Escalera successful!");
            if (currentPlayer.hand.length === 0) endRound(gameState, currentPlayer);
        } else {
            console.log("Invalid lay off. Cards do not extend the Escalera correctly.");
        }
        return;
    }

    // --- Pierna Lay Off (Sopo/Tiro) ---
    if (meldToAddTo.type === 'pierna') {
        if (gameState.selectedCards.length !== 1) {
            console.log("You must select exactly one card to lay off on a Pierna.");
            return;
        }
        const cardToLayOff = gameState.selectedCards[0];
        const piernaRank = meldToAddTo.cards[0].rank;
        const piernaSuits = new Set(meldToAddTo.cards.map(c => c.suit));

        if (cardToLayOff.rank === piernaRank && piernaSuits.has(cardToLayOff.suit)) {
            // Card is valid. Move it from hand to discard pile.
            const cardIndex = currentPlayer.hand.findIndex(c => c.id === cardToLayOff.id);
            if (cardIndex > -1) {
                currentPlayer.hand.splice(cardIndex, 1);
                gameState.discardPile.push(cardToLayOff);
                gameState.selectedCards = [];
                console.log(`Successful lay off to Pierna (Sopo). Card moved to discard pile.`);

                // This action does NOT end the turn. The player must still discard.
                // We only check if their hand is empty, which would end the round.
                if (currentPlayer.hand.length === 0) {
                    endRound(gameState, currentPlayer);
                }
            }
        } else {
            console.log("Invalid lay off. Card must match the Pierna's rank and belong to one of its suits.");
        }
        return;
    }
}

/**
 * Handles the logic for ending a round, calculating scores, and setting the phase.
 * @param {object} gameState The current state of the game.
 * @param {object} winner The player object for the winner of the round.
 */
function endRound(gameState, winner) {
    console.log(`Player ${winner.id} has won the round!`);
    winner.roundsWon += 1;

    // Calculate scores for other players
    gameState.players.forEach(p => {
        if (p.id !== winner.id) {
            p.score += calculateHandScore(p.hand);
        }
    });

    console.log("Scores updated:", gameState.players.map(p => `Player ${p.id}: ${p.score}, Wins: ${p.roundsWon}`));

    // --- Game Over Check ---
    if (gameState.gameMode === 'puntos' && gameState.players.some(p => p.score >= gameState.gameSettings.maxScore)) {
        console.log("Game over: Score limit reached.");
        gameState.turnPhase = 'game-over';
    } else if (gameState.gameMode === 'loba' && winner.roundsWon >= gameState.gameSettings.maxRounds) {
        console.log("Game over: Round win limit reached.");
        gameState.turnPhase = 'game-over';
    } else {
        gameState.turnPhase = 'round-over';
    }
}

/**
 * Discards the single selected card from the player's hand to the discard pile
 * and advances the turn to the next player.
 * @param {object} gameState The current state of the game.
 */
export function discardCard(gameState) {
    if (gameState.turnPhase !== 'play') {
        console.log("You must draw a card before you can discard.");
        return;
    }
    if (gameState.selectedCards.length !== 1) {
        console.log("You must select exactly one card to discard.");
        return;
    }

    const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);
    const cardToDiscard = gameState.selectedCards[0];

    // Remove card from hand
    const cardIndex = currentPlayer.hand.findIndex(card => card.suit === cardToDiscard.suit && card.rank === cardToDiscard.rank);
    if (cardIndex > -1) {
        currentPlayer.hand.splice(cardIndex, 1);
    }

    // Add card to discard pile
    gameState.discardPile.push(cardToDiscard);

    // Clear selection
    gameState.selectedCards = [];

    // --- Round End Check ---
    if (currentPlayer.hand.length === 0) {
        endRound(gameState, currentPlayer);
    } else {
        // Clear highlight when turn ends
        gameState.recentlyDrawnCard = null;
        // Advance to the next player and reset the turn phase
        const currentPlayerIndex = gameState.players.findIndex(p => p.id === gameState.currentPlayerId);
        const nextPlayerIndex = (currentPlayerIndex + 1) % gameState.players.length;
        gameState.currentPlayerId = gameState.players[nextPlayerIndex].id;
        gameState.turnPhase = 'draw';
        console.log(`Player ${currentPlayer.id} discarded. It's now Player ${gameState.currentPlayerId}'s turn.`);
    }
}
