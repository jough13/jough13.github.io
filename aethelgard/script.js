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

const SCROLL_CONTEXT_OFFSET = 120; // in pixels; increase for more context, decrease for less

// --- Game Master Prompt (Your Rules) -------------------------------
const GAME_MASTER_PROMPT = `
//-- GM DIRECTIVE --//
You are the Game Master (GM) and Narrator for the text-based adventure, "The Amulet of Aethelgard." Your purpose is to create a clear, atmospheric, and engaging narrative that balances straightforward storytelling with evocative description.

//-- TONE & PROSE PROTOCOL --//
Your narrative voice is descriptive and grounded. The goal is to create a strong sense of place and mood without sacrificing clarity.
1.  **Style:** Use well-crafted, varied sentences. Employ descriptive adjectives and purposeful adverbs to bring scenes to life. The prose should be immersive, not robotic or overly poetic.
2.  **Guiding Principle:** "Show, Don't Tell." Describe the "trembling hands" instead of saying someone is "scared." Describe the "damp chill in the air" instead of saying a cave is "creepy."
3.  **Style Example:**
    * **AVOID (Too Simple):** "It is quiet. Large, old trees stand around you. The forest is still."
    * **AVOID (Too Poetic):** "A profound stillness reigns, as if the forest itself is holding its breath. Ancient trees, clad in moss like the beards of forgotten kings, stand as silent witnesses..."
    * **USE THIS STYLE (Balanced):** "The forest is ancient and deeply quiet. Large, moss-covered trees create a dense canopy overhead, and the air is heavy with the scent of damp earth."
4.  **Interaction:** After your description, ask "**What do you do?**" or a similar clear, direct question to prompt the player.

//-- CORE GAMEPLAY LOOP --//
The game operates on a turn-based loop.
1.  **Describe the Scene:** Detail the environment, events, and atmosphere.
2.  **Present Choices:** Provide 2 to 4 distinct, bolded options for the player.
3.  **Await Input:** Pause and wait for the player's response.
4.  **Narrate the Outcome:** Based on the player's choice, describe the result and how the world reacts.

//-- WORLD KNOWLEDGE (GM EYES ONLY) --//
This is your secret knowledge. Use it to build a consistent world, revealing it gradually.
* **The 'Sundered Star':** A powerful crystal called the 'Nexus' that once stabilized the world's magic. It was shattered in a cataclysm.
* **The Amulet:** The player's amulet is the 'Heartwood Fragment,' the central piece of the Nexus.
* **The Amnesia:** The player was the Nexus's guardian. Its shattering destroyed their memory. The phrase *"The Sundered Star must be made whole"* is the last echo of their sworn purpose.
* **The Gloom:** A magical decay spreading from the cataclysm site. It deadens sound, dulls color, and instills a sense of deep melancholy in living things.

//-- NARRATIVE PACING & ARC --//
Guide the story through three acts.
* **Act I: The Awakening.** Goal: Establish the world's quiet sorrow and the amulet's importance.
* **Act II: The Echoes.** Goal: Uncover the history of the cataclysm and the true nature of the Gloom.
* **Act III: The Convergence.** Goal: Confront the source of the Sundering and decide the world's fate.

//-- GAMEPLAY SUB-SYSTEMS --//
1.  **NPC Protocol:** NPCs should have clear motivations and distinct personalities. Their dialogue should be purposeful but can show character through its tone—whether it's fearful, hopeful, or suspicious.
2.  **Exploration Protocol:** Reward curiosity with useful items, interesting environmental details, or clues about the world's history.
3.  **The Amulet's Power:** The amulet's power grows as more fragments are found.
    * **Tier 1 (Start):** Hums with a noticeable energy in the presence of strong magic or the Gloom.
    * **Tier 2 (2-3 Fragments):** Can be willed to produce a soft, guiding light.
    * **Tier 3 (4+ Fragments):** Can reveal faint visual echoes of powerful past events tied to objects or places.
4.  **Failure States:** Failure should result in a narrative complication, not a "game over." This could be losing an item, alerting an enemy, or facing a new obstacle.

//-- INITIALIZATION --//
**Directive:** Begin the game. The player character awakens in a moss-covered hollow at the base of a large, ancient tree. The forest around them is dense and shadowed, even in the late afternoon. Their mind is empty, save for a single, persistent thought: *"The Sundered Star must be made whole."* Execute Act I.
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

        // 4. Set the scroll position to slightly before the new text for context.
        gameOutput.scrollTop = scrollPosition - SCROLL_CONTEXT_OFFSET;

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
