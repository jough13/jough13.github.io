// expansions/SpecialUnits.js
import { Spider, Projectile, MathUtils } from '../game.js';

export const SpecialUnitsExpansion = {
    init: (game) => {
        // Intercept spawn requests to adjust stats for new roles
        game.bus.on('spawnSpider', (data) => {
            if (data.role === 'spitter' && game.eco[data.team].pumpkins >= 40) {
                game.eco[data.team].pumpkins -= 40;
                let s = new Spider(data.x, data.y, data.team, data.role);
                s.hp = 75; s.maxHp = 75; s.damage = 25; s.attackSpeed = 45; s.range = 250;
                s.sprite.src = data.team === 'black' ? 'assets/spitter_black.png' : 'assets/spitter_red.png';
                game.addEntity(s);
                game.bus.emit('playSound', 'harvest');
            }
            if (data.role === 'tarantula' && game.eco[data.team].pumpkins >= 75) {
                game.eco[data.team].pumpkins -= 75;
                let s = new Spider(data.x, data.y, data.team, data.role);
                s.hp = 400; s.maxHp = 400; s.damage = 45; s.attackSpeed = 40; s.size = 22; s.baseSpeed = 0.6;
                s.sprite.src = data.team === 'black' ? 'assets/tarantula_black.png' : 'assets/tarantula_red.png';
                game.addEntity(s);
                game.bus.emit('playSound', 'harvest');
            }
        });
    },

    patch: (game) => {
        // Patch the Spider AI to handle Ranged combat for Spitters
        game.expansions.patchClass(Spider, 'update', function(original, gameObj) {
            if (this.role === 'spitter' && !this.isManual) {
                const nearestEnemy = gameObj.getNearestEnemy(this.x, this.y, this.team, this.range + 50);
                if (nearestEnemy) {
                    this.state = 'combat'; 
                    this.angle = Math.atan2(nearestEnemy.y - this.y, nearestEnemy.x - this.x);
                    const distSq = MathUtils.distSq(this.x, this.y, nearestEnemy.x, nearestEnemy.y);
                    
                    if (distSq > this.range * this.range) {
                        this.x += Math.cos(this.angle) * this.baseSpeed; 
                        this.y += Math.sin(this.angle) * this.baseSpeed;
                    } else {
                        this.cooldown--;
                        if (this.cooldown <= 0) {
                            gameObj.addEntity(new Projectile(this.x, this.y, nearestEnemy, this.damage + (gameObj.techLevel[this.team]*5), this.team));
                            gameObj.bus.emit('playSound', 'shoot');
                            this.cooldown = this.attackSpeed;
                        }
                    }
                    return; // Skip normal AI
                }
            }
            original.call(this, gameObj); // Fallback to normal AI for movement/gathering/tanking
        });
    }
};
