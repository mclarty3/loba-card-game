# Loba Card Game

This project aims to create a web-based application for playing the popular card game "Loba".

This is pretty much entirely a vibe-coding project, using cursor and Gemini 2.5 Pro.

## Project Goals

- Implement the complete game logic for "Loba de Menos" in JavaScript.
- Develop a user-friendly web interface for an intuitive gameplay experience.
- Support 2 to 5 players.
- Include two distinct game modes:
    - **For Puntos:** The traditional scoring method where the player with the lowest score at the end of the game wins.
    - **For Loba:** A mode where the player who wins the most rounds is declared the winner.

## Known Bug

- If Joker is in middle, it should not be allowed to be moved to outer edge to replace with a new card
  - E.g: 3 Joker 5 6 =/> 3 4 5 6 Joker (NOT ALLOWED)
- Sometimes AI takes two turns (if player clicks through UI too fast? unsure)
- AI pretty much always chooses to discard first card, bug in training behavior probably
  - Should probably never discard jokers?

## Running the Game Locally
Add comment
More actions

This project uses `serve` to run a local development server.

1.  **Clone the repository:**


    ```bash
    git clone <repository-url>

    cd loba-cardgame
    ```

2.  **Install dependencies:**


    ```bash
    npm install
    ```

3.  **Start the server:**


    ```bash
    npm start
    ```
4.  **Open the game:**


    Open your web browser and navigate to `http://localhost:3000/public`.


## Game Rules: Loba de Menos

### Objective

The primary goal is to be the first player to get rid of all your cards. The winner of the overall game is determined by the game mode selected at the beginning.

### Setup

- **Players:** 2-5
- **Deck:** Two standard 52-card decks plus four jokers (108 cards total).
- **Dealing:** Each player is dealt nine cards. The remaining deck is placed face-down to form the stock pile, and its top card is turned face-up to start the discard pile.

### Melds (Card Combinations)

Players get rid of cards by forming melds, which can be placed on the table.

- **Pierna (Set):** A group of three or more cards of the same rank, using cards from exactly three of the four suits. For example, a valid `pierna` could be ♥️7, ♠️7, ♣️7. You can add more 7s from these same three suits, but you cannot add a ♦️7.
- **Escalera (Run):** A sequence of three or more cards of the same suit. For example, ♦️5, ♦️6, ♦️7. Aces can be high (Q-K-A) or low (A-2-3), but not both at the same time (e.g., K-A-2 is not a valid run).

### Jokers

- Jokers are wild cards but can **only** be used in an `escalera`.
- A maximum of one joker is allowed per `escalera`.

### Gameplay

A player's turn consists of three main actions:

1.  **Draw:** Start your turn by drawing one card, either from the top of the face-down stock pile or the top of the face-up discard pile.
2.  **Meld (Optional):** If you have the required cards to form a valid `pierna` or `escalera`, you can lay them down on the table in front of you. You can also **lay off** cards by adding them to existing melds on the table (both your own and those of other players), but only after you have placed your first meld.
3.  **Discard:** End your turn by placing one card from your hand onto the discard pile.

### Ending a Round

A round concludes when one player successfully gets rid of all their cards by melding or discarding their final card.

### Winning the Game

There are two ways to determine the winner:

1.  **For Puntos (By Points):**
    - The player who ends the round scores 0 points.
    - All other players count the value of the cards remaining in their hands:
        - **Joker, Ace, King, Queen, Jack:** 10 points each.
        - **Number Cards (2-10):** Face value.
    - Points are accumulated across rounds. The player with the **lowest** total score at the end of a predetermined number of rounds wins.

2.  **For Loba (By Rounds):**
    - The player who ends the round wins that round.
    - The player who wins the **most** rounds after a predetermined number of rounds wins the game.
