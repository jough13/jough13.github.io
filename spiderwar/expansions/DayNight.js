// expansions/DayNight.js
import { Game, Spider } from '../game.js';

// ==========================================
// CONFIGURATION (Easy Tweaking!)
// ==========================================
const DAY_CYCLE_TICKS = 7200; // 7200 ticks = ~4 minutes at 30 fps
const MAX_DARKNESS = 0.75;    // 75% opacity at the peak of night
const NOCTURNAL_BUFF = 1.20;  // Spiders move 20% faster at night

export const DayNightExpansion = {
    init: (game) => {
        game.dayTime = 0; // 0.0 to 1.0 scale
        game.isNight = false;

        // 1. Setup the UI Announcer for Time Transitions
        const style = document.createElement('style');
        style.innerHTML = `
            #dayNightAnnouncer {
                position: fixed; top: 15%; left: 50%; transform: translateX(-50%);
                color: #aa00ff; font-family: 'Courier New', monospace; font-size: 1.8rem;
                text-align: center; text-shadow: 0 0 15px #aa00ff, 2px 2px 0 #000;
                pointer-events: none; opacity: 0; transition: opacity 2s ease-in-out;
                z-index: 3000; text-transform: uppercase; font-weight: bold; letter-spacing: 2px;
            }
        `;
        document.head.appendChild(style);

        const announcer = document.createElement('div');
        announcer.id = 'dayNightAnnouncer';
        document.body.appendChild(announcer);

        // Utility to show fading text on screen
        game.showTimeMessage = (msg, color) => {
            announcer.innerText = msg;
            announcer.style.color = color;
            announcer.style.textShadow = `0 0 15px ${color}, 2px 2px 0 #000`;
            announcer.style.opacity = '1';
            
            // Fade out after 4 seconds
            setTimeout(() => { announcer.style.opacity = '0'; }, 4000);
        };
    },

    patch: (game) => {
        
        // ==========================================
        // 2. ENGINE TIME LOOP
        // ==========================================
        game.expansions.patchClass(Game, 'update', function(original) {
            original.call(this);
            
            if (this.gameState !== 'playing') return;

            // Calculate the current time of day (0.0 = Dawn, 0.5 = Dusk)
            this.dayTime = (this.tick % DAY_CYCLE_TICKS) / DAY_CYCLE_TICKS; 
            
            const wasNight = this.isNight;
            this.isNight = this.dayTime > 0.5 && this.dayTime < 0.9;
            
            // Dusk Transition
            if (this.isNight && !wasNight) {
                this.bus.emit('playSound', 'spell'); // Ethereal chime
                this.showTimeMessage("Night Falls... The Swarm Quickens", "#aa00ff");
            }
            
            // Dawn Transition
            if (!this.isNight && wasNight) {
                this.bus.emit('playSound', 'build'); // Deep thud/gong
                this.showTimeMessage("Daybreak Returns", "#ff9d00");
            }
        });

        // ==========================================
        // 3. NOCTURNAL GAMEPLAY MECHANIC
        // ==========================================
        game.expansions.patchClass(Spider, 'update', function(original, gameObj) {
            // Apply temporary speed buff at night!
            const originalSpeed = this.baseSpeed;
            
            if (gameObj.isNight) {
                this.baseSpeed *= NOCTURNAL_BUFF;
            }
            
            original.call(this, gameObj); // Run normal AI with boosted speed
            
            // Restore base speed safely so it doesn't compound infinitely
            this.baseSpeed = originalSpeed; 
        });

        // ==========================================
        // 4. ATMOSPHERIC RENDERING
        // ==========================================
        game.bus.on('atmosphereDraw', (ctx) => {
            let darkness = 0;
            
            // Smoothlerp calculations for dusk and dawn fading
            if (game.dayTime > 0.4 && game.dayTime <= 0.5) {
                // Dusk: Fade in from 0.4 to 0.5
                darkness = (game.dayTime - 0.4) * 10 * MAX_DARKNESS; 
            } 
            else if (game.dayTime > 0.5 && game.dayTime <= 0.9) {
                // Dead of Night
                darkness = MAX_DARKNESS; 
            } 
            else if (game.dayTime > 0.9) {
                // Dawn: Fade out from 0.9 to 1.0
                darkness = MAX_DARKNESS - ((game.dayTime - 0.9) * 10 * MAX_DARKNESS); 
            }

            // PERFORMANCE EARLY EXIT: Skip drawing entirely if it's daytime!
            if (darkness <= 0.01) return;

            // Draw the deep midnight-blue/purple darkness overlay
            ctx.fillStyle = `rgba(5, 0, 15, ${darkness})`; 
            ctx.fillRect(game.camera.x, game.camera.y, game.canvas.width, game.canvas.height);
        });
    }
};
