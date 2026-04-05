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
    
    // We establish our scene center line and ground line. 
    const sceneCenterY = sh / 2;
    const groundY = sh * 0.85; // Place ground near the bottom (85% down)

    // A. Setup Clean Rendering Layers (bottom to top)
    cliffLayer = this.add.container(sw/2, sceneCenterY); // Layer for the static rocks
    waterLayer = this.add.container(); // Layer for the physics drops
    decoLayer = this.add.container(sw/2, sceneCenterY); // Layer for plants, trees
    fgLayer = this.add.group();    // Layer for the foreground ground strip

    app.stage.addChild(cliffLayer, waterLayer, decoLayer, fgLayer); // Add layers in correct order

    // --- B. ENVIRONMENT PLACEMENT (Fixing the Stretching) ---
    // 1. Draw the Main Cliff (Grounded, rugged rock)
    const cliff = new PIXI.Graphics();
    
    // THE FIX: We stop drawing rugged trapezoids. We use our 2.5D cliff asset.
    // Replace with: this.load.image('cliff_face', 'assets/cliff_face.png');
    // For now, drawing a large rectangle for the sprite sheet
    
    // cliff.beginFill(gameState.currentBiome.cliffColor);
    // Let's use points to draw the asset seen in the user screenshot
    cliff.beginFill(0x546e7a); // Gray rock
    cliff.moveTo(-150, 150); // Bottom Left
    cliff.lineTo(150, 150); // Bottom Right
    cliff.lineTo(130, -140); // Top right (slight angle)
    cliff.lineTo(- ruggedWidth / 2 + 30, -150); // Rugged top left
    // We draw the basic rectangular 'missing asset' shape seen in the screenshot,
    // as that asset (the vertical gray tube) is what we are fixing.
    cliff.drawRect(-150, -150, 300, 300); // Centered rectangle
    cliff.endFill();
    cliffLayer.add(cliff);

    // 2. Draw Ground/Grounded Base (where water hits)
    const grass = new PIXI.Graphics();
    grass.beginFill(gameState.currentBiome.grassColor);
    grass.drawRect(0, 0, sw * 0.7, 50); // wide horizontal strip base
    grass.endFill();
    fgLayer.add(grass);

    // C. Grounded Props (Root them in the ground base)
    // Add dummy plants that look like image_447c20.jpg
    const plantColors = [0x2e7d32, 0x1b5e20, 0xa5d6a7];
    for(let i = 0; i < 6; i++) {
        const p = new PIXI.Graphics();
        const color = plantColors[Math.floor(Math.random()*plantColors.length)];
        p.beginFill(color);
        // Drawing simple "bushes" (clumps of circles) like the ones in the screenshot
        p.drawCircle(0,0, 15 + Math.random()*15);
        p.drawCircle(20,0, 10 + Math.random()*10);
        p.drawCircle(-15,10, 10 + Math.random()*10);
        p.endFill();
        p.x = cliffLayer.x + (Math.random()-0.5) * (ruggedWidth + 200);
        if(p.x < cliffLayer.x - ruggedWidth/2 || p.x > cliffLayer.x + ruggedWidth/2) {
            // Near base
            p.y = sh - 50 + Math.random()*30 - 15;
            p.scale.set(0.8 + Math.random()*0.4);
        } else {
            // On cliff face or ledge (requires slightly better math later)
            p.y = sceneCenterY + (sh - sceneCenterY)*Math.random();
            p.scale.set(0.4 + Math.random()*0.3); // smaller plants on cliff
        }
        cliffLayer.add(p);
    }

    // PHYSICS & WATER SETUP ( Cascading and Splashing Fix)
    this.waterGroup = this.physics.add.group({ maxSize: 1000 });

    // The invisible Ground collision line (where water lands)
    groundArea = this.add.rectangle(sw / 2, groundY, sw, 10, 0xff0000, 0); 
    this.physics.add.existing(groundArea, true); 

    // ADVANCED POLISH: Mist Particle Emitter (for when water lands)
    let mistParticles = this.add.particles(sw / 2, groundY, 'water_sheet', {
        frame: 0, // Use the first frame for mist
        scale: { start: 0.02, end: 0.08 }, // Keep it tiny since the frame is 340px
        speedX: { min: -100, max: 100 },
        speedY: { min: -50, max: -250 }, // float upwards
        alpha: { start: 0.3, end: 0 },
        lifespan: 1500, // 1.5 seconds
        gravityY: -400, // defy gravity
        blendMode: gameState.isDarkMode ? 'ADD' : 'NORMAL',
        frequency: -1, // Do not automatically fire, we fire on collision
        emitting: false
    });
    mistEmitter = mistParticles; // store reference
    fgLayer.add(mistParticles); // Place mist behind foreground grass


    // COLLECTIONS CALLBACK
    this.physics.add.collider(this.waterGroup, groundArea, (obj1, obj2) => {
        // Defensive ordering check (quirk in some Phaser 3 versions)
        let drop = (obj1 === groundArea) ? obj2 : obj1;
        
        // Trigger mist splash where the drop lands
        mistEmitter.explode(1, drop.x, groundY);

        // Despawn drop
        drop.disableBody(true, true); 
        gameState.waterEnergy += 0.1;
        updateUI();
    });

    // Handle Window Resizing (simply reload the scene for complex positioning)
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
