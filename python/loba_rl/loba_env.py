import gymnasium as gym
from gymnasium import spaces
import numpy as np
from itertools import combinations

from .game_state import GameState
from . import actions
from .card import Card, SUITS, RANKS, JOKER
from .constants import CARD_VALUES
from .utils import find_all_melds

# Create a unique ID for each card in a full Loba deck (108 cards)
UNIQUE_CARDS = [Card(r, s) for _ in range(2) for s in SUITS for r in RANKS] + [JOKER] * 4
CARD_TO_INT = {card: i for i, card in enumerate(UNIQUE_CARDS)}
INT_TO_CARD = {i: card for i, card in enumerate(UNIQUE_CARDS)}
DECK_SIZE = len(UNIQUE_CARDS)

# Constants for the action space
MAX_HAND_SIZE = 15 # A safe upper bound

class LobaEnv(gym.Env):
    """A Gymnasium environment for the Loba card game."""

    metadata = {'render_modes': ['human']}

    def __init__(self, num_players=2):
        super().__init__()
        self.num_players = num_players
        self.game = GameState(num_players=self.num_players)

        # Define action and observation spaces
        # These must be gym.spaces objects
        # Example: spaces.Discrete(N) for N discrete actions
        # Example: spaces.Box(low=0, high=1, shape=(3,), dtype=np.float32) for continuous actions

        # Observation Space
        self.observation_space = spaces.Dict({
            # Multi-binary representation of the player's hand
            "hand": spaces.MultiBinary(DECK_SIZE),
            # Top card of the discard pile (0 if empty)
            "discard_top": spaces.Discrete(DECK_SIZE + 1),
            # A flattened representation of all cards in melds
            "melds": spaces.MultiBinary(DECK_SIZE),
            # Whose turn it is
            "turn_phase": spaces.Discrete(2) # 0 for draw, 1 for play
        })

        # Simplified Action Space
        self.action_space = spaces.MultiDiscrete([
            3,              # Action Type: 0:Draw, 1:Meld, 2:Discard
            MAX_HAND_SIZE,  # Card index for discarding
        ])

    def _get_obs(self):
        player = self.game.current_player

        hand_obs = np.zeros(DECK_SIZE, dtype=np.int8)
        for card in player.hand:
            hand_obs[CARD_TO_INT[card]] = 1

        discard_top_obs = CARD_TO_INT[self.game.discard_pile[-1]] + 1 if self.game.discard_pile else 0

        melds_obs = np.zeros(DECK_SIZE, dtype=np.int8)
        for meld in self.game.melds:
            for card in meld['cards']:
                melds_obs[CARD_TO_INT[card]] = 1

        turn_phase_obs = 0 if self.game.turn_phase == 'draw' else 1

        return {
            "hand": hand_obs, "discard_top": discard_top_obs,
            "melds": melds_obs, "turn_phase": turn_phase_obs
        }

    def _get_info(self):
        # Return auxiliary diagnostic information (helpful for debugging)
        return {"player_hand_size": len(self.game.current_player.hand), "discard_top": self.game.discard_pile[-1]}

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)
        self.game = GameState(num_players=self.num_players)
        return self._get_obs(), {}

    def step(self, action):
        action_type, card_idx = action

        player = self.game.current_player
        reward = -0.1 # Small penalty for taking a turn, to encourage efficiency
        success = False

        if self.game.turn_phase == 'draw':
            # As before, we can force the draw action.
            success = actions.draw_from_deck(self.game)

        elif self.game.turn_phase == 'play':
            if action_type == 1: # Meld
                all_melds = find_all_melds(player.hand)
                possible_melds = all_melds['piernas'] + all_melds['escaleras']
                if possible_melds:
                    # For now, just play the first found meld.
                    meld_to_play = possible_melds[0]
                    # Get indices of the cards to meld
                    card_indices = [player.hand.index(c) for c in meld_to_play]
                    success = actions.meld_cards(self.game, card_indices)
                    if success:
                        # The reward is the value of the cards removed from the hand.
                        # This incentivizes playing high-value melds.
                        meld_score = sum(CARD_VALUES.get(c.rank, 0) for c in meld_to_play)
                        reward += meld_score

            elif action_type == 2: # Discard
                if card_idx < len(player.hand):
                    success = actions.discard_card(self.game, card_idx)

        terminated = self.game.winner is not None
        if terminated:
            reward += 100 if self.game.winner == player else -100

        observation = self._get_obs()
        return observation, reward, terminated, False, {}

    def action_masks(self) -> list[np.ndarray]:
        player = self.game.current_player

        # 1. Action Type Mask
        can_draw = self.game.turn_phase == 'draw'
        can_play = self.game.turn_phase == 'play'

        # Check if a valid meld exists
        all_melds = find_all_melds(player.hand)
        can_meld = can_play and bool(all_melds['piernas'] or all_melds['escaleras'])

        action_type_mask = np.array([
            can_draw,   # 0: Draw
            can_meld,   # 1: Meld
            can_play,   # 2: Discard
        ])

        # 2. Card Index Mask (only used for discarding)
        card_mask = np.zeros(MAX_HAND_SIZE, dtype=bool)
        if can_play and player.hand:
            card_mask[:len(player.hand)] = True

        return [action_type_mask, card_mask]

    def render(self):
        """Prints a human-readable representation of the current state."""
        print("\n" + "="*30)
        print(f"Player {self.game.current_player.id}'s Turn (Phase: {self.game.turn_phase})")
        print("="*30)

        print("Hand:")
        for i, card in enumerate(self.game.current_player.hand):
            print(f"  [{i}] {card}")

        print("\nMelds on Table:")
        if not self.game.melds:
            print("  (None)")
        for i, meld in enumerate(self.game.melds):
            meld_str = ", ".join(str(c) for c in meld['cards'])
            print(f"  [{i}] {meld['type'].capitalize()}: {meld_str}")

        print("\nDiscard Pile Top:")
        if not self.game.discard_pile:
            print("  (Empty)")
        else:
            print(f"  {self.game.discard_pile[-1]}")
        print("="*30 + "\n")
