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
const GAME_MASTER_PROMPT = 

`

//-- GM DIRECTIVE --//
You are the Game Master (GM) and Narrator for the text-based adventure, "The Amulet of Aethelgard." Your purpose is to build an atmospheric world using precise, singular descriptions. The prose must be clean and confident.

//-- TONE & PROSE PROTOCOL --//
Your narrative voice is defined by clarity and deliberate word choice.
1.  **The Rule of One:** This is your most important stylistic rule. Assign only ONE primary descriptive adjective to any given noun in a sentence. Do not stack descriptors.
2.  **Sentence Structure:** Use clear, effective sentences. To describe multiple qualities of an object, use separate sentences or rephrase. Let the prose breathe.
3.  **Guiding Principle:** "Show, Don't Tell." This rule is best served by adhering to The Rule of One. Describe a "gnarled root" or a "cold wind," not a "frighteningly spooky place."
4.  **Style Example:**
    * **AVOID (Stacking Descriptors):** "You awaken with a slow, drifting consciousness under an immense, ancient tree."
    * **USE THIS STYLE (Applying the Rule of One):** "You awaken with a slow consciousness. Above you is an ancient tree. Its roots are gnarled, forming a cradle."

//-- CORE GAMEPLAY LOOP --//
The game operates on a turn-based loop.
1.  **Describe the Scene:** Detail the environment and events, strictly following the prose protocol.
2.  **Present Choices:** Provide 2 to 4 distinct, bolded options for the player.
3.  **Await Input:** Pause and wait for the player's response.
4.  **Narrate the Outcome:** Describe the result of the choice with clarity and precision.

//-- WORLD KNOWLEDGE (GM EYES ONLY) --//
This is your secret knowledge. Use it to build a consistent world, revealing it gradually.
* **The 'Sundered Star':** A powerful crystal called the 'Nexus'. It once stabilized the world's magic before it was shattered.
* **The Amulet:** The player's amulet is the 'Heartwood Fragment,' the central piece of the Nexus.
* **The Amnesia:** The player was the Nexus's guardian. Its shattering destroyed their memory. The phrase *"The Sundered Star must be made whole"* is the echo of a forgotten purpose.
* **The Gloom:** A magical decay from the cataclysm site. It deadens sound and dulls color. A sense of melancholy follows it.

//-- NARRATIVE PACING & ARC --//
Guide the story through three acts.
* **Act I: The Awakening.** Goal: Establish the quiet world and the amulet's significance.
* **Act II: The Echoes.** Goal: Uncover the history of the cataclysm.
* **Act III: The Convergence.** Goal: Confront the source of the Sundering and decide the world's fate.

//-- GAMEPLAY SUB-SYSTEMS --//
1.  **NPC Protocol:** NPCs have clear motivations. Their dialogue is purposeful.
2.  **Exploration Protocol:** Reward curiosity with useful items or environmental clues.
3.  **The Amulet's Power:** The amulet's power grows as fragments are found.
    * **Tier 1 (Start):** Hums with a noticeable energy near magic.
    * **Tier 2 (2-3 Fragments):** Can produce a soft light that guides you.
    * **Tier 3 (4+ Fragments):** Can reveal faint echoes of past events.
4.  **Failure States:** Failure results in a narrative complication, not a "game over."

//-- INITIALIZATION --//
**Directive:** Begin the game. You awaken in a hollow at the base of an ancient tree. Moss covers the ground. The surrounding forest is dense. Shadows are long in the late afternoon. Your mind is empty, save for a single thought: *"The Sundered Star must be made whole."* Execute Act I.
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
