// --- 1. PHASER CONFIGURATION ---
const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.RESIZE,
        width: window.innerWidth,
        height: window.innerHeight,
    },
    transparent: true, 
    pixelArt: true, 
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 600 }, // INCREASED GRAVITY for a heavier, faster waterfall feel
            debug: false
        }
    },
    scene: { preload: preload, create: create, update: update }
};

const game = new Phaser.Game(config);

// --- 2. GAME STATE & UPGRADES ---
const gameState = {
    waterEnergy: 0,
    flowRate: 1,
    riverWidth: 60, // Started slightly narrower so it looks like it's coming from the cliff cleft
    isDarkMode: false,
    colors: {
        waterLight: 0xffffff, 
        waterDark: 0x88ccff,  // A slightly brighter glowing blue for dark mode
    }
};

const upgrades = {
    widen_river: { id: 'widen_river', name: 'Widen River', baseCost: 50, count: 0, effect: () => { gameState.riverWidth += 30; } },
    increase_flow: { id: 'increase_flow', name: 'Increase Flow', baseCost: 100, count: 0, effect: () => { gameState.flowRate += 1; } }
};

// --- 3. PHASER SCENE FUNCTIONS ---
let waterGroup;
let groundArea;
let groundBase;
let cliff;
let mistEmitter;
let spawnY = 0; // We will calculate this dynamically

function preload() {
    this.load.image('cliff_rock', 'assets/cliff_face.png'); 
    this.load.image('ground_base', 'assets/ground_strip.png');
    this.load.image('deco_tree', 'assets/pine_tree.png');
    this.load.spritesheet('water_sheet', 'assets/water_drop.png', { frameWidth: 340, frameHeight: 340 });
    this.load.spritesheet('deco_bush', 'assets/bush_round_small.png', { frameWidth: 256, frameHeight: 256 });
}

function create() {
    const sw = this.scale.width;
    const sh = this.scale.height;
    const groundY = sh * 0.85; 

    // --- ENVIRONMENT PLACEMENT ---

    // 1. Main Cliff
    cliff = this.add.image(sw / 2, groundY + 20, 'cliff_rock');
    cliff.setOrigin(0.5, 1);
    cliff.setScale(1.2);     
    cliff.setDepth(0);
    cliff.setTint(0xdddddd); // Darken the cliff slightly to push it into the background

    // Dynamically set water spawn to the top of the scaled cliff!
    spawnY = cliff.y - (cliff.height * cliff.scaleY) + 50; 

    // 2. Trees 
    let t1 = this.add.image(sw/2 - 140, groundY - 300, 'deco_tree');
    t1.setScale(0.5).setOrigin(0.5, 1).setDepth(1);
    let t2 = this.add.image(sw/2 + 120, groundY - 200, 'deco_tree');
    t2.setFlipX(true).setScale(0.4).setOrigin(0.5, 1).setDepth(1);

    // 3. PHYSICS & WATER
    waterGroup = this.physics.add.group({ 
        maxSize: 1500 // Increased pool size to handle faster flow upgrades
    });

    groundArea = this.add.rectangle(sw / 2, groundY, sw, 10, 0xff0000, 0); 
    this.physics.add.existing(groundArea, true); 

    // 4. Ground Base
    groundBase = this.add.tileSprite(sw / 2, groundY, sw, 256, 'ground_base');
    groundBase.setOrigin(0.5, 0.2); 
    groundBase.setDepth(2); 

    // 5. Bushes 
    let b1 = this.add.sprite(sw/2 - 200, groundY, 'deco_bush', 0); 
    b1.setScale(0.3).setOrigin(0.5, 1).setDepth(3); 
    let b2 = this.add.sprite(sw/2 + 180, groundY + 10, 'deco_bush', 14); 
    b2.setFlipX(true).setScale(0.25).setOrigin(0.5, 1).setDepth(3); 

    // --- MIST & COLLISIONS ---
    // IMPROVEMENT: Mist now uses frames 30-35 (the actual splash graphics on your sheet!)
    mistEmitter = this.add.particles(sw / 2, groundY, 'water_sheet', {
        frame: [30, 31, 32, 33, 34, 35], 
        scale: { start: 0.05, end: 0.15 }, // slightly larger so we can see the splash art
        speedX: { min: -100, max: 100 },
        speedY: { min: -100, max: -200 }, 
        alpha: { start: 0.8, end: 0 },
        lifespan: 600, // Shorter lifespan looks more like snappy mist
        gravityY: 300, 
        blendMode: gameState.isDarkMode ? 'ADD' : 'NORMAL',
        emitting: false
    });
    mistEmitter.setDepth(4); 

    this.physics.add.collider(waterGroup, groundArea, (obj1, obj2) => {
        let drop = (obj1 === groundArea) ? obj2 : obj1;
        
        // Spawn 1 splash particle exactly where the drop hit
        mistEmitter.explode(1, drop.x, groundY);
        
        drop.disableBody(true, true); // Deactivate and return to pool
        gameState.waterEnergy += 0.1;
        updateUI();
    });

    // IMPROVEMENT: Smooth resizing without reloading the page
    this.scale.on('resize', (gameSize) => {
        const width = gameSize.width;
        const height = gameSize.height;
        const newGroundY = height * 0.85;

        groundArea.setPosition(width / 2, newGroundY);
        groundArea.width = width;
        groundBase.setPosition(width / 2, newGroundY);
        groundBase.setSize(width, 256);
        cliff.setPosition(width / 2, newGroundY + 20);
        
        // Recalculate spawn Y
        spawnY = cliff.y - (cliff.height * cliff.scaleY) + 50;
    });

    setupUI();
}

function update(time, delta) {
    const sw = this.scale.width;
    const sh = this.scale.height;

    // --- WATER SPAWNING LOGIC ---
    for (let i = 0; i < gameState.flowRate; i++) {
        const spawnX = (sw / 2) + Phaser.Math.Between(-gameState.riverWidth/2, gameState.riverWidth/2);
        
        // IMPROVEMENT: Use the clean group.get() method for perfect Object Pooling
        let drop = waterGroup.get(spawnX, spawnY); 

        if (drop) {
            // IMPROVEMENT: Only use the top 3 rows of your sprite sheet (frames 0-17) for falling drops
            let randomFrame = Phaser.Math.Between(0, 17);
            let randomScale = Phaser.Math.FloatBetween(0.04, 0.08); 

            drop.setActive(true).setVisible(true);
            drop.enableBody(true, spawnX, spawnY, true, true);
            
            drop.setTexture('water_sheet', randomFrame); 
            drop.setScale(randomScale); 
            drop.setTint(gameState.isDarkMode ? gameState.colors.waterDark : gameState.colors.waterLight);
            
            // Give it a tiny bit of horizontal jitter as it falls off the cliff
            drop.setVelocityX(Phaser.Math.Between(-10, 10));
            drop.setVelocityY(Phaser.Math.Between(0, 50)); // Initial downward push
            drop.setDepth(1); 
        }
    }

    // --- WATER ANIMATION LOGIC ---
    waterGroup.children.iterate((drop) => {
        if (drop && drop.active) {
            // IMPROVEMENT: Velocity-based stretching! 
            // The faster it falls, the longer it gets visually. This is a classic pixel-art water trick.
            const speedY = drop.body.velocity.y;
            const baseScale = drop.scaleX; // Keep X scale constant
            
            // Stretch the Y scale based on speed, capping it so it doesn't get infinitely long
            const stretchScale = baseScale + (speedY * 0.0003); 
            drop.setScale(baseScale, Math.min(stretchScale, baseScale * 3));

            // Clean up drops if they somehow miss the floor and fall off screen
            if (drop.y > sh + 50) {
                drop.disableBody(true, true);
            }
        }
    });
}

// --- 4. UI LOGIC (Unchanged, just cleanly integrated) ---
function setupUI() {
    const currencyDisplay = document.getElementById('currency-display');
    const panel = document.getElementById('upgrade-container');
    const themeToggle = document.getElementById('theme-toggle');

    Object.values(upgrades).forEach(upg => {
        if (!document.getElementById(`btn-${upg.id}`)) {
            const btn = document.createElement('button');
            btn.id = `btn-${upg.id}`;
            btn.style.display = "block"; btn.style.marginBottom = "10px"; btn.style.width = "100%";
            btn.addEventListener('click', () => {
                const cost = Math.floor(upg.baseCost * Math.pow(1.5, upg.count));
                if (gameState.waterEnergy >= cost) {
                    gameState.waterEnergy -= cost; upg.count++; upg.effect(); updateUI();
                }
            });
            panel.appendChild(btn);
        }
    });

    themeToggle.addEventListener('click', () => {
        gameState.isDarkMode = !gameState.isDarkMode;
        document.body.classList.toggle('dark-mode');
        document.body.classList.toggle('light-mode');
        themeToggle.innerText = gameState.isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode";
        
        const waterColor = gameState.isDarkMode ? gameState.colors.waterDark : gameState.colors.waterLight;
        waterGroup.children.iterate((drop) => {
            if(drop) drop.setTint(waterColor);
        });
        mistEmitter.setBlendMode(gameState.isDarkMode ? 'ADD' : 'NORMAL');
    });

    window.updateUI = () => {
        currencyDisplay.innerText = `Water Energy: ${Math.floor(gameState.waterEnergy)}`;
        Object.values(upgrades).forEach(upg => {
            const btn = document.getElementById(`btn-${upg.id}`);
            if (btn) {
                const currentCost = Math.floor(upg.baseCost * Math.pow(1.5, upg.count));
                btn.innerText = `${upg.name} (Lvl ${upg.count}) - Cost: ${currentCost}`;
                btn.disabled = gameState.waterEnergy < currentCost;
            }
        });
    };
    updateUI();
}
