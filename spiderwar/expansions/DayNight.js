// expansions/DayNight.js
import { Game } from '../game.js';

export const DayNightExpansion = {
    init: (game) => {
        game.dayTime = 0; // 0 to 1 scale. 
        game.isNight = false;
    },
    patch: (game) => {
        game.expansions.patchClass(Game, 'update', function(original) {
            original.call(this);
            // Full cycle is 7200 ticks (approx 2 minutes)
            this.dayTime = (this.tick % 7200) / 7200; 
            
            // Night is between 0.5 and 1.0
            const wasNight = this.isNight;
            this.isNight = this.dayTime > 0.5 && this.dayTime < 0.9;
            
            if (this.isNight && !wasNight) this.bus.emit('playSound', 'spell'); // Spooky sound at dusk
        });

        // Patch the atmosphere to get very dark at night
        game.bus.on('atmosphereDraw', (ctx) => {
            let darkness = 0;
            if (game.dayTime > 0.4 && game.dayTime <= 0.5) darkness = (game.dayTime - 0.4) * 7; // Dusk
            else if (game.dayTime > 0.5 && game.dayTime <= 0.9) darkness = 0.7; // Night
            else if (game.dayTime > 0.9) darkness = 0.7 - ((game.dayTime - 0.9) * 7); // Dawn

            if (darkness > 0) {
                ctx.fillStyle = `rgba(5, 0, 15, ${darkness})`; 
                ctx.fillRect(game.camera.x, game.camera.y, game.canvas.width, game.canvas.height);
            }
        });
    }
};
