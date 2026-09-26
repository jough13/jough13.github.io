// expansions/Titans.js
import { Spider, MathUtils } from '../game.js';

// Special AoE Projectile for the Goliath
export class ExplosiveProjectile {
    constructor(x, y, target, damage, team) {
        this.x = x; this.y = y; this.target = target; this.damage = damage; this.team = team;
        this.speed = 3.5; this.active = true;
    }
    update(game) {
        if(!this.target || this.target.hp <= 0) { this.active = false; return; }
        const dx = this.target.x - this.x; const dy = this.target.y - this.y;
        const distSq = MathUtils.distSq(this.x, this.y, this.target.x, this.target.y);
        
        if (distSq < 225) { // Direct Hit!
            this.active = false; 
            game.bus.emit('playSound', 'death');
            game.bus.emit('particles', {x: this.target.x, y: this.target.y, color: '#ff5500', count: 40});
            game.bus.emit('particles', {x: this.target.x, y: this.target.y, color: '#ffaa00', count: 20});
            
            // Splash Damage Calculation
            game.entities.forEach(e => {
                if (e.team && e.team !== this.team && e.hp > 0) {
                    if (MathUtils.distSq(this.x, this.y, e.x, e.y) < 10000) { // 100px explosion radius
                        e.hp -= this.damage;
                    }
                }
            });
        } else {
            const dist = Math.sqrt(distSq);
            this.x += (dx/dist) * this.speed; this.y += (dy/dist) * this.speed; 
        }
    }
    draw(ctx) { 
        // Draws a flaming mini-pumpkin
        ctx.fillStyle = '#ff5500'; ctx.beginPath(); ctx.arc(this.x, this.y, 8, 0, Math.PI*2); ctx.fill(); 
        ctx.fillStyle = '#ffaa00'; ctx.beginPath(); ctx.arc(this.x, this.y, 4, 0, Math.PI*2); ctx.fill(); 
    }
}

export const TitansExpansion = {
    init: (game) => {
        // Handle spawning logic and stats for Titans
        game.bus.on('spawnSpider', (data) => {
            if (data.role === 'widow' && game.eco[data.team].pumpkins >= 150 && game.eco[data.team].dew >= 50) {
                game.eco[data.team].pumpkins -= 150; game.eco[data.team].dew -= 50;
                let s = new Spider(data.x, data.y, data.team, data.role);
                s.hp = 150; s.maxHp = 150; s.damage = 100; s.baseSpeed = 1.9; 
                s.isCloaked = true; s.cloakCooldown = 0;
                s.sprite.src = data.team === 'black' ? 'assets/widow_black.png' : 'assets/widow_red.png';
                game.addEntity(s);
                game.bus.emit('playSound', 'spell');
            }
            if (data.role === 'goliath' && game.eco[data.team].pumpkins >= 400 && game.eco[data.team].dew >= 150) {
                game.eco[data.team].pumpkins -= 400; game.eco[data.team].dew -= 150;
                let s = new Spider(data.x, data.y, data.team, data.role);
                s.hp = 1200; s.maxHp = 1200; s.damage = 90; s.size = 38; s.baseSpeed = 0.4; s.attackSpeed = 60;
                s.sprite.src = data.team === 'black' ? 'assets/goliath_black.png' : 'assets/goliath_red.png';
                game.addEntity(s);
                game.bus.emit('playSound', 'spell');
            }
        });
    },

    patch: (game) => {
        // 1. PATCH TARGETING SO ENEMIES IGNORE CLOAKED UNITS
        game.expansions.patchClass(game.constructor, 'getNearestEnemy', function(original, x, y, team, maxDist) {
            // Temporarily strip the team from cloaked units so the targeting AI ignores them
            let cloakedUnits = this.entities.filter(e => e.isCloaked);
            cloakedUnits.forEach(c => { c._tempTeam = c.team; c.team = null; });

            let target = original.call(this, x, y, team, maxDist);

            // Safely restore their team associations immediately after targeting finishes
            cloakedUnits.forEach(c => { c.team = c._tempTeam; delete c._tempTeam; });
            return target;
        });

        // 2. PATCH AI TO HANDLE TITAN COMBAT
        game.expansions.patchClass(Spider, 'update', function(original, gameObj) {
            // Widow Cloaking Logic
            if (this.role === 'widow') {
                if (this.cloakCooldown > 0) this.cloakCooldown--;
                this.isCloaked = (this.cloakCooldown <= 0);
            }

            // Goliath Siege AI
            if (this.role === 'goliath' && !this.isManual) {
                const nearestEnemy = gameObj.getNearestEnemy(this.x, this.y, this.team, 300); // Massive range
                if (nearestEnemy) {
                    this.state = 'combat'; 
                    this.angle = Math.atan2(nearestEnemy.y - this.y, nearestEnemy.x - this.x);
                    const distSq = MathUtils.distSq(this.x, this.y, nearestEnemy.x, nearestEnemy.y);
                    if (distSq > 200 * 200) {
                        this.x += Math.cos(this.angle) * this.baseSpeed; this.y += Math.sin(this.angle) * this.baseSpeed;
                    } else {
                        this.cooldown--;
                        if (this.cooldown <= 0) {
                            gameObj.addEntity(new ExplosiveProjectile(this.x, this.y, nearestEnemy, this.damage + (gameObj.techLevel[this.team]*5), this.team));
                            gameObj.bus.emit('playSound', 'shoot');
                            this.cooldown = this.attackSpeed;
                        }
                    }
                    return; // Skip normal melee AI
                }
            }

            // Run normal AI for everyone else
            original.call(this, gameObj);

            // If a Widow strikes out of stealth, reveal her for 5 seconds!
            if (this.role === 'widow' && this.cooldown === this.attackSpeed) {
                this.cloakCooldown = 150; 
                this.isCloaked = false;
            }
        });

        // 3. PATCH RENDERING FOR GHOSTLY WIDOWS
        game.expansions.patchClass(Spider, 'draw', function(original, ctx) {
            if (this.role === 'widow' && this.isCloaked) {
                ctx.globalAlpha = 0.35; // Make her highly transparent
            }
            original.call(this, ctx);
            ctx.globalAlpha = 1.0;
        });
    }
};
