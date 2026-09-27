// expansions/Networks.js
import { MathUtils, Spider } from '../game.js';
import { Queen } from './Queen.js';

// ==========================================
// 1. CONFIGURATION & BALANCING
// ==========================================
const NETWORK_CONFIG = {
    friendlySpeedBuff: 1.5,  // +50% speed on friendly silk
    enemySpeedDebuff: 0.7,   // -30% speed on enemy silk
    spiderLinkDistSq: 6400,  // 80px connection radius between spiders
    structLinkDistSq: 22500  // 150px connection radius to structures
};

// ==========================================
// 2. SILK TERRITORY (The "Creep")
// ==========================================
export const SilkNetworkExpansion = {
    patch: (game) => {
        
        // --- VISUALS: Draw the glowing territory on the ground ---
        game.bus.on('territoryDraw', (ctx) => {
            ctx.save();
            ctx.globalCompositeOperation = 'screen'; 
            
            // Viewport culling boundaries (Max territory is 400px, so use 400 padding)
            const padding = 400;
            const viewL = game.camera.x - padding;
            const viewR = game.camera.x + game.canvas.width + padding;
            const viewT = game.camera.y - padding;
            const viewB = game.camera.y + game.canvas.height + padding;

            // Slow eerie pulse for the magical web
            const pulseAlpha = 0.15 + Math.sin(game.tick * 0.05) * 0.10; 

            for (let i = 0; i < game.structures.length; i++) {
                let s = game.structures[i];
                
                if (s.territory > 0 && s.hp > 0 && !s.isConstructing) {
                    
                    // Viewport Culling: Don't draw massive gradients if off-screen!
                    if (s.x < viewL || s.x > viewR || s.y < viewT || s.y > viewB) continue;

                    let grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.territory);
                    if (s.team === 'black') {
                        grad.addColorStop(0, `rgba(150, 100, 255, ${pulseAlpha})`); // Obsidian Magic
                        grad.addColorStop(1, 'rgba(150, 100, 255, 0)');
                    } else {
                        grad.addColorStop(0, `rgba(255, 50, 50, ${pulseAlpha})`);   // Crimson Magic
                        grad.addColorStop(1, 'rgba(255, 50, 50, 0)');
                    }
                    
                    ctx.fillStyle = grad;
                    ctx.beginPath(); 
                    ctx.arc(s.x, s.y, s.territory, 0, Math.PI * 2); 
                    ctx.fill();
                    
                    ctx.strokeStyle = s.team === 'black' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 100, 100, 0.15)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    
                    // Draw 8-point geometric web lines
                    for (let j = 0; j < 8; j++) {
                        // Using s.x as a static offset seed so the web lines don't rotate or jitter
                        let angle = (j * Math.PI / 4) + (s.x % 1); 
                        ctx.moveTo(s.x, s.y);
                        ctx.lineTo(s.x + Math.cos(angle) * s.territory, s.y + Math.sin(angle) * s.territory);
                    }
                    
                    // Inner geometric ring
                    ctx.arc(s.x, s.y, s.territory * 0.7, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
            ctx.restore();
        });

        // --- MECHANICS: Apply Speed Buffs/Debuffs on the Silk ---
        game.expansions.patchClass(Spider, 'update', function(original, gameObj) {
            let isOnFriendlyWeb = false;
            let isOnEnemyWeb = false;
            
            for (let i = 0; i < gameObj.structures.length; i++) {
                let s = gameObj.structures[i];
                
                if (s.territory > 0 && s.hp > 0 && !s.isConstructing) {
                    
                    // Fast AABB early-exit check to bypass expensive MathUtils.distSq
                    if (Math.abs(this.x - s.x) > s.territory || Math.abs(this.y - s.y) > s.territory) continue;

                    if (MathUtils.distSq(s.x, s.y, this.x, this.y) <= s.territory * s.territory) {
                        if (s.team === this.team) isOnFriendlyWeb = true;
                        else isOnEnemyWeb = true;
                    }
                }
                // Early exit if we already have both statuses
                if (isOnFriendlyWeb && isOnEnemyWeb) break; 
            }
            
            // Temporarily mutate base speed for this frame's update loop
            const baseSpdTemp = this.baseSpeed;
            if (isOnFriendlyWeb) this.baseSpeed *= NETWORK_CONFIG.friendlySpeedBuff;      
            else if (isOnEnemyWeb) this.baseSpeed *= NETWORK_CONFIG.enemySpeedDebuff;    
            
            // FIXED: Safely call the original update with correct context
            original.call(this, gameObj); 
            
            this.baseSpeed = baseSpdTemp; 
        });
        
        // Queens also get the buff, but ignore the debuff
        game.expansions.patchClass(Queen, 'update', function(original, gameObj) {
            let isOnFriendlyWeb = false;
            
            for (let i = 0; i < gameObj.structures.length; i++) {
                let s = gameObj.structures[i];
                if (s.team === this.team && s.territory > 0 && s.hp > 0 && !s.isConstructing) {
                    // Fast AABB check
                    if (Math.abs(this.x - s.x) > s.territory || Math.abs(this.y - s.y) > s.territory) continue;
                    
                    if (MathUtils.distSq(s.x, s.y, this.x, this.y) <= s.territory * s.territory) {
                        isOnFriendlyWeb = true;
                        break; // Found it, stop checking!
                    }
                }
            }
            
            const baseSpdTemp = this.baseSpeed;
            if (isOnFriendlyWeb) this.baseSpeed *= NETWORK_CONFIG.friendlySpeedBuff; 
            
            // FIXED: Safely call the original update
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
            ctx.lineWidth = 1;
            
            // Viewport Culling Bounds (+150px padding to account for link distance)
            const padding = 150;
            const viewL = game.camera.x - padding;
            const viewR = game.camera.x + game.canvas.width + padding;
            const viewT = game.camera.y - padding;
            const viewB = game.camera.y + game.canvas.height + padding;

            // MASSIVE PERFORMANCE BOOST: Pre-filter spiders that are actually on/near the screen.
            // This reduces the O(N^2) loop below from 10,000+ calculations to just a few dozen!
            const visibleSpiders = game.spiders.filter(s => 
                s.hp > 0 && s.x >= viewL && s.x <= viewR && s.y >= viewT && s.y <= viewB
            );

            for (let i = 0; i < visibleSpiders.length; i++) {
                let s1 = visibleSpiders[i];
                
                // 1. Draw Links to nearby Friendly Structures
                let myStructs = game.structures.filter(s => s.team === s1.team && s.hp > 0);
                for (let k = 0; k < myStructs.length; k++) {
                    let struct = myStructs[k];
                    
                    // Fast AABB check before distSq
                    if (Math.abs(s1.x - struct.x) > 150 || Math.abs(s1.y - struct.y) > 150) continue;
                    
                    if (MathUtils.distSq(struct.x, struct.y, s1.x, s1.y) < NETWORK_CONFIG.structLinkDistSq) {
                        ctx.strokeStyle = s1.team === 'black' ? 'rgba(255,255,255,0.3)' : 'rgba(255, 100, 100, 0.3)'; 
                        ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.lineTo(struct.x, struct.y); ctx.stroke(); 
                    }
                }
                
                // 2. Draw Links to nearby Friendly Spiders (The Swarm Effect)
                for (let j = i + 1; j < visibleSpiders.length; j++) {
                    let s2 = visibleSpiders[j];
                    
                    if (s1.team === s2.team) {
                        // Fast AABB check before distSq
                        if (Math.abs(s1.x - s2.x) > 80 || Math.abs(s1.y - s2.y) > 80) continue;

                        if (MathUtils.distSq(s2.x, s2.y, s1.x, s1.y) < NETWORK_CONFIG.spiderLinkDistSq) { 
                            ctx.strokeStyle = s1.team === 'black' ? 'rgba(255,255,255,0.2)' : 'rgba(255, 100, 100, 0.2)'; 
                            ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.lineTo(s2.x, s2.y); ctx.stroke(); 
                        }
                    }
                }
            }
        });
    }
};
