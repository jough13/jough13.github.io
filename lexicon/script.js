document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('change', () => {
        document.body.classList.toggle('dark-mode');
    });

    window.addEventListener('keydown', (event) => {
        if (event.key === '`') {
            toggleDevMode();
        }
    });

    // --- Global State & Constants ---
    let deck = [];
    let hand = [];

    let workshopStacks = [[], [], [], []];
    let library = [];
    let selectedCard = null;
    let currentLevel = 1;
    let score = 0;
    let highScore = 0;
    let secretWord = '';
    let secretWordFound = false;
    let isDevMode = false;
    let buyCardsCost = 5;

    const HAND_SIZE = 8;
    const LETTER_VALUES = {
        'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1, 'F': 4, 'G': 2, 'H': 4, 'I': 1, 'J': 8, 
        'K': 5, 'L': 1, 'M': 3, 'N': 1, 'O': 1, 'P': 3, 'Q': 10, 'R': 1, 'S': 1, 'T': 1, 
        'U': 1, 'V': 4, 'W': 4, 'X': 8, 'Y': 4, 'Z': 10
    };
    let VALID_WORDS = new Set();
    let VALID_PREFIXES = new Set();

    // --- DOM Elements ---
    const startScreen = document.getElementById('start-screen');
    const gameContainer = document.getElementById('game-container');
    const startLevel1Btn = document.getElementById('start-level-1');
    const startLevel2Btn = document.getElementById('start-level-2');
    const handArea = document.getElementById('hand-area');
    const workshopArea = document.getElementById('workshop-area');
    const libraryArea = document.getElementById('library-area');
    const messageArea = document.getElementById('message-area');
    const redrawHandBtn = document.getElementById('redraw-hand-btn');
    const buyCardsBtn = document.getElementById('buy-cards-btn');
    const deckCountDisplay = document.getElementById('deck-count-display');
    const scoreDisplay = document.getElementById('score-display');
    const highScoreDisplay = document.getElementById('high-score-display');
    const highScoreStart = document.getElementById('high-score-start');
    const rulesBtn = document.getElementById('rules-btn');
    const rulesModal = document.getElementById('rules-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const gameOverModal = document.getElementById('game-over-modal');
    const gameOverTitle = document.getElementById('game-over-title');
    const gameOverReason = document.getElementById('game-over-reason');
    const closeGameOverBtn = document.getElementById('close-game-over-btn');
    const finalScoreDisplay = document.getElementById('final-score');
    const finalHighScoreDisplay = document.getElementById('final-high-score');
    const playAgainBtn = document.getElementById('play-again-btn');
    const devPanel = document.getElementById('dev-panel');

    // --- Level 2 Data & Grammar Rules ---
    const wordBank = [
        { text: 'The', type: 'determiner' }, { text: 'A', type: 'determiner' },
        { text: 'cat', type: 'noun' }, { text: 'dog', type: 'noun' }, { text: 'bird', type: 'noun' },
        { text: 'big', type: 'adjective' }, { text: 'small', type: 'adjective' }, { text: 'red', type: 'adjective' },
        { text: 'sat', type: 'verb' }, { text: 'barked', type: 'verb' }, { text: 'flew', type: 'verb' },
        { text: 'on', type: 'preposition' }, { text: 'under', type: 'preposition' },
        { text: 'mat', type: 'noun' }, { text: 'tree', type: 'noun' },
        { text: '.', type: 'punctuation' }
    ];

    const grammarRules = {
        'start': ['determiner', 'adjective', 'noun'],
        'determiner': ['adjective', 'noun'],
        'adjective': ['noun'],
        'noun': ['verb', 'preposition', 'punctuation'],
        'verb': ['preposition', 'determiner', 'punctuation'],
        'preposition': ['determiner', 'noun'],
    };

    // --- Game Logic ---
    function createLetterDeck() {
        const letters = 'E'.repeat(12) + 'A'.repeat(9) + 'I'.repeat(9) + 'O'.repeat(8) + 'N'.repeat(6) + 'R'.repeat(6) + 'T'.repeat(6) + 'L'.repeat(4) + 'S'.repeat(4) + 'U'.repeat(4) + 'D'.repeat(4) + 'G'.repeat(3) + 'B'.repeat(2) + 'C'.repeat(2) + 'M'.repeat(2) + 'P'.repeat(2) + 'F'.repeat(2) + 'H'.repeat(2) + 'V'.repeat(2) + 'W'.repeat(2) + 'Y'.repeat(2) + 'K'.repeat(1) + 'J'.repeat(1) + 'X'.repeat(1) + 'Q'.repeat(1) + 'Z'.repeat(1) + '*'.repeat(2);
        deck = letters.split('').map(char => ({ 
            text: char, 
            type: char === '*' ? 'replace' : 'letter' 
        }));
        shuffle(deck);
    }

function updateButtonStates() {
        buyCardsBtn.disabled = score < buyCardsCost;
        redrawHandBtn.disabled = deck.length < HAND_SIZE;
    }

    function createWordDeck() {
        deck = [];
        for (let i = 0; i < 3; i++) {
            deck.push(...wordBank);
        }
        shuffle(deck);
    }

function redrawHand() {
    if (deck.length < HAND_SIZE) {
        updateMessage("Not enough cards in the deck to redraw!");
        return;
    }

    score -= 2;
    renderScore();

    // The old hand is NOT returned to the deck or discard pile. It is gone forever.
    hand = []; 

    for (let i = 0; i < HAND_SIZE; i++) {
        const newCard = drawCard();
        if (newCard) hand.push(newCard);
    }

    updateMessage("Hand discarded and redrawn. (-2 pts)");
    renderAll();
}

function clearStack(stackIndex) {
    const stack = workshopStacks[stackIndex];
    if (stack.length === 0) {
        return;
    }

    score -= 2;
    renderScore();

    // The cards from the stack are now gone forever. We don't add them to any pile.

    workshopStacks[stackIndex] = [];
    workshopArea.querySelectorAll('.stack')[stackIndex].classList.remove('clue-correct-position', 'clue-wrong-position');
    updateMessage(`Stack cleared. (-2 pts)`);
    renderAll();
}

function buyCards() {
    if (score < buyCardsCost) {
        updateMessage(`You need ${buyCardsCost} points to buy cards.`);
        return;
    }

    score -= buyCardsCost;

    // Generate 5 new, balanced cards and add them to the deck
    const newCardPack = 'E'.repeat(2) + 'A'.repeat(2) + 'R'.repeat(1) + 'T'.repeat(1) + 'O'.repeat(1) + 'I'.repeat(1) + 'N'.repeat(1) + 'S'.repeat(1);
    const newCards = newCardPack.split('').map(char => ({ 
        text: char, 
        type: 'letter' 
    }));
    
    deck.push(...newCards);
    shuffle(deck);

    updateMessage(`Bought 5 new cards!`);
    
    buyCardsCost *= 2; // Double the cost for the next purchase
    
    renderAll();
}

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function drawCard() {
        return deck.length > 0 ? deck.pop() : null;
    }
    
    function calculateWordScore(word) {
        let wordScore = 0;
        for (const letter of word.toUpperCase()) {
            if (LETTER_VALUES[letter]) {
                wordScore += LETTER_VALUES[letter];
            }
        }
        return wordScore;
    }

    function selectSecretWord() {
        const fourLetterWords = [...VALID_WORDS].filter(word => word.length === 4);
        if (fourLetterWords.length > 0) {
            secretWord = fourLetterWords[Math.floor(Math.random() * fourLetterWords.length)];
            renderDevPanel();
        }
    }

    function checkSecretWordBonus() {
        if (currentLevel !== 1 || secretWordFound || secretWord === '') {
            return;
        }

        const match = workshopStacks.every((stack, index) => {
            return stack.length > 0 && stack[0].text.toLowerCase() === secretWord[index];
        });

        if (match) {
            score += 25;
            renderScore();
            updateMessage(`🎉 Secret Word "${secretWord.toUpperCase()}" found! +25 bonus points!`);
            
            secretWordFound = true;

            setTimeout(() => {
                secretWordFound = false;
                selectSecretWord();
                workshopArea.querySelectorAll('.stack').forEach(stackEl => {
                    stackEl.classList.remove('clue-correct-position', 'clue-wrong-position');
                });
                updateMessage('A new secret word has been chosen!');
            }, 2000);
        }
    }

    // --- High Score Logic ---
    function loadHighScore() {
        const savedScore = localStorage.getItem('lexiconHighScore');
        highScore = savedScore ? parseInt(savedScore, 10) : 0;
        renderHighScore();
    }

    function saveHighScore() {
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('lexiconHighScore', highScore);
        }
    }
    
    // --- Rendering Functions ---
    function renderScore() {
        scoreDisplay.innerText = `Score: ${score}`;
        if (score > parseInt(scoreDisplay.innerText.replace('Score: ', ''))) {
            scoreDisplay.classList.add('pulse');
            setTimeout(() => scoreDisplay.classList.remove('pulse'), 400);
        }
        if (score < 0) {
            triggerGameOver('negative_score');
        }
    }

    function renderHighScore() {
        highScoreDisplay.innerText = `High Score: ${highScore}`;
        highScoreStart.innerText = `High Score: ${highScore}`;
    }

    function renderDeckCount() {
        deckCountDisplay.innerText = `Cards Left: ${deck.length}`;
        buyCardsBtn.innerText = `Buy 5 Cards (${buyCardsCost} pts)`;
    }

    function renderAll() {
        renderHand();
        renderWorkshop();
        renderLibrary();
        renderHighScore();
        renderDeckCount();
        
        renderScore();

        updateButtonStates();
    }

    function renderHand() {
        handArea.innerHTML = '';
        hand.forEach((card, index) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'card';
            if (card.type === 'replace') {
                cardEl.classList.add('replace-card');
            }

            const letterEl = document.createElement('span');
            letterEl.className = 'card-letter';
            letterEl.innerText = card.text;
            cardEl.appendChild(letterEl);

            if (currentLevel === 1 && card.type === 'letter') {
                const pointsEl = document.createElement('span');
                pointsEl.className = 'card-points';
                pointsEl.innerText = LETTER_VALUES[card.text] || 0;
                cardEl.appendChild(pointsEl);
            }

            cardEl.dataset.handIndex = index;
            cardEl.addEventListener('click', onCardClick);
            handArea.appendChild(cardEl);
        });
    }

    function renderWorkshop() {
        const stacks = workshopArea.querySelectorAll('.stack');
        stacks.forEach((stackEl, index) => {
            const separator = (currentLevel === 1) ? '' : ' ';
            stackEl.innerText = workshopStacks[index].map(card => card.text).join(separator);
        });
    }

    function renderLibrary() {
        libraryArea.innerHTML = '';
        library.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'completed-word';
            itemEl.innerText = item;
            libraryArea.appendChild(itemEl);
        });
    }

    // --- Game State Logic ---
    function triggerGameOver(reason) {
        saveHighScore();
        if (reason === 'negative_score') {
            gameOverTitle.innerText = "Game Over";
            gameOverReason.innerText = "You've run out of points!";
        } else {
            gameOverTitle.innerText = "Game Over";
            gameOverReason.innerText = "You've run out of cards!";
        }
        finalScoreDisplay.innerText = `Final Score: ${score}`;
        finalHighScoreDisplay.innerText = `High Score: ${highScore}`;
        gameOverModal.classList.remove('hidden');
    }

    function checkGameOver() {
        if (deck.length === 0 && hand.length === 0) {
            triggerGameOver('out_of_cards');
        }
    }
    
    function showStartScreen() {
        saveHighScore();
        gameContainer.classList.add('hidden');
        gameOverModal.classList.add('hidden');
        startScreen.classList.remove('hidden');
        loadHighScore();
    }

    // --- Event Handlers ---
    function onCardClick(event) {
        const cardEl = event.currentTarget;
        const handIndex = parseInt(cardEl.dataset.handIndex);
        if (selectedCard && selectedCard.handIndex === handIndex) {
            selectedCard.element.classList.remove('selected');
            selectedCard = null;
            return;
        }
        if (selectedCard) {
            selectedCard.element.classList.remove('selected');
        }
        cardEl.classList.add('selected');
        selectedCard = {
            card: hand[handIndex],
            handIndex: handIndex,
            element: cardEl
        };
        updateMessage(`Selected '${selectedCard.card.text}'. Click a workshop stack to place it.`);
    }

    function onStackClick(event) {
        const stackIndex = parseInt(event.currentTarget.dataset.stackId);
        const stack = workshopStacks[stackIndex];

        if (selectedCard) {
            if (currentLevel === 1) {
                handleLevel1Move(stackIndex);
            } else {
                handleLevel2Move(stackIndex);
            }
        } 
        else {
            if (currentLevel === 1 && stack.length > 0) {
                const wordToCommit = stack.map(c => c.text).join('').toLowerCase();
                
                if (VALID_WORDS.has(wordToCommit)) {
                    const wordScore = calculateWordScore(wordToCommit);
                    score += wordScore;
                    renderScore();

                    library.push(wordToCommit.toUpperCase());
                    workshopStacks[stackIndex] = [];
                    workshopArea.querySelectorAll('.stack')[stackIndex].classList.remove('clue-correct-position', 'clue-wrong-position');
                    
                    updateMessage(`🎉 Word complete! (+${wordScore} pts) '${wordToCommit.toUpperCase()}' moved to Library.`);
                    renderAll();

                } else {
                    updateMessage(`'${wordToCommit.toUpperCase()}' is not a valid word to score.`);
                }
            }
        }
    }

    function handleLevel1Move(stackIndex) {
        const stack = workshopStacks[stackIndex];
        const cardToPlay = selectedCard.card;

        if (cardToPlay.type === 'replace') {
            if (stack.length === 0) {
                updateMessage("Cannot use a Rewrite tile on an empty stack!");
                return;
            }
            
            let newLetter = prompt("Enter the letter you want to change it to:");
            if (newLetter && newLetter.length === 1 && /[a-zA-Z]/.test(newLetter)) {
                discardPile.push(stack.pop()); // Add replaced card to discard
                stack.push({ text: newLetter.toUpperCase(), type: 'letter' });
                updateMessage("Letter rewritten!");
                finishMove();
            } else {
                updateMessage("Invalid input. Rewrite canceled.");
            }
            return;
        }

        let isValidMove = false;
        let newWord = (stack.map(c => c.text).join('') + cardToPlay.text).toLowerCase();

        if (stack.length === 0) {
            isValidMove = true;
        } else {
            if (VALID_WORDS.has(newWord) || VALID_PREFIXES.has(newWord)) {
                isValidMove = true;
            }
        }

        if (isValidMove) {
            stack.push(cardToPlay);
            
            if (stack.length === 1) {
                const playedLetter = cardToPlay.text.toLowerCase();
                const stackEl = workshopArea.querySelectorAll('.stack')[stackIndex];

                if (secretWord[stackIndex] === playedLetter) {
                    stackEl.classList.add('clue-correct-position');
                } else if (secretWord.includes(playedLetter)) {
                    stackEl.classList.add('clue-wrong-position');
                }
            }
            
            updateMessage("Good move! Keep building or click the stack to score.");
            finishMove();
        } else {
            updateMessage(`❌ Invalid move! '${newWord.toUpperCase()}' doesn't form a valid word.`);
        }
    }

    function handleLevel2Move(stackIndex) {
        const stack = workshopStacks[stackIndex];
        const cardToPlay = selectedCard.card;

        if (stack.length === 0) {
            if (!grammarRules['start'].includes(cardToPlay.type)) {
                updateMessage(`❌ Invalid start! Try starting with a determiner, adjective, or noun.`);
                return;
            }
        } else {
            const lastCard = stack[stack.length - 1];
            const allowedNextTypes = grammarRules[lastCard.type];
            if (!allowedNextTypes || !allowedNextTypes.includes(cardToPlay.type)) {
                updateMessage(`❌ Invalid grammar! You can't place a(n) '${cardToPlay.type}' after a(n) '${lastCard.type}'.`);
                return;
            }
        }

        stack.push(cardToPlay);
        if (cardToPlay.type === 'punctuation') {
            let sentenceScore = 0;
            const wordsInSentence = workshopStacks[stackIndex].map(c => c.text);
            wordsInSentence.forEach(word => {
                sentenceScore += calculateWordScore(word);
            });
            score += sentenceScore;
            renderScore();
            
            const sentence = wordsInSentence.join(' ');
            library.push(sentence);
            workshopStacks[stackIndex] = [];
            updateMessage(`🎉 Sentence complete! (+${sentenceScore} pts)`);
        } else {
            const wordScore = calculateWordScore(cardToPlay.text);
            updateMessage(`'${cardToPlay.text}' added! Keep building. (+${wordScore} potential pts)`);
        }

        finishMove();
    }
    
    function finishMove() {
        hand.splice(selectedCard.handIndex, 1);
        const newCard = drawCard();
        if (newCard) hand.push(newCard);
        selectedCard = null;
        renderAll();
        checkGameOver();
        checkSecretWordBonus();
    }

    function updateMessage(msg) {
        messageArea.innerText = msg;
    }

    // --- Dev Mode ---
    function toggleDevMode() {
        isDevMode = !isDevMode;
        document.body.classList.toggle('dev-mode-active');
        renderDevPanel();
    }

    function renderDevPanel() {
        if (isDevMode && currentLevel === 1) {
            devPanel.innerText = `Secret Word: ${secretWord}`;
        } else {
            devPanel.innerText = '';
        }
    }

    // --- Game Initialization ---
    async function loadDictionary() {
        updateMessage("Loading dictionary...");
        try {
            const response = await fetch('words.txt');
            const text = await response.text();
            const words = text.split('\n').map(w => w.trim().toLowerCase());
            VALID_WORDS = new Set(words);

            const twoLetterWords = [
                'of', 'to', 'in', 'it', 'is', 'be', 'as', 'at', 'so', 'we', 'he', 
                'by', 'or', 'on', 'do', 'if', 'me', 'my', 'up', 'an', 'go', 'no', 'us', 'am'
            ];
            twoLetterWords.forEach(word => VALID_WORDS.add(word));

            for (const word of VALID_WORDS) {
                for (let i = 1; i < word.length; i++) {
                    VALID_PREFIXES.add(word.substring(0, i));
                }
            }
        } catch (error) {
            console.error("Failed to load dictionary:", error);
            updateMessage("Error: Could not load dictionary file 'words.txt'.");
            gameContainer.innerHTML = "<p>Error: Could not load dictionary. Please run from a local server.</p>";
        }
    }

    function initGame(level) {
        saveHighScore();
        currentLevel = level;
        deck = [];
        hand = [];

        workshopStacks = [[], [], [], []];
        library = [];
        selectedCard = null;
        score = 0;
        secretWordFound = false;
        buyCardsCost = 5;

        if (level === 1) {
            createLetterDeck();
            selectSecretWord();
        } else {
            createWordDeck();
        }

        workshopArea.querySelectorAll('.stack').forEach(stackEl => {
            stackEl.classList.remove('clue-correct-position', 'clue-wrong-position');
        });

        for (let i = 0; i < HAND_SIZE; i++) {
            const newCard = drawCard();
            if (newCard) hand.push(newCard);
        }

        startScreen.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        renderAll();

updateButtonStates(); 

        updateMessage(`Level ${level} started. Good luck!`);
    }

    // --- Initial Load ---
    loadHighScore();
    loadDictionary().then(() => {

updateMessage("Select a level to begin!");

        startLevel1Btn.addEventListener('click', () => initGame(1));
        startLevel2Btn.addEventListener('click', () => initGame(2));
        redrawHandBtn.addEventListener('click', redrawHand);
        buyCardsBtn.addEventListener('click', buyCards);
        
        rulesBtn.addEventListener('click', () => rulesModal.classList.remove('hidden'));
        closeModalBtn.addEventListener('click', () => rulesModal.classList.add('hidden'));
        rulesModal.addEventListener('click', (event) => {
            if (event.target === rulesModal) {
                rulesModal.classList.add('hidden');
            }
        });
        
        closeGameOverBtn.addEventListener('click', showStartScreen);
        playAgainBtn.addEventListener('click', showStartScreen);

        workshopArea.querySelectorAll('.stack').forEach((stackEl, index) => {
            stackEl.addEventListener('click', onStackClick);
            stackEl.addEventListener('dblclick', () => clearStack(index));
        });
    });
});
