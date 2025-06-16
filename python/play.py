import os
from loba_rl.loba_env import LobaEnv
from stable_baselines3 import PPO

def main():
    """
    This script loads a trained agent and has it play a game of Loba.
    You can specify which checkpoint to load, e.g., "ppo_loba_model_200000_steps.zip"
    """
    env = LobaEnv()

    model_dir = "./rl_models/"
    # Load the latest model by default, or specify a checkpoint.
    # model_to_load = "ppo_loba_model_200000_steps.zip"
    model_to_load = "ppo_loba_final.zip"

    model_path = os.path.join(model_dir, model_to_load)

    try:
        model = PPO.load(model_path)
    except FileNotFoundError:
        print(f"Error: Model not found at {model_path}")
        print("Please run train.py to train and save a model first.")
        return

    print(f"--- Starting Game with Agent: {model_to_load} ---")
    obs, info = env.reset()

    terminated = False
    total_reward = 0

    # We add a step counter to prevent true infinite loops in case of bugs
    for step in range(1000):
        env.render()

        # The agent chooses an action based on the observation
        action, _states = model.predict(obs, deterministic=False)

        print(f"Agent chose action: {action}")

        obs, reward, terminated, truncated, info = env.step(action)

        total_reward += reward

        if terminated or truncated:
            print("--- Game Over ---")
            env.render()
            break

    print(f"Total reward: {total_reward}")
    env.close()

if __name__ == "__main__":
    main()
