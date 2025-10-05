// This tells the browser we are using the Google AI SDK.
import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

// --- DOM Elements ----------------------------------------------------
const gameOutput = document.getElementById('game-output');
const playerInput = document.getElementById('player-input');
const submitBtn = document.getElementById('submit-btn');

// --- Game Master Prompt (Your Rules) -------------------------------
const GAME_MASTER_PROMPT = `
You are the game master and narrator for a text-based adventure game. I am the sole player. The setting is a mystical, high-fantasy world called "Aethelgard," filled with ancient magic, forgotten gods, mythical creatures, and perilous landscapes.

Begin by describing the immediate surroundings and my character's situation. My character awakens with no memory of their past, wearing simple, unfamiliar clothing, and possessing only a single, ornately carved wooden amulet that hums faintly with an unknown energy.

**Crucially, adhere to these rules throughout the game:**
// ... (Paste your full, detailed prompt here) ...
12. End Goal Hint: In the initial set up, allude to a greater purpose, even if my character is not yet aware. Perhaps this is a phrase muttered in their mind as they awake, a symbol visible, or a feeling.

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
