// expansions/AdvancedBase.js
import { Structure, ResourceNode, MathUtils } from '../game.js';
import { Aphid, GoldenBug } from './Critters.js';

// ==========================================
// 1. CONFIGURATION & AI BALANCING
// ==========================================
const AI_CONFIG = {
    pad: 600,                 // Safe distance from map edges for base spawning
    exclusionRadiusSq: 90000, // 300px squared exclusion zone for resource spawning around bases
    
    unitTickRate: 120,        // AI attempts to spawn a unit every ~4 seconds
    buildTickRate: 450,       // AI attempts to expand base every ~15 seconds
    
    techUpgradeCost: 250,     // Cost for the AI to evolve its tech level
    
    // Escalation Timers (Ticks)
    phase2Tick: 3600,         // ~2 minutes
    phase3Tick: 5400,         // ~3 minutes
    phase4Tick: 7200          // ~4 minutes
};

export const AdvancedBaseExpansion = {
    init: (game) => {
        game.basesInitialized = false;
    },

    patch: (game) => {
        // Hook into the main game loop for deterministic AI and Initialization
        game.expansions.patchClass(game.constructor, 'update', function(original) {
            original.call(this);

            if (this.gameState !== 'playing') return;

            // ==========================================
            // 2. ONE-TIME BASE & MAP GENERATION (Tick 1)
            // ==========================================
            if (this.tick === 1 && !this.basesInitialized) {
                this.basesInitialized = true;
                
                console.log("%c[Lore] The Obsidian Brood and Crimson Swarm have awakened.", "color: #aa00ff; font-style: italic;");

                // Player Spawn (Obsidian Brood - Top Left-ish)
                const bX = AI_CONFIG.pad + MathUtils.randomRange(0, 200); 
                const bY = AI_CONFIG.pad + MathUtils.randomRange(0, 200);
                
                // Enemy Spawn (Crimson Swarm - Bottom Right-ish)
                const rX = this.world.width - AI_CONFIG.pad - MathUtils.randomRange(0, 200); 
                const rY = this.world.height - AI_CONFIG.pad - MathUtils.randomRange(0, 200);
                
                // SAFETY FIX: Make independent of Terrain.js. 
                // Only attempt to modify mapGrid if it actually exists!
                if (this.mapGrid) {
                    const tileSize = this.tileSize || 256;
                    const tBX = Math.max(0, Math.floor(bX / tileSize)); 
                    const tBY = Math.max(0, Math.floor(bY / tileSize));
                    const tRX = Math.max(0, Math.floor(rX / tileSize)); 
                    const tRY = Math.max(0, Math.floor(rY / tileSize));
                    
                    if(this.mapGrid[tBY] && this.mapGrid[tBY][tBX]) this.mapGrid[tBY][tBX] = { type: 'dirt', sprite: 'dirt', angle: 0 };
                    if(this.mapGrid[tRY] && this.mapGrid[tRY][tRX]) this.mapGrid[tRY][tRX] = { type: 'dirt', sprite: 'dirt', angle: 0 };
                    
                    if (this.updateBitmasks) this.updateBitmasks();
                }

                // Spawn Base Structures
                this.addEntity(new Structure(bX, bY, 'black', 'nest')); 
                this.addEntity(new Structure(bX + 80, bY, 'black', 'eggsac'));
                
                this.addEntity(new Structure(rX, rY, 'red', 'nest')); 
                this.addEntity(new Structure(rX - 80, rY, 'red', 'eggsac'));
                
                // Center camera on player base
                this.camera.x = Math.max(0, bX - (this.canvas.width / 2)); 
                this.camera.y = Math.max(0, bY - (this.canvas.height / 2));
                
                // GAMEPLAY POLISH: Helper to prevent resources from spawning directly on top of Nests
                const isTooCloseToBase = (x, y) => {
                    return MathUtils.distSq(x, y, bX, bY) < AI_CONFIG.exclusionRadiusSq || 
                           MathUtils.distSq(x, y, rX, rY) < AI_CONFIG.exclusionRadiusSq;
                };

                // Scatter Pumpkin Patches
                for (let i = 0; i < 40; i++) {
                    let pX, pY, valid = false;
                    for (let attempts = 0; attempts < 5 && !valid; attempts++) {
                        pX = 600 + Math.random() * (this.world.width - 1200); 
                        pY = 600 + Math.random() * (this.world.height - 1200);
                        if (!isTooCloseToBase(pX, pY)) valid = true;
                    }

                    if (valid) {
                        let clusterSize = MathUtils.randomInt(5, 10);
                        for (let p = 0; p < clusterSize; p++) {
                            this.addEntity(new ResourceNode(
                                pX + MathUtils.randomRange(-150, 150), 
                                pY + MathUtils.randomRange(-150, 150), 
                                'pumpkin'
                            ));
                        }
                    }
                }
                
                // Scatter Magic Dew
                for (let i = 0; i < 60; i++) { 
                    let dX, dY, valid = false;
                    for (let attempts = 0; attempts < 5 && !valid; attempts++) {
                        dX = Math.random() * this.world.width; 
                        dY = Math.random() * this.world.height;
                        if (!isTooCloseToBase(dX, dY)) valid = true;
                    }
                    if (valid) this.addEntity(new ResourceNode(dX, dY, 'dew')); 
                }
                
                // Spawn Neutral Critters
                for(let i = 0; i < 3; i++) {
                    this.addEntity(new GoldenBug(this.world.width/2 + MathUtils.randomRange(-500, 500), this.world.height/2 + MathUtils.randomRange(-500, 500)));
                }
                
                for(let i = 0; i < 30; i++) {
                    let ax = Math.random() * this.world.width; 
                    let ay = Math.random() * this.world.height;
                    // Aphids prefer grass, but occasionally spawn elsewhere
                    if(this.getTerrainAt(ax, ay) === 'grass' || Math.random() > 0.8) {
                        this.addEntity(new Aphid(ax, ay));
                    }
                }
            }

            // ==========================================
            // 3. CRIMSON SWARM AI: DYNAMIC ESCALATION
            // ==========================================
            
            // Unit Spawning Loop
            if (this.tick % AI_CONFIG.unitTickRate === 0) {
                let redNests = this.structures.filter(s => s.team === 'red' && s.type === 'nest');
                
                if (redNests.length > 0 && this.pop.red < this.maxPop.red) {
                    let nest = redNests[MathUtils.randomInt(0, redNests.length - 1)];
                    
                    // AI Escalation: Unlocks advanced units as time goes on
                    let availableRoles = ['harvester', 'harvester', 'soldier']; // Weighted towards eco early
                    if (this.tick > AI_CONFIG.phase2Tick) availableRoles.push('soldier', 'spitter');
                    if (this.tick > AI_CONFIG.phase4Tick) availableRoles.push('tarantula', 'spitter');
                    
                    let chosenRole = availableRoles[MathUtils.randomInt(0, availableRoles.length - 1)];

                    this.bus.emit('spawnSpider', {
                        x: nest.x, y: nest.y, 
                        team: 'red', 
                        role: chosenRole
                    });
                }
            }

            // Base Expansion Loop
            if (this.tick % AI_CONFIG.buildTickRate === 0) {
                
                let upgradedTech = false;
                
                // After Phase 4, the AI has a 50% chance to spend surplus pumpkins on Tech
                if (this.tick > AI_CONFIG.phase4Tick && this.eco.red.pumpkins >= AI_CONFIG.techUpgradeCost && Math.random() > 0.5) {
                    this.eco.red.pumpkins -= AI_CONFIG.techUpgradeCost;
                    this.techLevel.red = (this.techLevel.red || 0) + 1;
                    upgradedTech = true;
                    console.log(`[AI Alert] Crimson Swarm evolved to Tech Level ${this.techLevel.red}!`);
                }

                // Only proceed to build structures if we didn't spend our cycle/resources upgrading tech
                if (!upgradedTech) {
                    let redQueen = this.queens.find(q => q.team === 'red');
                    
                    // Only issue build orders if the Queen is alive and currently idle
                    if (redQueen && !redQueen.activeConstruction && !redQueen.buildTarget) {
                        
                        // AI Escalation: Unlocks advanced structures as time goes on
                        let availableBuildings = ['nest', 'eggsac', 'pylon', 'turret', 'wall'];
                        if (this.tick > AI_CONFIG.phase3Tick) availableBuildings.push('mortar', 'shrine');
                        
                        const type = availableBuildings[MathUtils.randomInt(0, availableBuildings.length - 1)];
                        
                        // AI Cost check before committing
                        const costs = { 
                            'nest': {p: 150, d: 0}, 'eggsac': {p: 50, d: 0}, 'pylon': {p: 25, d: 0}, 
                            'turret': {p: 100, d: 0}, 'wall': {p: 25, d: 0},
                            'mortar': {p: 200, d: 50}, 'shrine': {p: 150, d: 100}
                        };
                        
                        let cost = costs[type];
                        
                        if (this.eco.red.pumpkins >= cost.p && this.eco.red.dew >= cost.d) {
                            
                            const bX = MathUtils.clamp(redQueen.x + MathUtils.randomRange(-350, 350), 100, this.world.width - 100);
                            const bY = MathUtils.clamp(redQueen.y + MathUtils.randomRange(-350, 350), 100, this.world.height - 100);
                            
                            // AI SMART PLACEMENT FIX: Ensure the AI doesn't build perfectly on top of its own buildings!
                            const isOverlapping = this.structures.some(s => 
                                MathUtils.distSq(s.x, s.y, bX, bY) < ((s.size * 2) * (s.size * 2))
                            );

                            if (!isOverlapping) {
                                // Emit the build event exactly like a player clicking the UI
                                this.bus.emit('buildStructure', { x: bX, y: bY, team: 'red', type: type });
                            }
                        }
                    }
                }
            }
        });
    }
};
