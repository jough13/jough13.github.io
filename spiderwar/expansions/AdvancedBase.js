// expansions/AdvancedBase.js
import { Structure, ResourceNode } from '../game.js';
import { Aphid, GoldenBug } from './Critters.js';

export const AdvancedBaseExpansion = {
    init: (game) => {
        setTimeout(() => {
            const pad = 600; 
            const bX = pad + Math.random() * 200; const bY = pad + Math.random() * 200;
            const rX = game.world.width - pad - Math.random() * 200; const rY = game.world.height - pad - Math.random() * 200;
            
            const tBX = Math.max(0, Math.floor(bX/game.tileSize)); const tBY = Math.max(0, Math.floor(bY/game.tileSize));
            const tRX = Math.max(0, Math.floor(rX/game.tileSize)); const tRY = Math.max(0, Math.floor(rY/game.tileSize));
            if(game.mapGrid[tBY] && game.mapGrid[tBY][tBX]) game.mapGrid[tBY][tBX] = { type: 'dirt', sprite: 'dirt', angle: 0 };
            if(game.mapGrid[tRY] && game.mapGrid[tRY][tRX]) game.mapGrid[tRY][tRX] = { type: 'dirt', sprite: 'dirt', angle: 0 };
            
            game.updateBitmasks();

            game.addEntity(new Structure(bX, bY, 'black', 'nest')); 
            game.addEntity(new Structure(bX + 80, bY, 'black', 'eggsac'));
            game.addEntity(new Structure(rX, rY, 'red', 'nest')); 
            game.addEntity(new Structure(rX - 80, rY, 'red', 'eggsac'));
            
            game.camera.x = Math.max(0, bX - (game.canvas.width / 2)); game.camera.y = Math.max(0, bY - (game.canvas.height / 2));
            
            for (let i = 0; i < 40; i++) {
                let pX = 600 + Math.random() * (game.world.width - 1200); let pY = 600 + Math.random() * (game.world.height - 1200);
                for (let p = 0; p < Math.floor(Math.random() * 6) + 5; p++) game.addEntity(new ResourceNode(pX + (Math.random() - 0.5) * 300, pY + (Math.random() - 0.5) * 300, 'pumpkin'));
            }
            for (let i = 0; i < 60; i++) { game.addEntity(new ResourceNode(Math.random() * game.world.width, Math.random() * game.world.height, 'dew')); }
            
            for(let i=0; i<3; i++) game.addEntity(new GoldenBug(game.world.width/2 + (Math.random()-0.5)*1000, game.world.height/2 + (Math.random()-0.5)*1000));
            for(let i=0; i<30; i++) {
                let ax = Math.random() * game.world.width; let ay = Math.random() * game.world.height;
                if(game.getTerrainAt(ax, ay) === 'grass' || Math.random() > 0.8) game.addEntity(new Aphid(ax, ay));
            }

            setInterval(() => {
                if (game.gameState !== 'playing') return;
                let redNests = game.structures.filter(s => s.team === 'red' && s.type === 'nest');
                if (redNests.length > 0 && game.pop.red < game.maxPop.red) {
                    let nest = redNests[Math.floor(Math.random() * redNests.length)];
                    game.bus.emit('spawnSpider', {
                        x: nest.x, y: nest.y, team: 'red', 
                        role: Math.random() > 0.6 ? 'soldier' : 'harvester'
                    });
                }
            }, 4000);
        }, 100);
    }
};