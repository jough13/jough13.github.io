// expansions/AdvancedBase.js
import { Structure, ResourceNode, MathUtils } from '../game.js';
import { Aphid, GoldenBug } from './Critters.js';

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
            // 1. ONE-TIME BASE & MAP GENERATION (Tick 1)
            // ==========================================
            // We wait until tick 1 to guarantee TerrainGen has finished building the map grid
            if (this.tick === 1 && !this.basesInitialized) {
                this.basesInitialized = true;
                
                console.log("%c[Lore] The Obsidian Brood and Crimson Swarm have awakened.", "color: #aa00ff; font-style: italic;");

                const pad = 600; 
                
                // Player Spawn (Obsidian Brood - Top Left-ish)
                const bX = pad + MathUtils.randomRange(0, 200); 
                const bY = pad + MathUtils.randomRange(0, 200);
                
                // Enemy Spawn (Crimson Swarm - Bottom Right-ish)
                const rX = this.world.width - pad - MathUtils.randomRange(0, 200); 
                const rY = this.world.height - pad - MathUtils.randomRange(0, 200);
                
                // Clear the terrain directly under the spawn points so nests don't spawn in water
                const tBX = Math.max(0, Math.floor(bX / this.tileSize)); 
                const tBY = Math.max(0, Math.floor(bY / this.tileSize));
                const tRX = Math.max(0, Math.floor(rX / this.tileSize)); 
                const tRY = Math.max(0, Math.floor(rY / this.tileSize));
                
                if(this.mapGrid[tBY] && this.mapGrid[tBY][tBX]) this.mapGrid[tBY][tBX] = { type: 'dirt', sprite: 'dirt', angle: 0 };
                if(this.mapGrid[tRY] && this.mapGrid[tRY][tRX]) this.mapGrid[tRY][tRX] = { type: 'dirt', sprite: 'dirt', angle: 0 };
                
                if (this.updateBitmasks) this.updateBitmasks();

                // Spawn Base Structures
                this.addEntity(new Structure(bX, bY, 'black', 'nest')); 
                this.addEntity(new Structure(bX + 80, bY, 'black', 'eggsac'));
                
                this.addEntity(new Structure(rX, rY, 'red', 'nest')); 
                this.addEntity(new Structure(rX - 80, rY, 'red', 'eggsac'));
                
                // Center camera on player base
                this.camera.x = Math.max(0, bX - (this.canvas.width / 2)); 
                this.camera.y = Math.max(0, bY - (this.canvas.height / 2));
                
                // Scatter Pumpkin Patches
                for (let i = 0; i < 40; i++) {
                    let pX = 600 + Math.random() * (this.world.width - 1200); 
                    let pY = 600 + Math.random() * (this.world.height - 1200);
                    let clusterSize = MathUtils.randomInt(5, 10);
                    
                    for (let p = 0; p < clusterSize; p++) {
                        this.addEntity(new ResourceNode(
                            pX + MathUtils.randomRange(-150, 150), 
                            pY + MathUtils.randomRange(-150, 150), 
                            'pumpkin'
                        ));
                    }
                }
                
                // Scatter Magic Dew
                for (let i = 0; i < 60; i++) { 
                    this.addEntity(new ResourceNode(Math.random() * this.world.width, Math.random() * this.world.height, 'dew')); 
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
            // 2. CRIMSON SWARM AI: DYNAMIC ESCALATION
            // ==========================================
            
            // Unit Spawning Loop (Runs every ~4 seconds / 120 ticks)
            if (this.tick % 120 === 0) {
                let redNests = this.structures.filter(s => s.team === 'red' && s.type === 'nest');
                
                if (redNests.length > 0 && this.pop.red < this.maxPop.red) {
                    let nest = redNests[MathUtils.randomInt(0, redNests.length - 1)];
                    
                    // AI Escalation: Unlocks advanced units as time goes on
                    let availableRoles = ['harvester', 'harvester', 'soldier']; // Weighted towards eco early
                    if (this.tick > 3600) availableRoles.push('soldier', 'spitter'); // ~2 minutes in
                    if (this.tick > 7200) availableRoles.push('tarantula', 'spitter'); // ~4 minutes in
                    
                    let chosenRole = availableRoles[MathUtils.randomInt(0, availableRoles.length - 1)];

                    this.bus.emit('spawnSpider', {
                        x: nest.x, y: nest.y, 
                        team: 'red', 
                        role: chosenRole
                    });
                }
            }

            // Base Expansion Loop (Runs every ~15 seconds / 450 ticks)
            if (this.tick % 450 === 0) {
                
                // --- FIX: AI Tech Escalation ---
                let upgradedTech = false;
                // After 4 minutes (7200 ticks), the AI has a 50% chance to spend surplus pumpkins on Tech
                if (this.tick > 7200 && this.eco.red.pumpkins >= 250 && Math.random() > 0.5) {
                    this.eco.red.pumpkins -= 250;
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
                        if (this.tick > 5400) availableBuildings.push('mortar', 'shrine'); // ~3 minutes in
                        
                        const type = availableBuildings[MathUtils.randomInt(0, availableBuildings.length - 1)];
                        
                        // AI Cost check before committing (prevents spamming the event bus uselessly)
                        const costs = { 
                            'nest': {p: 150, d: 0}, 'eggsac': {p: 50, d: 0}, 'pylon': {p: 25, d: 0}, 
                            'turret': {p: 100, d: 0}, 'wall': {p: 25, d: 0},
                            'mortar': {p: 200, d: 50}, 'shrine': {p: 150, d: 100}
                        };
                        
                        let cost = costs[type];
                        
                        if (this.eco.red.pumpkins >= cost.p && this.eco.red.dew >= cost.d) {
                            // Offset the building placement randomly near the queen, but clamp it safely inside the map!
                            const bX = MathUtils.clamp(redQueen.x + MathUtils.randomRange(-350, 350), 100, this.world.width - 100);
                            const bY = MathUtils.clamp(redQueen.y + MathUtils.randomRange(-350, 350), 100, this.world.height - 100);
                            
                            // Emit the build event exactly like a player clicking the UI
                            this.bus.emit('buildStructure', { x: bX, y: bY, team: 'red', type: type });
                        }
                    }
                }
            }
        });
    }
};
