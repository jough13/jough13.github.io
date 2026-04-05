// --- 1. PHASER CONFIGURATION ---
const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.RESIZE,
        width: window.innerWidth,
        height: window.innerHeight,
    },
    transparent: true, 
    pixelArt: true, // Keeps your pixel art sharp
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 350 }, 
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
    riverWidth: 100,
    isDarkMode: false,
    colors: {
        waterLight: 0xffffff, 
        waterDark: 0x03a9f4,  
    }
};

const upgrades = {
    widen_river: { id: 'widen_river', name: 'Widen River', baseCost: 50, count: 0, effect: () => { gameState.riverWidth += 50; } },
    increase_flow: { id: 'increase_flow', name: 'Increase Flow', baseCost: 100, count: 0, effect: () => { gameState.flowRate += 1; } }
};

// --- 3. PHASER SCENE FUNCTIONS ---
let waterGroup;
let groundArea;
let mistEmitter;

function preload() {
    // Make sure these match the file names in your assets folder exactly!
    this.load.image('cliff_rock', 'assets/cliff_face.png'); 
    this.load.image('ground_base', 'assets/ground_strip.png');
    this.load.image('deco_tree', 'assets/pine_tree.png');
    
    // Using the 2040x2040 water sheet (340x340 frames)
    this.load.spritesheet('water_sheet', 'assets/water_drop.png', { frameWidth: 340, frameHeight: 340 });
    
    // Using the 4x4 bush sheet
    this.load.spritesheet('deco_bush', 'assets/bush_round_small.png', { frameWidth: 256, frameHeight: 256 });
}

function create() {
    const sw = this.scale.width;
    const sh = this.scale.height;
    
    // We define a solid "Ground Level" near the bottom of the screen (85% down)
    const groundY = sh * 0.85; 

    // --- ENVIRONMENT PLACEMENT ---

    // 1. Main Cliff (Anchored to the ground)
    let cliff = this.add.image(sw / 2, groundY + 20, 'cliff_rock');
    cliff.setOrigin(0.5, 1); // IMPORTANT: Anchors the image to its bottom edge
    cliff.setScale(1.2);     // Uniform scale so it never stretches!
    cliff.setDepth(0);       // Back layer

    // 2. Trees (Placed directly on the cliff ledges)
    // Tweak the 'X' and 'Y' offsets (+/- numbers) to place them on specific ledges
    let t1 = this.add.image(sw/2 - 140, groundY - 300, 'deco_tree');
    t1.setScale(0.5).setOrigin(0.5, 1).setDepth(1);

    let t2 = this.add.image(sw/2 + 120, groundY - 200, 'deco_tree');
    t2.setFlipX(true).setScale(0.4).setOrigin(0.5, 1).setDepth(1);

    // 3. PHYSICS & WATER
    waterGroup = this.physics.add.group({ maxSize: 1000 });

    // The invisible collision line now matches our new groundY
    groundArea = this.add.rectangle(sw / 2, groundY, sw, 10, 0xff0000, 0); 
    this.physics.add.existing(groundArea, true); 

    // 4. Ground Base (The TileSprite Fix!)
    // 256 is the assumed height of your ground image. If the bottom of your ground
    // looks chopped off, increase this number (e.g., 300 or 400)!
    let groundBase = this.add.tileSprite(sw / 2, groundY, sw, 256, 'ground_base');
    groundBase.setOrigin(0.5, 0.2); // Aligns the top of the grass with the physics floor
    groundBase.setDepth(2); // Front layer

    // 5. Bushes (Placed on the new ground level)
    let b1 = this.add.sprite(sw/2 - 200, groundY, 'deco_bush', 0); 
    b1.setScale(0.3).setOrigin(0.5, 1).setDepth(3); 
    
    let b2 = this.add.sprite(sw/2 + 180, groundY + 10, 'deco_bush', 14); 
    b2.setFlipX(true).setScale(0.25).setOrigin(0.5, 1).setDepth(3); 

    // --- MIST & COLLISIONS ---
    let mistParticles = this.add.particles(sw / 2, groundY, 'water_sheet', {
        frame: 0, 
        scale: { start: 0.02, end: 0.08 }, 
        speedX: { min: -80, max: 80 },
        speedY: { min: -50, max: -150 }, 
        alpha: { start: 0.5, end: 0 },
        lifespan: 1200,
        gravityY: -200, 
        blendMode: gameState.isDarkMode ? 'ADD' : 'NORMAL',
        frequency: -1, 
        emitting: false
    });
    mistEmitter = mistParticles; 
    mistEmitter.setDepth(4); // Mist spawns in front of everything

    this.physics.add.collider(waterGroup, groundArea, (obj1, obj2) => {
        let drop = (obj1 === groundArea) ? obj2 : obj1;
        mistEmitter.explode(1, drop.x, groundY);
        drop.disableBody(true, true); 
        gameState.waterEnergy += 0.1;
        updateUI();
    });

    this.scale.on('resize', () => { location.reload(); });
    setupUI();
}

function update(time, delta) {
    const sw = this.scale.width;
    const sh = this.scale.height;
    
    // Water Spawn Point: Fixed to spawn relative to the ground so it always matches the cliff
    const spawnY = (sh * 0.85) - 400; // Spawns 400 pixels above the ground

    for (let i = 0; i < gameState.flowRate; i++) {
        let drop = waterGroup.getFirstDead(false); 
        const spawnX = (sw / 2) + Phaser.Math.Between(-gameState.riverWidth/2, gameState.riverWidth/2);
        
        let randomFrame = Phaser.Math.Between(0, 35);
        let randomScale = Phaser.Math.FloatBetween(0.03, 0.08); 

        if (drop) {
            drop.enableBody(true, spawnX, spawnY, true, true);
            drop.setTexture('water_sheet', randomFrame); 
            drop.setScale(randomScale); 
            drop.setTint(gameState.isDarkMode ? gameState.colors.waterDark : gameState.colors.waterLight);
            drop.setVelocityX(Phaser.Math.Between(-15, 15));
            drop.body.angularVelocity = Phaser.Math.Between(-30, 30); 
            drop.setDepth(1); // Water falls behind the foreground grass
        } else if (waterGroup.getLength() < waterGroup.maxSize) {
            let newDrop = waterGroup.create(spawnX, spawnY, 'water_sheet', randomFrame);
            newDrop.setScale(randomScale); 
            newDrop.setTint(gameState.isDarkMode ? gameState.colors.waterDark : gameState.colors.waterLight);
            newDrop.setBounce(Phaser.Math.FloatBetween(0.1, 0.4)); 
            newDrop.setVelocityX(Phaser.Math.Between(-15, 15));
            newDrop.body.angularVelocity = Phaser.Math.Between(-30, 30);
            newDrop.setDepth(1);
        }
    }

    waterGroup.children.iterate((drop) => {
        if (drop && drop.active && drop.y > sh + 50) {
            drop.disableBody(true, true);
        }
    });
}

// --- 4. UI LOGIC ---
function setupUI() {
    const currencyDisplay = document.getElementById('currency-display');
    const panel = document.querySelector('.panel');
    const themeToggle = document.getElementById('theme-toggle');

    Object.values(upgrades).forEach(upg => {
        // Prevent duplicate buttons on resize
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
