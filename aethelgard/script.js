// This tells the browser we are using the Google AI SDK.
import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

// --- DOM Elements ----------------------------------------------------
const gameOutput = document.getElementById('game-output');
const playerInput = document.getElementById('player-input');
const submitBtn = document.getElementById('submit-btn');
const themeToggle = document.getElementById('theme-toggle');

// Modal DOM Elements
const apiKeyModal = document.getElementById('api-key-modal');
const apiKeyInput = document.getElementById('api-key-input');
const apiKeySubmitBtn = document.getElementById('api-key-submit-btn');

// --- Game Master Prompt (Your Rules) -------------------------------
const GAME_MASTER_PROMPT = `
You are the game master and narrator for a text-based adventure game. I am the sole player. The setting is a mystical, high-fantasy world called "Aethelgard," filled with ancient magic, forgotten gods, mythical creatures, and perilous landscapes.

Begin by describing the immediate surroundings and my character's situation. My character awakens with no memory of their past, wearing simple, unfamiliar clothing, and possessing only a single, ornately carved wooden amulet that hums faintly with an unknown energy.

**Crucially, adhere to these rules throughout the game:**

1.  **Immersive Detail:** Provide richly detailed descriptions of the environment, characters, and events. Use evocative language to engage all five senses (sight, sound, smell, touch, and even taste where appropriate).
2.  **Player Agency:** After each description, present me with at least two distinct choices of action. Frame these choices clearly, using phrases like "What do you do? A) ... B) ...". Do NOT proceed until I make a choice. My input solely determines the next step.
3.  **Consequences:** My choices have meaningful consequences. Good choices might lead to rewards, clues, or progress. Poor choices might lead to danger, setbacks, or even death (though allow for opportunities to recover from mistakes – don't instantly end the game on a single bad choice).
4.  **Mystical Elements:** Weave in elements of magic, prophecy, and ancient lore throughout the game. The amulet should be a recurring element, potentially with hidden powers or significance.
5.  **Dynamic World:** The world should feel alive. NPCs should have their own motivations and reactions. The environment itself can be an obstacle or an ally.
6.  **Combat System (Simple):** If combat occurs, use a very simple system. Describe the attack and my options (e.g., "A) Attack with your fists B) Try to dodge"). Then, based on my choice, describe the outcome narratively (e.g., "Your blow lands, staggering the goblin!" or "You narrowly avoid the goblin's rusty blade!"). Don't use numerical stats or dice rolls. Focus on descriptive action.
7.  **Inventory (Simple):** Keep track of any significant items I find. Mention them when relevant. Don't use a complex inventory system, just narratively incorporate found items into the story.
8.  **Character Progression (Subtle):** While not strictly stat-based, hint at my character growing in skill or knowledge as the game progresses through your descriptions (e.g., "You feel more confident in your ability to handle yourself after that encounter").
9.  **No Meta-Gaming:** Do not break character. Do not refer to yourself as an AI or LLM. Stay entirely within the role of game master.
10. **Mystery and Intrigue:** Maintain an air of mystery and intrigue. Don't reveal everything at once. The goal is to draw me into the world and make me want to explore and uncover its secrets. Specifically, my character's lost memory is a key element to be gradually revealed through gameplay.
11. **Open-Ended:** While there should be overarching mysteries (like the amulet and my character's past), allow for open-ended exploration and avoid a strictly linear path.
12. **End Goal Hint:** In the initial set up, allude to a greater purpose, even if my character is not yet aware. Perhaps this is a phrase muttered in their mind as they awake, a symbol visible, or a feeling.

Begin the game!
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

    addMessage(`> ${inputText}`, 'player');
    playerInput.value = '';

    setLoadingState(true);
    addMessage('The Amulet hums in response...', 'system');
    
    try {
        const result = await chat.sendMessage(inputText);
        const response = result.response;
        const text = response.text();
        addMessage(text, 'gamemaster');
    } catch (error) {
        console.error("Error sending message:", error);
        addMessage("A strange force interferes with your connection... Please try again.", 'system');
    } finally {
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
 * Initializes the AI model and starts the game narrative.
 * This is now separate from the initial page load.
 * @param {string} apiKey The user-provided API key.
 */
async function initializeAI(apiKey) {
    addMessage("Connecting to the world of The Amulet...", 'system');
    
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
        chat = model.startChat({ history: [] });

        const result = await chat.sendMessage(GAME_MASTER_PROMPT);
        const response = result.response;
        const text = response.text();
        addMessage(text, 'gamemaster');

        setLoadingState(false);
    } catch (error) {
        console.error("Initialization Error:", error);
        addMessage("The cipher was incorrect or the connection failed. Please check your API key and refresh the page to try again.", 'system');
    }
}

/**
 * Handles the submission of the API key from the modal.
 */
function submitApiKey() {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        // You could add a visual shake or an error message here later
        return; 
    }
    
    // Hide the modal and start the game
    apiKeyModal.classList.add('hidden');
    initializeAI(apiKey);
}

// --- Theme Toggle Logic ---
/**
 * Applies a theme by adding/removing a class from the body.
 * @param {string} theme The theme to apply ('light' or 'dark').
 */
function applyTheme(theme) {
    if (theme === 'light') {
        document.body.classList.add('light-mode');
        themeToggle.textContent = '☀️';
    } else {
        document.body.classList.remove('light-mode');
        themeToggle.textContent = '🌙';
    }
}

/**
 * Toggles the theme and saves the preference to localStorage.
 */
function toggleTheme() {
    const isLight = document.body.classList.contains('light-mode');
    const newTheme = isLight ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
}

// --- Event Listeners -----------------------------------------------
// Game input listeners
submitBtn.addEventListener('click', handlePlayerInput);
playerInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        handlePlayerInput();
    }
});

// Theme toggle listener
themeToggle.addEventListener('click', toggleTheme);

// Modal input listeners
apiKeySubmitBtn.addEventListener('click', submitApiKey);
apiKeyInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        submitApiKey();
    }
});

// --- Start the game! -----------------------------------------------
// The page starts by making the modal visible and focusing the input.
apiKeyModal.classList.remove('hidden');
apiKeyInput.focus();

// Apply saved theme on load
const savedTheme = localStorage.getItem('theme') || 'dark';
applyTheme(savedTheme);
