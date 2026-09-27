// expansions/CombatAI.js
import { MathUtils, Spider, Structure, Projectile } from '../game.js';
import { Queen } from './Queen.js';

export const CombatAndHarvesterExpansion = {
    patch: (game) => {
        
        // ==========================================
        // 1. TURRET COMBAT AI
        // ==========================================
        game.expansions.patchClass(Structure, 'update', function(original, gameObj) {
            original.call(this, gameObj);
            
            if (this.type === 'turret' && !this.isConstructing && this.hp > 0) {
                this.cooldown = this.cooldown || 0;
                
                if (this.cooldown > 0) {
                    this.cooldown--;
                } else {
                    let enemy = gameObj.getNearestEnemy(this.x, this.y, this.team, 350);
                    if (enemy) {
                        // Projectile damage scales with faction Tech Level
                        const projDamage = 15 + (gameObj.techLevel[this.team] || 0) * 5;
                        gameObj.addEntity(new Projectile(this.x, this.y, enemy, projDamage, this.team));
                        
                        gameObj.bus.emit('playSound', 'shoot');
                        this.cooldown = 40; // Reload time
                    }
                }
            }
        });

        // ==========================================
        // 2. SPIDER SWARM & HARVESTER AI
        // ==========================================
        game.expansions.patchClass(Spider, 'update', function(original, gameObj) {
            // Apply Tech Level upgrades
            const techLvl = gameObj.techLevel[this.team] || 0; 
            const currentDamage = this.damage + (techLvl * 5); 
            
            // Apply Terrain modifiers
            const terrain = gameObj.getTerrainAt(this.x, this.y); 
            let tMod = 1.0;
            if(terrain === 'water') tMod = 0.05; // Spiders hate water
            if(terrain === 'grass') tMod = 1.3;  // Camouflage/speed boost in grass
            
            let currentSpeed = (this.baseSpeed + (techLvl * 0.15)) * tMod;
            if (this.isSlowed) currentSpeed *= 0.3; // Apply trap debuffs
            this.isSlowed = false; // Resets every frame (traps must re-apply it)

            // --- COMBAT OVERRIDE ---
            // If an enemy is within detection range, drop everything and fight!
            const detectRadius = 150 + (techLvl * 10);
            let nearestEnemy = gameObj.getNearestEnemy(this.x, this.y, this.team, detectRadius);

            if (nearestEnemy) {
                this.state = 'combat'; 
                this.angle = Math.atan2(nearestEnemy.y - this.y, nearestEnemy.x - this.x);
                
                const combatRange = nearestEnemy.size ? nearestEnemy.size + 15 : 20;
                const distSq = MathUtils.distSq(this.x, this.y, nearestEnemy.x, nearestEnemy.y);
                
                if (distSq > combatRange * combatRange) { 
                    this.x += Math.cos(this.angle) * currentSpeed; 
                    this.y += Math.sin(this.angle) * currentSpeed;
                } else {
                    this.cooldown = this.cooldown || 0;
                    if (this.cooldown > 0) this.cooldown--;
                    
                    if (this.cooldown <= 0) {
                        nearestEnemy.hp -= currentDamage; 
                        this.cooldown = this.attackSpeed;
                        
                        // Recoil effect
                        this.x -= Math.cos(this.angle) * 10; 
                        this.y -= Math.sin(this.angle) * 10; 
                        
                        const magicColor = this.team === 'black' ? '#aa00ff' : '#ffaa00';
                        gameObj.bus.emit('particles', {x: nearestEnemy.x, y: nearestEnemy.y, color: magicColor, count: 5}); 
                        gameObj.bus.emit('playSound', 'harvest'); // Squishy impact sound
                    }
                }
                return; // End update (Combat overrides all other tasks)
            }

            // --- SOLDIER ESCORT AI ---
            if (this.role === 'soldier') {
                const myQueen = gameObj.queens.find(q => q.team === this.team);
                if (myQueen) {
                    const dx = myQueen.x - this.x; 
                    const dy = myQueen.y - this.y;
                    
                    if (MathUtils.distSq(0,0, dx, dy) > 6400) { // 80px orbit radius
                        // Add a slight randomization to the angle so soldiers fan out into a protective ring
                        // rather than collapsing into a single pixel stack
                        this.angle = Math.atan2(dy, dx) + MathUtils.randomRange(-0.2, 0.2);
                        this.x += Math.cos(this.angle) * currentSpeed; 
                        this.y += Math.sin(this.angle) * currentSpeed;
                    }
                }
                return; 
            }

            // --- HARVESTER ECONOMY AI ---
            if (this.cargo.amount === 0) this.state = 'seeking_pumpkin'; 
            else this.state = 'returning_home';
            
            // PERFORMANCE: Stagger target searches to prevent CPU lag spikes
            if (!this.target || (this.target.resources !== undefined && this.target.resources <= 0)) {
                this.searchDelay = (this.searchDelay || 0) - 1;
                
                if (this.searchDelay <= 0) {
                    this.searchDelay = MathUtils.randomInt(10, 20); // Wait 10-20 frames before searching again
                    let closest = null; 
                    let minD = Infinity;

                    if (this.state === 'seeking_pumpkin') {
                        // Find nearest Resource Node
                        gameObj.resourceNodes.forEach(r => { 
                            let dSq = MathUtils.distSq(r.x, r.y, this.x, this.y); 
                            if(dSq < minD) { minD = dSq; closest = r; } 
                        });
                    } else {
                        // Find nearest Dropoff Point (Nest, Pylon, or Queen)
                        gameObj.structures.filter(s => s.team === this.team && (s.type === 'nest' || s.type === 'pylon')).forEach(n => { 
                            let dSq = MathUtils.distSq(n.x, n.y, this.x, this.y); 
                            if(dSq < minD) { minD = dSq; closest = n; } 
                        });
                        gameObj.queens.filter(q => q.team === this.team).forEach(q => { 
                            let dSq = MathUtils.distSq(q.x, q.y, this.x, this.y); 
                            if(dSq < minD) { minD = dSq; closest = q; } 
                        });
                    }
                    this.target = closest;
                } else {
                    return; // Yield CPU if we are waiting for our search cycle
                }
            }

            // Move towards target
            if (this.target) {
                const dx = this.target.x - this.x; 
                const dy = this.target.y - this.y;
                const distSq = MathUtils.distSq(0,0, dx, dy); 
                
                this.angle = Math.atan2(dy, dx);
                const targetRadius = this.target.size ? this.target.size + 5 : 15;
                
                if (distSq > targetRadius * targetRadius) { 
                    this.x += Math.cos(this.angle) * currentSpeed; 
                    this.y += Math.sin(this.angle) * currentSpeed;
                } else {
                    // Reached Target!
                    if (this.state === 'seeking_pumpkin' && this.target.resources > 0) {
                        let amountGathered = Math.min(10, this.target.resources);
                        this.cargo.amount = amountGathered; 
                        this.cargo.type = this.target.type; 
                        
                        this.target.resources -= amountGathered; 
                        this.target = null; // Clear target to trigger return home
                        
                        const resColor = this.cargo.type === 'pumpkin' ? '#ff7b00' : '#00aaff';
                        gameObj.bus.emit('particles', {x: this.x, y: this.y, color: resColor, count: 5}); 
                        gameObj.bus.emit('playSound', 'harvest');
                    } 
                    else if (this.state === 'returning_home') {
                        if (this.cargo.type === 'pumpkin') gameObj.eco[this.team].pumpkins += this.cargo.amount;
                        else if (this.cargo.type === 'dew') gameObj.eco[this.team].dew += this.cargo.amount;
                        
                        this.cargo.amount = 0; 
                        this.target = null; // Clear target to trigger gathering
                    }
                }
            } else {
                // Idle wandering if completely lost
                this.angle += MathUtils.randomRange(-0.5, 0.5);
                this.x += Math.cos(this.angle) * (currentSpeed * 0.5); 
                this.y += Math.sin(this.angle) * (currentSpeed * 0.5);
                
                // Stay inside the map bounds!
                this.x = MathUtils.clamp(this.x, 50, gameObj.world.width - 50);
                this.y = MathUtils.clamp(this.y, 50, gameObj.world.height - 50);
            }
        });

        // ==========================================
        // 3. UNIVERSAL HEALTH BAR RENDERING
        // ==========================================
        const drawHealth = function(ctx) {
            // Check if entity is damaged (taking into account dynamic tech level HP boosts)
            const techBoost = (game.techLevel[this.team] || 0) * 20;
            const absoluteMaxHp = this.maxHp + techBoost;

            if (this.hp !== undefined && this.hp > 0 && this.hp < absoluteMaxHp) {
                const w = this.size * 1.5; 
                const hpPct = Math.max(0, this.hp) / absoluteMaxHp;

                // Color interpolates based on health: Green -> Yellow -> Red
                let barColor = '#00ff00';
                if (hpPct < 0.5) barColor = '#ffff00';
                if (hpPct < 0.25) barColor = '#ff0000';

                // Background (Black border + Dark Red missing health)
                ctx.fillStyle = '#000000'; 
                ctx.fillRect(this.x - w/2 - 1, this.y - this.size - 11, w + 2, 6);
                ctx.fillStyle = '#550000'; 
                ctx.fillRect(this.x - w/2, this.y - this.size - 10, w, 4);
                
                // Current Health
                ctx.fillStyle = barColor; 
                ctx.fillRect(this.x - w/2, this.y - this.size - 10, w * hpPct, 4);
            }
        };
        
        // Attach the renderer to all standard combat entities
        game.expansions.patchClass(Spider, 'draw', function(original, ctx) { original.call(this, ctx); drawHealth.call(this, ctx); });
        game.expansions.patchClass(Queen, 'draw', function(original, ctx) { original.call(this, ctx); drawHealth.call(this, ctx); });
        game.expansions.patchClass(Structure, 'draw', function(original, ctx) { original.call(this, ctx); drawHealth.call(this, ctx); });
    }
};
