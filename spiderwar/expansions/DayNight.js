// expansions/DayNight.js
import { Game, Spider, MathUtils } from '../game.js';

// ==========================================
// 1. CONFIGURATION (Easy Tweaking!)
// ==========================================
// 🔌 [EXPANDABILITY] Exported so other mods can tweak cycle speeds or toggle real-world time!
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
    fireflySpawnChance: 0.15,  // 15% chance per frame to spawn a firefly
    
    // Mod Compatibility
    eclipseDurationTicks: 3600 // How long the CursedRelics Eclipse spell overrides real-world time (60 seconds)
};

export const DayNightExpansion = {
    init: (game) => {
        // 🔌 [EXPANDABILITY] Mount config to engine
        game.dayNightConfig = DAYNIGHT_CONFIG;
        game.dayTime = 0; // 0.0 to 1.0 scale
        game.isNight = false;
        game.eclipseTimer = 0;
        
        // 🛡️ [FIX] Clean listener for the Eclipse spell that bypasses the engine clock!
        game.bus.on('triggerEclipse', () => {
            game.eclipseTimer = DAYNIGHT_CONFIG.eclipseDurationTicks;
            if (game.showSystemMessage) game.showSystemMessage("SUPERNATURAL ECLIPSE", "#aa00ff");
        });
    },

    patch: (game) => {
        
        // ==========================================
        // 2. ENGINE TIME LOOP
        // ==========================================
        game.expansions.patchClass(Game, 'update', function(original) {
            
            // 🛡️ [FIX] Removed the hacky `lastTick` time-warp detector here. 
            // Eclipse is now cleanly driven via the 'triggerEclipse' bus event!

            original.call(this);
            
            if (this.gameState !== 'playing') return;

            // 1. Calculate the Time Ratio
            let currentRatio = 0.5; // Default noon
            
            if (DAYNIGHT_CONFIG.useRealTime) {
                // 🚀 [PERFORMANCE] Only query the system clock once a second (every 60 frames)!
                // Calling new Date() 60 times a second creates massive Garbage Collection thrashing.
                if (this.tick % 60 === 0 || this._cachedTimeRatio === undefined) {
                    const now = new Date();
                    const msSinceMidnight = (now.getHours() * 3600000) + (now.getMinutes() * 60000) + (now.getSeconds() * 1000) + now.getMilliseconds();
                    this._cachedTimeRatio = msSinceMidnight / 86400000;
                }
                currentRatio = this._cachedTimeRatio;
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
                if (this.showSystemMessage) this.showSystemMessage("NIGHT FALLS... THE SWARM QUICKENS", "#aa00ff");
            }
            if (!this.isNight && wasNight && this.eclipseTimer <= 0) {
                this.bus.emit('playSound', 'build'); 
                if (this.showSystemMessage) this.showSystemMessage("DAYBREAK RETURNS", "#ff9d00");
            }

            // 🧃 [JUICE] Spawn ambient fireflies during the night!
            if (this.isNight && Math.random() < cfg.fireflySpawnChance) {
                // 🛡️ [FIX] Strict integer coordinate clamping to prevent sub-pixel rendering blur
                const spawnX = (this.camera.x + Math.random() * this.canvas.width) | 0;
                const spawnY = (this.camera.y + Math.random() * this.canvas.height) | 0;
                
                this.bus.emit('particles', {
                    x: spawnX, y: spawnY, color: cfg.fireflyColor, count: 1, type: 'firefly' // [FIX] Use custom lazy physics
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
                
                // 🧃 [JUICE] Spiders leave a faint, ghostly trail while empowered by the night!
                // 🛡️ [FIX] Only emit if actively moving to prevent overlapping puddles of particles
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

            // 🚀 PERFORMANCE EARLY EXIT: Skip drawing entirely if it's daytime!
            if (darkness <= 0.01) return;

            // Use fast integer coordinates for large primitive fills
            const camX = game.camera.x | 0;
            const camY = game.camera.y | 0;
            const canvasW = game.canvas.width | 0;
            const canvasH = game.canvas.height | 0;

            // 🧃 [JUICE] Render beautiful radial sunsets on the horizon during transitions
            if (useSunsetGlow && game.eclipseTimer <= 0) {
                const cx = camX + (canvasW / 2);
                const cy = camY + (canvasH / 2);
                
                // Creates a glowing orange light that fades into the deep purple night sky
                let grad = ctx.createRadialGradient(cx, cy + 200, 100, cx, cy, canvasW * 0.8);
                grad.addColorStop(0, `rgba(255, 100, 0, ${darkness * 0.6})`); 
                grad.addColorStop(1, `rgba(${cfg.nightColorRGB}, ${darkness})`);
                
                ctx.fillStyle = grad;
            } else {
                // Flat darkness for deep night or Eclipse
                ctx.fillStyle = `rgba(${cfg.nightColorRGB}, ${darkness})`; 
            }

            ctx.fillRect(camX, camY, canvasW, canvasH);
        });
    }
};
