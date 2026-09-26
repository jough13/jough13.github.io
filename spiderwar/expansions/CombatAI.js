// expansions/CombatAI.js
import { MathUtils, Spider, Structure, Projectile } from '../game.js';
import { Queen } from './Queen.js';

export const CombatAndHarvesterExpansion = {
    patch: (game) => {
        game.expansions.patchClass(Structure, 'update', function(original, gameObj) {
            original.call(this, gameObj);
            if (this.type === 'turret' && !this.isConstructing && this.hp > 0) {
                this.cooldown--;
                if (this.cooldown <= 0) {
                    let enemy = gameObj.getNearestEnemy(this.x, this.y, this.team, 350);
                    if (enemy) {
                        gameObj.addEntity(new Projectile(this.x, this.y, enemy, 15 + (gameObj.techLevel[this.team] || 0) * 5, this.team));
                        gameObj.bus.emit('playSound', 'shoot');
                        this.cooldown = 40;
                    }
                }
            }
        });

        game.expansions.patchClass(Spider, 'update', function(original, gameObj) {
            const techLvl = gameObj.techLevel[this.team] || 0; 
            const currentDamage = this.damage + (techLvl * 5); 
            
            const terrain = gameObj.getTerrainAt(this.x, this.y); let tMod = 1.0;
            if(terrain === 'water') tMod = 0.05; if(terrain === 'grass') tMod = 1.3;
            
            let currentSpeed = (this.baseSpeed + (techLvl * 0.15)) * tMod;
            if (this.isSlowed) currentSpeed *= 0.3; this.isSlowed = false; 

            const detectRadius = 150 + (techLvl * 10);
            let nearestEnemy = gameObj.getNearestEnemy(this.x, this.y, this.team, detectRadius);

            if (nearestEnemy) {
                this.state = 'combat'; this.angle = Math.atan2(nearestEnemy.y - this.y, nearestEnemy.x - this.x);
                const combatRange = nearestEnemy.size ? nearestEnemy.size + 15 : 20;
                const distSq = MathUtils.distSq(this.x, this.y, nearestEnemy.x, nearestEnemy.y);
                
                if (distSq > combatRange * combatRange) { 
                    this.x += Math.cos(this.angle) * currentSpeed; this.y += Math.sin(this.angle) * currentSpeed;
                } else {
                    this.cooldown--;
                    if (this.cooldown <= 0) {
                        nearestEnemy.hp -= currentDamage; this.cooldown = this.attackSpeed;
                        this.x -= Math.cos(this.angle) * 10; this.y -= Math.sin(this.angle) * 10; 
                        gameObj.bus.emit('particles', {x: nearestEnemy.x, y: nearestEnemy.y, color: this.team==='black'?'#aa00ff':'#ffaa00', count: 5}); 
                        gameObj.bus.emit('playSound', 'harvest');
                    }
                }
                return; 
            }

            if (this.role === 'soldier') {
                const myQueen = gameObj.queens.find(q => q.team === this.team);
                if (myQueen) {
                    const dx = myQueen.x - this.x; const dy = myQueen.y - this.y;
                    if (MathUtils.distSq(0,0, dx, dy) > 6400) { 
                        this.angle = Math.atan2(dy, dx);
                        this.x += Math.cos(this.angle) * currentSpeed; this.y += Math.sin(this.angle) * currentSpeed;
                    }
                }
                return; 
            }

            if (this.cargo.amount === 0) this.state = 'seeking_pumpkin'; else this.state = 'returning_home';
            
            if (this.state === 'seeking_pumpkin') {
                if (!this.target || this.target.resources <= 0) {
                    let closest = null; let minD = Infinity;
                    gameObj.resourceNodes.forEach(r => { 
                        let dSq = MathUtils.distSq(r.x, r.y, this.x, this.y); 
                        if(dSq < minD) { minD = dSq; closest = r; } 
                    });
                    this.target = closest;
                }
            } else {
                let closest = null; let minD = Infinity;
                gameObj.structures.filter(s => s.team === this.team && (s.type === 'nest' || s.type === 'pylon')).forEach(n => { 
                    let dSq = MathUtils.distSq(n.x, n.y, this.x, this.y); 
                    if(dSq < minD) { minD = dSq; closest = n; } 
                });
                gameObj.queens.filter(q => q.team === this.team).forEach(q => { 
                    let dSq = MathUtils.distSq(q.x, q.y, this.x, this.y); 
                    if(dSq < minD) { minD = dSq; closest = q; } 
                });
                this.target = closest;
            }

            if (this.target) {
                const dx = this.target.x - this.x; const dy = this.target.y - this.y;
                const distSq = MathUtils.distSq(0,0, dx, dy); this.angle = Math.atan2(dy, dx);
                const targetRadius = this.target.size ? this.target.size + 5 : 15;
                if (distSq > targetRadius * targetRadius) { 
                    this.x += Math.cos(this.angle) * currentSpeed; this.y += Math.sin(this.angle) * currentSpeed;
                } else {
                    if (this.state === 'seeking_pumpkin' && this.target.resources > 0) {
                        this.cargo.amount = 10; this.cargo.type = this.target.type; this.target.resources -= 10; this.target = null; 
                        gameObj.bus.emit('particles', {x: this.x, y: this.y, color: this.cargo.type === 'pumpkin' ? '#ff7b00' : '#00aaff', count: 5}); 
                        gameObj.bus.emit('playSound', 'harvest');
                    } else if (this.state === 'returning_home') {
                        if(this.cargo.type === 'pumpkin') gameObj.eco[this.team].pumpkins += this.cargo.amount;
                        else if(this.cargo.type === 'dew') gameObj.eco[this.team].dew += this.cargo.amount;
                        this.cargo.amount = 0; this.target = null;
                    }
                }
            } else {
                this.angle += (Math.random() - 0.5) * 0.5;
                this.x += Math.cos(this.angle) * (currentSpeed * 0.5); this.y += Math.sin(this.angle) * (currentSpeed * 0.5);
                this.x = Math.max(0, Math.min(this.x, gameObj.world.width)); this.y = Math.max(0, Math.min(this.y, gameObj.world.height));
            }
        });

        const drawHealth = function(ctx) {
            if (this.hp !== undefined && this.hp < (this.maxHp + (game.techLevel[this.team] || 0) * 20)) {
                const max = this.maxHp + ((game.techLevel[this.team] || 0) * 20);
                const w = this.size * 1.5; ctx.fillStyle = 'black'; ctx.fillRect(this.x - w/2 - 1, this.y - this.size - 11, w + 2, 6);
                ctx.fillStyle = 'red'; ctx.fillRect(this.x - w/2, this.y - this.size - 10, w, 4);
                ctx.fillStyle = '#00ff00'; ctx.fillRect(this.x - w/2, this.y - this.size - 10, w * (Math.max(0, this.hp) / max), 4);
            }
        };
        
        game.expansions.patchClass(Spider, 'draw', function(original, ctx) { original.call(this, ctx); drawHealth.call(this, ctx); });
        game.expansions.patchClass(Queen, 'draw', function(original, ctx) { original.call(this, ctx); drawHealth.call(this, ctx); });
        game.expansions.patchClass(Structure, 'draw', function(original, ctx) { original.call(this, ctx); drawHealth.call(this, ctx); });
    }
};