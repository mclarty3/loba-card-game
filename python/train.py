import os
from loba_rl.loba_env import LobaEnv
from stable_baselines3 import PPO
from stable_baselines3.common.callbacks import CheckpointCallback

def main():
    """
    This script trains a PPO agent on the Loba environment.
    """

    # Create directories for logs and models
    log_dir = "./loba_tensorboard_logs/"
    model_dir = "./rl_models/"
    os.makedirs(log_dir, exist_ok=True)
    os.makedirs(model_dir, exist_ok=True)

    env = LobaEnv()

    # Callback for saving models
    checkpoint_callback = CheckpointCallback(
        save_freq=50000,
        save_path=model_dir,
        name_prefix="ppo_loba_model"
    )

    # Set up the model with a linearly decaying learning rate
    model = PPO(
        "MultiInputPolicy",
        env,
        verbose=1,
        tensorboard_log=log_dir,
        learning_rate=lambda f: 0.0003 * f # Linearly decay from 0.0003 to 0
    )

    # Train the agent
    print("--- Starting Training ---")
    # The 'tb_log_name' will create a subdirectory for this specific run
    model.learn(
        total_timesteps=300000,
        tb_log_name="PPO_Loba_ScheduledLR",
        callback=checkpoint_callback
    )
    print("--- Training Finished ---")

    # Save the final agent
    final_model_path = os.path.join(model_dir, "ppo_loba_final.zip")
    model.save(final_model_path)
    print(f"Final model saved to {final_model_path}")

    env.close()

if __name__ == "__main__":
    main()
