// --- 1. PHASER CONFIGURATION ---
const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.RESIZE,
        width: window.innerWidth,
        height: window.innerHeight,
    },
    transparent: true, 
    pixelArt: true, // Keeps your new assets crisp
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
        waterLight: 0xffffff, // Untinted in light mode to show off the asset's natural colors
        waterDark: 0x03a9f4,  // Glows cyan in dark mode
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
let fgLayer, decoLayer, cliffLayer;

function preload() {
    // Single static images
    this.load.image('cliff_rock', 'assets/cliff_face.png'); 
    this.load.image('ground_base', 'assets/ground_strip.png');
    this.load.image('deco_tree', 'assets/pine_tree.png');
    
    // Sprite Sheets (Math applied!)
    // 2040x2040 divided by 6 columns/rows = 340
    this.load.spritesheet('water_sheet', 'assets/water_drop.png', { frameWidth: 340, frameHeight: 340 });
    
    // Assuming the bush sheet is standard square (adjust 256 if your image is a different size)
    this.load.spritesheet('deco_bush', 'assets/bush_round_small.png', { frameWidth: 256, frameHeight: 256 });
}

function create() {
    const sw = this.scale.width;
    const sh = this.scale.height;
    const ruggedTop = sh / 2 - 200;
    const baseLine = sh / 2 + 200;

    // Layering Groups
    cliffLayer = this.add.group();
    decoLayer = this.add.group();  
    fgLayer = this.add.group();    

    // ENVIRONMENT PLACEMENT
    // 1. Main Cliff
    let cliff = this.add.image(sw / 2, sh / 2, 'cliff_rock');
    cliff.setScale(1.2).setOrigin(0.5); 
    cliffLayer.add(cliff);

    // 2. Ground Base
    let groundBase = this.add.image(sw / 2, baseLine + 50, 'ground_base');
    groundBase.setScale(1.0).setOrigin(0.5);
    fgLayer.add(groundBase);

    // 3. Trees on the cliff top
    let t1 = this.add.image(sw/2 - 180, ruggedTop - 50, 'deco_tree');
    t1.setScale(0.5).setOrigin(0.5, 1);
    decoLayer.add(t1);

    let t2 = this.add.image(sw/2 + 150, ruggedTop - 20, 'deco_tree');
    t2.setFlipX(true).setScale(0.4).setOrigin(0.5, 1);
    decoLayer.add(t2);

    // 4. Bushes at the base
    let b1 = this.add.sprite(sw/2 - 200, baseLine - 10, 'deco_bush', 0); // Frame 0
    b1.setScale(0.3); 
    fgLayer.add(b1);
    
    let b2 = this.add.sprite(sw/2 + 180, baseLine + 10, 'deco_bush', 14); // Frame 14 (Flowers)
    b2.setFlipX(true).setScale(0.25); 
    fgLayer.add(b2);

    // PHYSICS & WATER
    waterGroup = this.physics.add.group({ maxSize: 1000 });

    groundArea = this.add.rectangle(sw / 2, baseLine + 10, sw, 10, 0xff0000, 0); 
    this.physics.add.existing(groundArea, true); 

    // MIST EMITTER (Using a small water drop frame)
    let mistParticles = this.add.particles(sw / 2, baseLine, 'water_sheet', {
        frame: 0, // Use the first frame for mist
        scale: { start: 0.02, end: 0.08 }, // Keep it tiny since the frame is 340px
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
    fgLayer.add(mistParticles); 

    // COLLISIONS
    this.physics.add.collider(waterGroup, groundArea, (obj1, obj2) => {
        let drop = (obj1 === groundArea) ? obj2 : obj1;
        
        mistEmitter.explode(1, drop.x, baseLine);
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
    const ruggedTop = sh / 2 - 200; 

    for (let i = 0; i < gameState.flowRate; i++) {
        let drop = waterGroup.getFirstDead(false); 
        const spawnX = (sw / 2) + Phaser.Math.Between(-gameState.riverWidth/2, gameState.riverWidth/2);
        
        // Pick a random frame (0 to 35) from the 6x6 sheet
        let randomFrame = Phaser.Math.Between(0, 35);
        
        // 340px is massive, so we scale it down to about 10-25 pixels
        let randomScale = Phaser.Math.FloatBetween(0.03, 0.08); 

        if (drop) {
            drop.enableBody(true, spawnX, ruggedTop, true, true);
            drop.setTexture('water_sheet', randomFrame); 
            drop.setScale(randomScale); 
            drop.setTint(gameState.isDarkMode ? gameState.colors.waterDark : gameState.colors.waterLight);
            drop.setVelocityX(Phaser.Math.Between(-15, 15));
            drop.body.angularVelocity = Phaser.Math.Between(-30, 30); 
        } else if (waterGroup.getLength() < waterGroup.maxSize) {
            let newDrop = waterGroup.create(spawnX, ruggedTop, 'water_sheet', randomFrame);
            newDrop.setScale(randomScale); 
            newDrop.setTint(gameState.isDarkMode ? gameState.colors.waterDark : gameState.colors.waterLight);
            newDrop.setBounce(Phaser.Math.FloatBetween(0.1, 0.4)); 
            newDrop.setVelocityX(Phaser.Math.Between(-15, 15));
            newDrop.body.angularVelocity = Phaser.Math.Between(-30, 30);
        }
    }

    // Cleanup off-screen
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
