// expansions/SpecialUnits.js
import { Spider, Projectile, MathUtils, UNIT_DATA, SPIDER_STATE } from '../game.js';

// ==========================================
// 1. CONFIGURATION & BALANCING
// ==========================================
const SPECIAL_CONFIG = {
    spitter: { 
        hp: 75, damage: 25, attackSpeed: 45, size: 12, 
        baseSpeedMin: 0.8, baseSpeedMax: 1.2, cost: 40,
        range: 250, rangeSq: 62500 // Pre-calculated for fast MathUtils.distSq comparisons
    },
    tarantula: { 
        hp: 400, damage: 45, attackSpeed: 40, size: 22, 
        baseSpeedMin: 0.5, baseSpeedMax: 0.7, cost: 75 
    }
};

const TWO_PI = Math.PI * 2;

export const SpecialUnitsExpansion = {
    init: (game) => {
        // --- 1. ASSET REGISTRY ---
        game.assets.register('assets/spitter_black.png');
        game.assets.register('assets/spitter_red.png');
        game.assets.register('assets/tarantula_black.png');
        game.assets.register('assets/tarantula_red.png');

        // --- PILLAR 3: TRAIT ASSIGNMENT ---
        UNIT_DATA['spitter'] = { 
            size: SPECIAL_CONFIG.spitter.size, hp: SPECIAL_CONFIG.spitter.hp, 
            damage: SPECIAL_CONFIG.spitter.damage, attackSpeed: SPECIAL_CONFIG.spitter.attackSpeed, 
            baseSpeedMin: SPECIAL_CONFIG.spitter.baseSpeedMin, baseSpeedMax: SPECIAL_CONFIG.spitter.baseSpeedMax,
            traits: ['ranged_attacker', 'escort'] // Automatically guards the queen when idle!
        };
        
        UNIT_DATA['tarantula'] = { 
            size: SPECIAL_CONFIG.tarantula.size, hp: SPECIAL_CONFIG.tarantula.hp, 
            damage: SPECIAL_CONFIG.tarantula.damage, attackSpeed: SPECIAL_CONFIG.tarantula.attackSpeed, 
            baseSpeedMin: SPECIAL_CONFIG.tarantula.baseSpeedMin, baseSpeedMax: SPECIAL_CONFIG.tarantula.baseSpeedMax,
            traits: ['melee', 'escort'] // Heavy melee guard
        };

        game.bus.on('spawnSpider', (data) => {
            // PERFORMANCE FIX: Pull directly from config instead of recreating an object in memory every spawn
            const config = SPECIAL_CONFIG[data.role];
            
            if (config && config.cost !== undefined) {
                // SAFETY FIX: Optional chaining on game.eco[data.team]
                if (game.eco[data.team]?.pumpkins >= config.cost && game.pop[data.team] < game.maxPop[data.team]) {
                    game.eco[data.team].pumpkins -= config.cost;
                    
                    let s = new Spider(data.x + MathUtils.randomRange(-25, 25), data.y + MathUtils.randomRange(-25, 25), data.team, data.role);
                    
                    // --- 2. INSTANT RAM CACHE RETRIEVAL ---
                    if (data.role === 'spitter') {
                        s.sprite = game.assets.get(data.team === 'black' ? 'assets/spitter_black.png' : 'assets/spitter_red.png');
                        s.range = config.range; 
                        s.rangeSq = config.rangeSq; // PERFORMANCE FIX: Cache squared range for AABB math
                    } else if (data.role === 'tarantula') {
                        s.sprite = game.assets.get(data.team === 'black' ? 'assets/tarantula_black.png' : 'assets/tarantula_red.png');
                    }
                    
                    s.imageLoaded = true; // Tell base engine it's ready immediately
                    game.addEntity(s);
                    game.bus.emit('playSound', 'harvest'); 
                }
            }
        });
    },

    patch: (game) => {
        // 3. Ranged Combat AI for any unit with the 'ranged_attacker' trait!
        game.expansions.patchClass(Spider, 'update', function(original, gameObj) {
            
            // --- PILLAR 3: TRAIT-BASED AI CHECK ---
            if (this.hasTrait('ranged_attacker')) {
                const techLvl = gameObj.techLevel[this.team] || 0; 
                const currentDamage = this.damage + (techLvl * 5); 
                
                // Environmental and magical speed modifiers
                const terrain = gameObj.getTerrainAt(this.x, this.y); 
                let tMod = (terrain === 'water') ? 0.05 : ((terrain === 'grass') ? 1.3 : 1.0);
                let currentSpeed = (this.baseSpeed + (techLvl * 0.15)) * tMod;
                if (this.isSlowed) currentSpeed *= 0.3;
                this.isSlowed = false; // Reset trap debuff

                const detectRadius = (this.range || 200) + 50 + (techLvl * 10);
                let nearestEnemy = gameObj.getNearestEnemy(this.x, this.y, this.team, detectRadius);

                // COMBAT OVERRIDE: Prioritize shooting over everything else!
                if (nearestEnemy) {
                    this.state = SPIDER_STATE.COMBAT; 
                    this.angle = Math.atan2(nearestEnemy.y - this.y, nearestEnemy.x - this.x);
                    const distSq = MathUtils.distSq(this.x, this.y, nearestEnemy.x, nearestEnemy.y);
                    
                    // PERFORMANCE FIX: Use pre-cached squared range to skip multiplication
                    const effectiveRangeSq = this.rangeSq || 40000;

                    if (distSq > effectiveRangeSq) {
                        // Chase until in range
                        this.x += Math.cos(this.angle) * currentSpeed; 
                        this.y += Math.sin(this.angle) * currentSpeed;
                    } else {
                        // In range, open fire!
                        this.cooldown = (this.cooldown || 0) - 1;
                        if (this.cooldown <= 0) {
                            gameObj.addEntity(new Projectile(this.x, this.y, nearestEnemy, currentDamage, this.team));
                            gameObj.bus.emit('playSound', 'shoot');
                            
                            // Ranged Recoil Effect
                            this.x -= Math.cos(this.angle) * 4; 
                            this.y -= Math.sin(this.angle) * 4; 
                            
                            this.cooldown = this.attackSpeed;
                        }
                    }
                    return; // Prevent standard melee AI from running
                }

                // MANUAL MOVEMENT OVERRIDE: 
                // If the ranged unit has no enemies in range, but is under player command, move there!
                if (this.isManual && this.commandTarget) {
                    const dx = this.commandTarget.x - this.x; 
                    const dy = this.commandTarget.y - this.y;
                    
                    if (MathUtils.distSq(0, 0, dx, dy) > 225) { 
                        const targetAngle = Math.atan2(dy, dx);
                        
                        // Smooth rotation (Using optimized TWO_PI)
                        let diff = targetAngle - this.angle;
                        while (diff > Math.PI) diff -= TWO_PI;
                        while (diff < -Math.PI) diff += TWO_PI;
                        this.angle += (diff * 0.15); 
                        
                        this.x += Math.cos(this.angle) * currentSpeed; 
                        this.y += Math.sin(this.angle) * currentSpeed;
                        
                        // SAFETY FIX: Clamp manual movement so they don't wander off the map!
                        const bnd = this.size * 2;
                        this.x = MathUtils.clamp(this.x, bnd, gameObj.world.width - bnd);
                        this.y = MathUtils.clamp(this.y, bnd, gameObj.world.height - bnd);

                    } else {
                        this.commandTarget = null; // Target reached
                    }
                    return; // Prevent standard melee AI from running
                }
            }
            
            // All non-ranged combat units safely fall back to the standard AI (which now handles Escort/Gatherer traits!)
            original.call(this, gameObj);
        });
    }
};
