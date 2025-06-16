import { isPierna, isEscalera } from './melds.js';
import { drawFromDeck, drawFromDiscard, meldSelectedCards, discardCard, layOffCards } from './actions.js';
import { calculateHandScore } from './scoring.js';

const API_URL = "http://localhost:5001/get-move";

const DELAY_MS = 1000;
const delay = ms => new Promise(res => setTimeout(res, ms));

export async function getModelMove(gameState) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(gameState),
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.action;

    } catch (error) {
        console.error("Error calling RL model API:", error);
        // As a fallback, if the API fails, discard the first card.
        return [2, 0];
    }
}

/**
 * Finds all possible melds (Piernas and Escaleras) in a given hand.
 * @param {Array<object>} hand The hand of cards to search for melds.
 * @returns {object} An object containing arrays of possible 'piernas' and 'escaleras'.
 */
function findPossibleMelds(hand) {
    const piernas = [];
    const escaleras = [];

    // Helper to generate combinations of a specific size from an array
    function getCombinations(arr, size) {
        const result = [];
        const f = (start, combo) => {
            if (combo.length === size) {
                result.push(combo);
                return;
            }
            for (let i = start; i < arr.length; i++) {
                f(i + 1, [...combo, arr[i]]);
            }
        };
        f(0, []);
        return result;
    }

    // --- Find Piernas ---
    const cardsByRank = hand.reduce((acc, card) => {
        if (card.rank !== 'Joker') {
            acc[card.rank] = acc[card.rank] || [];
            acc[card.rank].push(card);
        }
        return acc;
    }, {});

    for (const rank in cardsByRank) {
        if (cardsByRank[rank].length >= 3) {
            // Check all 3-card combinations for a valid pierna
            const combinations = getCombinations(cardsByRank[rank], 3);
            for (const combo of combinations) {
                if (isPierna(combo)) {
                    piernas.push(combo);
                    // If a valid pierna is found, we can also check for 4-card versions
                    const remaining = cardsByRank[rank].filter(c => !combo.includes(c));
                    if (remaining.length > 0) {
                        // A 4th card of the same rank from one of the existing suits is valid
                        const comboSuits = new Set(combo.map(c => c.suit));
                        if (comboSuits.has(remaining[0].suit)) {
                            piernas.push([...combo, remaining[0]]);
                        }
                    }
                }
            }
        }
    }

    // --- Find Escaleras ---
    const jokers = hand.filter(c => c.rank === 'Joker');
    const cardsBySuit = hand.reduce((acc, card) => {
        if (card.rank !== 'Joker') {
            acc[card.suit] = acc[card.suit] || [];
            acc[card.suit].push(card);
        }
        return acc;
    }, {});

    for (const suit in cardsBySuit) {
        const suitCards = cardsBySuit[suit];
        if (suitCards.length < 2 && jokers.length === 0) continue;

        // Try all combinations of cards within the suit
        for (let size = 3; size <= suitCards.length + jokers.length; size++) {
            if (size > suitCards.length && (size - suitCards.length) > jokers.length) continue;

            const cardCombos = getCombinations(suitCards, size - (jokers.length > 0 ? 1 : 0));
            for (const combo of cardCombos) {
                if (isEscalera(combo)) {
                    escaleras.push(combo);
                }
                if (jokers.length > 0 && isEscalera([...combo, ...jokers.slice(0, 1)])) {
                    escaleras.push([...combo, ...jokers.slice(0, 1)]);
                }
            }
        }
    }


    return { piernas, escaleras };
}

export async function playAITurn(gameState, renderCallback) {
    const aiPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);
    if (!aiPlayer) return;

    // --- 1. DRAW PHASE ---
    const topDiscard = gameState.discardPile[gameState.discardPile.length - 1];
    let drawnFromDiscard = false;

    if (topDiscard) {
        const potentialHand = [...aiPlayer.hand, topDiscard];
        const { piernas, escaleras } = findPossibleMelds(potentialHand);
        const allMelds = [...piernas, ...escaleras];
        const meldUsingDiscard = allMelds.find(meld => meld.includes(topDiscard));

        if (meldUsingDiscard) {
            console.log(`AI ${aiPlayer.id} sees a meld with the discard card.`);
            // Select the cards from hand for the meld
            gameState.selectedCards = meldUsingDiscard.filter(card => card !== topDiscard);
            drawFromDiscard(gameState);
            drawnFromDiscard = true;
        }
    }

    if (!drawnFromDiscard) {
        console.log(`AI ${aiPlayer.id} draws from the deck.`);
        drawFromDeck(gameState);
    }

    renderCallback();
    await delay(DELAY_MS);

    // --- 2. MELD PHASE ---
    let melded = true;
    while (melded) {
        const { piernas, escaleras } = findPossibleMelds(aiPlayer.hand);
        const allMelds = [...piernas, ...escaleras];

        if (allMelds.length > 0) {
            // For simplicity, just play the first found meld
            const meldToPlay = allMelds[0];
            // Make sure the AI doesn't try to meld cards it doesn't have
            const cardInHand = meldToPlay.every(c => aiPlayer.hand.some(h => h.rank === c.rank && h.suit === c.suit));
            if (!cardInHand) {
                melded = false;
                continue;
            }

            gameState.selectedCards = meldToPlay;
            console.log(`AI ${aiPlayer.id} is melding:`, meldToPlay.map(c => c.rank + (c.suit || '')));
            meldSelectedCards(gameState);
            melded = true;
            renderCallback();
            await delay(DELAY_MS);
        } else {
            melded = false;
        }
    }

    // --- 2.5. LAY OFF PHASE ---
    let laidOff = true;
    while (laidOff) {
        laidOff = false;
        for (let i = 0; i < gameState.melds.length; i++) {
            const meld = gameState.melds[i];
            for (const card of aiPlayer.hand) {
                const potentialNewMeldCards = [...meld.cards, card];
                let isValidLayOff = false;
                if (meld.type === 'escalera' && isEscalera(potentialNewMeldCards)) {
                    isValidLayOff = true;
                } else if (meld.type === 'pierna') {
                    // For pierna, the logic in actions.js moves the card to discard pile.
                    // We can simulate this check.
                    const piernaRank = meld.cards[0].rank;
                    const piernaSuits = new Set(meld.cards.map(c => c.suit));
                    if (card.rank === piernaRank && piernaSuits.has(card.suit)) {
                        isValidLayOff = true;
                    }
                }

                if (isValidLayOff) {
                    console.log(`AI ${aiPlayer.id} is laying off ${card.rank}${card.suit} on meld ${i}`);
                    gameState.selectedCards = [card];
                    layOffCards(gameState, i);
                    laidOff = true;
                    renderCallback();
                    await delay(DELAY_MS);
                    break; // break from card loop
                }
            }
            if (laidOff) break; // break from meld loop
        }
    }


    // --- 3. DISCARD PHASE ---
    if (aiPlayer.hand.length > 0) {
        let cardToDiscard = getBestCardToDiscard(aiPlayer.hand);

        console.log(`AI ${aiPlayer.id} is discarding:`, cardToDiscard.rank + (cardToDiscard.suit || ''));
        gameState.selectedCards = [cardToDiscard];
        discardCard(gameState);
        renderCallback();
    }
}

function getBestCardToDiscard(hand) {
    let bestCardToDiscard = hand[0];
    let minDesirability = Infinity;

    const { piernas, escaleras } = findPossibleMelds(hand);
    const meldCards = new Set([...piernas.flat(), ...escaleras.flat()]);

    for (const card of hand) {
        let desirability = 0;

        // 1. Penalize high-value cards
        desirability -= calculateHandScore([card]);

        // 2. Reward cards that are part of a meld
        if (meldCards.has(card)) {
            desirability += 10;
        }

        // 3. Reward cards that could form a run
        const suitMates = hand.filter(c => c.suit === card.suit && c !== card);
        for (const mate of suitMates) {
            const rankDiff = Math.abs(getRankValue(card) - getRankValue(mate));
            if (rankDiff > 0 && rankDiff < 3) {
                desirability += (5 - rankDiff); // Closer cards get a higher bonus
            }
        }

        if (desirability < minDesirability) {
            minDesirability = desirability;
            bestCardToDiscard = card;
        }
    }

    return bestCardToDiscard;
}

function getRankValue(card) {
    const RANK_VALUES = { 'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13 };
    return RANK_VALUES[card.rank] || 0;
}
