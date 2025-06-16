from .deck import create_deck, shuffle_deck
from .card import Card
from typing import List, Optional
from .constants import CARD_VALUES

class Player:
    def __init__(self, player_id: int):
        self.id = player_id
        self.hand: List[Card] = []
        self.score = 0
        self.rounds_won = 0

    def calculate_hand_score(self) -> int:
        """Calculates the total point value of the player's hand."""
        return sum(CARD_VALUES.get(c.rank, 0) for c in self.hand)

class GameState:
    def __init__(self, num_players: int = 2):
        if not 2 <= num_players <= 5:
            raise ValueError("Loba must be played with 2 to 5 players.")

        self.deck = create_deck()
        shuffle_deck(self.deck)

        self.players = [Player(i + 1) for i in range(num_players)]

        # Deal 9 cards to each player
        for _ in range(9):
            for player in self.players:
                player.hand.append(self.deck.pop())

        self.discard_pile: List[Card] = [self.deck.pop()]

        self.melds = [] # Melds on the table
        self.current_player_idx = 0
        self.turn_phase = 'draw' # Can be 'draw' or 'play'
        self.winner: Optional[Player] = None

    @property
    def current_player(self) -> Player:
        return self.players[self.current_player_idx]

    def advance_to_next_player(self):
        self.current_player_idx = (self.current_player_idx + 1) % len(self.players)

    def end_round(self, winner: Player):
        """Ends the round, calculates scores, and sets the winner."""
        self.winner = winner
        winner.rounds_won += 1

        for p in self.players:
            if p.id != winner.id:
                p.score += p.calculate_hand_score()

        # In a real game, you'd check for game-over conditions here.
        # For the RL env, we'll just mark the round as over.
        self.turn_phase = 'round-over'
