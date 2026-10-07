// expansions/DayNight.js
import { Game, Spider, MathUtils } from '../game.js';

// ==========================================
// 1. CONFIGURATION (Easy Tweaking!)
// ==========================================
// [EXPANDABILITY] Exported so other mods can tweak cycle speeds or toggle real-world time!
export const DAYNIGHT_CONFIG = {
    useRealTime: true,     // Matches host player's actual local clock!
    
    // Real-world 24-hour thresholds (0.0 = Midnight, 0.5 = Noon)
    dawnStart: 6 / 24,     // 6:00 AM (Sun starts rising)
    dayStart: 7 / 24,      // 7:00 AM (Fully bright)
    duskStart: 18 / 24,    // 6:00 PM (Sun starts setting)
    nightStart: 20 / 24,   // 8:00 PM (Fully dark)

    maxDarkness: 0.85,     // 85% opacity at the peak of night
    nocturnalBuff: 1.25,   // Spiders move 25% faster at night
    
    // Aesthetic
    nightColorRGB: '5, 0, 15', // Deep midnight-blue/purple
    fireflyColor: '#d4ff00',   // Glowing yellow-green
    
    // Mod Compatibility
    eclipseDurationTicks: 3600 // How long the CursedRelics Eclipse spell overrides real-world time (60 seconds)
};

export const DayNightExpansion = {
    init: (game) => {
        game.dayNightConfig = DAYNIGHT_CONFIG;
        game.dayTime = 0; // 0.0 to 1.0 scale
        game.isNight = false;
        game.eclipseTimer = 0;

        // 1. Setup the UI Announcer for Time Transitions
        if (!document.getElementById('dayNightStyle')) {
            const style = document.createElement('style');
            style.id = 'dayNightStyle';
            style.innerHTML = `
                #dayNightAnnouncer {
                    position: fixed; top: 20%; left: 50%; transform: translate(-50%, -50%) scale(1);
                    color: #aa00ff; font-family: 'Courier New', monospace; font-size: 2rem;
                    text-align: center; text-shadow: 0 0 15px #aa00ff, 2px 2px 0 #000;
                    pointer-events: none; opacity: 0; 
                    transition: opacity 1.5s ease-in-out, transform 3s ease-out;
                    z-index: 3000; text-transform: uppercase; font-weight: bold; letter-spacing: 4px;
                }
                #dayNightAnnouncer.active {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1.1); /* Cinematic slow zoom */
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

        game.showTimeMessage = (msg, color) => {
            announcer.innerText = msg;
            announcer.style.color = color;
            announcer.style.textShadow = `0 0 20px ${color}, 2px 2px 0 #000`;
            
            announcer.classList.remove('active');
            void announcer.offsetWidth; // Force DOM reflow
            announcer.classList.add('active');
            
            if (msgTimeout) clearTimeout(msgTimeout);
            msgTimeout = setTimeout(() => { announcer.classList.remove('active'); }, 4000);
        };
    },

    patch: (game) => {
        
        // ==========================================
        // 2. ENGINE TIME LOOP
        // ==========================================
        game.expansions.patchClass(Game, 'update', function(original) {
            
            // [MOD COMPATIBILITY FIX] The Time-Warp Detector!
            // If CursedRelics.js fast-forwards the engine tick, we catch the jump here
            // and force the game into a "Supernatural Eclipse" regardless of real-world time.
            if (this.lastTick !== undefined && this.tick - this.lastTick > 100) {
                this.eclipseTimer = DAYNIGHT_CONFIG.eclipseDurationTicks;
                this.showTimeMessage("Supernatural Eclipse!", "#aa00ff");
            }
            this.lastTick = this.tick;

            original.call(this);
            
            if (this.gameState !== 'playing') return;

            // 1. Calculate the Time Ratio
            let currentRatio = 0.5; // Default noon
            
            if (DAYNIGHT_CONFIG.useRealTime) {
                // Calculate precise percentage of the 24-hour real-world day
                const now = new Date();
                const msSinceMidnight = (now.getHours() * 3600000) + (now.getMinutes() * 60000) + (now.getSeconds() * 1000) + now.getMilliseconds();
                currentRatio = msSinceMidnight / 86400000;
            } else {
                // Fallback to classic fast-forward engine ticks (Useful for debugging)
                currentRatio = (this.tick % 7200) / 7200;
            }

            // 2. Apply Eclipse Override
            if (this.eclipseTimer > 0) {
                this.eclipseTimer--;
                currentRatio = DAYNIGHT_CONFIG.nightStart + 0.05; // Lock the time to deep night!
            }

            this.dayTime = currentRatio;
            
            // 3. State Determination
            const wasNight = this.isNight;
            const t = this.dayTime;
            const cfg = DAYNIGHT_CONFIG;
            
            // It is night if the time is before dawn, or after dusk
            this.isNight = (t < cfg.dawnStart || t >= cfg.duskStart);
            
            // 4. Transitions
            if (this.isNight && !wasNight && this.eclipseTimer <= 0) {
                this.bus.emit('playSound', 'spell'); 
                this.showTimeMessage("Night Falls... The Swarm Quickens", "#aa00ff");
            }
            if (!this.isNight && wasNight && this.eclipseTimer <= 0) {
                this.bus.emit('playSound', 'build'); 
                this.showTimeMessage("Daybreak Returns", "#ff9d00");
            }

            // [JUICE] Spawn ambient fireflies during the night!
            if (this.isNight && Math.random() < 0.15) {
                const spawnX = this.camera.x + MathUtils.randomRange(0, this.canvas.width);
                const spawnY = this.camera.y + MathUtils.randomRange(0, this.canvas.height);
                
                this.bus.emit('particles', {
                    x: spawnX, y: spawnY, color: cfg.fireflyColor, count: 1, type: 'magic'
                });
            }
        });

        // ==========================================
        // 3. NOCTURNAL GAMEPLAY MECHANIC
        // ==========================================
        game.expansions.patchClass(Spider, 'update', function(original, gameObj) {
            const originalSpeed = this.baseSpeed;
            
            if (gameObj.isNight) {
                this.baseSpeed *= DAYNIGHT_CONFIG.nocturnalBuff;
                
                // [JUICE] Spiders leave a faint, ghostly trail while empowered by the night!
                if (this.speed > 0 && gameObj.tick % 15 === 0 && Math.random() > 0.5) {
                    const magicColor = this.team === 'black' ? 'rgba(170, 0, 255, 0.4)' : 'rgba(255, 0, 0, 0.4)';
                    gameObj.bus.emit('particles', {x: this.x, y: this.y, color: magicColor, count: 1, type: 'magic'});
                }
            }
            
            original.call(this, gameObj); 
            
            this.baseSpeed = originalSpeed; 
        });

        // ==========================================
        // 4. ATMOSPHERIC RENDERING
        // ==========================================
        game.bus.on('atmosphereDraw', (ctx) => {
            const t = game.dayTime;
            const cfg = DAYNIGHT_CONFIG;
            
            let darkness = 0;
            let useSunsetGlow = false;
            
            if (t >= cfg.dawnStart && t < cfg.dayStart) {
                // DAWN (Fading out darkness)
                const progress = (t - cfg.dawnStart) / (cfg.dayStart - cfg.dawnStart);
                darkness = cfg.maxDarkness * (1 - progress); 
                useSunsetGlow = true;
            } 
            else if (t >= cfg.duskStart && t < cfg.nightStart) {
                // DUSK (Fading in darkness)
                const progress = (t - cfg.duskStart) / (cfg.nightStart - cfg.duskStart);
                darkness = cfg.maxDarkness * progress; 
                useSunsetGlow = true;
            }
            else if (t >= cfg.nightStart || t < cfg.dawnStart) {
                // DEAD OF NIGHT
                darkness = cfg.maxDarkness; 
            }

            // PERFORMANCE EARLY EXIT: Skip drawing entirely if it's daytime!
            if (darkness <= 0.01) return;

            // [JUICE] Render beautiful radial sunsets on the horizon during transitions
            if (useSunsetGlow && game.eclipseTimer <= 0) {
                const cx = game.camera.x + (game.canvas.width / 2);
                const cy = game.camera.y + (game.canvas.height / 2);
                
                // Creates a glowing orange light that fades into the deep purple night sky
                let grad = ctx.createRadialGradient(cx, cy + 200, 100, cx, cy, game.canvas.width * 0.8);
                grad.addColorStop(0, `rgba(255, 100, 0, ${darkness * 0.6})`); 
                grad.addColorStop(1, `rgba(${cfg.nightColorRGB}, ${darkness})`);
                
                ctx.fillStyle = grad;
            } else {
                // Flat darkness for deep night or Eclipse
                ctx.fillStyle = `rgba(${cfg.nightColorRGB}, ${darkness})`; 
            }

            ctx.fillRect(game.camera.x, game.camera.y, game.canvas.width, game.canvas.height);
        });
    }
};
