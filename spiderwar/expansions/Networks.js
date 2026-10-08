// expansions/Networks.js
import { MathUtils, Spider } from '../game.js';
import { Queen } from './Queen.js';

// ==========================================
// 1. CONFIGURATION & BALANCING
// ==========================================
// [EXPANDABILITY] Exposed so other mods can tweak connection distances and buffs
export const NETWORK_CONFIG = {
    friendlySpeedBuff: 1.5,  // +50% speed on friendly silk
    enemySpeedDebuff: 0.7,   // -30% speed on enemy silk
    
    spiderLinkDist: 80,      
    spiderLinkDistSq: 6400,  
    
    structLinkDist: 150,     
    structLinkDistSq: 22500  
};

const PI_OVER_4 = Math.PI / 4; 

// ==========================================
// 2. SILK TERRITORY (The "Creep")
// ==========================================
export const SilkNetworkExpansion = {
    init: (game) => {
        game.networkConfig = NETWORK_CONFIG;
    },
    
    patch: (game) => {
        
        // --- VISUALS: Draw the glowing territory on the ground ---
        game.bus.on('territoryDraw', (ctx) => {
            if (!game.structures) return;

            ctx.save();
            ctx.globalCompositeOperation = 'screen'; 
            
            const padding = 400;
            const viewL = game.camera.x - padding;
            const viewR = game.camera.x + game.canvas.width + padding;
            const viewT = game.camera.y - padding;
            const viewB = game.camera.y + game.canvas.height + padding;

            const pulseAlpha = 0.15 + Math.sin(game.tick * 0.05) * 0.10; 

            for (let i = 0; i < game.structures.length; i++) {
                let s = game.structures[i];
                
                if (s.territory > 0 && s.hp > 0 && !s.isConstructing) {
                    if (s.x < viewL || s.x > viewR || s.y < viewT || s.y > viewB) continue;

                    let grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.territory);
                    if (s.team === 'black') {
                        grad.addColorStop(0, `rgba(150, 100, 255, ${pulseAlpha})`); 
                        grad.addColorStop(1, 'rgba(150, 100, 255, 0)');
                    } else {
                        grad.addColorStop(0, `rgba(255, 50, 50, ${pulseAlpha})`);   
                        grad.addColorStop(1, 'rgba(255, 50, 50, 0)');
                    }
                    
                    ctx.fillStyle = grad;
                    ctx.beginPath(); 
                    ctx.arc(s.x, s.y, s.territory, 0, MathUtils.TWO_PI); 
                    ctx.fill();
                    
                    ctx.strokeStyle = s.team === 'black' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 100, 100, 0.15)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    
                    for (let j = 0; j < 8; j++) {
                        let angle = (j * PI_OVER_4) + (s.x % 1); 
                        ctx.moveTo(s.x, s.y);
                        ctx.lineTo(s.x + Math.cos(angle) * s.territory, s.y + Math.sin(angle) * s.territory);
                    }
                    
                    ctx.arc(s.x, s.y, s.territory * 0.7, 0, MathUtils.TWO_PI);
                    ctx.stroke();
                }
            }
            ctx.restore();
        });

        // --- MECHANICS: Apply Speed Buffs/Debuffs on the Silk ---
        game.expansions.patchClass(Spider, 'update', function(original, gameObj) {
            let isOnFriendlyWeb = false;
            let isOnEnemyWeb = false;
            
            // PERFORMANCE FIX: Cache getter to prevent .filter() array GC thrashing
            const structs = gameObj.structures;

            for (let i = 0; i < structs.length; i++) {
                let s = structs[i];
                
                if (s.territory > 0 && s.hp > 0 && !s.isConstructing) {
                    if (Math.abs(this.x - s.x) > s.territory || Math.abs(this.y - s.y) > s.territory) continue;

                    if (MathUtils.distSq(s.x, s.y, this.x, this.y) <= s.territory * s.territory) {
                        if (s.team === this.team) isOnFriendlyWeb = true;
                        else isOnEnemyWeb = true;
                    }
                }
                if (isOnFriendlyWeb && isOnEnemyWeb) break; 
            }
            
            const baseSpdTemp = this.baseSpeed;
            if (isOnFriendlyWeb) this.baseSpeed *= NETWORK_CONFIG.friendlySpeedBuff;      
            else if (isOnEnemyWeb) this.baseSpeed *= NETWORK_CONFIG.enemySpeedDebuff;    
            
            original.call(this, gameObj); 
            
            this.baseSpeed = baseSpdTemp; 
        });
        
        // Queens also get the buff, but ignore the debuff
        game.expansions.patchClass(Queen, 'update', function(original, gameObj) {
            let isOnFriendlyWeb = false;
            const structs = gameObj.structures; // Cache
            
            for (let i = 0; i < structs.length; i++) {
                let s = structs[i];
                if (s.team === this.team && s.territory > 0 && s.hp > 0 && !s.isConstructing) {
                    if (Math.abs(this.x - s.x) > s.territory || Math.abs(this.y - s.y) > s.territory) continue;
                    
                    if (MathUtils.distSq(s.x, s.y, this.x, this.y) <= s.territory * s.territory) {
                        isOnFriendlyWeb = true;
                        break; 
                    }
                }
            }
            
            const baseSpdTemp = this.baseSpeed;
            if (isOnFriendlyWeb) this.baseSpeed *= NETWORK_CONFIG.friendlySpeedBuff; 
            
            original.call(this, gameObj);
            
            this.baseSpeed = baseSpdTemp;
        });
    }
};

// ==========================================
// 3. VISUAL SWARM LINKS (The "Web Network")
// ==========================================
export const WebNetworkExpansion = {
    patch: (game) => {
        game.bus.on('preDraw', (ctx) => {
            if (!game.spiders || !game.structures) return;

            ctx.lineWidth = 1;
            
            const padding = 150;
            const viewL = game.camera.x - padding;
            const viewR = game.camera.x + game.canvas.width + padding;
            const viewT = game.camera.y - padding;
            const viewB = game.camera.y + game.canvas.height + padding;

            const visibleSpiders = [];
            for (let i = 0; i < game.spiders.length; i++) {
                let s = game.spiders[i];
                if (s.hp > 0 && s.x >= viewL && s.x <= viewR && s.y >= viewT && s.y <= viewB) {
                    visibleSpiders.push(s);
                }
            }

            const aliveStructs = [];
            for (let i = 0; i < game.structures.length; i++) {
                if (game.structures[i].hp > 0) aliveStructs.push(game.structures[i]);
            }

            const structDist = NETWORK_CONFIG.structLinkDist;
            const spiderDist = NETWORK_CONFIG.spiderLinkDist;
            const spiderDistSq = NETWORK_CONFIG.spiderLinkDistSq;
            
            const CELL_SIZE = 250; // Sync with spatial grid
            const maxGridX = Math.ceil(game.world.width / CELL_SIZE);
            const maxGridY = Math.ceil(game.world.height / CELL_SIZE);

            for (let i = 0; i < visibleSpiders.length; i++) {
                let s1 = visibleSpiders[i];
                
                // 1. Draw Links to nearby Friendly Structures (Standard Loop)
                for (let k = 0; k < aliveStructs.length; k++) {
                    let struct = aliveStructs[k];
                    
                    if (struct.team === s1.team) {
                        if (Math.abs(s1.x - struct.x) > structDist || Math.abs(s1.y - struct.y) > structDist) continue;
                        
                        const distSq = MathUtils.distSq(struct.x, struct.y, s1.x, s1.y);
                        if (distSq < NETWORK_CONFIG.structLinkDistSq) {
                            // [JUICE] Dist-based pulsing makes the light look like it's flowing through the web!
                            const flowPulse = 0.15 + Math.sin(game.tick * 0.1 + Math.sqrt(distSq)) * 0.1;
                            ctx.strokeStyle = s1.team === 'black' ? `rgba(255,255,255,${flowPulse + 0.1})` : `rgba(255, 100, 100, ${flowPulse + 0.1})`; 
                            ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.lineTo(struct.x, struct.y); ctx.stroke(); 
                        }
                    }
                }
                
                // 2. SPATIAL GRID OPTIMIZATION for Spider-to-Spider links
                // Instead of checking against every spider on the screen, only check the 9 grid cells around this spider!
                const cx = MathUtils.clamp((s1.x / CELL_SIZE) | 0, 0, maxGridX);
                const cy = MathUtils.clamp((s1.y / CELL_SIZE) | 0, 0, maxGridY);

                for (let nx = cx - 1; nx <= cx + 1; nx++) {
                    if (nx < 0 || nx > maxGridX) continue;
                    for (let ny = cy - 1; ny <= cy + 1; ny++) {
                        if (ny < 0 || ny > maxGridY) continue;
                        
                        const key = (nx << 16) | ny;
                        const cell = game.spatialGrid.get(key);
                        if (!cell) continue;

                        for (let j = 0; j < cell.length; j++) {
                            let s2 = cell[j];
                            
                            // [FIX] ID Check to prevent Canvas Double-Drawing
                            // Only draw A->B, skip B->A
                            if (s1 === s2 || s1.team !== s2.team || !s2.role || s2.hp <= 0 || s1.id > s2.id) continue;

                            // Fast AABB check
                            if (Math.abs(s1.x - s2.x) > spiderDist || Math.abs(s1.y - s2.y) > spiderDist) continue;

                            const distSq = MathUtils.distSq(s2.x, s2.y, s1.x, s1.y);
                            if (distSq < spiderDistSq) { 
                                const flowPulse = 0.15 + Math.sin(game.tick * 0.1 + Math.sqrt(distSq)) * 0.1;
                                ctx.strokeStyle = s1.team === 'black' ? `rgba(255,255,255,${flowPulse})` : `rgba(255, 100, 100, ${flowPulse})`; 
                                ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.lineTo(s2.x, s2.y); ctx.stroke(); 
                            }
                        }
                    }
                }
            }
        });
    }
};
