// expansions/Networks.js
import { MathUtils, Spider } from '../game.js';
import { Queen } from './Queen.js';

export const SilkNetworkExpansion = {
    patch: (game) => {
        game.bus.on('territoryDraw', (ctx) => {
            ctx.save();
            ctx.globalCompositeOperation = 'screen'; 
            
            for(let s of game.structures) {
                if(s.territory > 0) {
                    let grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.territory);
                    if (s.team === 'black') {
                        grad.addColorStop(0, 'rgba(150, 100, 255, 0.25)'); 
                        grad.addColorStop(1, 'rgba(150, 100, 255, 0)');
                    } else {
                        grad.addColorStop(0, 'rgba(255, 50, 50, 0.25)'); 
                        grad.addColorStop(1, 'rgba(255, 50, 50, 0)');
                    }
                    ctx.fillStyle = grad;
                    ctx.beginPath(); ctx.arc(s.x, s.y, s.territory, 0, Math.PI * 2); ctx.fill();
                    
                    ctx.strokeStyle = s.team === 'black' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 100, 100, 0.15)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    for(let i=0; i<8; i++) {
                        let angle = (i * Math.PI/4) + (s.x % 1); 
                        ctx.moveTo(s.x, s.y);
                        ctx.lineTo(s.x + Math.cos(angle)*s.territory, s.y + Math.sin(angle)*s.territory);
                    }
                    ctx.arc(s.x, s.y, s.territory * 0.7, 0, Math.PI*2);
                    ctx.stroke();
                }
            }
            ctx.restore();
        });

        game.expansions.patchClass(Spider, 'update', function(original, gameObj) {
            let isOnFriendlyWeb = false;
            let isOnEnemyWeb = false;
            for(let s of gameObj.structures) {
                if (s.territory > 0 && MathUtils.distSq(s.x, s.y, this.x, this.y) <= s.territory**2) {
                    if (s.team === this.team) isOnFriendlyWeb = true;
                    else isOnEnemyWeb = true;
                }
            }
            const baseSpdTemp = this.baseSpeed;
            if (isOnFriendlyWeb) this.baseSpeed *= 1.5;      
            else if (isOnEnemyWeb) this.baseSpeed *= 0.7;    
            
            original(gameObj); 
            this.baseSpeed = baseSpdTemp; 
        });
        
        game.expansions.patchClass(Queen, 'update', function(original, gameObj) {
            let isOnFriendlyWeb = false;
            for(let s of gameObj.structures) {
                if (s.team === this.team && s.territory > 0 && MathUtils.distSq(s.x, s.y, this.x, this.y) <= s.territory**2) isOnFriendlyWeb = true;
            }
            const baseSpdTemp = this.baseSpeed;
            if (isOnFriendlyWeb) this.baseSpeed *= 1.5; 
            original(gameObj);
            this.baseSpeed = baseSpdTemp;
        });
    }
};

export const WebNetworkExpansion = {
    patch: (game) => {
        game.bus.on('preDraw', (ctx) => {
            ctx.lineWidth = 1;
            const spiders = game.spiders;
            for (let i = 0; i < spiders.length; i++) {
                let s1 = spiders[i];
                if (s1.x < game.camera.x - 100 || s1.x > game.camera.x + game.canvas.width + 100 || s1.y < game.camera.y - 100 || s1.y > game.camera.y + game.canvas.height + 100) continue;
                
                game.structures.filter(s => s.team === s1.team).forEach(struct => {
                    if (MathUtils.distSq(struct.x, struct.y, s1.x, s1.y) < 22500) { // 150 squared
                        ctx.strokeStyle = s1.team === 'black' ? 'rgba(255,255,255,0.3)' : 'rgba(255, 100, 100, 0.3)'; 
                        ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.lineTo(struct.x, struct.y); ctx.stroke(); 
                    }
                });
                for (let j = i + 1; j < spiders.length; j++) {
                    let s2 = spiders[j];
                    if (s1.team === s2.team && MathUtils.distSq(s2.x, s2.y, s1.x, s1.y) < 6400) { // 80 squared
                        ctx.strokeStyle = s1.team === 'black' ? 'rgba(255,255,255,0.2)' : 'rgba(255, 100, 100, 0.2)'; 
                        ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.lineTo(s2.x, s2.y); ctx.stroke(); 
                    }
                }
            }
        });
    }
};