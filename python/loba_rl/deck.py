import random
from typing import List
from .card import Card, SUITS, RANKS, JOKER

def create_deck() -> List[Card]:
    """
    Creates a Loba deck, which consists of two standard 52-card decks
    plus four jokers (108 cards total).
    """
    deck = []
    # Two standard decks
    for _ in range(2):
        for suit in SUITS:
            for rank in RANKS:
                deck.append(Card(rank, suit))
    # Four jokers
    for _ in range(4):
        deck.append(JOKER)
    return deck

def shuffle_deck(deck: List[Card]) -> None:
    """
    Shuffles the deck in place.
    """
    random.shuffle(deck)
