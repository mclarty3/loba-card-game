import os
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from stable_baselines3 import PPO

from loba_rl.loba_env import CARD_TO_INT, DECK_SIZE
from loba_rl.card import Card

# --- Initialize Flask App and Model ---
app = Flask(__name__)
CORS(app)  # Allow cross-origin requests

# Load the trained model
model_dir = "./rl_models/"
model_to_load = "ppo_loba_final.zip" # Choose your best model
model_path = os.path.join(model_dir, model_to_load)

try:
    model = PPO.load(model_path)
    print(f"Model {model_to_load} loaded successfully.")
except FileNotFoundError:
    print(f"Error: Model not found at {model_path}")
    model = None

# --- Helper Function ---
def state_to_observation(state_json):
    """Converts a JSON game state from the frontend into a NumPy observation."""
    player_hand = state_json.get('hand', [])
    discard_top_card = state_json.get('discard_top', None)
    table_melds = state_json.get('melds', [])

    # Create the observation dictionary
    hand_obs = np.zeros(DECK_SIZE, dtype=np.int8)
    for card in player_hand:
        # The JS card suit is lowercase, Python is capitalized.
        card_obj = Card(rank=card["rank"], suit=card["suit"].capitalize())
        card_int = CARD_TO_INT.get(card_obj, -1)
        if card_int != -1:
            hand_obs[card_int] = 1

    discard_top_obs = 0
    if discard_top_card:
        card_obj = Card(rank=discard_top_card["rank"], suit=discard_top_card["suit"].capitalize())
        discard_top_obs = CARD_TO_INT.get(card_obj, -1) + 1

    melds_obs = np.zeros(DECK_SIZE, dtype=np.int8)
    for meld in table_melds:
        for card in meld.get('cards', []):
            card_obj = Card(rank=card["rank"], suit=card["suit"].capitalize())
            card_int = CARD_TO_INT.get(card_obj, -1)
            if card_int != -1:
                melds_obs[card_int] = 1

    turn_phase_obs = 0 if state_json.get('turn_phase') == 'draw' else 1

    return {
        "hand": hand_obs, "discard_top": discard_top_obs,
        "melds": melds_obs, "turn_phase": turn_phase_obs
    }

# --- API Endpoint ---
@app.route('/get-move', methods=['POST'])
def get_move():
    if not model:
        return jsonify({"error": "Model not loaded"}), 500

    state_json = request.json
    observation = state_to_observation(state_json)

    # Get the action from the model
    action, _ = model.predict(observation, deterministic=True)

    # Convert NumPy array to a standard Python list for JSON serialization
    action_list = [int(a) for a in action]

    return jsonify({"action": action_list})

if __name__ == '__main__':
    # Runs the Flask app on port 5001 to avoid conflicts with other common ports
    app.run(port=5001, debug=True)
