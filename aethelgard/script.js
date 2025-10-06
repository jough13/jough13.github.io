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

// Thematic loading messages based on player intent
const loadingMessages = {
    perception: [
        "Your eyes adjust to the details...",
        "A hidden truth brushes against your mind...",
        "The world reveals a secret...",
        "Focusing on the unseen...",
        "The patterns become clear..."
    ],
    action: [
        "You commit to your course...",
        "The world shifts in response to your will...",
        "Fate's loom trembles...",
        "A breath held, a step taken...",
        "The die is cast..."
    ],
    social: [
        "Choosing your words with care...",
        "The currents of conversation shift...",
        "A fragile trust is tested...",
        "You offer a piece of yourself...",
        "The air hangs heavy with unspoken words..."
    ],
    magic: [
        "The Amulet hums in response...",
        "Weaving the threads of ethereal energy...",
        "The air crackles with latent power...",
        "A whisper on the edge of reality...",
        "The ancient forces stir..."
    ],
    default: [
        "The world holds its breath...",
        "Consulting the celestial patterns...",
        "The ancient stones whisper...",
        "Time stretches and bends...",
        "Destiny considers your move..."
    ]
};

const SCROLL_CONTEXT_OFFSET = 120; // in pixels; increase for more context, decrease for less

// --- Game Master Prompt (Purposeful Prose v7.0) ---
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
    * **The correct format is:** \`**A)** Choice text here.\`
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
let chat; // This will hold our chat session

function handleChoiceClick(event) {
    const choice = event.target.dataset.choice;
    playerInput.value = choice;
    handlePlayerInput();

    const buttons = document.querySelectorAll('.choice-btn:not([disabled])');
    buttons.forEach(button => {
        button.disabled = true;
    });
}

// --- UPDATED: addMessage now adds classes for visual flourishes ---
/**
 * Appends a message to the game output, adding classes for animations and styling.
 * @param {string} text The message text.
 * @param {string} sender 'gamemaster', 'player', or 'system'.
 */
function addMessage(text, sender) {
    if (sender === 'gamemaster') {
        const paragraphs = text.split('\n');
        let choiceContainer = null;
        let isFirstParagraph = true; // For applying the drop cap

        paragraphs.forEach(paragraphText => {
            if (paragraphText.trim() === '') return;

            const choiceRegex = /^\s*\*\*([A-Z])\)\*\*(.*)/;
            const match = paragraphText.match(choiceRegex);

            if (match) {
                if (!choiceContainer) {
                    choiceContainer = document.createElement('div');
                    choiceContainer.className = 'choice-container fade-in'; // Add fade-in to container
                    gameOutput.appendChild(choiceContainer);
                }

                const choiceLetter = match[1];
                const choiceText = match[2].trim();
                const button = document.createElement('button');
                button.className = 'choice-btn';
                button.textContent = `${choiceLetter}) ${choiceText}`;
                button.dataset.choice = choiceLetter;
                button.addEventListener('click', handleChoiceClick);
                choiceContainer.appendChild(button);
            } else {
                choiceContainer = null;
                const paragraph = document.createElement('p');
                
                // Add classes for styling
                paragraph.className = 'fade-in';
                if (isFirstParagraph) {
                    paragraph.classList.add('gm-first-paragraph');
                    isFirstParagraph = false;
                }

                const unsafeHtml = marked.parse(paragraphText);
                const safeHtml = DOMPurify.sanitize(unsafeHtml);
                paragraph.innerHTML = safeHtml;
                gameOutput.appendChild(paragraph);
            }
        });
    } else {
        const p = document.createElement('p');
        p.textContent = text;
        
        // Add classes for styling
        p.classList.add('fade-in');
        if (sender === 'player') {
            p.className = 'player-text fade-in turn-divider';
        } else if (sender === 'system') {
            p.className = 'loading-text fade-in';
        }
        
        gameOutput.appendChild(p);
    }
}


function getLoadingContext(inputText) {
    const lowerInput = inputText.toLowerCase();
    if (/\b(look|examine|inspect|observe|read|search)\b/.test(lowerInput)) {
        return 'perception';
    }
    if (/\b(talk|ask|speak|persuade|intimidate|greet)\b/.test(lowerInput)) {
        return 'social';
    }
    if (/\b(touch|use|activate|channel|focus|amulet|rune|magic)\b/.test(lowerInput)) {
        return 'magic';
    }
    if (/\b(go|move|walk|run|climb|open|take|attack)\b/.test(lowerInput)) {
        return 'action';
    }
    return 'default';
}

function showLoadingScreen(context = 'default') {
    const messageList = loadingMessages[context] || loadingMessages.default;
    const randomIndex = Math.floor(Math.random() * messageList.length);
    loadingText.textContent = messageList[randomIndex];
    loadingOverlay.classList.remove('hidden');
    void loadingOverlay.offsetHeight;
}

function hideLoadingScreen() {
    loadingOverlay.classList.add('hidden');
}

async function handlePlayerInput() {
    const inputText = playerInput.value.trim();
    if (inputText === '' || !chat) return;

    addMessage(`> ${inputText}`, 'player');
    gameOutput.scrollTop = gameOutput.scrollHeight;

    playerInput.value = '';
    setLoadingState(true);

    const context = getLoadingContext(inputText);
    showLoadingScreen(context);

    try {
        const scrollPosition = gameOutput.scrollHeight;
        const result = await chat.sendMessage(inputText);
        const response = result.response;
        addMessage(response.text(), 'gamemaster');
        gameOutput.scrollTop = scrollPosition - SCROLL_CONTEXT_OFFSET;
    } catch (error)
        {
        console.error("Error sending message:", error);
        addMessage("A strange force interferes with your connection... Please try again.", 'system');
        gameOutput.scrollTop = gameOutput.scrollHeight;
    } finally {
        hideLoadingScreen();
        setLoadingState(false);
    }
}

function setLoadingState(isLoading) {
    playerInput.disabled = isLoading;
    submitBtn.disabled = isLoading;
    if (!isLoading) {
        playerInput.focus();
    }
}

async function initializeAI(apiKey) {
    showLoadingScreen('default');
    gameOutput.innerHTML = '';

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        chat = model.startChat({ history: [] });

        const result = await chat.sendMessage(GAME_MASTER_PROMPT);
        const response = result.response;

        console.log("Raw AI Response:", response.text());

        addMessage(response.text(), 'gamemaster');

        setLoadingState(false);
        gameOutput.scrollTop = 0;
    } catch (error) {
        console.error("Initialization Error:", error);
        apiKeyModal.classList.remove('hidden');
        addMessage("The cipher was incorrect or the connection failed. Please check your API key and try again.", 'system');
    } finally {
        hideLoadingScreen();
    }
}

function submitApiKey() {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) return;
    localStorage.setItem('gemini-api-key', apiKey);
    apiKeyModal.classList.add('hidden');
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
const savedTheme = localStorage.getItem('theme') || 'dark';
applyTheme(savedTheme);

const savedApiKey = localStorage.getItem('gemini-api-key');
if (savedApiKey) {
    apiKeyInput.value = savedApiKey;
}
apiKeyModal.classList.remove('hidden');
apiKeyInput.focus();
