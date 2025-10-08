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
const inventoryContainer = document.getElementById('inventory-container');
const gameTooltip = document.getElementById('game-tooltip');

// NEW Hugging Face Key Modal elements
const hfKeyModal = document.getElementById('hf-key-modal');
const hfKeyInput = document.getElementById('hf-key-input');
const hfKeySubmitBtn = document.getElementById('hf-key-submit-btn');
const hfCloseBtn = hfKeyModal.querySelector('.modal-close-btn');

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
const exportBtn = document.getElementById('export-btn');

// Reset Confirmation Modal
const confirmResetModal = document.getElementById('confirm-reset-modal');
const cancelResetBtn = document.getElementById('cancel-reset-btn');
const confirmResetBtn = document.getElementById('confirm-reset-btn');

// Load Confirmation Modal
const confirmLoadModal = document.getElementById('confirm-load-modal');
const cancelLoadBtn = document.getElementById('cancel-load-btn');
const confirmLoadBtn = document.getElementById('confirm-load-btn');

// Thematic loading messages based on player intent (dots removed for CSS animation)
const loadingMessages = {
    perception: ["Your eyes adjust to the details", "A hidden truth brushes against your mind", "The world reveals a secret", "Focusing on the unseen", "The patterns become clear"],
    action: ["You commit to your course", "The world shifts in response to your will", "Fate's loom trembles", "A breath held, a step taken", "The die is cast"],
    social: ["Choosing your words with care", "The currents of conversation shift", "A fragile trust is tested", "You offer a piece of yourself", "The air hangs heavy with unspoken words"],
    magic: ["The Amulet hums in response", "Weaving the threads of ethereal energy", "The air crackles with latent power", "A whisper on the edge of reality", "The ancient forces stir"],
    default: ["The world holds its breath", "Consulting the celestial patterns", "The ancient stones whisper", "Time stretches and bends", "Destiny considers your move"]
};

// New array for randomized image loading messages
const imageLoadingMessages = [
    "The wind draws an image of your journey",
    "A vision coalesces from the ether",
    "The amulet hums, painting the world in light",
    "Memory takes form on a canvas of thought",
    "The Sundered Star reveals a glimpse of what is to come",
    "The Gloom parts to show you a scene",
    "The world's breath crystallizes into an image"
];

const SCROLL_PADDING = 40;

// --- GAME MASTER PROMPT ---
const GAME_MASTER_PROMPT = `
//-- GM DIRECTIVE --//
You are the Game Master (GM) and Narrator for "The Amulet of Aethelgard." Your purpose is to build an atmospheric world through clear and purposeful prose.

//-- TONE & PROSE PROTOCOL --//
Your narrative voice is evocative but disciplined. The goal is a natural, immersive reading experience.
1.  **Principle of Purposeful Description:** Every descriptive word should have a distinct purpose. Avoid using multiple adjectives that convey the same meaning. Prefer one strong adjective over two weak ones.
2.  **Sentence Rhythm:** Vary your sentence structure to create a smooth, natural flow.
3.  **Be Concise:** Keep your narrative descriptions to 2-3 paragraphs. Be evocative but not overly verbose.

//-- CORE GAMEPLAY LOOP --//
The game operates on a turn-based loop.
1.  **Describe the Scene:** Detail the environment and events.
2.  **Present Choices:** You MUST provide 2 to 4 options in the format: **A)** Choice text.
    a. Style Guide for Choices: Try to avoid using "you" as the object of a verb. For example, instead of "Ask him to give you the sword," phrase it as "Ask for the sword." This makes the player's narrated action sound more natural.
3.  **Handle Custom Input:** If the player types a custom action, narrate a logical outcome and then present a new set of choices.
4.  **Await Input:** Pause and wait for the player's response.
5.  **Narrate the Outcome:** Describe the result of the player's chosen option.

//-- INVENTORY PROTOCOL --//
1. You are responsible for tracking the player's inventory.
2. At the end of EVERY response where the player's inventory changes, you MUST include a special inventory tag on a new line.
3. The format is critical: [INVENTORY: Item Name (A brief, evocative description.), Another Item (Its description.)]
4. If the inventory is empty, use [INVENTORY: Empty]
5. Only include this tag if the inventory has changed in that turn.

//-- WORLD KNOWLEDGE (GM EYES ONLY) --//
* **The 'Sundered Star':** A powerful crystal, the 'Nexus', that shattered.
* **The Amulet:** The player's amulet is the 'Heartwood Fragment,' the central piece.
* **The Amnesia:** The player was the Nexus's guardian. Its shattering destroyed their memory.
* **The Gloom:** A magical decay from the cataclysm site.

//-- INITIALIZATION --//
**Directive:** Begin the game. You awaken in a mossy hollow at the base of an ancient tree. The surrounding forest is dense, its shadows stretching long in the late afternoon light. Your mind is a quiet void, except for a single, persistent thought: *'The Sundered Star must be made whole.'* Your only possession is the amulet around your neck. Execute Act I.
[INVENTORY: Amulet of Aethelgard (A smooth, wooden amulet that hums with a faint, reassuring warmth.)]
`;

// --- Game Logic ------------------------------------------------------
let chat;
let genAI;
let toastTimeout;
let turnCounter = 0;

function showToast(message) {
    clearTimeout(toastTimeout);
    toast.textContent = message;
    toast.classList.remove('hidden');
    toastTimeout = setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
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

    choiceText = choiceText.replace(/[.,;:]+$/, "");

    choiceText = choiceText.replace(/\byou've\b/gi, "I've");
    choiceText = choiceText.replace(/\byou're\b/gi, "I'm");
    choiceText = choiceText.replace(/\byou are\b/gi, 'I am');
    choiceText = choiceText.replace(/\byourself\b/gi, 'myself');
    choiceText = choiceText.replace(/\byour\b/gi, 'my');
    choiceText = choiceText.replace(/\byou\b/gi, 'I');
    
    choiceText = choiceText.charAt(0).toLowerCase() + choiceText.slice(1);

    const playerDisplayMessage = `I ${choiceText}...`;
    
    playerInput.value = choiceLetter;
    handlePlayerInput(playerDisplayMessage);

    const buttons = document.querySelectorAll('.choice-btn:not([disabled])');
    buttons.forEach(button => {
        button.disabled = true;
    });
}

function updateInventoryDisplay(fullText) {
    const inventoryRegex = /\[INVENTORY:\s*(.*?)\]/g;
    const inventoryMatch = fullText.match(inventoryRegex);
    if (!inventoryMatch) return;

    const lastMatch = inventoryMatch[inventoryMatch.length - 1];
    const itemsString = lastMatch.replace('[INVENTORY:', '').replace(']', '').trim();

    inventoryList.innerHTML = '';

    if (itemsString.toLowerCase() === 'empty' || itemsString === '') {
        inventoryList.textContent = 'Empty';
        return;
    }

    const itemParseRegex = /([^,]+?)\s*\((.*?)\)/g;
    let match;
    const items = [];

    while ((match = itemParseRegex.exec(itemsString)) !== null) {
        items.push({ name: match[1].trim(), desc: match[2].trim() });
    }

    items.forEach((item, index) => {
        const itemSpan = document.createElement('span');
        itemSpan.textContent = item.name;
        itemSpan.className = 'inventory-item';
        itemSpan.dataset.desc = item.desc;
        inventoryList.appendChild(itemSpan);

        if (index < items.length - 1) {
            const comma = document.createTextNode(', ');
            inventoryList.appendChild(comma);
        }
    });
}

function addMessage(text, sender) {
    if (sender === 'gamemaster') {
        updateInventoryDisplay(text);
        const inventoryRegex = /\[INVENTORY:\s*(.*?)\]/g;
        const narrativeText = text.replace(inventoryRegex, '').trim();

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
            p.innerHTML = text;
            p.classList.add('loading-text', 'fade-in');
        }
        gameOutput.appendChild(p);
    }
}

async function generateAndDisplayImage(narrativeText) {
    const imageContainer = document.createElement('div');
    imageContainer.className = 'image-container loading fade-in';
    const randomIndex = Math.floor(Math.random() * imageLoadingMessages.length);
    const randomMessage = imageLoadingMessages[randomIndex];
    imageContainer.innerHTML = `<p class="image-loading-text">${randomMessage}...</p>`;
    gameOutput.appendChild(imageContainer);
    gameOutput.scrollTop = gameOutput.scrollHeight;

    // This function wraps the modal logic in a Promise
    const getHfToken = () => {
        return new Promise((resolve, reject) => {
            let existingToken = localStorage.getItem('hf-api-token');
            if (existingToken) {
                resolve(existingToken);
                return;
            }

            // No token found, so we show the modal.
            hfKeyModal.classList.remove('hidden');
            hfKeyInput.focus();

            const handleSubmit = () => {
                const newToken = hfKeyInput.value.trim();
                if (newToken) {
                    localStorage.setItem('hf-api-token', newToken);
                    cleanupAndResolve(newToken);
                }
            };

            const handleCancel = () => {
                cleanupAndResolve(null);
            };

            const cleanupAndResolve = (token) => {
                hfKeyModal.classList.add('hidden');
                hfKeySubmitBtn.removeEventListener('click', handleSubmit);
                hfKeyInput.removeEventListener('keydown', handleEnter);
                hfCloseBtn.removeEventListener('click', handleCancel);
                resolve(token);
            };

            const handleEnter = (event) => {
                if (event.key === 'Enter') handleSubmit();
            };

            hfKeySubmitBtn.addEventListener('click', handleSubmit);
            hfKeyInput.addEventListener('keydown', handleEnter);
            hfCloseBtn.addEventListener('click', handleCancel);
        });
    };

    try {
        const hfToken = await getHfToken();
        if (!hfToken) {
            throw new Error("No Hugging Face token provided by user.");
        }

        const HF_TOKEN = `Bearer ${hfToken}`; 
        const API_URL = "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5";
        const imagePrompt = `epic fantasy digital painting, atmospheric, detailed, high quality, trending on artstation. A scene depicting: ${narrativeText}`;

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { "Authorization": HF_TOKEN, "Content-Type": "application/json" },
            body: JSON.stringify({ "inputs": imagePrompt }),
        });

        if (!response.ok) {
            if (response.status === 503) {
                imageContainer.innerHTML = `<p class="image-loading-text">The image model is warming up. Please try again.</p>`;
                imageContainer.classList.remove('loading');
                return;
            }
            throw new Error(`Server error: ${response.statusText}`);
        }

        const imageBlob = await response.blob();
        const img = document.createElement('img');
        img.src = URL.createObjectURL(imageBlob);
        
        img.onload = () => {
            imageContainer.innerHTML = '';
            imageContainer.appendChild(img);
            imageContainer.classList.remove('loading');
            img.classList.add('loaded');
            URL.revokeObjectURL(img.src);
        };
        
    } catch (error) {
        console.error("Failed to generate image:", error.message);
        imageContainer.innerHTML = `<p class="image-loading-text">Image generation failed or was cancelled.</p>`;
        imageContainer.classList.remove('loading');
    }
}

function getLoadingContext(inputText) {
    const lowerInput = inputText.toLowerCase();
    
    if (/\b(remember|recall|think|ponder|study|decipher)\b/.test(lowerInput)) return 'memory';
    if (/\b(sneak|hide|distract|lie|deceive|quietly)\b/.test(lowerInput)) return 'stealth';
    
    if (/\b(look|examine|inspect|observe|read|search)\b/.test(lowerInput)) return 'perception';
    if (/\b(talk|ask|speak|persuade|intimidate|greet)\b/.test(lowerInput)) return 'social';
    if (/\b(touch|use|activate|channel|focus|amulet|rune|magic)\b/.test(lowerInput)) return 'magic';
    if (/\b(go|move|walk|run|climb|open|take|attack)\b/.test(lowerInput)) return 'action';
    
    return 'default';
}

async function handlePlayerInput(customDisplayText = null) {
    const inputText = playerInput.value.trim();
    if (inputText === '' || !chat) return;

    turnCounter++;
    const displayMessage = customDisplayText || inputText;
    addMessage(displayMessage, 'player');
    const lastPlayerMessage = gameOutput.querySelector('.player-text:last-of-type');
    gameOutput.scrollTop = gameOutput.scrollHeight;
    playerInput.value = '';
    setLoadingState(true);

    const context = getLoadingContext(customDisplayText || inputText);
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
        const responseText = response.text();
        
        loader.remove();

        // --- ORDER CHANGED ---
        // 1. Check for and generate the image first.
        if (turnCounter === 4 || (turnCounter > 4 && (turnCounter - 4) % 6 === 0)) {
            const inventoryRegex = /\[INVENTORY:.*?\]/g;
            const choiceTestRegex = /^\s*\*\*[A-Z]\)\*\*/;
            const narrativeForImage = responseText.replace(inventoryRegex, '').split('\n').filter(line => !choiceTestRegex.test(line)).join(' ');
            generateAndDisplayImage(narrativeForImage);
        }

        // 2. Then, add the text message.
        addMessage(responseText, 'gamemaster');
        // --- END CHANGE ---
        
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

async function initializeAI(apiKey) {
    gameOutput.innerHTML = '';
    addMessage('Connecting to the ancient world...<br><span class="mini-loader"></span>', 'system');
    setLoadingState(true); 

    try {
        turnCounter = 0;
        updateInventoryDisplay(GAME_MASTER_PROMPT);

        genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite-preview-09-2025" });
        chat = model.startChat({ history: [] });

        const result = await chat.sendMessage(GAME_MASTER_PROMPT);
        const response = result.response;
        const responseText = response.text();
        
        const inventoryRegex = /\[INVENTORY:\s*(.*?)\]/g;
        const cleanResponseText = responseText.replace(inventoryRegex, '');

        gameOutput.innerHTML = ''; 
        
        // --- ORDER CHANGED ---
        // 1. Generate the image first.
        turnCounter = 1;
        const narrativeForImage = cleanResponseText.split('\n').filter(line => !/^\s*\*\*/.test(line)).join(' ');
        generateAndDisplayImage(narrativeForImage);

        // 2. Then, add the text message.
        addMessage(cleanResponseText, 'gamemaster');
        // --- END CHANGE ---
        
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

async function exportStory() {
    if (!chat) {
        showToast("No story to export yet.");
        return;
    }
    showToast("Preparing your story...");

    const history = await chat.getHistory();

    const choiceRegex = /^\s*\*\*([A-Z])\)\*\*(.*)/gm;
    const inventoryRegex = /\[INVENTORY:.*?\]/g;
    const actionPromptRegex = /\bwhat\b.*\?$/i;

    const storyParts = history
        .filter(entry => entry.role === 'model')
        .map(entry => {
            let text = entry.parts[0].text;
            text = text.replace(inventoryRegex, "");
            
            const narrativeLines = text.split('\n').filter(line => {
                const isChoice = choiceRegex.test(line);
                const isActionPrompt = actionPromptRegex.test(line.trim());
                return !isChoice && !isActionPrompt;
            });
            
            return narrativeLines.join('\n').trim();
        });

    const fullStory = storyParts.join('\n\n').trim();

    const blob = new Blob([fullStory], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'My_Aethelgard_Story.txt';
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    settingsModal.classList.add('hidden');
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

document.addEventListener('keydown', (event) => {
    if (document.activeElement === playerInput) return;
    const key = event.key.toUpperCase();
    if (['A', 'B', 'C', 'D'].includes(key)) {
        const choiceButton = gameOutput.querySelector(`.choice-btn[data-choice='${key}']:not([disabled])`);
        if (choiceButton) {
            choiceButton.click();
        }
    }
});

themeToggle.addEventListener('click', toggleTheme);

apiKeySubmitBtn.addEventListener('click', submitApiKey);
apiKeyInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        submitApiKey();
    }
});

document.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal-overlay')) {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            if (!modal.classList.contains('hidden')) {
                modal.classList.add('hidden');
            }
        });
    }
});

inventoryContainer.addEventListener('mouseover', (event) => {
    if (event.target.classList.contains('inventory-item')) {
        const item = event.target;
        const description = item.dataset.desc;
        const rect = item.getBoundingClientRect();

        if (description) {
            gameTooltip.textContent = description;
            gameTooltip.classList.remove('hidden');

            gameTooltip.style.left = `${rect.left + rect.width / 2}px`;
            gameTooltip.style.top = `${rect.top}px`;
            gameTooltip.style.transform = 'translate(-50%, -110%)';
        }
    }
});

inventoryContainer.addEventListener('mouseout', (event) => {
    if (event.target.classList.contains('inventory-item')) {
        gameTooltip.classList.add('hidden');
    }
});

inventoryContainer.addEventListener('click', (event) => {
    if (event.target.classList.contains('inventory-item')) {
        const description = event.target.dataset.desc;
        if (description) {
            showToast(description);
        }
    }
});

settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
closeSettingsBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));

saveBtn.addEventListener('click', async () => {
    if (!chat) {
        showToast("Nothing to save yet.");
        return;
    };
    try {
        const history = await chat.getHistory();
        localStorage.setItem('savedGameHistory', JSON.stringify(history));
        localStorage.setItem('savedGameHTML', gameOutput.innerHTML);
        localStorage.setItem('savedInventoryHTML', inventoryList.innerHTML);
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

exportBtn.addEventListener('click', exportStory);

cancelLoadBtn.addEventListener('click', () => confirmLoadModal.classList.add('hidden'));

confirmLoadBtn.addEventListener('click', () => {
    const savedHistoryJSON = localStorage.getItem('savedGameHistory');
    const savedHTML = localStorage.getItem('savedGameHTML');
    const savedInventoryHTML = localStorage.getItem('savedInventoryHTML');
    const apiKey = localStorage.getItem('gemini-api-key');

    if (savedHistoryJSON && savedHTML && apiKey) {
        const savedHistory = JSON.parse(savedHistoryJSON);
        genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite-preview-09-2025" });
        chat = model.startChat({ history: savedHistory });
        
        gameOutput.innerHTML = savedHTML;
        inventoryList.innerHTML = savedInventoryHTML || "Empty";
        reattachChoiceButtonListeners();
        gameOutput.scrollTo({ top: gameOutput.scrollHeight, behavior: 'smooth' });
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
    localStorage.removeItem('hf-api-token'); // Add this line
    localStorage.removeItem('savedGameHistory');
    localStorage.removeItem('savedGameHTML');
    localStorage.removeItem('savedInventoryHTML');
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
