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
const clearApiKeyBtn = document.getElementById('clear-api-key'); // NEW

// --- Game Master Prompt (Your Rules) -------------------------------
const GAME_MASTER_PROMPT = `
// ... (Your full, detailed prompt goes here) ...
Begin the game!
`;

// --- Game Logic ------------------------------------------------------
let chat; // This will hold our chat session
let loadingInterval; // For the loading animation

/**
 * Appends a message to the game output and scrolls to the bottom.
 * Splits gamemaster messages into multiple paragraphs.
 * @param {string} text The message text.
 * @param {string} sender 'gamemaster', 'player', or 'system'.
 * @returns {HTMLElement} The created paragraph element (for system messages).
 */
function addMessage(text, sender) {
    let p; // Keep p in scope to return it
    if (sender === 'gamemaster') {
        text.split('\n').forEach(paragraphText => {
            if (paragraphText.trim() === '') return;
            const paragraph = document.createElement('p');
            paragraph.textContent = paragraphText;
            gameOutput.appendChild(paragraph);
        });
    } else {
        p = document.createElement('p');
        p.textContent = text;
        if (sender === 'player') {
            p.className = 'player-text';
        } else if (sender === 'system') {
            p.className = 'loading-text';
        }
        gameOutput.appendChild(p);
    }
    gameOutput.scrollTop = gameOutput.scrollHeight;
    return p;
}

/**
 * Starts a simple "..." animation on a given element.
 * @param {HTMLElement} element The text element to animate.
 */
function startLoadingAnimation(element) {
    stopLoadingAnimation();
    const baseText = element.textContent;
    let dots = 1;
    loadingInterval = setInterval(() => {
        element.textContent = baseText + '.'.repeat(dots);
        dots = (dots % 3) + 1;
    }, 400);
}

/**
 * Stops the loading animation.
 */
function stopLoadingAnimation() {
    clearInterval(loadingInterval);
    loadingInterval = null;
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
    const loadingMessage = addMessage('The Amulet hums in response', 'system');
    startLoadingAnimation(loadingMessage);

    try {
        const result = await chat.sendMessage(inputText);
        const response = result.response;
        addMessage(response.text(), 'gamemaster');
    } catch (error) {
        console.error("Error sending message:", error);
        addMessage("A strange force interferes with your connection... Please try again.", 'system');
    } finally {
        stopLoadingAnimation();
        loadingMessage.remove();
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
    const loadingMessage = addMessage("Connecting to the world of The Amulet", 'system');
    startLoadingAnimation(loadingMessage);

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" }); 

        chat = model.startChat({ history: [] });

        const result = await chat.sendMessage(GAME_MASTER_PROMPT);
        const response = result.response;
        addMessage(response.text(), 'gamemaster');

        setLoadingState(false);
    } catch (error) {
        console.error("Initialization Error:", error);
        addMessage("The cipher was incorrect or the connection failed. Please check your API key and refresh the page to try again.", 'system');
    } finally {
        stopLoadingAnimation();
        loadingMessage.remove();
    }
}

/**
 * Handles the submission of the API key from the modal.
 */
function submitApiKey() {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) return;
    
    // NEW: Save the key to localStorage
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

// NEW: Event listener for the clear key button
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

// NEW: Check for a saved API key on load
const savedApiKey = localStorage.getItem('gemini-api-key');
if (savedApiKey) {
    // If a key exists, hide the modal and start the game immediately
    apiKeyModal.classList.add('hidden');
    initializeAI(savedApiKey);
} else {
    // If no key, show the modal
    apiKeyModal.classList.remove('hidden');
    apiKeyInput.focus();
}
