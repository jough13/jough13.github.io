// expansions/TitanGod.js
import { MathUtils } from '../game.js';
import { CentipedeBoss } from './Boss.js';

export const TAMER_CONFIG = {
    spellCost: 200,            
    spellRadius: 300,          
    spellRadiusSq: 90000,      
    subjugateDuration: 1800,   
    requiredTech: 3            
};

class SubjugationRune {
    constructor(x, y, team) {
        this.x = x; 
        this.y = y; 
        this.team = team;
        this.life = 60; 
        this.maxLife = 60;
        this.radius = TAMER_CONFIG.spellRadius;
        this.size = this.radius; // [FIX] Ensure it doesn't get culled prematurely
        
        // 🚀 [ASSET INTEGRATION]
        this.spriteSrc = 'assets/rune_subjugate.png';
        this.spriteLoaded = false;
        this.sprite = null;
    }

    update(game) { this.life--; }

    draw(ctx, game) {
        if (!this.spriteLoaded && game && game.assets) {
            this.sprite = game.assets.get(this.spriteSrc);
            if (this.sprite) this.spriteLoaded = true;
        }

        const progress = 1 - (this.life / this.maxLife);
        const currentRadius = this.radius * Math.sqrt(progress); 
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.rotate(game.tick * 0.05);
        
        // 🧃 [JUICE] Draw the new pixel art rune!
        if (this.spriteLoaded && this.sprite && this.sprite.complete && this.sprite.naturalHeight !== 0) {
            ctx.shadowColor = this.team === 'black' ? '#aa00ff' : '#ff0000';
            ctx.shadowBlur = 20;
            ctx.drawImage(this.sprite, -currentRadius, -currentRadius, currentRadius * 2, currentRadius * 2);
        } else {
            // Fallback hexagon
            ctx.strokeStyle = this.team === 'black' ? '#aa00ff' : '#ff0000';
            ctx.lineWidth = 6;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI) / 3;
                if (i === 0) ctx.moveTo(Math.cos(angle) * currentRadius, Math.sin(angle) * currentRadius);
                else ctx.lineTo(Math.cos(angle) * currentRadius, Math.sin(angle) * currentRadius);
            }
            ctx.closePath(); ctx.stroke();
        }

        ctx.restore();
    }
}

export const TitanGodExpansion = {
    init: (game) => {
        game.tamerConfig = TAMER_CONFIG;

        // 🚀 [ASSET INTEGRATION] Register new assets
        game.assets.register('assets/rune_subjugate.png');
        game.assets.register('assets/icon_subjugate.png');

        // [FIX] Initialize UI arrays locally to ensure 100% modular safety regardless of boot order!
        game.uiActions = game.uiActions || {};
        game.customUIHooks = game.customUIHooks || [];

        game.uiActions['subjugate'] = { 
            reqTech: TAMER_CONFIG.requiredTech, 
            icon: '⛓️',  
            img: 'assets/icon_subjugate.png', 
            name: 'Subjugate', 
            cost: `${TAMER_CONFIG.spellCost}💧`, 
            type: 'tool', 
            val: 'subjugate' 
        };

        game.customUIHooks.push((currentSelection, addButton) => {
            if (!currentSelection || currentSelection.role === 'queen') addButton('subjugate');
        });

        game.bus.on('castSpell', (data) => {
            if (data.type === 'subjugate') {
                if (game.eco[data.team].dew >= TAMER_CONFIG.spellCost) {
                    game.eco[data.team].dew -= TAMER_CONFIG.spellCost;
                    game.addEntity(new SubjugationRune(data.x, data.y, data.team));
                    
                    if (game.triggerShake) game.triggerShake(15);
                    game.bus.emit('playSound', 'void'); 
                    game.bus.emit('playSound', 'spell');
                    
                    let captured = false;
                    const bosses = game.bosses;
                    const bossLen = bosses.length;
                    
                    for (let i = 0; i < bossLen; i++) {
                        let boss = bosses[i];
                        if (boss.hp > 0) {
                            if (Math.abs(boss.x - data.x) > TAMER_CONFIG.spellRadius || Math.abs(boss.y - data.y) > TAMER_CONFIG.spellRadius) continue;
                            if (MathUtils.distSq(boss.x, boss.y, data.x, data.y) < TAMER_CONFIG.spellRadiusSq) {
                                
                                // [FIX] Only record the original team if it isn't ALREADY under a mind-control spell!
                                if (!boss.subjugationTimer || boss.subjugationTimer <= 0) {
                                    boss.originalTeam = boss.team;
                                }
                                
                                boss.team = data.team;
                                boss.subjugationTimer = TAMER_CONFIG.subjugateDuration;
                                boss.target = null; 
                                captured = true;
                                
                                const magicColor = data.team === 'black' ? '#aa00ff' : '#ff0000';
                                game.bus.emit('particles', {x: boss.x, y: boss.y, color: magicColor, count: 100, type: 'magic'});
                                game.bus.emit('playSound', 'roar');
                                if (game.showSystemMessage) game.showSystemMessage("THE BEHEMOTH HAS BEEN TAMED!", magicColor);
                            }
                        }
                    }
                    if (!captured) game.bus.emit('particles', {x: data.x, y: data.y, color: '#ffffff', count: 20, type: 'magic'});
                }
            }
        });
    },

    patch: (game) => {
        game.expansions.patchClass(CentipedeBoss, 'update', function(original, gameObj) {
            if (this.subjugationTimer > 0 && this.hp > 0) {
                this.subjugationTimer--;
                if (gameObj.tick % 10 === 0) gameObj.bus.emit('particles', {x: this.x, y: this.y, color: this.team === 'black' ? '#aa00ff' : '#ff0000', count: 2, type: 'magic'});

                if (this.subjugationTimer <= 0) {
                    this.team = this.originalTeam || 'nature';
                    this.target = null; this.cooldown = 0;  
                    if (gameObj.triggerShake) gameObj.triggerShake(12);
                    gameObj.bus.emit('playSound', 'roar');
                    gameObj.bus.emit('particles', {x: this.x, y: this.y, color: '#ffea00', count: 50, type: 'magic'});
                    if (gameObj.showSystemMessage) gameObj.showSystemMessage("THE BEHEMOTH BREAKS FREE!", "#ffea00");
                }
            }
            original.call(this, gameObj); 
        });

        game.expansions.patchClass(CentipedeBoss, 'draw', function(original, ctx, gameObj) {
            let restoreAlpha = false;
            let oldAlpha = ctx.globalAlpha;
            
            if (this.subjugationTimer > 0) {
                ctx.save(); ctx.translate(this.x, this.y);
                const magicColor = this.team === 'black' ? '#aa00ff' : '#ff0000';
                const pulse = 10 + Math.sin(gameObj.tick * 0.2) * 10;
                ctx.shadowColor = magicColor; ctx.shadowBlur = 20 + pulse;
                ctx.fillStyle = `rgba(${this.team === 'black' ? '170, 0, 255' : '255, 0, 0'}, 0.3)`;
                ctx.beginPath(); ctx.ellipse(0, 0, 60 + pulse, 40 + pulse, 0, 0, MathUtils.TWO_PI); ctx.fill();
                ctx.restore();
                
                ctx.globalAlpha = 0.85; restoreAlpha = true;
            }

            original.call(this, ctx, gameObj);
            
            if (restoreAlpha) {
                ctx.globalAlpha = oldAlpha;
                ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle);
                const magicColor = this.team === 'black' ? '#aa00ff' : '#ff0000';
                ctx.shadowColor = magicColor; ctx.shadowBlur = 10; ctx.fillStyle = magicColor;
                ctx.beginPath(); ctx.arc(8, -8, 5, 0, MathUtils.TWO_PI); ctx.arc(8, 8, 5, 0, MathUtils.TWO_PI); ctx.fill(); 
                ctx.restore();
            }
        });
    }
};
