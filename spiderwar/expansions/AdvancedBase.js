// expansions/AdvancedBase.js
import { Structure, ResourceNode, MathUtils } from '../game.js';
import { Aphid, GoldenBug } from './Critters.js';

// ==========================================
// 1. CONFIGURATION & AI BALANCING
// ==========================================

const MAP_CONFIG = {
    pad: 600,                 // Safe distance from map edges for base spawning
    exclusionRadiusSq: 90000  // 300px squared exclusion zone for resource spawning around bases
};

export const AI_PROFILES = {
    easy: { 
        unitTickRate: 180, buildTickRate: 600, techUpgradeCost: 350, 
        phase2Tick: 5400, phase3Tick: 7200, phase4Tick: 10800 
    },
    normal: { 
        unitTickRate: 120, buildTickRate: 450, techUpgradeCost: 250, 
        phase2Tick: 3600, phase3Tick: 5400, phase4Tick: 7200 
    },
    hard: { 
        unitTickRate: 80,  buildTickRate: 300, techUpgradeCost: 200, 
        phase2Tick: 2400, phase3Tick: 3600, phase4Tick: 4800 
    },
    insane: { 
        unitTickRate: 50,  buildTickRate: 200, techUpgradeCost: 150, 
        phase2Tick: 1200, phase3Tick: 2400, phase4Tick: 3600 
    }
};

const AI_POOLS = {
    units: {
        phase1: ['harvester', 'harvester', 'soldier', 'tick'],
        phase2: ['harvester', 'soldier', 'spitter', 'phantom'],
        phase3: ['soldier', 'tarantula', 'defiler', 'wraith'],
        phase4: ['tarantula', 'widow', 'goliath', 'voidweaver']
    },
    buildings: {
        phase1: ['nest', 'eggsac', 'pylon', 'extractor'],
        phase2: ['turret', 'wall', 'incubator'],
        phase3: ['mortar', 'shrine', 'monolith'],
        phase4: ['obelisk', 'maw']
    }
};

const BUILD_COSTS = {
    'nest': {p: 150, d: 0}, 'eggsac': {p: 50, d: 0}, 'pylon': {p: 25, d: 0}, 
    'turret': {p: 100, d: 0}, 'wall': {p: 25, d: 0}, 'extractor': {p: 100, d: 0},
    'mortar': {p: 200, d: 50}, 'shrine': {p: 150, d: 100}, 'monolith': {p: 150, d: 50},
    'obelisk': {p: 150, d: 80}, 'incubator': {p: 200, d: 0}, 'maw': {p: 150, d: 0}
};

export const AdvancedBaseExpansion = {
    init: (game) => {
        game.basesInitialized = false;
        if (!game.aiDifficulty) game.aiDifficulty = 'normal'; 
        
        // [EXPANDABILITY] Expose configuration to the game instance so other mods can inject into the AI!
        game.aiConfig = {
            profiles: AI_PROFILES,
            pools: AI_POOLS,
            buildCosts: BUILD_COSTS,
            activeUnitPool: [...AI_POOLS.units.phase1],
            activeBuildPool: [...AI_POOLS.buildings.phase1]
        };
    },

    patch: (game) => {
        game.expansions.patchClass(game.constructor, 'update', function(original) {
            original.call(this);

            if (this.gameState !== 'playing') return;

            const ai = this.aiConfig.profiles[this.aiDifficulty] || this.aiConfig.profiles.normal;

            // ==========================================
            // 2. ONE-TIME BASE & MAP GENERATION (Tick 1)
            // ==========================================
            if (this.tick === 1 && !this.basesInitialized) {
                this.basesInitialized = true;
                
                console.log(`%c[Lore] The Obsidian Brood and Crimson Swarm have awakened. (Difficulty: ${this.aiDifficulty.toUpperCase()})`, "color: #aa00ff; font-style: italic;");

                const bX = MAP_CONFIG.pad + MathUtils.randomRange(0, 200); 
                const bY = MAP_CONFIG.pad + MathUtils.randomRange(0, 200);
                const rX = this.world.width - MAP_CONFIG.pad - MathUtils.randomRange(0, 200); 
                const rY = this.world.height - MAP_CONFIG.pad - MathUtils.randomRange(0, 200);
                
                if (this.mapGrid) {
                    const tileSize = this.tileSize || 256;
                    const tBX = Math.max(0, (bX / tileSize) | 0); 
                    const tBY = Math.max(0, (bY / tileSize) | 0);
                    const tRX = Math.max(0, (rX / tileSize) | 0); 
                    const tRY = Math.max(0, (rY / tileSize) | 0);
                    
                    // [JUICE/FIX] Carve out a 2x2 grid of solid dirt for the bases so they don't clip water edges
                    const carveDirt = (tx, ty) => {
                        for(let x=0; x<=1; x++) {
                            for(let y=0; y<=1; y++) {
                                if(this.mapGrid[ty+y] && this.mapGrid[ty+y][tx+x]) {
                                    this.mapGrid[ty+y][tx+x] = { type: 'dirt', sprite: 'dirt', angle: 0, drawX: (tx+x)*tileSize, drawY: (ty+y)*tileSize };
                                }
                            }
                        }
                    };
                    
                    carveDirt(tBX, tBY);
                    carveDirt(tRX, tRY);
                    
                    if (this.updateBitmasks) this.updateBitmasks();
                }

                // Spawn Base Structures
                this.addEntity(new Structure(bX, bY, 'black', 'nest')); 
                this.addEntity(new Structure(bX + 80, bY, 'black', 'eggsac'));
                this.addEntity(new Structure(rX, rY, 'red', 'nest')); 
                this.addEntity(new Structure(rX - 80, rY, 'red', 'eggsac'));
                
                // JUICE: Massive spawn-in visual effects and camera shake!
                this.bus.emit('particles', {x: bX, y: bY, color: '#aa00ff', count: 150});
                this.bus.emit('particles', {x: rX, y: rY, color: '#ff0000', count: 150});
                if (this.triggerShake) this.triggerShake(15);
                this.bus.emit('playSound', 'death'); 

                this.camera.x = Math.max(0, bX - (this.canvas.width / 2)); 
                this.camera.y = Math.max(0, bY - (this.canvas.height / 2));
                
                const isTooCloseToBase = (x, y) => {
                    return MathUtils.distSq(x, y, bX, bY) < MAP_CONFIG.exclusionRadiusSq || 
                           MathUtils.distSq(x, y, rX, rY) < MAP_CONFIG.exclusionRadiusSq;
                };

                // Scatter Pumpkin Patches
                for (let i = 0; i < 40; i++) {
                    let pX, pY, valid = false;
                    for (let attempts = 0; attempts < 5 && !valid; attempts++) {
                        pX = 600 + Math.random() * (this.world.width - 1200); 
                        pY = 600 + Math.random() * (this.world.height - 1200);
                        if (!isTooCloseToBase(pX, pY) && this.getTerrainAt(pX, pY) !== 'water') valid = true;
                    }

                    if (valid) {
                        let clusterSize = MathUtils.randomInt(5, 10);
                        for (let p = 0; p < clusterSize; p++) {
                            this.addEntity(new ResourceNode(
                                MathUtils.clamp(pX + MathUtils.randomRange(-150, 150), 0, this.world.width), 
                                MathUtils.clamp(pY + MathUtils.randomRange(-150, 150), 0, this.world.height), 
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
                        if (!isTooCloseToBase(dX, dY) && this.getTerrainAt(dX, dY) !== 'water') valid = true;
                    }
                    if (valid) this.addEntity(new ResourceNode(dX, dY, 'dew')); 
                }
                
                for(let i = 0; i < 3; i++) {
                    this.addEntity(new GoldenBug(this.world.width/2 + MathUtils.randomRange(-500, 500), this.world.height/2 + MathUtils.randomRange(-500, 500)));
                }
                
                for(let i = 0; i < 30; i++) {
                    let ax = Math.random() * this.world.width; 
                    let ay = Math.random() * this.world.height;
                    if(this.getTerrainAt(ax, ay) === 'grass' || Math.random() > 0.8) {
                        this.addEntity(new Aphid(ax, ay));
                    }
                }
            }

            // ==========================================
            // 3. CRIMSON SWARM AI: DYNAMIC ESCALATION
            // ==========================================
            
            // Phase Escalation (Triggers once per phase transition)
            if (this.tick === ai.phase2Tick) {
                this.aiConfig.activeUnitPool.push(...this.aiConfig.pools.units.phase2);
                this.aiConfig.activeBuildPool.push(...this.aiConfig.pools.buildings.phase2);
            }
            if (this.tick === ai.phase3Tick) {
                this.aiConfig.activeUnitPool.push(...this.aiConfig.pools.units.phase3);
                this.aiConfig.activeBuildPool.push(...this.aiConfig.pools.buildings.phase3);
            }
            if (this.tick === ai.phase4Tick) {
                this.aiConfig.activeUnitPool.push(...this.aiConfig.pools.units.phase4);
                this.aiConfig.activeBuildPool.push(...this.aiConfig.pools.buildings.phase4);
            }

            // Unit Spawning Loop
            if (this.tick % ai.unitTickRate === 0) {
                
                let redNests = [];
                for (let i = 0; i < this.structures.length; i++) {
                    if (this.structures[i].team === 'red' && this.structures[i].type === 'nest') {
                        redNests.push(this.structures[i]);
                    }
                }
                
                if (redNests.length > 0 && this.pop.red < this.maxPop.red) {
                    let nest = redNests[MathUtils.randomInt(0, redNests.length - 1)];
                    let chosenRole = this.aiConfig.activeUnitPool[MathUtils.randomInt(0, this.aiConfig.activeUnitPool.length - 1)];

                    this.bus.emit('spawnSpider', {
                        x: nest.x, y: nest.y, 
                        team: 'red', 
                        role: chosenRole
                    });
                }
            }

            // Base Expansion Loop
            if (this.tick % ai.buildTickRate === 0) {
                
                let upgradedTech = false;
                
                if (this.tick > ai.phase4Tick && this.eco.red.pumpkins >= ai.techUpgradeCost && Math.random() > 0.5) {
                    this.eco.red.pumpkins -= ai.techUpgradeCost;
                    this.techLevel.red = (this.techLevel.red || 0) + 1;
                    upgradedTech = true;
                    console.log(`[AI Alert] Crimson Swarm evolved to Tech Level ${this.techLevel.red}!`);
                    
                    // JUICE: Tech Upgrade Visuals for the AI!
                    let redQueen = null;
                    for (let i = 0; i < this.entities.length; i++) {
                        if (this.entities[i].team === 'red' && this.entities[i].role === 'queen') {
                            redQueen = this.entities[i]; break;
                        }
                    }
                    if (redQueen) {
                        this.bus.emit('playSound', 'spell');
                        this.bus.emit('particles', {x: redQueen.x, y: redQueen.y, color: '#ff0000', count: 60, type: 'magic'});
                    }
                }

                if (!upgradedTech) {
                    // PERFORMANCE FIX: Clean for-loop
                    let redQueen = null;
                    for (let i = 0; i < this.entities.length; i++) {
                        if (this.entities[i].team === 'red' && this.entities[i].role === 'queen') {
                            redQueen = this.entities[i]; break;
                        }
                    }
                    
                    if (redQueen && redQueen.hp > 0 && !redQueen.activeConstruction && !redQueen.buildTarget) {
                        
                        const type = this.aiConfig.activeBuildPool[MathUtils.randomInt(0, this.aiConfig.activeBuildPool.length - 1)];
                        let cost = this.aiConfig.buildCosts[type];
                        
                        if (cost && this.eco.red.pumpkins >= cost.p && this.eco.red.dew >= cost.d) {
                            
                            // [FIX] Give the AI 5 attempts to find a valid spot (Not overlapping, not in water)
                            let bX, bY, validSpot = false;
                            
                            for (let attempts = 0; attempts < 5; attempts++) {
                                bX = MathUtils.clamp(redQueen.x + MathUtils.randomRange(-350, 350), 100, this.world.width - 100);
                                bY = MathUtils.clamp(redQueen.y + MathUtils.randomRange(-350, 350), 100, this.world.height - 100);
                                
                                // Red AI cannot build in water
                                if (this.getTerrainAt(bX, bY) === 'water') continue;

                                let isOverlapping = false;
                                for (let i = 0; i < this.structures.length; i++) {
                                    let s = this.structures[i];
                                    if (MathUtils.distSq(s.x, s.y, bX, bY) < ((s.size * 2) * (s.size * 2))) {
                                        isOverlapping = true; break;
                                    }
                                }

                                if (!isOverlapping) {
                                    validSpot = true;
                                    break;
                                }
                            }

                            if (validSpot) {
                                this.bus.emit('buildStructure', { x: bX, y: bY, team: 'red', type: type });
                            }
                        }
                    }
                }
            }
        });
    }
};
