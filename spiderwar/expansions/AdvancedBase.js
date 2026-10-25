// expansions/AdvancedBase.js
// [FIX] Imported Spider to prevent fatal ReferenceError crashes during Tech Upgrades!
import { Spider, Structure, ResourceNode, MathUtils } from '../game.js';
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
        unitTickRate: 360, buildTickRate: 1200, techUpgradeCost: 350, // Unit every 6s, build every 20s
        phase2Tick: 18000, phase3Tick: 32400, phase4Tick: 46800,      // Fallback: 5m, 9m, 13m
        maxTechLead: -1, techCooldown: 10800                          // Stays 1 tech behind player
    },
    normal: { 
        unitTickRate: 270, buildTickRate: 900, techUpgradeCost: 250,  // Unit every 4.5s, build every 15s
        phase2Tick: 14400, phase3Tick: 25200, phase4Tick: 36000,      // Fallback: 4m, 7m, 10m
        maxTechLead: 0, techCooldown: 7200                            // Matches player tech level
    },
    hard: { 
        unitTickRate: 180, buildTickRate: 600, techUpgradeCost: 200,  // Unit every 3s, build every 10s
        phase2Tick: 10800, phase3Tick: 18000, phase4Tick: 25200,      // Fallback: 3m, 5m, 7m
        maxTechLead: 1, techCooldown: 5400                            // Can lead player by 1 tech
    },
    insane: { 
        unitTickRate: 120, buildTickRate: 420, techUpgradeCost: 150,  // Unit every 2s, build every 7s
        phase2Tick: 7200,  phase3Tick: 12600, phase4Tick: 18000,      // Fallback: 2m, 3.5m, 5m
        maxTechLead: 2, techCooldown: 3600                            // Can lead player by 2 techs
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
        
        // [FIX] Register critter assets so they don't fall back to generic ellipses!
        game.assets.register('assets/aphid.png');
        game.assets.register('assets/goldenbug.png');
        
        // 🔌 [EXPANDABILITY] Expose configuration to the game instance so other mods can inject into the AI!
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
                    
                    // 🛡️ [FIX] Carve out a 3x3 grid of solid dirt for the bases so they NEVER clip water edges
                    const carveDirt = (tx, ty) => {
                        for(let x = -1; x <= 1; x++) {
                            for(let y = -1; y <= 1; y++) {
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
                
                // 🧃 [JUICE] Massive spawn-in visual effects and camera shake!
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
                            // [FIX] Ensure the scattered coordinates don't land in the river!
                            const nX = MathUtils.clamp(pX + MathUtils.randomRange(-150, 150), 0, this.world.width);
                            const nY = MathUtils.clamp(pY + MathUtils.randomRange(-150, 150), 0, this.world.height);
                            
                            if (this.getTerrainAt(nX, nY) !== 'water') {
                                this.addEntity(new ResourceNode(nX, nY, 'pumpkin'));
                            }
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
                
                // Scatter Neutral Critters
                // 🛡️ [FIX] Try/Catch wrapper so a missing or corrupted Critters.js doesn't crash initialization
                try {
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
                } catch (err) {
                    console.warn("[AdvancedBase] Critters module missing or failed to initialize. Skipping critter generation.");
                }
            }

            // ==========================================
            // 3. CRIMSON SWARM AI: DYNAMIC ESCALATION
            // ==========================================
            
            // Initialize tracking flags so we only escalate once per phase
            if (this.aiConfig.phase2Escalated === undefined) {
                this.aiConfig.phase2Escalated = false;
                this.aiConfig.phase3Escalated = false;
                this.aiConfig.phase4Escalated = false;
            }

            // 🧃 [JUICE] Phase Escalation UI & Sound Hooks
            const escalatePhase = (phaseNum, targetTick) => {
                const phaseStr = `phase${phaseNum}`;
                
                // 🛡️ [FIX] Prevent Duplicate Pushing on Save/Load Catchup!
                const newUnits = this.aiConfig.pools.units[phaseStr];
                newUnits.forEach(u => {
                    if (!this.aiConfig.activeUnitPool.includes(u)) this.aiConfig.activeUnitPool.push(u);
                });

                const newBuilds = this.aiConfig.pools.buildings[phaseStr];
                newBuilds.forEach(b => {
                    if (!this.aiConfig.activeBuildPool.includes(b)) this.aiConfig.activeBuildPool.push(b);
                });
                
                // Mute the SFX/VFX if the game is "catching up" after loading a save file
                const isCatchingUp = (this.tick > targetTick + 5);
                
                if (!isCatchingUp) {
                    if (this.showSystemMessage) this.showSystemMessage(`THE SWARM EVOLVES: PHASE ${phaseNum}`, '#ff0000');
                    this.bus.emit('playSound', 'roar');
                    if (this.triggerShake) this.triggerShake(8);
                }
                
                console.log(`%c[AI Alert] Crimson Swarm reached Phase ${phaseNum}! ${isCatchingUp ? '(Save Loaded)' : ''}`, "color: #ff0000; font-weight: bold;");
            };

            // Adaptive Phase Escalation:
            // Escalate when the player reaches the corresponding Tech Level/Pop, OR when the long fallback timer expires.
            // We also enforce a minimum time floor (e.g., 2 mins for Phase 2) so early player rushes don't instant-trigger it.
            const playerTech = this.techLevel.black || 0;
            const playerPop = this.pop.black || 0;

            const readyForPhase2 = (this.tick >= 7200 && (playerTech >= 1 || playerPop >= 12)) || this.tick >= ai.phase2Tick;
            const readyForPhase3 = (this.tick >= 14400 && (playerTech >= 2 || playerPop >= 20)) || this.tick >= ai.phase3Tick;
            const readyForPhase4 = (this.tick >= 21600 && (playerTech >= 3 || playerPop >= 30)) || this.tick >= ai.phase4Tick;

            if (readyForPhase2 && !this.aiConfig.phase2Escalated) { 
                this.aiConfig.phase2Escalated = true; escalatePhase(2, this.tick - 10); 
            }
            if (readyForPhase3 && !this.aiConfig.phase3Escalated) { 
                this.aiConfig.phase3Escalated = true; escalatePhase(3, this.tick - 10); 
            }
            if (readyForPhase4 && !this.aiConfig.phase4Escalated) { 
                this.aiConfig.phase4Escalated = true; escalatePhase(4, this.tick - 10); 
            }

            // Adaptive Unit Spawning Rate:
            // If the AI already outnumbers the player by more than 8 units, slow its spawning down by 50%
            const popDiff = (this.pop.red || 0) - (this.pop.black || 0);
            const effectiveUnitRate = popDiff > 8 ? Math.floor(ai.unitTickRate * 1.5) : ai.unitTickRate;

            if (this.tick % effectiveUnitRate === 0) {
                let redNests = [];
                const structs = this.structures;
                for (let i = 0; i < structs.length; i++) {
                    if (structs[i].team === 'red' && structs[i].type === 'nest') redNests.push(structs[i]);
                }
                
                if (redNests.length > 0 && this.pop.red < this.maxPop.red) {
                    let nest = redNests[MathUtils.randomInt(0, redNests.length - 1)];
                    let chosenRole = this.aiConfig.activeUnitPool[MathUtils.randomInt(0, this.aiConfig.activeUnitPool.length - 1)];

                    this.bus.emit('spawnSpider', { x: nest.x, y: nest.y, team: 'red', role: chosenRole });
                }
            }

            // Base Expansion & Player-Scaled Tech Loop
            if (this.tick % ai.buildTickRate === 0) {
                let upgradedTech = false;
                if (!this.aiConfig.nextTechTick) this.aiConfig.nextTechTick = 10800; // Earliest AI tech upgrade: 3 mins
                
                const maxAllowedRedTech = Math.max(0, (this.techLevel.black || 0) + (ai.maxTechLead ?? 0));
                const canUpgradeTech = this.tick >= this.aiConfig.nextTechTick &&
                                       (this.techLevel.red || 0) < maxAllowedRedTech &&
                                       this.eco.red.pumpkins >= ai.techUpgradeCost;

                if (canUpgradeTech && Math.random() > 0.5) {
                    this.eco.red.pumpkins -= ai.techUpgradeCost;
                    this.techLevel.red = (this.techLevel.red || 0) + 1;
                    this.aiConfig.nextTechTick = this.tick + (ai.techCooldown || 7200);
                    upgradedTech = true;
                    
                    // [FIX] Apply tech HP bonus to all existing entities instantly
                    for (let i = 0; i < this.entities.length; i++) {
                        let e = this.entities[i];
                        if (e.team === 'red' && e.hp > 0 && e.role !== 'queen' && (e instanceof Spider || e instanceof Structure)) {
                            e.maxHp += 20; e.hp += 20;
                        }
                    }
                    
                    if (this.showSystemMessage) this.showSystemMessage(`CRIMSON SWARM TECH LVL ${this.techLevel.red}`, '#ff0000');
                    
                    const queens = this.queens;
                    let redQueen = null;
                    for (let i = 0; i < queens.length; i++) {
                        if (queens[i].team === 'red') { redQueen = queens[i]; break; }
                    }
                    if (redQueen) {
                        this.bus.emit('playSound', 'spell');
                        this.bus.emit('particles', {x: redQueen.x, y: redQueen.y, color: '#ff0000', count: 60, type: 'magic'});
                    }
                }

                if (!upgradedTech) {
                    const queens = this.queens;
                    let redQueen = null;
                    for (let i = 0; i < queens.length; i++) {
                        if (queens[i].team === 'red') { redQueen = queens[i]; break; }
                    }
                    
                    // [FIX] Prevent the AI from building random bases in the middle of the map while marching to attack!
                    let redNest = null;
                    const structs = this.structures;
                    for (let i = 0; i < structs.length; i++) {
                        if (structs[i].team === 'red' && structs[i].type === 'nest') { redNest = structs[i]; break; }
                    }

                    // [FIX] Prevent the AI from building random bases in the middle of the map while marching to attack!
                    if (redQueen && redQueen.hp > 0 && !redQueen.activeConstruction && !redQueen.buildTarget && !redQueen.isAssaulting) {
                        
                        const type = this.aiConfig.activeBuildPool[MathUtils.randomInt(0, this.aiConfig.activeBuildPool.length - 1)];
                        let cost = this.aiConfig.buildCosts[type];
                        
                        if (cost && this.eco.red.pumpkins >= cost.p && this.eco.red.dew >= cost.d) {
                            
                            let bX, bY, validSpot = false;
                            
                            // Give the AI 5 attempts to find a valid spot
                            for (let attempts = 0; attempts < 5; attempts++) {
                                bX = MathUtils.clamp(redQueen.x + MathUtils.randomRange(-350, 350), 100, this.world.width - 100);
                                bY = MathUtils.clamp(redQueen.y + MathUtils.randomRange(-350, 350), 100, this.world.height - 100);
                                
                                // Red AI cannot build in water
                                if (this.getTerrainAt(bX, bY) === 'water') continue;

                                let isOverlapping = false;
                                const structs = this.structures;
                                const checkSize = 40; // Max expected size of a new building
                                
                                for (let i = 0; i < structs.length; i++) {
                                    let s = structs[i];
                                    const safeDist = s.size + checkSize;
                                    
                                    // 🚀 [PERFORMANCE] Fast AABB Check before expensive distSq math!
                                    if (Math.abs(s.x - bX) > safeDist || Math.abs(s.y - bY) > safeDist) continue;
                                    
                                    if (MathUtils.distSq(s.x, s.y, bX, bY) < (safeDist * safeDist)) {
                                        isOverlapping = true; break;
                                    }
                                }

                                if (!isOverlapping) {
                                    validSpot = true; break;
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
