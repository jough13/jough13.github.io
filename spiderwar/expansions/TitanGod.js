// expansions/TitanGod.js
import { MathUtils } from '../game.js';
import { CentipedeBoss } from './Boss.js';

// ==========================================
// 1. CONFIGURATION & BALANCING
// ==========================================
// 🔌 [EXPANDABILITY] Exposed so other mods can adjust the taming mechanics
export const TAMER_CONFIG = {
    spellCost: 200,            // High cost, requires late-game economy
    spellRadius: 300,          // Massive AoE
    spellRadiusSq: 90000,      // 300^2
    subjugateDuration: 1800,   // 30 seconds at 60fps
    requiredTech: 3            // Late-game only
};

// ==========================================
// 2. VISUAL SPELL ENTITY (Subjugation Rune)
// ==========================================
class SubjugationRune {
    constructor(x, y, team) {
        this.x = x; 
        this.y = y; 
        this.team = team;
        this.life = 60; // 1-second animation
        this.maxLife = 60;
        this.radius = TAMER_CONFIG.spellRadius;
        this.color = team === 'black' ? '#aa00ff' : '#ff0000';
    }

    update(game) {
        this.life--;
    }

    draw(ctx, game) {
        const progress = 1 - (this.life / this.maxLife);
        const currentRadius = this.radius * Math.sqrt(progress); // Fast ease-out expansion
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // 🧃 [JUICE] Additive blending for glowing magical chains/runes
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = this.life / this.maxLife;
        
        // Spinning inner rune
        ctx.rotate(game.tick * 0.05);
        
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 6;
        
        // Draw an arcane hexagon
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const px = Math.cos(angle) * currentRadius;
            const py = Math.sin(angle) * currentRadius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();

        // Expanding outer containment ring
        ctx.beginPath();
        ctx.arc(0, 0, currentRadius * 1.2, 0, MathUtils.TWO_PI);
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }
}

// ==========================================
// 3. EXPANSION LOGIC
// ==========================================
export const TitanGodExpansion = {
    init: (game) => {
        console.log("%c[DLC] Behemoth Tamer Online. The Chains of Domination are forged.", "color: #ff9d00; font-weight: bold;");
        
        game.tamerConfig = TAMER_CONFIG;

        // 🔌 1. INJECT CUSTOM UI BUTTON dynamically!
        if (game.customUIHooks) {
            // We register the button definition directly into the game's dictionary
            game.uiActions['subjugate'] = { 
                reqTech: TAMER_CONFIG.requiredTech, 
                icon: '🔗', 
                name: 'Subjugate', 
                cost: `${TAMER_CONFIG.spellCost}💧`, 
                type: 'tool', 
                val: 'subjugate' 
            };

            // This hook runs every time the UI refreshes
            game.customUIHooks.push((currentSelection, addButton) => {
                // If nothing is selected (The Hive), or the Queen is selected, give them the spell!
                if (!currentSelection || currentSelection.role === 'queen') {
                    addButton('subjugate');
                }
            });
        }

        // 2. HANDLE SPELL CASTING
        game.bus.on('castSpell', (data) => {
            if (data.type === 'subjugate') {
                if (game.eco[data.team].dew >= TAMER_CONFIG.spellCost) {
                    game.eco[data.team].dew -= TAMER_CONFIG.spellCost;
                    
                    // Spawn the massive spell rune
                    game.addEntity(new SubjugationRune(data.x, data.y, data.team));
                    
                    // 🧃 [JUICE] Huge impact effects
                    if (game.triggerShake) game.triggerShake(15);
                    game.bus.emit('playSound', 'void'); // Ominous drop
                    game.bus.emit('playSound', 'spell');
                    
                    let captured = false;
                    
                    // 🚀 [PERFORMANCE] Since there is usually only 1 boss, skip the spatial grid!
                    const bosses = game.bosses;
                    const bossLen = bosses.length;
                    
                    for (let i = 0; i < bossLen; i++) {
                        let boss = bosses[i];
                        if (boss.hp > 0) {
                            // Fast AABB check
                            if (Math.abs(boss.x - data.x) > TAMER_CONFIG.spellRadius || Math.abs(boss.y - data.y) > TAMER_CONFIG.spellRadius) continue;

                            if (MathUtils.distSq(boss.x, boss.y, data.x, data.y) < TAMER_CONFIG.spellRadiusSq) {
                                
                                // DOMINATE THE BEAST!
                                boss.originalTeam = boss.team;
                                boss.team = data.team;
                                boss.subjugationTimer = TAMER_CONFIG.subjugateDuration;
                                boss.target = null; // Clear its current target so it re-evaluates
                                
                                captured = true;
                                
                                // 🧃 [JUICE] Massive visual feedback
                                const magicColor = data.team === 'black' ? '#aa00ff' : '#ff0000';
                                game.bus.emit('particles', {x: boss.x, y: boss.y, color: magicColor, count: 100, type: 'magic'});
                                game.bus.emit('playSound', 'roar');
                                
                                if (game.showSystemMessage) {
                                    game.showSystemMessage("THE BEHEMOTH HAS BEEN TAMED!", magicColor);
                                }
                            }
                        }
                    }
                    
                    // Visual feedback for missing
                    if (!captured) {
                        game.bus.emit('particles', {x: data.x, y: data.y, color: '#ffffff', count: 20, type: 'magic'});
                    }
                }
            }
        });
    },

    patch: (game) => {
        // 3. OVERRIDE BOSS BEHAVIOR
        game.expansions.patchClass(CentipedeBoss, 'update', function(original, gameObj) {
            
            if (this.subjugationTimer > 0 && this.hp > 0) {
                this.subjugationTimer--;
                
                // 🧃 [JUICE] Emit magical domination chains/sparks from the boss while controlled
                if (gameObj.tick % 10 === 0) {
                    const magicColor = this.team === 'black' ? '#aa00ff' : '#ff0000';
                    gameObj.bus.emit('particles', {x: this.x, y: this.y, color: magicColor, count: 2, type: 'magic'});
                }

                // BREAK FREE!
                if (this.subjugationTimer <= 0) {
                    this.team = this.originalTeam || 'nature';
                    this.target = null; // Instantly drop targets to re-evaluate who to eat
                    this.cooldown = 0;  // Instantly ready to bite whoever just controlled it!
                    
                    if (gameObj.triggerShake) gameObj.triggerShake(12);
                    gameObj.bus.emit('playSound', 'roar');
                    gameObj.bus.emit('particles', {x: this.x, y: this.y, color: '#ffea00', count: 50, type: 'magic'});
                    
                    if (gameObj.showSystemMessage) {
                        gameObj.showSystemMessage("THE BEHEMOTH BREAKS FREE!", "#ffea00");
                    }
                }
            }

            original.call(this, gameObj); // Run normal boss AI
        });

        // 4. OVERRIDE BOSS RENDERING
        game.expansions.patchClass(CentipedeBoss, 'draw', function(original, ctx, gameObj) {
            
            let restoreAlpha = false;
            let oldAlpha = ctx.globalAlpha;
            
            // 🧃 [JUICE] When subjugated, the boss glows with the controlling team's color
            if (this.subjugationTimer > 0) {
                ctx.save();
                ctx.translate(this.x, this.y);
                
                const magicColor = this.team === 'black' ? '#aa00ff' : '#ff0000';
                const pulse = 10 + Math.sin(gameObj.tick * 0.2) * 10;
                
                ctx.shadowColor = magicColor;
                ctx.shadowBlur = 20 + pulse;
                
                // Draw a pulsing colored ring under the boss
                ctx.fillStyle = `rgba(${this.team === 'black' ? '170, 0, 255' : '255, 0, 0'}, 0.3)`;
                ctx.beginPath(); ctx.ellipse(0, 0, 60 + pulse, 40 + pulse, 0, 0, MathUtils.TWO_PI); ctx.fill();
                
                ctx.restore();
                
                // Slightly tint the boss sprite
                ctx.globalAlpha = 0.85;
                restoreAlpha = true;
            }

            original.call(this, ctx, gameObj);
            
            if (restoreAlpha) {
                ctx.globalAlpha = oldAlpha;
                
                // Draw glowing eyes indicating mind-control
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.angle);
                
                const magicColor = this.team === 'black' ? '#aa00ff' : '#ff0000';
                ctx.shadowColor = magicColor;
                ctx.shadowBlur = 10;
                ctx.fillStyle = magicColor;
                
                // Override the natural red eyes with glowing magic eyes
                ctx.beginPath(); 
                ctx.arc(8, -8, 5, 0, MathUtils.TWO_PI); 
                ctx.arc(8, 8, 5, 0, MathUtils.TWO_PI); 
                ctx.fill(); 
                
                ctx.restore();
            }
        });
    }
};
