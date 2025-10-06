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
const clearApiKeyBtn = document.getElementById('clear-api-key');

// Loading Screen DOM Elements
const loadingOverlay = document.getElementById('loading-overlay');
const loadingText = document.getElementById('loading-text');

// Thematic loading messages
const loadingMessages = [
    "The Amulet hums in response...",
    "Whispers echo from the ancient stones...",
    "Weaving the threads of fate...",
    "The world holds its breath...",
    "Consulting the celestial patterns..."
];

// --- Game Master Prompt (Your Rules) -------------------------------
const GAME_MASTER_PROMPT = `
You are the game master and narrator for a text-based adventure game. I am the sole player. The setting is a mystical, high-fantasy world called "Aethelgard," filled with ancient magic, forgotten gods, mythical creatures, and perilous landscapes.

Begin by describing the immediate surroundings and my character's situation. My character awakens with no memory of their past, wearing simple, unfamiliar clothing, and possessing only a single, ornately carved wooden amulet that hums faintly with an unknown energy.

**Crucially, adhere to these rules throughout the game:**

1.  **Immersive Detail:** Provide richly detailed descriptions of the environment, characters, and events. Use evocative language to engage all five senses (sight, sound, smell, touch, and even taste where appropriate).
2.  **Player Agency:** After each description, present me with at least two distinct choices of action. Frame these choices clearly, using phrases like "**What do you do?**" and formatting options with bold letters (e.g., "**A)** ..."). Do NOT proceed until I make a choice. My input solely determines the next step.
3.  **Consequences:** My choices have meaningful consequences. Good choices might lead to rewards, clues, or progress. Poor choices might lead to danger, setbacks, or even death (though allow for opportunities to recover from mistakes – don't instantly end the game on a single bad choice).
4.  **Mystical Elements:** Weave in elements of magic, prophecy, and ancient lore throughout the game. The amulet should be a recurring element, potentially with hidden powers or significance.
5.  **Dynamic World:** The world should feel alive. NPCs should have their own motivations and reactions. The environment itself can be an obstacle or an ally.
6.  **Combat System (Simple):** If combat occurs, use a very simple system. Describe the attack and my options (e.g., "**A)** Attack with your fists **B)** Try to dodge"). Then, based on my choice, describe the outcome narratively (e.g., "Your blow lands, staggering the goblin!" or "You narrowly avoid the goblin's rusty blade!"). Don't use numerical stats or dice rolls. Focus on descriptive action.
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
 * Appends a message to the game output without controlling the scroll.
 * @param {string} text The message text.
 * @param {string} sender 'gamemaster', 'player', or 'system'.
 */
function addMessage(text, sender) {
    if (sender === 'gamemaster') {
        text.split('\n').forEach(paragraphText => {
            if (paragraphText.trim() === '') return;
            const paragraph = document.createElement('p');
            const unsafeHtml = marked.parse(paragraphText);
            const safeHtml = DOMPurify.sanitize(unsafeHtml);
            paragraph.innerHTML = safeHtml;
            gameOutput.appendChild(paragraph);
        });
    } else {
        const p = document.createElement('p');
        p.textContent = text;
        if (sender === 'player') p.className = 'player-text';
        else if (sender === 'system') p.className = 'loading-text';
        gameOutput.appendChild(p);
    }
}

/**
 * Shows the loading overlay with a dynamic, random message.
 */
function showLoadingScreen() {
    const randomIndex = Math.floor(Math.random() * loadingMessages.length);
    loadingText.textContent = loadingMessages[randomIndex];
    loadingOverlay.classList.remove('hidden');
    // This line forces the browser to repaint, ensuring the animation starts.
    void loadingOverlay.offsetHeight;
}

/**
 * Hides the loading overlay.
 */
function hideLoadingScreen() {
    loadingOverlay.classList.add('hidden');
}

/**
 * Handles sending the player's message to the Gemini API.
 */
async function handlePlayerInput() {
    const inputText = playerInput.value.trim();
    if (inputText === '' || !chat) return;

    // 1. Add player's text and scroll to the absolute bottom to keep the input in view.
    addMessage(`> ${inputText}`, 'player');
    gameOutput.scrollTop = gameOutput.scrollHeight;

    playerInput.value = '';
    setLoadingState(true);
    showLoadingScreen();

    try {
        // 2. BEFORE getting the API response, get the current height. This marks the top of the new content.
        const scrollPosition = gameOutput.scrollHeight;

        const result = await chat.sendMessage(inputText);
        const response = result.response;

        // 3. Add the new prose from the API.
        addMessage(response.text(), 'gamemaster');

        // 4. Set the scroll position to the spot we saved, bringing the user to the start of the new text.
        gameOutput.scrollTop = scrollPosition;

    } catch (error) {
        console.error("Error sending message:", error);
        addMessage("A strange force interferes with your connection... Please try again.", 'system');
        // If there's an error, scroll to the bottom to make sure the error message is visible.
        gameOutput.scrollTop = gameOutput.scrollHeight;
    } finally {
        hideLoadingScreen();
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
 * @param {string} apiKey The user-provided API key.
 */
async function initializeAI(apiKey) {
    showLoadingScreen();
    // Clear any previous game text
    gameOutput.innerHTML = '';

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" }); 

        chat = model.startChat({ history: [] });

        const result = await chat.sendMessage(GAME_MASTER_PROMPT);
        const response = result.response;
        addMessage(response.text(), 'gamemaster');

        setLoadingState(false);
        
        // Force the scroll window to the top after setup is complete.
        gameOutput.scrollTop = 0;

    } catch (error) {
        console.error("Initialization Error:", error);
        // If init fails, re-show the modal for a new key
        apiKeyModal.classList.remove('hidden');
        addMessage("The cipher was incorrect or the connection failed. Please check your API key and try again.", 'system');
    } finally {
        hideLoadingScreen();
    }
}

/**
 * Handles the submission of the API key from the modal.
 */
function submitApiKey() {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) return;
    
    localStorage.setItem('gemini-api-key', apiKey);
    
    apiKeyModal.classList.add('hidden');
    initializeAI(apiKey);
}

// --- Theme Toggle Logic ---
function applyTheme(theme) {
    if (theme === 'light') {
        document.body.classList.add('light-mode');
        themeToggle.textContent = '☀️';
    } else {
        document.body.classList.remove('light-mode');
        themeToggle.textContent = '🌙';
    }
}

function toggleTheme() {
    const isLight = document.body.classList.contains('light-mode');
    const newTheme = isLight ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
}

// --- Event Listeners -----------------------------------------------
submitBtn.addEventListener('click', handlePlayerInput);
playerInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') handlePlayerInput();
});

themeToggle.addEventListener('click', toggleTheme);

apiKeySubmitBtn.addEventListener('click', submitApiKey);
apiKeyInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') submitApiKey();
});

clearApiKeyBtn.addEventListener('click', () => {
    localStorage.removeItem('gemini-api-key');
    apiKeyInput.value = '';
    apiKeyInput.placeholder = 'Key cleared. Please enter a new one.';
    apiKeyInput.focus();
});

// --- Start the game! -----------------------------------------------
// Apply saved theme on load
const savedTheme = localStorage.getItem('theme') || 'dark';
applyTheme(savedTheme);

// ALWAYS show the modal, but pre-fill the key if it exists.
const savedApiKey = localStorage.getItem('gemini-api-key');
if (savedApiKey) {
    apiKeyInput.value = savedApiKey;
}
apiKeyModal.classList.remove('hidden');
apiKeyInput.focus();
