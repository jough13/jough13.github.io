// expansions/Titans.js
import { Spider, Projectile, MathUtils, UNIT_DATA } from '../game.js';

// ==========================================
// 1. CONFIGURATION & BALANCING
// ==========================================
const TITAN_CONFIG = {
    widow: { 
        hp: 150, damage: 100, attackSpeed: 20, size: 16, 
        baseSpeedMin: 1.8, baseSpeedMax: 2.1, // Hyper-fast assassin
        costP: 150, costD: 50, 
        decloakTime: 150 // 5 seconds of visibility after attacking
    },
    goliath: { 
        hp: 1200, damage: 90, attackSpeed: 60, size: 38, 
        baseSpeedMin: 0.3, baseSpeedMax: 0.5, // Slow, lumbering siege engine
        costP: 400, costD: 150, 
        range: 300, 
        splashRadiusSq: 10000 // 100px splash radius
    }
};

// ==========================================
// 2. GOLIATH SIEGE PROJECTILE
// ==========================================
export class ExplosiveProjectile {
    constructor(x, y, target, damage, team) {
        this.x = x; this.y = y; 
        this.target = target; 
        this.damage = damage; 
        this.team = team;
        this.speed = 3.5; 
        this.active = true;
    }

    update(game) {
        if(!this.target || this.target.hp <= 0) { 
            this.active = false; 
            return; 
        }

        const dx = this.target.x - this.x; 
        const dy = this.target.y - this.y;
        const distSq = MathUtils.distSq(this.x, this.y, this.target.x, this.target.y);
        
        if (distSq < 225) { // 15px Direct Hit!
            this.active = false; 
            game.bus.emit('playSound', 'death'); // Heavy explosion
            
            const magicColor = this.team === 'black' ? '#aa00ff' : '#ff0000';
            game.bus.emit('particles', {x: this.target.x, y: this.target.y, color: magicColor, count: 40});
            game.bus.emit('particles', {x: this.target.x, y: this.target.y, color: '#ffaa00', count: 20, type: 'splatter'});
            
            // Splash Damage Calculation (with high-performance early exits)
            for (let i = 0; i < game.entities.length; i++) {
                let e = game.entities[i];
                
                // FIX A: Ignore dead units, allies, AND Nature units
                if (!e.team || e.team === this.team || e.team === 'nature' || e.hp <= 0) continue;
                
                // Fast AABB check
                if (Math.abs(this.x - e.x) > 100 || Math.abs(this.y - e.y) > 100) continue;

                if (MathUtils.distSq(this.x, this.y, e.x, e.y) < TITAN_CONFIG.goliath.splashRadiusSq) { 
                    // FIX A: Full damage to units, 50% damage to buildings
                    if (e instanceof Spider || e.constructor.name === 'CentipedeBoss') {
                        e.hp -= this.damage;
                    } else {
                        e.hp -= (this.damage * 0.5); 
                    }
                }
            }
        } else {
            // Homing movement
            const dist = Math.sqrt(distSq);
            this.x += (dx/dist) * this.speed; 
            this.y += (dy/dist) * this.speed; 
        }
    }

    draw(ctx) { 
        const magicColor = this.team === 'black' ? '#aa00ff' : '#ff0000';
        ctx.fillStyle = magicColor; 
        ctx.beginPath(); ctx.arc(this.x, this.y, 8, 0, Math.PI*2); ctx.fill(); 
        
        ctx.fillStyle = '#ffaa00'; 
        ctx.beginPath(); ctx.arc(this.x, this.y, 4, 0, Math.PI*2); ctx.fill(); 
    }
}

// ==========================================
// 3. EXPANSION LOGIC
// ==========================================
export const TitansExpansion = {
    init: (game) => {
        // 1. Inject base stats into the core engine dictionary!
        UNIT_DATA['widow'] = { 
            size: TITAN_CONFIG.widow.size, hp: TITAN_CONFIG.widow.hp, 
            damage: TITAN_CONFIG.widow.damage, attackSpeed: TITAN_CONFIG.widow.attackSpeed,
            baseSpeedMin: TITAN_CONFIG.widow.baseSpeedMin, baseSpeedMax: TITAN_CONFIG.widow.baseSpeedMax
        };
        UNIT_DATA['goliath'] = { 
            size: TITAN_CONFIG.goliath.size, hp: TITAN_CONFIG.goliath.hp, 
            damage: TITAN_CONFIG.goliath.damage, attackSpeed: TITAN_CONFIG.goliath.attackSpeed,
            baseSpeedMin: TITAN_CONFIG.goliath.baseSpeedMin, baseSpeedMax: TITAN_CONFIG.goliath.baseSpeedMax
        };

        // 2. Safely hook into the spawn system for multi-resource units
        game.bus.on('spawnSpider', (data) => {
            let costP = 0, costD = 0;
            
            if (data.role === 'widow') { costP = TITAN_CONFIG.widow.costP; costD = TITAN_CONFIG.widow.costD; }
            if (data.role === 'goliath') { costP = TITAN_CONFIG.goliath.costP; costD = TITAN_CONFIG.goliath.costD; }
            
            if (costP > 0) {
                if (game.eco[data.team].pumpkins >= costP && game.eco[data.team].dew >= costD && game.pop[data.team] < game.maxPop[data.team]) {
                    
                    game.eco[data.team].pumpkins -= costP; 
                    game.eco[data.team].dew -= costD;
                    
                    let s = new Spider(
                        data.x + MathUtils.randomRange(-30, 30), 
                        data.y + MathUtils.randomRange(-30, 30), 
                        data.team, data.role
                    );
                    
                    // Apply special mechanical traits
                    if (data.role === 'widow') {
                        s.isCloaked = true; 
                        s.cloakCooldown = 0;
                        s.sprite.src = data.team === 'black' ? 'assets/widow_black.png' : 'assets/widow_red.png';
                    }
                    if (data.role === 'goliath') {
                        s.range = TITAN_CONFIG.goliath.range;
                        s.sprite.src = data.team === 'black' ? 'assets/goliath_black.png' : 'assets/goliath_red.png';
                    }

                    game.addEntity(s);
                    game.bus.emit('playSound', 'spell');
                }
            }
        });
    },

    patch: (game) => {
        
        // 3. AI & COMBAT LOGIC
        game.expansions.patchClass(Spider, 'update', function(original, gameObj) {
            
            // --- THE WIDOWMAKER (STEALTH ASSASSIN) ---
            if (this.role === 'widow') {
                if (this.cloakCooldown > 0) {
                    this.cloakCooldown--;
                    // Visual re-cloaking effect
                    if (this.cloakCooldown <= 0) {
                        gameObj.bus.emit('particles', {x: this.x, y: this.y, color: '#333333', count: 15});
                        gameObj.bus.emit('playSound', 'spell'); 
                    }
                }
                this.isCloaked = (this.cloakCooldown <= 0);

                // Note: Widows fall back to standard melee AI (`original.call`) below!
            }

            // --- THE PUMPKIN GOLIATH (SIEGE TITAN) ---
            if (this.role === 'goliath') {
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
                            gameObj.addEntity(new ExplosiveProjectile(this.x, this.y, nearestEnemy, currentDamage, this.team));
                            gameObj.bus.emit('playSound', 'shoot');
                            
                            // Heavy Ranged Recoil
                            this.x -= Math.cos(this.angle) * 5; 
                            this.y -= Math.sin(this.angle) * 5; 
                            
                            this.cooldown = this.attackSpeed;
                        }
                    }
                    return; // Prevent standard melee AI from running
                }

                // MANUAL MOVEMENT OVERRIDE (Stutter-Step Logic)
                if (this.isManual && this.commandTarget) {
                    const dx = this.commandTarget.x - this.x; 
                    const dy = this.commandTarget.y - this.y;
                    
                    if (MathUtils.distSq(0, 0, dx, dy) > 225) { 
                        const targetAngle = Math.atan2(dy, dx);
                        
                        // Smooth, lumbering rotation
                        let diff = targetAngle - this.angle;
                        while (diff > Math.PI) diff -= Math.PI * 2;
                        while (diff < -Math.PI) diff += Math.PI * 2;
                        this.angle += (diff * 0.05); 
                        
                        this.x += Math.cos(this.angle) * currentSpeed; 
                        this.y += Math.sin(this.angle) * currentSpeed;
                    } else {
                        this.commandTarget = null; // Target reached
                    }
                    return; // Prevent standard melee AI from running
                }
            }

            // Fallback for Widows (Melee) and non-combat Goliaths
            original.call(this, gameObj);

            // POST-COMBAT TRIGGER: If a Widow strikes, strip her stealth!
            if (this.role === 'widow' && this.cooldown === this.attackSpeed) {
                this.cloakCooldown = TITAN_CONFIG.widow.decloakTime; 
                this.isCloaked = false;
            }
        });

        // 4. RENDERING POLISH (Ghostly transparency for cloaked units)
        game.expansions.patchClass(Spider, 'draw', function(original, ctx) {
            if (this.role === 'widow' && this.isCloaked) {
                ctx.globalAlpha = 0.35; // Highly transparent to the player
            }
            original.call(this, ctx);
            ctx.globalAlpha = 1.0;
        });
    }
};
