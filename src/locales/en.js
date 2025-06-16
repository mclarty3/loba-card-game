export const en = {
    // General
    language_label: 'Language',

    // Game Status
    game_over: (winnerId) => `Game Over! Player ${winnerId} wins the game!`,
    round_over: (winnerId) => `Round Over! Player ${winnerId} won.`,
    player_turn: (playerId, phase) => `Player ${playerId}'s Turn: ${phase}`,
    draw_phase: 'Draw a card',
    meld_phase: 'Meld or discard',

    // Player Info
    player_hand_title: (playerId) => `Player ${playerId}'s Hand`,
    score: 'Score',
    rounds_won: 'Rounds Won',

    // Buttons
    new_game: 'Start New Game',
    next_round: 'Start Next Round',
    meld: 'Meld Selected Cards',
    discard: 'Discard Selected Card',

    // Piles
    deck: 'Deck',
    discard_pile: 'Discard',

    // Debug
    debug_controls: 'Debug Controls:',
    debug_rank_placeholder: 'Rank (e.g., A, 7)',
    debug_suit_placeholder: 'Suit (hearts)',
    debug_set_card: 'Set Next Card',
    debug_next_draw: (rank, suit) => `Next draw: ${rank} of ${suit}`,
};
