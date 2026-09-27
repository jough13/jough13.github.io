// expansions/Fortress.js
import { MathUtils, Structure } from '../game.js';

// 1. Ballistic Artillery Shell (Calculates an arc based on distance!)
export class MortarShell {
    constructor(startX, startY, targetX, targetY, damage, team) {
        this.startX = startX; this.startY = startY;
        this.x = startX; this.y = startY;
        this.targetX = targetX; this.targetY = targetY;
        this.damage = damage; this.team = team;
        this.speed = 4.5; this.active = true;
        this.totalDist = MathUtils.dist(startX, startY, targetX, targetY);
    }
    update(game) {
        const dx = this.targetX - this.x; const dy = this.targetY - this.y;
        const distSq = dx*dx + dy*dy;
        
        if (distSq < 25) { // Reached coordinates
            this.active = false;
            game.bus.emit('playSound', 'death'); // Heavy explosion sound
            game.bus.emit('particles', {x: this.x, y: this.y, color: '#ff5500', count: 50});
            game.bus.emit('particles', {x: this.x, y: this.y, color: '#aa00ff', count: 30});
            
            // Splash Damage
            game.entities.forEach(e => {
                if (e.team && e.team !== this.team && e.hp > 0) {
                    if (MathUtils.distSq(this.x, this.y, e.x, e.y) < 150*150) { // 150px splash radius
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
        // Calculate artificial Z-axis (height) for a parabolic arc effect
        let currentDist = MathUtils.dist(this.x, this.y, this.startX, this.startY);
        let progress = currentDist / this.totalDist;
        let z = Math.sin(progress * Math.PI) * 100; // Peak height of 100px
        
        // Draw Shadow on the ground
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath(); ctx.arc(this.x, this.y, Math.max(2, 8 - (z/20)), 0, Math.PI*2); ctx.fill();
        
        // Draw Shell in the air (Offset by -z)
        ctx.fillStyle = this.team === 'black' ? '#aa00ff' : '#ff5500';
        ctx.beginPath(); ctx.arc(this.x, this.y - z, 10, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(this.x, this.y - z, 4, 0, Math.PI*2); ctx.fill();
    }
}

export const FortressExpansion = {
    patch: (game) => {
        game.expansions.patchClass(Structure, 'update', function(original, gameObj) {
            original.call(this, gameObj); // Run normal logic
            
            if (this.isConstructing || this.hp <= 0) return;

            // 1. Mortar Artillery Logic
            if (this.type === 'mortar') {
                this.cooldown = this.cooldown || 0;
                if (this.cooldown > 0) this.cooldown--;
                
                if (this.cooldown <= 0) {
                    let target = gameObj.getNearestEnemy(this.x, this.y, this.team, 750); // Massive 750px range
                    // Minimum range check (Can't fire at things closer than 150px)
                    if (target && MathUtils.distSq(this.x, this.y, target.x, target.y) > 22500) {
                        gameObj.addEntity(new MortarShell(this.x, this.y, target.x, target.y, 150 + (gameObj.techLevel[this.team]*15), this.team));
                        gameObj.bus.emit('playSound', 'shoot'); 
                        this.cooldown = 180; // 6 second reload time
                    }
                }
            }

            // 2. Healing Shrine Logic
            if (this.type === 'shrine') {
                if (gameObj.tick % 30 === 0) { // Pulse every 1 second
                    let healed = false;
                    gameObj.entities.forEach(e => {
                        // Heal any friendly unit or structure that is damaged
                        if (e.team === this.team && e.hp > 0 && e.hp < (e.maxHp + (gameObj.techLevel[this.team]*20 || 0))) {
                            if (MathUtils.distSq(this.x, this.y, e.x, e.y) < 62500) { // 250px healing radius
                                e.hp = Math.min(e.maxHp + (gameObj.techLevel[this.team]*20 || 0), e.hp + 15);
                                healed = true;
                                // Emit a tiny green sparkle on the healed unit
                                gameObj.bus.emit('particles', {x: e.x, y: e.y, color: '#00ff00', count: 1});
                            }
                        }
                    });
                    // Emit a pulse from the Shrine if it successfully healed something
                    if (healed) {
                        gameObj.bus.emit('particles', {x: this.x, y: this.y - 20, color: '#00ff00', count: 8});
                    }
                }
            }
        });

        // 3. Fallback Rendering for new structures (In case sprites haven't loaded)
        game.expansions.patchClass(Structure, 'draw', function(original, ctx) {
            if (this.spriteLoaded) {
                original.call(this, ctx);
            } else {
                ctx.save();
                if (this.type === 'mortar') {
                    ctx.fillStyle = '#444'; ctx.fillRect(this.x - 20, this.y - 20, 40, 40);
                    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(this.x, this.y, 15, 0, Math.PI*2); ctx.fill();
                } else if (this.type === 'shrine') {
                    ctx.fillStyle = '#225522'; ctx.beginPath(); ctx.moveTo(this.x, this.y - 30); ctx.lineTo(this.x + 20, this.y + 20); ctx.lineTo(this.x - 20, this.y + 20); ctx.fill();
                    ctx.fillStyle = '#00ff00'; ctx.beginPath(); ctx.arc(this.x, this.y, 8, 0, Math.PI*2); ctx.fill();
                } else {
                    original.call(this, ctx); // Run original for Nests, Pylons, etc.
                }
                ctx.restore();
            }
        });
    }
};
