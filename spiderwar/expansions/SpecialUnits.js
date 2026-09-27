// expansions/SpecialUnits.js
import { Spider, Projectile, MathUtils, UNIT_DATA } from '../game.js';

// ==========================================
// 1. CONFIGURATION & BALANCING
// ==========================================
const SPECIAL_CONFIG = {
    spitter: { 
        hp: 75, damage: 25, attackSpeed: 45, range: 250, size: 12, 
        baseSpeedMin: 0.8, baseSpeedMax: 1.2, cost: 40 
    },
    tarantula: { 
        hp: 400, damage: 45, attackSpeed: 40, size: 22, 
        baseSpeedMin: 0.5, baseSpeedMax: 0.7, cost: 75 
    }
};

export const SpecialUnitsExpansion = {
    init: (game) => {
        // 1. Inject stats into the core engine's data dictionary!
        UNIT_DATA['spitter'] = { 
            size: SPECIAL_CONFIG.spitter.size, hp: SPECIAL_CONFIG.spitter.hp, 
            damage: SPECIAL_CONFIG.spitter.damage, attackSpeed: SPECIAL_CONFIG.spitter.attackSpeed,
            baseSpeedMin: SPECIAL_CONFIG.spitter.baseSpeedMin, baseSpeedMax: SPECIAL_CONFIG.spitter.baseSpeedMax
        };
        UNIT_DATA['tarantula'] = { 
            size: SPECIAL_CONFIG.tarantula.size, hp: SPECIAL_CONFIG.tarantula.hp, 
            damage: SPECIAL_CONFIG.tarantula.damage, attackSpeed: SPECIAL_CONFIG.tarantula.attackSpeed,
            baseSpeedMin: SPECIAL_CONFIG.tarantula.baseSpeedMin, baseSpeedMax: SPECIAL_CONFIG.tarantula.baseSpeedMax
        };

        // 2. Safely hook into the spawn system for ONLY our specific units
        game.bus.on('spawnSpider', (data) => {
            const costs = {
                'spitter': SPECIAL_CONFIG.spitter.cost,
                'tarantula': SPECIAL_CONFIG.tarantula.cost
            };

            let cost = costs[data.role];
            
            // Only proceed if it is one of THIS expansion's units
            if (cost !== undefined) {
                if (game.eco[data.team].pumpkins >= cost && game.pop[data.team] < game.maxPop[data.team]) {
                    game.eco[data.team].pumpkins -= cost;
                    
                    let s = new Spider(
                        data.x + MathUtils.randomRange(-25, 25), 
                        data.y + MathUtils.randomRange(-25, 25), 
                        data.team, data.role
                    );
                    
                    // Assign lore-friendly sprites
                    if (data.role === 'spitter') s.sprite.src = data.team === 'black' ? 'assets/spitter_black.png' : 'assets/spitter_red.png';
                    if (data.role === 'tarantula') s.sprite.src = data.team === 'black' ? 'assets/tarantula_black.png' : 'assets/tarantula_red.png';
                    
                    // Assign range custom property for the Spitter
                    if (data.role === 'spitter') s.range = SPECIAL_CONFIG.spitter.range;

                    game.addEntity(s);
                    game.bus.emit('playSound', 'harvest'); // Squishy spawn sound
                }
            }
        });
    },

    patch: (game) => {
        // 3. Ranged Combat AI for Spitters
        game.expansions.patchClass(Spider, 'update', function(original, gameObj) {
            
            if (this.role === 'spitter') {
                const techLvl = gameObj.techLevel[this.team] || 0; 
                const currentDamage = this.damage + (techLvl * 5); 
                
                // Environmental and magical speed modifiers
                const terrain = gameObj.getTerrainAt(this.x, this.y); 
                let tMod = (terrain === 'water') ? 0.05 : ((terrain === 'grass') ? 1.3 : 1.0);
                let currentSpeed = (this.baseSpeed + (techLvl * 0.15)) * tMod;
                if (this.isSlowed) currentSpeed *= 0.3;
                this.isSlowed = false; // Reset trap debuff

                const detectRadius = this.range + 50 + (techLvl * 10);
                let nearestEnemy = gameObj.getNearestEnemy(this.x, this.y, this.team, detectRadius);

                // COMBAT OVERRIDE: Prioritize shooting over everything else!
                if (nearestEnemy) {
                    this.state = 'combat'; 
                    this.angle = Math.atan2(nearestEnemy.y - this.y, nearestEnemy.x - this.x);
                    const distSq = MathUtils.distSq(this.x, this.y, nearestEnemy.x, nearestEnemy.y);
                    
                    if (distSq > this.range * this.range) {
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
                // If the spitter has no enemies in range, but is under player command, move there!
                if (this.isManual && this.commandTarget) {
                    const dx = this.commandTarget.x - this.x; 
                    const dy = this.commandTarget.y - this.y;
                    
                    if (MathUtils.distSq(0, 0, dx, dy) > 225) { 
                        const targetAngle = Math.atan2(dy, dx);
                        
                        // Smooth rotation
                        let diff = targetAngle - this.angle;
                        while (diff > Math.PI) diff -= Math.PI * 2;
                        while (diff < -Math.PI) diff += Math.PI * 2;
                        this.angle += (diff * 0.15); 
                        
                        this.x += Math.cos(this.angle) * currentSpeed; 
                        this.y += Math.sin(this.angle) * currentSpeed;
                    } else {
                        this.commandTarget = null; // Target reached
                    }
                    return; // Prevent standard melee AI from running
                }
            }
            
            // Tarantulas (heavy melee) and non-combat Spitters safely fall back to the standard AI
            original.call(this, gameObj);
        });
    }
};
