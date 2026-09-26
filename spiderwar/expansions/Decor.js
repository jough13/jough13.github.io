// expansions/Decor.js

export const DecorExpansion = {
    init: (game) => {
        game.decorSprites = { water: new Image(), grass: new Image(), pebbles: new Image() };
        game.decorSprites.water.src = 'assets/clutter_water.png';
        game.decorSprites.grass.src = 'assets/clutter_grass.png';
        game.decorSprites.pebbles.src = 'assets/clutter_pebbles.png';

        setTimeout(() => {
            for(let i=0; i<1500; i++) {
                const dx = Math.random() * game.world.width;
                const dy = Math.random() * game.world.height;
                const terrain = game.getTerrainAt(dx, dy);
                
                if(['water', 'grass', 'pebbles'].includes(terrain)) {
                    game.decor.push({
                        x: dx, y: dy, type: terrain, 
                        sprite: game.decorSprites[terrain],
                        size: (Math.random() * 15) + 15 
                    });
                }
            }
        }, 500);
    },
    patch: (game) => {
        game.bus.on('preDraw', (ctx) => {
            const padding = 100;
            const viewL = game.camera.x - padding;
            const viewR = game.camera.x + game.canvas.width + padding;
            const viewT = game.camera.y - padding;
            const viewB = game.camera.y + game.canvas.height + padding;

            game.decor.forEach(d => {
                if (d.x >= viewL && d.x <= viewR && d.y >= viewT && d.y <= viewB) {
                    if (d.sprite.complete && d.sprite.naturalHeight !== 0) {
                        ctx.drawImage(d.sprite, d.x - d.size, d.y - d.size, d.size*2, d.size*2);
                    }
                }
            });
        });
    }
};