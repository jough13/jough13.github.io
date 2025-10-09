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

// API Key Modal
const apiKeyModal = document.getElementById('api-key-modal');
const apiKeyInput = document.getElementById('api-key-input');
const apiKeySubmitBtn = document.getElementById('api-key-submit-btn');
const clearApiKeyBtn = document.getElementById('clear-api-key');

// Hugging Face Key Modal
const hfKeyModal = document.getElementById('hf-key-modal');
const hfKeyInput = document.getElementById('hf-key-input');
const hfKeySubmitBtn = document.getElementById('hf-key-submit-btn');
const hfCloseBtn = hfKeyModal.querySelector('.modal-close-btn');

// Settings Modal
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = settingsModal.querySelector('.modal-close-btn');
const saveBtn = document.getElementById('save-btn');
const loadBtn = document.getElementById('load-btn');
const resetBtn = document.getElementById('reset-btn');
const exportBtn = document.getElementById('export-btn');
const autoplayToggle = document.getElementById('autoplay-toggle');
const liveImageToggle = document.getElementById('live-image-toggle');

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
    perception: ["Your eyes adjust to the details", "A hidden truth brushes against your mind", "The world reveals a secret", "Focusing on the unseen", "The patterns become clear"],
    action: ["You commit to your course", "The world shifts in response to your will", "Fate's loom trembles", "A breath held, a step taken", "The die is cast"],
    social: ["Choosing your words with care", "The currents of conversation shift", "A fragile trust is tested", "You offer a piece of yourself", "The air hangs heavy with unspoken words"],
    magic: ["The Amulet hums in response", "Weaving the threads of ethereal energy", "The air crackles with latent power", "A whisper on the edge of reality", "The ancient forces stir"],
    stealth: ["Treading softly on the edge of shadows", "Holding your breath as the world passes by", "Weaving a careful deception", "A whisper of movement, unheard", "You become one with the darkness"],
    memory: ["A fragment of memory surfaces from the depths", "Connecting the scattered echoes of the past", "The fog in your mind begins to thin", "A forgotten truth sparks into light", "The past reaches out to you"],
    default: ["The world holds its breath", "Consulting the celestial patterns", "The ancient stones whisper", "Time stretches and bends", "Destiny considers your move"]
};

// Array for randomized image loading messages
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

//-- IMAGE PROTOCOL --//
// You have a library of pre-made images. When you describe a scene that matches one, you MUST output a tag to signal which image to show.
// The format is: [SCENE_IMAGE: filename.png]
// Your available images are:
// - 'awakening_hollow.png': For the opening scene where the player awakens.
// - 'ruined_tower_exterior.png': For when the player first sees the ruined tower.
// - 'gloomy_forest_path.png': For any description of a dark, spooky path in the woods.

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
[SCENE_IMAGE: awakening_hollow.png]
[INVENTORY: Amulet of Aethelgard (A smooth, wooden amulet that hums with a faint, reassuring warmth.)]
`;

// --- Game Logic ------------------------------------------------------
let chat;
let genAI;
let toastTimeout;
let turnCounter = 0;
let isAutoplayEnabled = false;
let autoplayTimeout;
let isLiveImageModeEnabled = false;

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
    clearTimeout(autoplayTimeout);
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
        const imageRegex = /\[SCENE_IMAGE:\s*(.*?)\]/g;
        let narrativeText = text.replace(inventoryRegex, '').trim();
        narrativeText = narrativeText.replace(imageRegex, '').trim();

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

        const finalChoiceContainer = gameOutput.querySelector('.choice-container:last-of-type');
        if (finalChoiceContainer && isAutoplayEnabled) {
            clearTimeout(autoplayTimeout);
            autoplayTimeout = setTimeout(pickRandomChoice, 10000);
        }

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

function displayStaticImage(imageFilename) {
    const imageContainer = document.createElement('div');
    imageContainer.className = 'image-container fade-in';
    
    const img = document.createElement('img');
    img.src = `./images/${imageFilename}`; 
    
    img.onload = () => { img.classList.add('loaded'); };
    img.onerror = () => { 
        console.error(`Failed to load static image: ${imageFilename}`);
        imageContainer.remove(); 
    };
    
    gameOutput.insertBefore(imageContainer, gameOutput.firstChild);
    imageContainer.appendChild(img);
}

async function generateAndDisplayImage(narrativeText) {
    const imageContainer = document.createElement('div');
    imageContainer.className = 'image-container loading fade-in';
    const randomIndex = Math.floor(Math.random() * imageLoadingMessages.length);
    const randomMessage = imageLoadingMessages[randomIndex];
    imageContainer.innerHTML = `<p class="image-loading-text">${randomMessage}...</p>`;
    gameOutput.insertBefore(imageContainer, gameOutput.firstChild);
    gameOutput.scrollTop = gameOutput.scrollHeight;

    const getHfToken = () => {
        return new Promise((resolve) => {
            let existingToken = localStorage.getItem('hf-api-token');
            if (existingToken) {
                resolve(existingToken);
                return;
            }

            hfKeyModal.classList.remove('hidden');
            hfKeyInput.focus();

            const handleSubmit = () => {
                const newToken = hfKeyInput.value.trim();
                if (newToken) {
                    localStorage.setItem('hf-api-token', newToken);
                    cleanupAndResolve(newToken);
                }
            };

            const handleCancel = () => cleanupAndResolve(null);
            const handleEnter = (event) => {
                if (event.key === 'Enter') handleSubmit();
            };

            const cleanupAndResolve = (token) => {
                hfKeyModal.classList.add('hidden');
                hfKeySubmitBtn.removeEventListener('click', handleSubmit);
                hfKeyInput.removeEventListener('keydown', handleEnter);
                hfCloseBtn.removeEventListener('click', handleCancel);
                resolve(token);
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

function handleImageTrigger(fullResponseText) {
    const imageRegex = /\[SCENE_IMAGE:\s*(.*?)\]/g;
    const imageMatch = fullResponseText.match(imageRegex);

    if (imageMatch) {
        const lastMatch = imageMatch[imageMatch.length - 1];
        const filename = lastMatch.replace('[SCENE_IMAGE:', '').replace(']', '').trim();

        if (isLiveImageModeEnabled) {
            const choiceTestRegex = /^\s*\*\*[A-Z]\)\*\*/;
            const narrativeForImage = fullResponseText
                .replace(/\[.*?\]/g, '')
                .split('\n')
                .filter(line => !choiceTestRegex.test(line))
                .join(' ');
            generateAndDisplayImage(narrativeForImage);
        } else {
            displayStaticImage(filename);
        }
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
        
        handleImageTrigger(responseText);
        addMessage(responseText, 'gamemaster');
        
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
        
        gameOutput.innerHTML = ''; 
        
        turnCounter = 1;
        handleImageTrigger(responseText);
        addMessage(responseText, 'gamemaster');
        
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

function pickRandomChoice() {
    const availableChoices = document.querySelectorAll('.choice-btn:not([disabled])');
    if (availableChoices.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableChoices.length);
        const randomChoice = availableChoices[randomIndex];

        randomChoice.classList.add('autopicked');
        showToast("Auto-playing next turn...");
        
        setTimeout(() => {
            randomChoice.click();
        }, 1000);
    }
}

async function exportStory() {
    if (!chat) {
        showToast("No story to export yet.");
        return;
    }
    showToast("Preparing your story...");

    try {
        const cssResponse = await fetch('style.css');
        const cssText = await cssResponse.text();

        const storyContainer = document.createElement('div');
        storyContainer.innerHTML = gameOutput.innerHTML;

        storyContainer.querySelectorAll('.choice-container, #inline-loader').forEach(el => el.remove());

        const cleanedStoryHtml = storyContainer.innerHTML;
        const currentThemeClass = document.body.classList.contains('light-mode') ? 'light-mode' : '';
        
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>The Amulet of Aethelgard - Your Story</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&display=swap" rel="stylesheet">
                <style>${cssText}</style>
            </head>
            <body class="${currentThemeClass}">
                <div id="game-container">
                    <h1>Your Story</h1>
                    <div id="game-output">${cleanedStoryHtml}</div>
                </div>
            </body>
            </html>`;

        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'My_Aethelgard_Story.html';
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

    } catch (error) {
        console.error("Failed to export story:", error);
        showToast("Export failed.");
    } finally {
        settingsModal.classList.add('hidden');
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

settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
closeSettingsBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));

autoplayToggle.addEventListener('change', () => {
    isAutoplayEnabled = autoplayToggle.checked;
    localStorage.setItem('autoplay-enabled', isAutoplayEnabled);
    showToast(`Auto-play ${isAutoplayEnabled ? 'enabled' : 'disabled'}.`);
    if (isAutoplayEnabled && document.querySelector('.choice-btn:not([disabled])')) {
        clearTimeout(autoplayTimeout);
        autoplayTimeout = setTimeout(pickRandomChoice, 10000);
    } else {
        clearTimeout(autoplayTimeout);
    }
});

liveImageToggle.addEventListener('change', () => {
    isLiveImageModeEnabled = liveImageToggle.checked;
    localStorage.setItem('live-image-enabled', isLiveImageModeEnabled);
    showToast(`Dynamic Images ${isLiveImageModeEnabled ? 'enabled' : 'disabled'}.`);
});

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
    localStorage.removeItem('hf-api-token');
    localStorage.removeItem('savedGameHistory');
    localStorage.removeItem('savedGameHTML');
    localStorage.removeItem('savedInventoryHTML');
    localStorage.removeItem('autoplay-enabled');
    localStorage.removeItem('live-image-enabled');
    location.reload();
});

// --- Start the game! ---
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);

    isAutoplayEnabled = localStorage.getItem('autoplay-enabled') === 'true';
    autoplayToggle.checked = isAutoplayEnabled;

    isLiveImageModeEnabled = localStorage.getItem('live-image-enabled') === 'true';
    liveImageToggle.checked = isLiveImageModeEnabled;

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
