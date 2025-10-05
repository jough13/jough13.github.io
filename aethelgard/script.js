// This tells the browser we are using the Google AI SDK.
import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

// --- DOM Elements ----------------------------------------------------
const gameOutput = document.getElementById('game-output');
const playerInput = document.getElementById('player-input');
const submitBtn = document.getElementById('submit-btn');

// --- Game Master Prompt (Your Rules) -------------------------------
const GAME_MASTER_PROMPT = `
You are the game master and narrator for a text-based adventure game.  I am the sole player. The setting is a mystical, high-fantasy world called "Aethelgard," filled with ancient magic, forgotten gods, mythical creatures, and perilous landscapes.

Begin by describing the immediate surroundings and my character's situation.  My character awakens with no memory of their past, wearing simple, unfamiliar clothing, and possessing only a single, ornately carved wooden amulet that hums faintly with an unknown energy.

**Crucially, adhere to these rules throughout the game:**

1.  **Immersive Detail:** Provide richly detailed descriptions of the environment, characters, and events. Use evocative language to engage all five senses (sight, sound, smell, touch, and even taste where appropriate).
2.  **Player Agency:** After each description, present me with at least two distinct choices of action. Frame these choices clearly, using phrases like "What do you do? A) ... B) ...". Do NOT proceed until I make a choice. My input solely determines the next step.
3.  **Consequences:** My choices have meaningful consequences. Good choices might lead to rewards, clues, or progress. Poor choices might lead to danger, setbacks, or even death (though allow for opportunities to recover from mistakes – don't instantly end the game on a single bad choice).
4.  **Mystical Elements:** Weave in elements of magic, prophecy, and ancient lore throughout the game. The amulet should be a recurring element, potentially with hidden powers or significance.
5.  **Dynamic World:** The world should feel alive. NPCs should have their own motivations and reactions. The environment itself can be an obstacle or an ally.
6.  **Combat System (Simple):** If combat occurs, use a very simple system. Describe the attack and my options (e.g., "A) Attack with your fists B) Try to dodge"). Then, based on my choice, describe the outcome narratively (e.g., "Your blow lands, staggering the goblin!" or "You narrowly avoid the goblin's rusty blade!"). Don't use numerical stats or dice rolls. Focus on descriptive action.
7.  **Inventory (Simple):** Keep track of any significant items I find. Mention them when relevant. Don't use a complex inventory system, just narratively incorporate found items into the story.
8.  **Character Progression (Subtle):** While not strictly stat-based, hint at my character growing in skill or knowledge as the game progresses through your descriptions (e.g., "You feel more confident in your ability to handle yourself after that encounter").
9. **No Meta-Gaming:** Do not break character. Do not refer to yourself as an AI or LLM. Stay entirely within the role of game master.
10. **Mystery and Intrigue:** Maintain an air of mystery and intrigue. Don't reveal everything at once. The goal is to draw me into the world and make me want to explore and uncover its secrets. Specifically, my character's lost memory is a key element to be gradually revealed through gameplay.
11. **Open-Ended:** While there should be overarching mysteries (like the amulet and my character's past), allow for open-ended exploration and avoid a strictly linear path.
12. **End Goal Hint:** In the initial set up, allude to a greater purpose, even if my character is not yet aware. Perhaps this is a phrase muttered in their mind as they awake, a symbol visible, or a feeling.

Begin the game!

Key improvements in this prompt:
 * Explicit Roles: Clearly defines the LLM's role (game master/narrator) and your role (player).
 * Detailed Setting: Provides a specific fantasy setting ("Aethelgard") with key elements to inspire the LLM.
 * Intriguing Starting Point: The amnesiac protagonist with a mysterious amulet immediately creates a compelling hook.
 * Comprehensive Rules: The numbered list provides clear and detailed instructions on how the LLM should behave, ensuring a consistent and engaging game experience.  These rules cover immersion, player choice, consequences, and the specific fantasy elements desired.
 * Simple Systems: The prompt outlines simplified combat and inventory systems, keeping the focus on narrative description rather than complex mechanics.
 * Character Progression: Includes subtle character progression to give a sense of accomplishment.
 * No Meta-Gaming: Explicitly prohibits the LLM from breaking character.
 * Mystery and Intrigue: Emphasizes the importance of maintaining a sense of mystery.
 * Open-Endedness: Encourages non-linear gameplay and exploration.
 * End Goal Hint: Provides a suggestion to make sure a more cohesive story arises.
 * "Begin the game!": A clear call to action.
This prompt is designed to be very specific and guiding, minimizing the chances of the LLM going off-track and maximizing the chances of a truly immersive and enjoyable text adventure. It balances structure with creative freedom, allowing the LLM to build a compelling world while still adhering to the core principles of a good text-based adventure.
`;

// --- Game Logic ------------------------------------------------------
let chat; // This will hold our chat session

/**
 * Appends a message to the game output and scrolls to the bottom.
 * @param {string} text The message text.
 * @param {string} sender 'gamemaster', 'player', or 'system'.
 */
function addMessage(text, sender) {
    const p = document.createElement('p');
    p.textContent = text;
    if (sender === 'player') {
        p.className = 'player-text';
    } else if (sender === 'system') {
        p.className = 'loading-text';
    }
    gameOutput.appendChild(p);
    gameOutput.scrollTop = gameOutput.scrollHeight; // Auto-scroll
}

/**
 * Handles sending the player's message to the Gemini API.
 */
async function handlePlayerInput() {
    const inputText = playerInput.value.trim();
    if (inputText === '' || !chat) return;

    // Display player's action
    addMessage(`> ${inputText}`, 'player');
    playerInput.value = '';

    // Disable input while waiting for the AI
    setLoadingState(true);
    addMessage('Aethelgard responds...', 'system');
    
    try {
        const result = await chat.sendMessage(inputText);
        const response = result.response;
        const text = response.text();
        addMessage(text, 'gamemaster');
    } catch (error) {
        console.error("Error sending message:", error);
        addMessage("A strange force interferes with your connection... Please try again.", 'system');
    } finally {
        // Re-enable input
        setLoadingState(false);
    }
}

/**
 * Toggles the UI between loading and interactive states.
 * @param {boolean} isLoading
 */
function setLoadingState(isLoading) {
    playerInput.disabled = isLoading;
    submitBtn.disabled = isLoading;
    if (!isLoading) {
        playerInput.focus();
    }
}

/**
 * Initializes the game and the AI model.
 */
async function startGame() {
    // ⚠️ IMPORTANT: This is for local development only.
    // Do not expose your API key in client-side code in production.
    const API_KEY = window.prompt("Please enter your Google AI API Key:");
    if (!API_KEY) {
        addMessage("API Key not provided. The world of Aethelgard cannot be loaded.", 'system');
        return;
    }

    addMessage("Connecting to the world of Aethelgard...", 'system');
    
    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
        chat = model.startChat({ history: [] });

        // Kick off the game with the main prompt
        const result = await chat.sendMessage(GAME_MASTER_PROMPT);
        const response = result.response;
        const text = response.text();
        addMessage(text, 'gamemaster');

        setLoadingState(false); // Enable input for the player
    } catch (error) {
        console.error("Initialization Error:", error);
        addMessage("Failed to initialize the game. Please check your API key and refresh the page.", 'system');
    }
}

// --- Event Listeners -----------------------------------------------
submitBtn.addEventListener('click', handlePlayerInput);
playerInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        handlePlayerInput();
    }
});

// --- Start the game! -----------------------------------------------
startGame();
