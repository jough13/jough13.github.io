// This file no longer needs the Google AI SDK, as all AI calls happen on the server.

// --- DOM Elements ----------------------------------------------------
const gameOutput = document.getElementById('game-output');
const playerInput = document.getElementById('player-input');
const submitBtn = document.getElementById('submit-btn');
const themeToggle = document.getElementById('theme-toggle');
const settingsBtn = document.getElementById('settings-btn');
const toast = document.getElementById('toast-notification');

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

// --- Game Constants ----------------------------------------------------
const actionPhrases = [
    "I decide to", "I choose to", "I am going to", "I'll try to", "My next move is to", "I will"
];

const loadingMessages = {
    perception: ["Your eyes adjust to the details...", "A hidden truth brushes against your mind...", "The world reveals a secret..."],
    action: ["You commit to your course...", "The world shifts in response to your will...", "Fate's loom trembles..."],
    social: ["Choosing your words with care...", "The currents of conversation shift...", "A fragile trust is tested..."],
    magic: ["The Amulet hums in response...", "Weaving the threads of ethereal energy...", "The air crackles with latent power..."],
    default: ["The world holds its breath...", "Consulting the celestial patterns...", "Destiny considers your move..."]
};

const SCROLL_PADDING = 40;
const GAME_MASTER_PROMPT = `
//-- GM DIRECTIVE --//
You are the Game Master (GM) and Narrator for "The Amulet of Aethelgard." Your purpose is to build an atmospheric world through clear and purposeful prose.

//-- TONE & PROSE PROTOCOL --//
Your narrative voice is evocative but disciplined. The goal is a natural, immersive reading experience.
1.  **Principle of Purposeful Description:** This is your core style guide. Every descriptive word should have a distinct purpose.
    * Avoid using multiple adjectives that convey the same meaning (e.g., "the huge, massive rock").
    * Using two distinct descriptors is allowed, but should be done with intention, not as a default (e.g., "a tall, slender tree" is good; "an immense, ancient tree" is pushing the limit).
    * Prefer one strong adjective over two weak ones.
2.  **Sentence Rhythm:** Vary your sentence structure to create a smooth, natural flow. Avoid both long, complex sentences and a long series of short, simple ones.
3.  **Style Example:**
    * **AVOID (Too Sparse):** "You awaken in a hollow. An ancient tree is above you. The forest is dense."
    * **AVOID (Too Rich):** "You awaken with a slow, drifting consciousness under an immense, ancient tree with gnarled, twisting roots."
    * **USE THIS STYLE (Balanced):** "You awaken in a mossy hollow at the base of an ancient tree. The surrounding forest is dense, its shadows stretching long in the afternoon light."

//-- CORE GAMEPLAY LOOP --//
The game operates on a turn-based loop.
1.  **Describe the Scene:** Detail the environment and events, following the prose protocol.
2.  **Present Choices:** This is a critical instruction. You MUST provide 2 to 4 options. Each option must be on its own new line.
    * **The correct format is:** **A)** Choice text here.
    * The letter (e.g., A, B, C) and the closing parenthesis ')' must be enclosed together in double asterisks.
    * Use a parenthesis ')', not a period '.'.
    * Avoid other formats like using single asterisks or no asterisks at all.
3.  **Handle Custom Input:** The player may occasionally type a custom action instead of choosing an option. If they do, you must:
    a. Narrate a logical, brief outcome for their custom action.
    b. If the action is impossible or nonsensical, state that clearly but gently (e.g., "You try to lift the boulder, but it is far too heavy.").
    c. After narrating the outcome of their action, you MUST present a new set of choices to guide the story forward. This is essential to keep the game moving.
4.  **Await Input:** Pause and wait for the player's response.
5.  **Narrate the Outcome:** Describe the result of the player's chosen option with clarity.

//-- WORLD KNOWLEDGE (GM EYES ONLY) --//
This is your secret knowledge. Use it to build a consistent world, revealing it gradually.
* **The 'Sundered Star':** A powerful crystal called the 'Nexus' that once stabilized the world's magic before it was shattered.
* **The Amulet:** The player's amulet is the 'Heartwood Fragment,' the central piece of the Nexus.
* **The Amnesia:** The player was the Nexus's guardian. Its shattering destroyed their memory. The phrase *"The Sundered Star must be made whole"* is the echo of a forgotten purpose.
* **The Gloom:** A magical decay from the cataclysm site. It deadens sound and dulls color. A sense of deep melancholy follows it.

//-- NARRATIVE PACING & ARC --//
Guide the story through three acts.
* **Act I: The Awakening.** Goal: Establish the quiet world and the amulet's significance.
* **Act II: The Echoes.** Goal: Uncover the history of the cataclysm.
* **Act III: The Convergence.** Goal: Confront the source of the Sundering and decide the world's fate.

//-- GAMEPLAY SUB-SYSTEMS --//
1.  **NPC Protocol:** NPCs have clear motivations. Their dialogue is purposeful and reflects their personality.
2.  **Exploration Protocol:** Reward curiosity with useful items or interesting environmental clues.
3.  **The Amulet's Power:** The amulet's power grows as fragments are found.
    * **Tier 1 (Start):** Hums with a noticeable energy near magic.
    * **Tier 2 (2-3 Fragments):** Can produce a soft light that guides you.
    * **Tier 3 (4+ Fragments):** Can reveal faint echoes of past events.
4.  **Failure States:** Failure results in a narrative complication, not a "game over."

//-- INITIALIZATION --//
**Directive:** Begin the game. You awaken in a mossy hollow at the base of an ancient tree. The surrounding forest is dense, its shadows stretching long in the late afternoon light. Your mind is a quiet void, except for a single, persistent thought: *'The Sundered Star must be made whole.'* Execute Act I.
`;

// --- Game Logic ------------------------------------------------------
let gameHistory = []; // The entire game state is now stored in this array.

// Helper function for toast notifications
function showToast(message) {
    toast.textContent = message;
    toast.classList.remove('hidden');
    // The animation will hide it automatically after it finishes
}

// Re-attaches listeners to choice buttons after loading a game
function reattachChoiceButtonListeners() {
    const buttons = gameOutput.querySelectorAll('.choice-btn:not([disabled])');
    buttons.forEach(button => {
        button.addEventListener('click', handleChoiceClick);
    });
}

// Handles clicking a choice button
function handleChoiceClick(event) {
    const button = event.target;
    const choiceLetter = button.dataset.choice;
    let choiceText = button.textContent.replace(/^[A-Z]\)\s*/, '').trim();

    // Pronoun fix
    choiceText = choiceText.replace(/\byou've\b/gi, "I've");
    choiceText = choiceText.replace(/\byou're\b/gi, "I'm");
    choiceText = choiceText.replace(/\byou are\b/gi, 'I am');
    choiceText = choiceText.replace(/\byourself\b/gi, 'myself');
    choiceText = choiceText.replace(/\byour\b/gi, 'my');
    choiceText = choiceText.charAt(0).toLowerCase() + choiceText.slice(1);

    const randomIndex = Math.floor(Math.random() * actionPhrases.length);
    const playerDisplayMessage = `${actionPhrases[randomIndex]} ${choiceText}.`;

    playerInput.value = choiceLetter;
    handlePlayerInput(playerDisplayMessage);

    const allButtons = document.querySelectorAll('.choice-btn');
    allButtons.forEach(btn => {
        btn.disabled = true;
    });
}

// Adds a message to the game output window
function addMessage(text, sender) {
    if (sender === 'gamemaster') {
        const paragraphs = text.split('\n');
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
                choiceContainer = null;
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
        const p = document.createElement('p');
        if (sender === 'player') {
            p.textContent = `> ${text}`;
            p.classList.add('player-text', 'fade-in', 'turn-divider');
        } else if (sender === 'system') {
            p.textContent = text;
            p.classList.add('loading-text', 'fade-in');
        }
        gameOutput.appendChild(p);
    }
}

// Chooses a thematic loading message
function getLoadingContext(inputText) {
    const lowerInput = inputText.toLowerCase();
    if (/\b(look|examine|inspect|observe|read|search)\b/.test(lowerInput)) return 'perception';
    if (/\b(talk|ask|speak|persuade|intimidate|greet)\b/.test(lowerInput)) return 'social';
    if (/\b(touch|use|activate|channel|focus|amulet|rune|magic)\b/.test(lowerInput)) return 'magic';
    if (/\b(go|move|walk|run|climb|open|take|attack)\b/.test(lowerInput)) return 'action';
    return 'default';
}

// Main function to handle player input and communication with the backend
async function handlePlayerInput(customDisplayText = null) {
    const inputText = playerInput.value.trim();
    if (inputText === '') return;

    const displayMessage = customDisplayText || inputText;
    addMessage(displayMessage, 'player');
    const lastPlayerMessage = gameOutput.querySelector('.player-text:last-of-type');
    gameOutput.scrollTop = gameOutput.scrollHeight;
    playerInput.value = '';
    setLoadingState(true);

    // Add loading message
    const context = getLoadingContext(inputText);
    const messageList = loadingMessages[context];
    const randomIndex = Math.floor(Math.random() * messageList.length);
    const loader = document.createElement('div');
    loader.id = 'inline-loader';
    loader.className = 'fade-in';
    loader.innerHTML = `<p>${messageList[randomIndex]}</p>`;
    gameOutput.appendChild(loader);
    gameOutput.scrollTop = gameOutput.scrollHeight;

    try {
        // Send the history and new message to our secure serverless function
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                history: gameHistory,
                message: inputText
            }),
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
        }

        const data = await response.json();
        const gmResponseText = data.text;

        // Update the local game history
        gameHistory.push({ role: 'user', parts: [{ text: inputText }] });
        gameHistory.push({ role: 'model', parts: [{ text: gmResponseText }] });

        loader.remove();
        addMessage(gmResponseText, 'gamemaster');
        
        // Scroll to the previous player message for context
        if (lastPlayerMessage) {
            const desiredScrollPosition = lastPlayerMessage.offsetTop - SCROLL_PADDING;
            gameOutput.scrollTo({ top: desiredScrollPosition, behavior: 'smooth' });
        }

    } catch (error) {
        console.error("Error communicating with server:", error);
        addMessage("A strange force interferes with your connection... Please try again.", 'system');
        if (loader) loader.remove();
    } finally {
        setLoadingState(false);
    }
}

// Disables/enables input during AI responses
function setLoadingState(isLoading) {
    playerInput.disabled = isLoading;
    submitBtn.disabled = isLoading;
    if (!isLoading) {
        playerInput.focus();
    }
}

// Starts a new game by fetching the initial message from the GM
async function startNewGame() {
    gameOutput.innerHTML = '';
    gameHistory = [];
    addMessage("Connecting to the ancient world...", 'system');
    setLoadingState(true);

    try {
        // This is the very first call to the AI with the main prompt
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                history: [],
                message: GAME_MASTER_PROMPT
            }),
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
        }

        const data = await response.json();
        const gmResponseText = data.text;
        
        // The GM prompt is the first "user" message, and the response is the first "model" message
        gameHistory.push({ role: 'user', parts: [{ text: GAME_MASTER_PROMPT }] });
        gameHistory.push({ role: 'model', parts: [{ text: gmResponseText }] });

        gameOutput.innerHTML = ''; // Clear "Connecting..." message
        addMessage(gmResponseText, 'gamemaster');

    } catch (error) {
        console.error("CRITICAL INITIALIZATION ERROR:", error);
        gameOutput.innerHTML = '';
        addMessage("Connection failed. The ancient world is unreachable. Please refresh to try again.", 'system');
    } finally {
        setLoadingState(false);
    }
}


// --- Theme Management ---
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
submitBtn.addEventListener('click', () => handlePlayerInput());
playerInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') handlePlayerInput();
});

themeToggle.addEventListener('click', toggleTheme);

// Settings Modal Listeners
settingsBtn.addEventListener('click', () => {
    settingsModal.classList.remove('hidden');
});

closeSettingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
});

// Save Button
saveBtn.addEventListener('click', () => {
    if (gameHistory.length === 0) {
        showToast("Nothing to save yet.");
        return;
    };
    try {
        localStorage.setItem('savedGameHistory', JSON.stringify(gameHistory));
        localStorage.setItem('savedGameHTML', gameOutput.innerHTML);
        showToast("Game Saved!");
    } catch (error) {
        console.error("Error saving game:", error);
        showToast("Could not save game.");
    }
    settingsModal.classList.add('hidden');
});

// Load Button - shows confirmation modal
loadBtn.addEventListener('click', () => {
    if (!localStorage.getItem('savedGameHistory')) {
        showToast("No saved game found.");
        return;
    }
    settingsModal.classList.add('hidden');
    confirmLoadModal.classList.remove('hidden');
});

// Reset Button - shows confirmation modal
resetBtn.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
    confirmResetModal.classList.remove('hidden');
});

// Cancel Load Button
cancelLoadBtn.addEventListener('click', () => {
    confirmLoadModal.classList.add('hidden');
});

// Confirm Load Button
confirmLoadBtn.addEventListener('click', () => {
    const savedHistoryJSON = localStorage.getItem('savedGameHistory');
    const savedHTML = localStorage.getItem('savedGameHTML');

    if (savedHistoryJSON && savedHTML) {
        gameHistory = JSON.parse(savedHistoryJSON);
        gameOutput.innerHTML = savedHTML;
        
        reattachChoiceButtonListeners(); // Crucial for making old buttons clickable again
        
        gameOutput.scrollTop = gameOutput.scrollHeight;
        showToast("Game Loaded!");
    } else {
        showToast("Could not load game data.");
    }
    confirmLoadModal.classList.add('hidden');
    setLoadingState(false);
});

// Cancel Reset Button
cancelResetBtn.addEventListener('click', () => {
    confirmResetModal.classList.add('hidden');
});

// Confirm Reset Button
confirmResetBtn.addEventListener('click', () => {
    confirmResetModal.classList.add('hidden');
    // We only clear game data now, not API keys
    localStorage.removeItem('savedGameHistory');
    localStorage.removeItem('savedGameHTML');
    startNewGame(); // Start a fresh game
});

// --- Start the game! -----------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);

    // No more API key checks, just start the game!
    startNewGame();

    document.body.classList.remove('loading');
});
