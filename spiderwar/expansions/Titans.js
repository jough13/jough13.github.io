// expansions/Titans.js
import { Spider, MathUtils, UNIT_DATA, SPIDER_STATE } from '../game.js';

// ==========================================
// 1. CONFIGURATION & BALANCING
// ==========================================
const TITAN_CONFIG = {
    widow: { 
        hp: 150, damage: 100, attackSpeed: 20, size: 16, 
        baseSpeedMin: 1.8, baseSpeedMax: 2.1, costP: 150, costD: 50, 
        decloakTime: 150 
    },
    goliath: { 
        hp: 1200, damage: 90, attackSpeed: 60, size: 38, 
        baseSpeedMin: 0.3, baseSpeedMax: 0.5, costP: 400, costD: 150, 
        range: 300, rangeSq: 90000,                  
        splashRadius: 100, splashRadiusSq: 10000,    
        projSpeed: 3.5 
    }
};

const TWO_PI = Math.PI * 2;

// ==========================================
// 2. GOLIATH SIEGE PROJECTILE
// ==========================================
export class ExplosiveProjectile {
    constructor(x, y, target, damage, team) {
        this.x = x; this.y = y; 
        this.target = target; 
        this.damage = damage; 
        this.team = team;
        this.speed = TITAN_CONFIG.goliath.projSpeed; 
        this.active = true;
    }

    update(game) {
        if(!this.target || this.target.hp === undefined || this.target.hp <= 0) { 
            this.active = false; 
            return; 
        }

        const dx = this.target.x - this.x; 
        const dy = this.target.y - this.y;
        const distSq = MathUtils.distSq(this.x, this.y, this.target.x, this.target.y);
        
        if (distSq < 225) { 
            this.active = false; 
            game.bus.emit('playSound', 'death'); 
            
            const magicColor = this.team === 'black' ? '#aa00ff' : '#ff0000';
            game.bus.emit('particles', {x: this.target.x, y: this.target.y, color: magicColor, count: 40});
            game.bus.emit('particles', {x: this.target.x, y: this.target.y, color: '#ffaa00', count: 20, type: 'splatter'});
            
            const splashRad = TITAN_CONFIG.goliath.splashRadius;
            const splashRadSq = TITAN_CONFIG.goliath.splashRadiusSq;

            for (let i = 0; i < game.entities.length; i++) {
                let e = game.entities[i];
                if (!e.team || e.team === this.team || e.team === 'nature' || e.hp === undefined || e.hp <= 0) continue;
                if (Math.abs(this.x - e.x) > splashRad || Math.abs(this.y - e.y) > splashRad) continue;

                if (MathUtils.distSq(this.x, this.y, e.x, e.y) < splashRadSq) { 
                    if (e instanceof Spider || e.constructor.name === 'CentipedeBoss') e.hp -= this.damage;
                    else e.hp -= (this.damage * 0.5); 
                }
            }
        } else {
            const dist = Math.sqrt(distSq);
            if (dist > 0) {
                this.x += (dx/dist) * this.speed; 
                this.y += (dy/dist) * this.speed; 
            }
        }
    }

    draw(ctx) { 
        const magicColor = this.team === 'black' ? '#aa00ff' : '#ff0000';
        ctx.fillStyle = magicColor; 
        ctx.beginPath(); ctx.arc(this.x, this.y, 8, 0, TWO_PI); ctx.fill(); 
        ctx.fillStyle = '#ffaa00'; 
        ctx.beginPath(); ctx.arc(this.x, this.y, 4, 0, TWO_PI); ctx.fill(); 
    }
}

// ==========================================
// 3. EXPANSION LOGIC
// ==========================================
export const TitansExpansion = {
    init: (game) => {
        // --- 1. ASSET REGISTRY ---
        game.assets.register('assets/widow_black.png');
        game.assets.register('assets/widow_red.png');
        game.assets.register('assets/goliath_black.png');
        game.assets.register('assets/goliath_red.png');

        // --- 2. TRAIT ASSIGNMENT ---
        UNIT_DATA['widow'] = { 
            size: TITAN_CONFIG.widow.size, hp: TITAN_CONFIG.widow.hp, 
            damage: TITAN_CONFIG.widow.damage, attackSpeed: TITAN_CONFIG.widow.attackSpeed, 
            baseSpeedMin: TITAN_CONFIG.widow.baseSpeedMin, baseSpeedMax: TITAN_CONFIG.widow.baseSpeedMax,
            traits: ['melee', 'stealth'] 
        };
        
        UNIT_DATA['goliath'] = { 
            size: TITAN_CONFIG.goliath.size, hp: TITAN_CONFIG.goliath.hp, 
            damage: TITAN_CONFIG.goliath.damage, attackSpeed: TITAN_CONFIG.goliath.attackSpeed, 
            baseSpeedMin: TITAN_CONFIG.goliath.baseSpeedMin, baseSpeedMax: TITAN_CONFIG.goliath.baseSpeedMax,
            traits: ['siege_attacker'] 
        };

        // --- 3. ECS TRAIT REGISTRATION! ---
        
        // Stealth Trait
        game.registerTrait('stealth', {
            update: (entity, gameObj) => {
                // Handle stealth cooldown and visual effects
                if (entity.cloakCooldown > 0) {
                    entity.cloakCooldown--;
                    if (entity.cloakCooldown <= 0) {
                        gameObj.bus.emit('particles', {x: entity.x, y: entity.y, color: '#333333', count: 15});
                        gameObj.bus.emit('playSound', 'spell'); 
                    }
                }
                entity.isCloaked = (entity.cloakCooldown <= 0);

                // Strip stealth instantly if the unit just attacked!
                if (entity.cooldown >= entity.attackSpeed - 1 && entity.cooldown > 0) {
                    entity.cloakCooldown = TITAN_CONFIG.widow.decloakTime; 
                    entity.isCloaked = false;
                }
                
                return false; // Return false to allow standard melee AI to continue running
            }
        });

        // Siege Attacker Trait
        game.registerTrait('siege_attacker', {
            update: (entity, gameObj) => {
                const techLvl = gameObj.techLevel[entity.team] || 0; 
                const currentDamage = entity.damage + (techLvl * 5); 
                
                const terrain = gameObj.getTerrainAt(entity.x, entity.y); 
                let tMod = (terrain === 'water') ? 0.05 : ((terrain === 'grass') ? 1.3 : 1.0);
                let currentSpeed = (entity.baseSpeed + (techLvl * 0.15)) * tMod;
                if (entity.isSlowed) currentSpeed *= 0.3;
                entity.isSlowed = false; 

                const detectRadius = entity.range + 50 + (techLvl * 10);
                let nearestEnemy = gameObj.getNearestEnemy(entity.x, entity.y, entity.team, detectRadius);

                // COMBAT OVERRIDE
                if (nearestEnemy) {
                    entity.state = SPIDER_STATE.COMBAT; 
                    entity.angle = Math.atan2(nearestEnemy.y - entity.y, nearestEnemy.x - entity.x);
                    const distSq = MathUtils.distSq(entity.x, entity.y, nearestEnemy.x, nearestEnemy.y);
                    const effectiveRangeSq = entity.rangeSq || 90000;

                    if (distSq > effectiveRangeSq) {
                        entity.x += Math.cos(entity.angle) * currentSpeed; 
                        entity.y += Math.sin(entity.angle) * currentSpeed;
                    } else {
                        entity.cooldown = (entity.cooldown || 0) - 1;
                        if (entity.cooldown <= 0) {
                            gameObj.addEntity(new ExplosiveProjectile(entity.x, entity.y, nearestEnemy, currentDamage, entity.team));
                            gameObj.bus.emit('playSound', 'shoot');
                            entity.x -= Math.cos(entity.angle) * 5; 
                            entity.y -= Math.sin(entity.angle) * 5; 
                            entity.cooldown = entity.attackSpeed;
                        }
                    }
                    return true; // Prevent standard melee AI!
                }

                // MANUAL MOVEMENT OVERRIDE (Stutter-Step Logic)
                if (entity.isManual && entity.commandTarget) {
                    const dx = entity.commandTarget.x - entity.x; 
                    const dy = entity.commandTarget.y - entity.y;
                    
                    if (MathUtils.distSq(0, 0, dx, dy) > 225) { 
                        const targetAngle = Math.atan2(dy, dx);
                        let diff = targetAngle - entity.angle;
                        while (diff > Math.PI) diff -= TWO_PI;
                        while (diff < -Math.PI) diff += TWO_PI;
                        entity.angle += (diff * 0.05); 
                        
                        entity.x += Math.cos(entity.angle) * currentSpeed; 
                        entity.y += Math.sin(entity.angle) * currentSpeed;
                        
                        const bnd = entity.size * 2;
                        entity.x = MathUtils.clamp(entity.x, bnd, gameObj.world.width - bnd);
                        entity.y = MathUtils.clamp(entity.y, bnd, gameObj.world.height - bnd);
                    } else {
                        entity.commandTarget = null; 
                    }
                    return true; // Prevent standard melee AI!
                }
                
                return false; 
            }
        });

        // --- 4. SPAWN LOGIC ---
        game.bus.on('spawnSpider', (data) => {
            const config = TITAN_CONFIG[data.role];
            if (config && config.costP !== undefined) {
                if (game.eco[data.team]?.pumpkins >= config.costP && game.eco[data.team]?.dew >= config.costD && game.pop[data.team] < game.maxPop[data.team]) {
                    game.eco[data.team].pumpkins -= config.costP; 
                    game.eco[data.team].dew -= config.costD;
                    
                    let s = new Spider(data.x + MathUtils.randomRange(-30, 30), data.y + MathUtils.randomRange(-30, 30), data.team, data.role);
                    
                    if (data.role === 'widow') s.sprite = game.assets.get(data.team === 'black' ? 'assets/widow_black.png' : 'assets/widow_red.png');
                    if (data.role === 'goliath') s.sprite = game.assets.get(data.team === 'black' ? 'assets/goliath_black.png' : 'assets/goliath_red.png');

                    // ECS Trait Setup
                    if (s.hasTrait('stealth')) {
                        s.isCloaked = true; 
                        s.cloakCooldown = 0;
                    }
                    if (s.hasTrait('siege_attacker')) {
                        s.range = config.range;
                        s.rangeSq = config.rangeSq; 
                    }

                    s.imageLoaded = true; 
                    game.addEntity(s);
                    game.bus.emit('playSound', 'spell');
                }
            }
        });
    },

    patch: (game) => {
        // 4. RENDERING POLISH (The only patch remaining!)
        game.expansions.patchClass(Spider, 'draw', function(original, ctx) {
            if (this.hasTrait('stealth') && this.isCloaked) {
                ctx.globalAlpha = 0.35; // Highly transparent to the player
            }
            original.call(this, ctx);
            ctx.globalAlpha = 1.0;
        });
    }
};
