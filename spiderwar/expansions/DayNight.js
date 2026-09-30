// expansions/DayNight.js
import { Game, Spider } from '../game.js';

// ==========================================
// 1. CONFIGURATION (Easy Tweaking!)
// ==========================================
const DAYNIGHT_CONFIG = {
    cycleTicks: 7200,      // 7200 ticks = ~4 minutes at 30 fps
    maxDarkness: 0.75,     // 75% opacity at the peak of night
    nocturnalBuff: 1.20,   // Spiders move 20% faster at night
    
    // Cycle Thresholds (0.0 to 1.0)
    duskStart: 0.40,       // 40% into the cycle, sun begins to set
    nightStart: 0.50,      // 50% into the cycle, true night begins
    dawnStart: 0.90,       // 90% into the cycle, sun begins to rise
    
    // Aesthetic
    nightColorRGB: '5, 0, 15' // Deep midnight-blue/purple
};

export const DayNightExpansion = {
    init: (game) => {
        game.dayTime = 0; // 0.0 to 1.0 scale
        game.isNight = false;

        // 1. Setup the UI Announcer for Time Transitions
        // SAFETY FIX: Check if styles/elements exist to prevent DOM bloat on hot-reloads!
        if (!document.getElementById('dayNightStyle')) {
            const style = document.createElement('style');
            style.id = 'dayNightStyle';
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
        }

        let announcer = document.getElementById('dayNightAnnouncer');
        if (!announcer) {
            announcer = document.createElement('div');
            announcer.id = 'dayNightAnnouncer';
            document.body.appendChild(announcer);
        }

        let msgTimeout = null;

        // Utility to show fading text on screen
        game.showTimeMessage = (msg, color) => {
            announcer.innerText = msg;
            announcer.style.color = color;
            announcer.style.textShadow = `0 0 15px ${color}, 2px 2px 0 #000`;
            announcer.style.opacity = '1';
            
            // UI POLISH FIX: Clear old timeouts so fast messages don't accidentally get hidden early
            if (msgTimeout) clearTimeout(msgTimeout);
            msgTimeout = setTimeout(() => { announcer.style.opacity = '0'; }, 4000);
        };
    },

    patch: (game) => {
        
        // ==========================================
        // 2. ENGINE TIME LOOP
        // ==========================================
        game.expansions.patchClass(Game, 'update', function(original) {
            original.call(this);
            
            if (this.gameState !== 'playing') return;

            // Calculate the current time of day (0.0 = Dawn, 1.0 = End of cycle)
            this.dayTime = (this.tick % DAYNIGHT_CONFIG.cycleTicks) / DAYNIGHT_CONFIG.cycleTicks; 
            
            const wasNight = this.isNight;
            this.isNight = this.dayTime > DAYNIGHT_CONFIG.nightStart && this.dayTime < DAYNIGHT_CONFIG.dawnStart;
            
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
                this.baseSpeed *= DAYNIGHT_CONFIG.nocturnalBuff;
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
            const t = game.dayTime;
            const cfg = DAYNIGHT_CONFIG;
            
            // MATH FIX: Dynamic normalization ensures the fade is always smooth 
            // no matter how the modder alters the config thresholds!
            if (t > cfg.duskStart && t <= cfg.nightStart) {
                // Dusk: Fade in gradually
                const progress = (t - cfg.duskStart) / (cfg.nightStart - cfg.duskStart);
                darkness = progress * cfg.maxDarkness; 
            } 
            else if (t > cfg.nightStart && t <= cfg.dawnStart) {
                // Dead of Night
                darkness = cfg.maxDarkness; 
            } 
            else if (t > cfg.dawnStart) {
                // Dawn: Fade out gradually
                const progress = (t - cfg.dawnStart) / (1.0 - cfg.dawnStart);
                darkness = cfg.maxDarkness - (progress * cfg.maxDarkness); 
            }

            // PERFORMANCE EARLY EXIT: Skip drawing entirely if it's daytime!
            if (darkness <= 0.01) return;

            // Draw the night overlay
            ctx.fillStyle = `rgba(${cfg.nightColorRGB}, ${darkness})`; 
            ctx.fillRect(game.camera.x, game.camera.y, game.canvas.width, game.canvas.height);
        });
    }
};
