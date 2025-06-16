export const es = {
    // General
    language_label: 'Idioma',

    // Game Status
    game_over: (winnerId) => `¡Fin del juego! ¡El jugador ${winnerId} gana la partida!`,
    round_over: (winnerId) => `¡Fin de la ronda! El jugador ${winnerId} ganó.`,
    player_turn: (playerId, phase) => `Turno del jugador ${playerId}: ${phase}`,
    draw_phase: 'Levantá una carta',
    meld_phase: 'Bajar o descartar',

    // Player Info
    player_hand_title: (playerId) => `Mano del Jugador ${playerId}`,
    score: 'Puntaje',
    rounds_won: 'Rondas Ganadas',

    // Buttons
    new_game: 'Empezar Nuevo Juego',
    next_round: 'Siguiente Ronda',
    meld: 'Bajar Cartas Seleccionadas',
    discard: 'Descartar Carta Seleccionada',

    // Piles
    deck: 'Mazo',
    discard_pile: 'Descarte',

    // Debug
    debug_controls: 'Controles de Depuración:',
    debug_rank_placeholder: 'Rango (ej. A, 7)',
    debug_suit_placeholder: 'Palo (corazones)',
    debug_set_card: 'Fijar Siguiente Carta',
    debug_next_draw: (rank, suit) => `Siguiente robo: ${rank} de ${suit}`,
};
