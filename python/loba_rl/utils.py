from itertools import combinations
from typing import List, Dict

from .card import Card
from .melds import is_pierna, is_escalera

def find_all_melds(hand: List[Card]) -> Dict[str, List[List[Card]]]:
    """
    Finds all possible meld combinations (piernas and escaleras) in a given hand.

    Returns:
        A dictionary with 'piernas' and 'escaleras' as keys and lists of
        card combinations as values.
    """
    piernas = []
    escaleras = []

    # Iterate over all possible combination sizes (from 3 to hand size)
    for r in range(3, len(hand) + 1):
        # Generate all combinations of that size
        for combo in combinations(hand, r):
            combo_list = list(combo)
            if is_pierna(combo_list):
                piernas.append(combo_list)
            elif is_escalera(combo_list):
                escaleras.append(combo_list)

    # To avoid melds that are subsets of larger melds (e.g., a 3-card run within a 4-card run)
    # we can add filtering logic here if needed, but for now this is a good start.

    return {"piernas": piernas, "escaleras": escaleras}
