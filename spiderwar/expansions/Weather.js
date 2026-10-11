// expansions/Weather.js
import { Game, MathUtils, Spider } from '../game.js';

// ==========================================
// 1. CONFIGURATION & BALANCING
// ==========================================
// 🔌 [EXPANDABILITY] Exported so other mods can tweak the weather system
export const WEATHER_CONFIG = {
    changeIntervalTicks: 27000, // 7.5 minutes at 60fps (60 * 60 * 7.5)
    transitionSpeed: 0.005,     // How fast the storm rolls in
    
    // Effects
    rainSpeedDebuff: 0.25,      // -25% movement speed during rain
    fogVisionDebuff: 0.40,      // -40% aggro/vision range during storms
    acidDamagePerSec: 3,        // Damage taken if not standing near a base
    safeZoneRadius: 250,        // How close to a Nest/Shrine you must be to avoid acid
    
    // Chances (Out of 100)
    weights: {
        clear: 50,
        rain: 25,
        acid: 25
    }
};

// ==========================================
// 2. ZERO-GC RAIN PARTICLE SYSTEM
// ==========================================
// Using a Float32Array is the absolute fastest way to process math in JS.
const RAIN_COUNT = 300;
const rainData = new Float32Array(RAIN_COUNT * 3); // [x, y, speed] per drop

const initRain = (canvasW, canvasH) => {
    for (let i = 0; i < RAIN_COUNT * 3; i += 3) {
        rainData[i] = Math.random() * canvasW;           // X
        rainData[i + 1] = Math.random() * canvasH;       // Y
        rainData[i + 2] = MathUtils.randomRange(15, 25); // Speed
    }
};

// ==========================================
// 3. EXPANSION LOGIC
// ==========================================
export const WeatherSystemExpansion = {
    init: (game) => {
        console.log("%c[DLC] Weather System Online. The skies darken...", "color: #00aaff; font-weight: bold;");
        
        game.weatherConfig = WEATHER_CONFIG;
        
        game.weather = {
            current: 'clear',
            nextTick: WEATHER_CONFIG.changeIntervalTicks,
            intensity: 0,   // 0.0 to 1.0 (Used for fading visuals in/out)
            color: '#ffffff'
        };

        // Initialize the rain positions based on screen size
        initRain(window.innerWidth, window.innerHeight);
        
        // Re-calculate if device rotates
        window.addEventListener('resize', () => initRain(window.innerWidth, window.innerHeight));
    },

    patch: (game) => {
        
        // --- 1. CORE WEATHER LOOP ---
        game.expansions.patchClass(Game, 'update', function(original) {
            original.call(this);
            if (this.gameState !== 'playing') return;

            const w = this.weather;
            
            // Check for Weather Change
            if (this.tick >= w.nextTick) {
                w.nextTick = this.tick + WEATHER_CONFIG.changeIntervalTicks;
                
                // Roll for new weather
                const roll = Math.random() * 100;
                let cumulative = 0;
                let newWeather = 'clear';
                
                for (const [type, weight] of Object.entries(WEATHER_CONFIG.weights)) {
                    cumulative += weight;
                    if (roll <= cumulative) { newWeather = type; break; }
                }

                if (w.current !== newWeather) {
                    w.current = newWeather;
                    
                    // 🧃 [JUICE] Announcements & Thunder!
                    if (w.current === 'rain') {
                        if (this.showSystemMessage) this.showSystemMessage("A HEAVY DOWNPOUR BEGINS", "#00aaff");
                        this.bus.emit('playSound', 'death'); // Thunderclap
                        w.color = 'rgba(150, 200, 255, 0.4)';
                    } else if (w.current === 'acid') {
                        if (this.showSystemMessage) this.showSystemMessage("WARNING: TOXIC ACID STORM", "#55ff00");
                        this.bus.emit('playSound', 'roar'); 
                        if (this.triggerShake) this.triggerShake(10);
                        w.color = 'rgba(85, 255, 0, 0.6)';
                    } else {
                        if (this.showSystemMessage) this.showSystemMessage("THE SKIES CLEAR", "#ffffff");
                    }
                }
            }

            // Smoothly fade intensity in and out
            const targetIntensity = (w.current === 'clear') ? 0.0 : 1.0;
            if (w.intensity < targetIntensity) w.intensity = Math.min(1.0, w.intensity + WEATHER_CONFIG.transitionSpeed);
            if (w.intensity > targetIntensity) w.intensity = Math.max(0.0, w.intensity - WEATHER_CONFIG.transitionSpeed);
        });

        // --- 2. GAMEPLAY MECHANIC: ACID DAMAGE & SPEED DEBUFFS ---
        game.expansions.patchClass(Spider, 'update', function(original, gameObj) {
            
            // Apply speed debuff globally based on weather intensity
            const w = gameObj.weather;
            const originalSpeed = this.baseSpeed;
            
            if (w.intensity > 0) {
                this.baseSpeed *= (1 - (WEATHER_CONFIG.rainSpeedDebuff * w.intensity));
            }
            
            // Acid Rain Damage Logic
            // 🚀 [PERFORMANCE] Use this.animOffset % 30 to stagger the damage checks across different frames!
            if (w.current === 'acid' && gameObj.tick % 30 === this.animOffset % 30) {
                
                // Nature units and Bosses are immune to acid
                if (this.team !== 'nature' && this.constructor.name !== 'CentipedeBoss') {
                    
                    let isSafe = false;
                    const structs = gameObj.structures;
                    const structLen = structs.length;
                    
                    // Check if standing under a friendly Nest or Shrine
                    for (let i = 0; i < structLen; i++) {
                        let s = structs[i];
                        if (s.team === this.team && (s.type === 'nest' || s.type === 'shrine') && s.hp > 0) {
                            // 🚀 Fast AABB Check
                            if (Math.abs(this.x - s.x) < WEATHER_CONFIG.safeZoneRadius && Math.abs(this.y - s.y) < WEATHER_CONFIG.safeZoneRadius) {
                                isSafe = true; break;
                            }
                        }
                    }
                    
                    if (!isSafe) {
                        this.hp -= (WEATHER_CONFIG.acidDamagePerSec * w.intensity);
                        // 🧃 [JUICE] Sizzle particles
                        if (w.intensity > 0.5) gameObj.bus.emit('particles', {x: this.x, y: this.y, color: '#55ff00', count: 1});
                    }
                }
            }

            original.call(this, gameObj); 
            
            this.baseSpeed = originalSpeed; // Restore base speed for the next frame
        });

        // --- 3. GAMEPLAY MECHANIC: FOGGY VISION DEBUFF ---
        // Dynamically reduce the aggro range of all units during storms
        game.expansions.patchClass(Game, 'getNearestEnemy', function(original, x, y, team, maxDist) {
            let effectiveDist = maxDist;
            const w = this.weather;
            
            if (w && w.intensity > 0) {
                effectiveDist *= (1 - (WEATHER_CONFIG.fogVisionDebuff * w.intensity));
            }
            
            return original.call(this, x, y, team, effectiveDist);
        });

        // --- 4. HIGH-PERFORMANCE VISUAL RENDERING ---
        game.bus.on('uiDraw', (ctx) => {
            const w = game.weather;
            if (w.intensity <= 0.01) return;

            // 🧃 [JUICE] Darken and tint the whole screen
            ctx.fillStyle = w.current === 'acid' ? `rgba(10, 20, 5, ${w.intensity * 0.3})` : `rgba(5, 10, 20, ${w.intensity * 0.3})`;
            ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);

            // 🚀 [PERFORMANCE] Screen-space Rain Rendering
            // By keeping the rain in screen-space (ignoring the camera.x/y), we ensure the rain 
            // covers the screen perfectly without having to simulate millions of drops across the 6000x6000 map!
            
            ctx.save();
            ctx.globalAlpha = w.intensity;
            ctx.strokeStyle = w.color;
            ctx.lineWidth = 2;
            
            // Slant the rain slightly based on the wind
            const slant = 5; 
            
            ctx.beginPath();
            
            for (let i = 0; i < RAIN_COUNT * 3; i += 3) {
                let rx = rainData[i];
                let ry = rainData[i + 1];
                let rSpeed = rainData[i + 2];
                
                // Update Physics
                ry += rSpeed;
                rx += slant;

                // Reset drop if it hits the bottom of the screen
                if (ry > game.canvas.height) {
                    ry = -50;
                    rx = Math.random() * game.canvas.width;
                }
                
                // Wrap around X axis
                if (rx > game.canvas.width) rx = -20;

                // Save updated values back to the Float32Array
                rainData[i] = rx;
                rainData[i + 1] = ry;

                // 🚀 Batched path drawing!
                ctx.moveTo(rx, ry);
                ctx.lineTo(rx - slant, ry - rSpeed); // Draw a line tracing its path backwards
            }
            
            ctx.stroke(); // Send all 300 lines to the GPU in one single call!
            ctx.restore();
        });
    }
};
