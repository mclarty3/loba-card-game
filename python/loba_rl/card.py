from dataclasses import dataclass

SUITS = ["Hearts", "Diamonds", "Clubs", "Spades"]
RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]

@dataclass(frozen=True)
class Card:
    """
    Represents a single playing card.
    The dataclass is frozen to make Card objects immutable.
    """
    rank: str
    suit: str

    def __str__(self):
        return f"{self.rank} of {self.suit}"

    def __repr__(self):
        return f"Card(rank='{self.rank}', suit='{self.suit}')"

# Define the Joker as a special instance or a separate class if it has unique behavior.
# For now, we can represent it with a special rank and suit.
JOKER = Card(rank="Joker", suit="Joker")
