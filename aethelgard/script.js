// This tells the browser we are using the Google AI SDK.
import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

// --- DOM Elements ----------------------------------------------------
const gameOutput = document.getElementById('game-output');
const playerInput = document.getElementById('player-input');
const submitBtn = document.getElementById('submit-btn');
const themeToggle = document.getElementById('theme-toggle');
const settingsBtn = document.getElementById('settings-btn');
const toast = document.getElementById('toast-notification');
const inventoryList = document.getElementById('inventory-list');

// API Key Modal
const apiKeyModal = document.getElementById('api-key-modal');
const apiKeyInput = document.getElementById('api-key-input');
const apiKeySubmitBtn = document.getElementById('api-key-submit-btn');
const clearApiKeyBtn = document.getElementById('clear-api-key');

// Settings Modal
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = settingsModal.querySelector('.modal-close-btn');
const saveBtn = document.getElementById('save-btn');
const loadBtn = document.getElementById('load-btn');
const resetBtn = document.getElementById('reset-btn');

// Reset Confirmation Modal
const confirmResetModal = document.getElementById('confirm-reset-modal');
const cancelResetBtn = document.getElementById('cancel-reset-btn');
const confirmResetBtn = document.getElementById('confirm-reset-btn');

// Load Confirmation Modal
const confirmLoadModal = document.getElementById('confirm-load-modal');
const cancelLoadBtn = document.getElementById('cancel-load-btn');
const confirmLoadBtn = document.getElementById('confirm-load-btn');

// Thematic loading messages based on player intent
const loadingMessages = {
    perception: ["Your eyes adjust to the details...", "A hidden truth brushes against your mind...", "The world reveals a secret...", "Focusing on the unseen...", "The patterns become clear..."],
    action: ["You commit to your course...", "The world shifts in response to your will...", "Fate's loom trembles...", "A breath held, a step taken...", "The die is cast..."],
    social: ["Choosing your words with care...", "The currents of conversation shift...", "A fragile trust is tested...", "You offer a piece of yourself...", "The air hangs heavy with unspoken words..."],
    magic: ["The Amulet hums in response...", "Weaving the threads of ethereal energy...", "The air crackles with latent power...", "A whisper on the edge of reality...", "The ancient forces stir..."],
    default: ["The world holds its breath...", "Consulting the celestial patterns...", "The ancient stones whisper...", "Time stretches and bends...", "Destiny considers your move..."]
};

const SCROLL_PADDING = 40;

// --- GAME MASTER PROMPT with Inventory Protocol ---
const GAME_MASTER_PROMPT = `
//-- GM DIRECTIVE --//
You are the Game Master (GM) and Narrator for "The Amulet of Aethelgard." Your purpose is to build an atmospheric world through clear and purposeful prose.

//-- TONE & PROSE PROTOCOL --//
Your narrative voice is evocative but disciplined. The goal is a natural, immersive reading experience.
1.  **Principle of Purposeful Description:** Every descriptive word should have a distinct purpose. Avoid using multiple adjectives that convey the same meaning. Prefer one strong adjective over two weak ones.
2.  **Sentence Rhythm:** Vary your sentence structure to create a smooth, natural flow.

//-- CORE GAMEPLAY LOOP --//
The game operates on a turn-based loop.
1.  **Describe the Scene:** Detail the environment and events.
2.  **Present Choices:** You MUST provide 2 to 4 options in the format: **A)** Choice text.
3.  **Handle Custom Input:** If the player types a custom action, narrate a logical outcome and then present a new set of choices.
4.  **Await Input:** Pause and wait for the player's response.
5.  **Narrate the Outcome:** Describe the result of the player's chosen option.

//-- INVENTORY PROTOCOL --//
1. You are responsible for tracking the player's inventory.
2. At the end of EVERY response where the player's inventory changes (they gain or lose an item), you MUST include a special inventory tag on a new line.
3. The format is critical: [INVENTORY: Item 1, Item 2, A Rusty Key]
4. If the inventory is empty, use [INVENTORY: Empty]
5. Only include this tag if the inventory has changed in that turn.

//-- WORLD KNOWLEDGE (GM EYES ONLY) --//
* **The 'Sundered Star':** A powerful crystal, the 'Nexus', that shattered.
* **The Amulet:** The player's amulet is the 'Heartwood Fragment,' the central piece.
* **The Amnesia:** The player was the Nexus's guardian. Its shattering destroyed their memory.
* **The Gloom:** A magical decay from the cataclysm site.

//-- INITIALIZATION --//
**Directive:** Begin the game. You awaken in a mossy hollow at the base of an ancient tree. The surrounding forest is dense, its shadows stretching long in the late afternoon light. Your mind is a quiet void, except for a single, persistent thought: *'The Sundered Star must be made whole.'* Your only possession is the amulet around your neck. Execute Act I.
[INVENTORY: Amulet of Aethelgard]
`;

// --- Game Logic ------------------------------------------------------
let chat;
let genAI;

function showToast(message) {
    toast.textContent = message;
    toast.classList.remove('hidden');
}

function reattachChoiceButtonListeners() {
    const buttons = gameOutput.querySelectorAll('.choice-btn:not([disabled])');
    buttons.forEach(button => {
        button.addEventListener('click', handleChoiceClick);
    });
}

function handleChoiceClick(event) {
    const button = event.target;
    const choiceLetter = button.dataset.choice;
    let choiceText = button.textContent.replace(/^[A-Z]\)\s*/, '').trim();

    // --- FIX ---
    // This new line removes any trailing punctuation (like a period) from the AI's choice.
    choiceText = choiceText.replace(/[.,;:]+$/, "");

    // The pronoun fix remains unchanged.
    choiceText = choiceText.replace(/\byou've\b/gi, "I've");
    choiceText = choiceText.replace(/\byou're\b/gi, "I'm");
    choiceText = choiceText.replace(/\byou are\b/gi, 'I am');
    choiceText = choiceText.replace(/\byourself\b/gi, 'myself');
    choiceText = choiceText.replace(/\byour\b/gi, 'my');
    
    choiceText = choiceText.charAt(0).toLowerCase() + choiceText.slice(1);

    const playerDisplayMessage = `I ${choiceText}...`;
    
    playerInput.value = choiceLetter;
    handlePlayerInput(playerDisplayMessage);

    const buttons = document.querySelectorAll('.choice-btn:not([disabled])');
    buttons.forEach(button => {
        button.disabled = true;
    });
}

// --- UPDATED addMessage Function ---
// This function now handles inventory parsing and choice button creation again.
function addMessage(text, sender) {
    if (sender === 'gamemaster') {
        // 1. Handle Inventory Parsing
        const inventoryRegex = /\[INVENTORY:\s*(.*?)\]/g;
        const inventoryMatch = text.match(inventoryRegex);
        if (inventoryMatch) {
            const lastMatch = inventoryMatch[inventoryMatch.length - 1];
            const items = lastMatch.replace('[INVENTORY:', '').replace(']', '').trim();
            inventoryList.textContent = items || "Empty";
        }
        const narrativeText = text.replace(inventoryRegex, '').trim();

        // 2. Handle Narrative and Choice Button Rendering
        const paragraphs = narrativeText.split('\n');
        let choiceContainer = null;
        let isFirstGMParagraph = true;

        paragraphs.forEach(paragraphText => {
            if (paragraphText.trim() === '') return;
            const choiceRegex = /^\s*\*\*([A-Z])\)\*\*(.*)/;
            const match = paragraphText.match(choiceRegex);

            if (match) {
                if (!choiceContainer) {
                    choiceContainer = document.createElement('div');
                    choiceContainer.classList.add('choice-container', 'fade-in');
                    gameOutput.appendChild(choiceContainer);
                }
                const button = document.createElement('button');
                button.classList.add('choice-btn');
                button.textContent = `${match[1]}) ${match[2].trim()}`;
                button.dataset.choice = match[1];
                button.addEventListener('click', handleChoiceClick);
                choiceContainer.appendChild(button);
            } else {
                choiceContainer = null; // A line of text resets the button group
                const p = document.createElement('p');
                p.classList.add('fade-in');
                if (isFirstGMParagraph) {
                    p.classList.add('gm-first-paragraph');
                    isFirstGMParagraph = false;
                }
                p.innerHTML = DOMPurify.sanitize(marked.parse(paragraphText));
                gameOutput.appendChild(p);
            }
        });
    } else {
        // This part handles player and system messages
        const p = document.createElement('p');
        if (sender === 'player') {
            p.textContent = `> ${text}`;
            p.classList.add('player-text', 'fade-in', 'turn-divider');
        } else if (sender === 'system') {
            p.innerHTML = text;
            p.classList.add('loading-text', 'fade-in');
        }
        gameOutput.appendChild(p);
    }
}

function getLoadingContext(inputText) {
    const lowerInput = inputText.toLowerCase();
    if (/\b(look|examine|inspect|observe|read|search)\b/.test(lowerInput)) return 'perception';
    if (/\b(talk|ask|speak|persuade|intimidate|greet)\b/.test(lowerInput)) return 'social';
    if (/\b(touch|use|activate|channel|focus|amulet|rune|magic)\b/.test(lowerInput)) return 'magic';
    if (/\b(go|move|walk|run|climb|open|take|attack)\b/.test(lowerInput)) return 'action';
    return 'default';
}

// --- REVERTED handlePlayerInput to non-streaming ---
async function handlePlayerInput(customDisplayText = null) {
    const inputText = playerInput.value.trim();
    if (inputText === '' || !chat) return;

    const displayMessage = customDisplayText || inputText;
    addMessage(displayMessage, 'player');
    const lastPlayerMessage = gameOutput.querySelector('.player-text:last-of-type');
    gameOutput.scrollTop = gameOutput.scrollHeight;
    playerInput.value = '';
    setLoadingState(true);

    const context = getLoadingContext(inputText);
    const messageList = loadingMessages[context] || loadingMessages.default;
    const randomIndex = Math.floor(Math.random() * messageList.length);
    const loader = document.createElement('div');
    loader.id = 'inline-loader';
    loader.className = 'fade-in';
    loader.innerHTML = `<p>${messageList[randomIndex]}</p>`;
    gameOutput.appendChild(loader);
    gameOutput.scrollTop = gameOutput.scrollHeight;

    try {
        const result = await chat.sendMessage(inputText);
        const response = result.response;
        
        loader.remove();
        addMessage(response.text(), 'gamemaster');
        
        if (lastPlayerMessage) {
            const desiredScrollPosition = lastPlayerMessage.offsetTop - SCROLL_PADDING;
            gameOutput.scrollTo({ top: desiredScrollPosition, behavior: 'smooth' });
        }

    } catch (error) {
        console.error("Error sending message:", error);
        addMessage("A strange force interferes with your connection...", 'system');
    } finally {
        const finalLoader = document.getElementById('inline-loader');
        if (finalLoader) finalLoader.remove();
        setLoadingState(false);
    }
}

function setLoadingState(isLoading) {
    playerInput.disabled = isLoading;
    submitBtn.disabled = isLoading;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isLoading && !isTouchDevice) {
        playerInput.focus();
    }
}

// --- REVERTED initializeAI to non-streaming ---
async function initializeAI(apiKey) {
    gameOutput.innerHTML = '';
    addMessage('Connecting to the ancient world...<br><span class="mini-loader"></span>', 'system');
    setLoadingState(true); 

    try {
        genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        chat = model.startChat({ history: [] });

        const result = await chat.sendMessage(GAME_MASTER_PROMPT);
        const response = result.response;

        gameOutput.innerHTML = ''; 
        addMessage(response.text(), 'gamemaster');
        setLoadingState(false);
        gameOutput.scrollTop = 0;

    } catch (error) {
        console.error("CRITICAL INITIALIZATION ERROR:", error);
        gameOutput.innerHTML = ''; 
        addMessage("Connection failed. The API key may be invalid or there could be a network issue.", 'system');
        setLoadingState(true);
        playerInput.placeholder = "Refresh to try again.";
    }
}

function submitApiKey() {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) return;
    localStorage.setItem('gemini-api-key', apiKey);
    apiKeyModal.style.display = 'none';
    initializeAI(apiKey);
}

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

// --- Event Listeners ---
submitBtn.addEventListener('click', () => handlePlayerInput());
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

settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
closeSettingsBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));

saveBtn.addEventListener('click', async () => {
    if (!chat) return;
    try {
        const history = await chat.getHistory();
        localStorage.setItem('savedGameHistory', JSON.stringify(history));
        localStorage.setItem('savedGameHTML', gameOutput.innerHTML);
        localStorage.setItem('savedInventory', inventoryList.textContent); // Save inventory
        showToast("Game Saved!");
    } catch (error) {
        console.error("Error saving game:", error);
        showToast("Could not save game.");
    }
    settingsModal.classList.add('hidden');
});

loadBtn.addEventListener('click', () => {
    if (!localStorage.getItem('savedGameHistory')) {
        showToast("No saved game found.");
        return;
    }
    settingsModal.classList.add('hidden');
    confirmLoadModal.classList.remove('hidden');
});

resetBtn.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
    confirmResetModal.classList.remove('hidden');
});

cancelLoadBtn.addEventListener('click', () => confirmLoadModal.classList.add('hidden'));

confirmLoadBtn.addEventListener('click', () => {
    const savedHistoryJSON = localStorage.getItem('savedGameHistory');
    const savedHTML = localStorage.getItem('savedGameHTML');
    const savedInventory = localStorage.getItem('savedInventory');
    const apiKey = localStorage.getItem('gemini-api-key');

    if (savedHistoryJSON && savedHTML && apiKey) {
        const savedHistory = JSON.parse(savedHistoryJSON);
        genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        chat = model.startChat({ history: savedHistory });
        
        gameOutput.innerHTML = savedHTML;
        inventoryList.textContent = savedInventory || "Empty"; // Load inventory
        reattachChoiceButtonListeners();
        gameOutput.scrollTop = gameOutput.scrollHeight;
        showToast("Game Loaded!");
    } else {
        showToast("Could not load game data.");
    }
    confirmLoadModal.classList.add('hidden');
});

cancelResetBtn.addEventListener('click', () => confirmResetModal.classList.add('hidden'));

confirmResetBtn.addEventListener('click', () => {
    confirmResetModal.classList.add('hidden');
    localStorage.removeItem('gemini-api-key');
    localStorage.removeItem('savedGameHistory');
    localStorage.removeItem('savedGameHTML');
    localStorage.removeItem('savedInventory'); // Clear inventory save
    location.reload();
});

// --- Start the game! ---
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);

    const savedApiKey = localStorage.getItem('gemini-api-key');
    if (savedApiKey) {
        apiKeyInput.value = savedApiKey;
        apiKeyModal.style.display = 'none';
        initializeAI(savedApiKey);
    } else {
        apiKeyModal.style.display = 'flex';
        apiKeyInput.focus();
    }

    document.body.classList.remove('loading');
});
