import random
from .game_state import GameState
from .melds import is_pierna, is_escalera
from .card import Card
from .constants import CARD_VALUES

def draw_from_deck(game: GameState):
    """Allows the current player to draw a card from the deck."""
    if game.turn_phase != 'draw':
        # Or raise an error for an illegal move
        return False

    if not game.deck:
        # If the deck is empty, shuffle the discard pile to create a new deck.
        if len(game.discard_pile) > 1:
            print("--- Deck is empty. Reshuffling discard pile. ---")
            # All but the top card of the discard pile become the new deck
            new_deck = game.discard_pile[:-1]
            random.shuffle(new_deck)
            game.deck = new_deck
            game.discard_pile = [game.discard_pile[-1]] # Keep the top card
        else:
            # Not enough cards in the discard pile to reshuffle. This is a stalemate.
            # In a real game, this might end the round. For the agent, it's a failed move.
            return False

    player = game.current_player
    player.hand.append(game.deck.pop())
    game.turn_phase = 'play'
    return True

def discard_card(game: GameState, card_index: int):
    """Discards a card from the player's hand and advances the turn."""
    if game.turn_phase != 'play':
        return False

    player = game.current_player
    if card_index < 0 or card_index >= len(player.hand):
        return False # Invalid index

    card_to_discard = player.hand.pop(card_index)
    game.discard_pile.append(card_to_discard)

    # Check if the player won
    if not player.hand:
        game.end_round(winner=player)
    else:
        # Advance to the next player and reset turn phase
        game.advance_to_next_player()
        game.turn_phase = 'draw'
    return True

def meld_cards(game: GameState, card_indices: list[int]):
    """Forms a meld from the selected cards in the player's hand."""
    if game.turn_phase != 'play':
        return False

    player = game.current_player
    if not card_indices or len(card_indices) < 3:
        return False

    selected_cards = [player.hand[i] for i in sorted(card_indices, reverse=True)]

    meld_type = None
    if is_pierna(selected_cards):
        meld_type = 'pierna'
    elif is_escalera(selected_cards):
        meld_type = 'escalera'

    if meld_type:
        game.melds.append({'type': meld_type, 'cards': selected_cards})
        # Remove cards from hand
        for index in sorted(card_indices, reverse=True):
            player.hand.pop(index)

        if not player.hand:
            game.end_round(winner=player)
        return True

    return False

def lay_off_card(game: GameState, card_index: int, meld_index: int):
    """Lays off a single card onto an existing meld."""
    if game.turn_phase != 'play' or not game.melds or meld_index >= len(game.melds):
        return False

    player = game.current_player
    if card_index >= len(player.hand):
        return False

    card_to_lay_off = player.hand[card_index]
    meld = game.melds[meld_index]

    # Check for laying off a Joker on an Escalera
    if meld['type'] == 'escalera' and card_to_lay_off.rank == 'Joker':
        if not any(c.rank == 'Joker' for c in meld['cards']):
            meld['cards'].append(card_to_lay_off)
            player.hand.pop(card_index)
            if not player.hand:
                game.end_round(winner=player)
            return True
        else:
            return False # Already has a joker

    # General case: check if the new combination is valid
    potential_new_meld = meld['cards'] + [card_to_lay_off]

    if meld['type'] == 'escalera' and is_escalera(potential_new_meld):
        meld['cards'] = potential_new_meld # Assuming sort_escalera would be called
        player.hand.pop(card_index)
        if not player.hand:
            game.end_round(winner=player)
        return True
    # Note: Pierna lay-off logic from JS was to discard, which is a separate action.
    # Here, we assume it extends the meld, which is not per the rules.
    # We will omit Pierna lay-offs for now to keep the rules accurate.

    return False
