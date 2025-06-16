// This file will be replaced with logic to call the Python RL model's API.

const API_URL = "http://localhost:5001/get-move";

export async function getModelMove(gameState) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(gameState),
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.action;

    } catch (error) {
        console.error("Error calling RL model API:", error);
        // As a fallback, if the API fails, discard the first card.
        return [2, 0];
    }
}
