from typing import List, Set
from .card import Card, JOKER

RANK_VALUES = {'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13}

def is_pierna(cards: List[Card]) -> bool:
    """
    Validates if a set of cards constitutes a valid "Pierna".
    """
    if len(cards) < 3:
        return False
    if any(c.rank == "Joker" for c in cards):
        return False

    first_rank = cards[0].rank
    if not all(c.rank == first_rank for c in cards):
        return False

    suits = {c.suit for c in cards}
    return len(suits) == 3

def _check_sequence(values: List[int], total_card_count: int) -> bool:
    if not values:
        return True
    min_val, max_val = min(values), max(values)
    return (max_val - min_val + 1) <= total_card_count

def is_escalera(cards: List[Card]) -> bool:
    """
    Validates if a set of cards constitutes a valid "Escalera".
    """
    if len(cards) < 3:
        return False

    jokers = [c for c in cards if c.rank == "Joker"]
    if len(jokers) > 1:
        return False

    regular_cards = [c for c in cards if c.rank != "Joker"]
    if not regular_cards:
        return False

    if len(regular_cards) < 2 and len(jokers) > 0:
        return True

    # Check for duplicate regular cards
    if len({c.rank for c in regular_cards}) != len(regular_cards):
        return False

    suit = regular_cards[0].suit
    if not all(c.suit == suit for c in regular_cards):
        return False

    values = sorted([RANK_VALUES[c.rank] for c in regular_cards])

    # Handle Ace high/low
    if 1 in values:  # Ace is present
        high_ace_values = sorted([14 if v == 1 else v for v in values])
        # Check for wrap-around (K-A-2), which is invalid
        is_wrap_around = 2 in high_ace_values and 13 in high_ace_values and 14 in high_ace_values
        if not is_wrap_around and _check_sequence(high_ace_values, len(cards)):
            return True

    return _check_sequence(values, len(cards))
