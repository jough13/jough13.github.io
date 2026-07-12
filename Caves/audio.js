// --- START OF FILE audio.js ---

// ==========================================
// ADVANCED PROCEDURAL AUDIO SYSTEM
// ==========================================

// Safe initialization of settings to handle corrupted or outdated local storage
let _savedAudioSettings = null;
try {
    _savedAudioSettings = JSON.parse(localStorage.getItem('audioSettings'));
} catch(e) {}

const _getAudioSetting = (key, defaultVal) => {
    if (_savedAudioSettings && _savedAudioSettings[key] !== undefined) {
        return _savedAudioSettings[key];
    }
    return defaultVal;
};

const AudioSystem = {
    _ctx: null, 
    _masterGain: null,
    _compressor: null,
    noiseBuffer: null, 
    
    // PERFORMANCE WIN: O(1) Map for high-speed audio throttling & GC
    _lastPlayed: new Map(),

    // Settings State
    settings: {
        master: _getAudioSetting('master', true),
        steps: _getAudioSetting('steps', true),
        combat: _getAudioSetting('combat', true),
        magic: _getAudioSetting('magic', true),
        ui: _getAudioSetting('ui', true)
    },

    saveSettings: () => {
        localStorage.setItem('audioSettings', JSON.stringify(AudioSystem.settings));
    },

    // --- MOBILE BROWSER COMPATIBILITY FIX ---
    // iOS and Android Chrome strictly block AudioContext from starting unless 
    // triggered directly by a user gesture. This wrapper guarantees it unlocks.
    initAudioContext: function() {
        if (!this._ctx) {
            // BUG FIX & COMPATIBILITY WIN: Fallback for older Safari versions
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                console.warn("Web Audio API not supported in this browser.");
                return null;
            }

            try {
                this._ctx = new AudioContextClass();
                
                // Studio-grade Mastering Chain
                this._masterGain = this._ctx.createGain();
                this._masterGain.gain.value = 0.65; // Safe headroom to prevent clipping on massive AoE spells
                
                // AUDIO QUALITY WIN: Upgraded Compressor settings
                // Prevents ear-bleeding distortion when 15 monsters all attack at the exact same millisecond!
                this._compressor = this._ctx.createDynamicsCompressor();
                this._compressor.threshold.value = -24; // Start compressing much earlier
                this._compressor.knee.value = 30;       // Smooth transition
                this._compressor.ratio.value = 12;      // Hard limiting
                this._compressor.attack.value = 0.003;  // React instantly
                this._compressor.release.value = 0.25;  // Let go naturally

                this._masterGain.connect(this._compressor);
                this._compressor.connect(this._ctx.destination);
                
                // PERFORMANCE WIN: Generate the heavy pink noise buffer ONCE here instead of every step!
                this.initNoise();
            } catch (e) {
                console.error("Failed to initialize AudioContext:", e);
                return null;
            }
        }
        return this._ctx;
    },

    getCtx: function() {
        // Bypass expensive initialization calls if it's already running
        if (this._ctx && this._ctx.state === 'running') return this._ctx;

        const ctx = this.initAudioContext();
        
        // 🚨 BUG FIX & STABILITY WIN: Browser Tab Suspension Guards
        // If a user switches tabs, browsers force-suspend the AudioContext.
        // We MUST attempt to resume it gracefully. If it fails (e.g. strict autoplay policy),
        // we catch the error so the entire game engine doesn't crash!
        if (ctx && ctx.state === 'suspended') {
            try {
                // Returns a promise, catch rejection silently
                ctx.resume().catch(() => {});
            } catch (e) {}
        }
        
        // If it STILL isn't running after attempting to resume, abort sound playback for this frame
        if (ctx && ctx.state !== 'running') return null;
        
        return ctx;
    },

    // Pink Noise Generator
    // White noise is harsh. Pink noise sounds like natural wind, water, and deep impacts!
    initNoise: function() {
        const ctx = this._ctx;
        if (!ctx || this.noiseBuffer) return;
        
        const bufferSize = ctx.sampleRate * 2.0; // 2 seconds of noise buffer
        this.noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        
        // Paul Kellet's refined Pink Noise algorithm
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
            let white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            data[i] *= 0.11; // Normalize to roughly -1 to 1 to prevent clipping
            b6 = white * 0.115926;
        }
    },

    // Internal Throttler (Highly optimized for V8 via Maps)
    _throttle: function(id, msCooldown) {
        const now = Date.now();
        // PERFORMANCE WIN: Smarter O(1) garbage collection for the throttle Map.
        // Bumped threshold to 100 to prevent constant map iteration during intense combat.
        if (this._lastPlayed.size > 100) {
            // Using the map's native iterator is significantly faster than Object.keys
            for (const [key, time] of this._lastPlayed) { 
                if (now - time > 5000) this._lastPlayed.delete(key);
            }
        }
        
        const lastTime = this._lastPlayed.get(id);
        if (lastTime && now - lastTime < msCooldown) return false;
        
        this._lastPlayed.set(id, now);
        return true;
    },

    // --- IMMERSION: DYNAMIC ACOUSTICS & DISTANCE ATTENUATION ---
    _getAcoustics: function() {
        let baseAcoustics = { durationMult: 1.0, filterMult: 1.0, echoDelay: 0, echoFeedback: 0, dampening: 20000 };
        
        if (typeof gameState !== 'undefined') {
            // LORE WIN: Deeply immersive acoustic profiles based on the environment!
            
            // 1. The Void & Abyss (Eerie, endless echoes)
            if (gameState.currentRealm !== 0 || gameState.currentCaveTheme === 'VOID' || gameState.currentCaveTheme === 'ABYSS') {
                baseAcoustics = { durationMult: 1.6, filterMult: 0.35, echoDelay: 0.35, echoFeedback: 0.65, dampening: 1000 };
            }
            // 2. Crystal Caves & Frozen Ruins (High resonance, bright ringing)
            else if (gameState.currentCaveTheme === 'CRYSTAL' || gameState.currentCaveTheme === 'FROZEN_RUIN') {
                baseAcoustics = { durationMult: 2.0, filterMult: 1.2, echoDelay: 0.2, echoFeedback: 0.7, dampening: 8000 };
            }
            // 3. Sand Tombs (Dry, dusty, heavily muffled)
            else if (gameState.currentCaveTheme === 'SAND_TOMB') {
                baseAcoustics = { durationMult: 0.6, filterMult: 0.5, echoDelay: 0.02, echoFeedback: 0.1, dampening: 800 };
            }
            // 4. Sunken Temples & Grottos (Underwater muffling)
            else if (gameState.currentCaveTheme === 'SUNKEN' || gameState.currentCaveTheme === 'GROTTO') {
                baseAcoustics = { durationMult: 0.8, filterMult: 0.25, echoDelay: 0.1, echoFeedback: 0.2, dampening: 600 };
            }
            // 5. Dwarven Mines (Tight metallic slapback)
            else if (gameState.currentCaveTheme === 'DWARVEN_MINE') {
                baseAcoustics = { durationMult: 0.9, filterMult: 1.1, echoDelay: 0.05, echoFeedback: 0.5, dampening: 6000 };
            }
            // 6. Arena / Colosseum (Wide stadium echo)
            else if (gameState.currentCaveTheme === 'ARENA') {
                baseAcoustics = { durationMult: 1.2, filterMult: 0.9, echoDelay: 0.25, echoFeedback: 0.4, dampening: 4000 };
            }
            // 7. Sky Realm (Wind swept, quick decay)
            else if (gameState.mapMode === 'skyrealm') {
                baseAcoustics = { durationMult: 0.8, filterMult: 1.5, echoDelay: 0.4, echoFeedback: 0.3, dampening: 4000 };
            }
            // 8. Underworld (Crushing deep muffle, miles of earth above)
            else if (gameState.mapMode === 'underworld') {
                baseAcoustics = { durationMult: 1.5, filterMult: 0.4, echoDelay: 0.3, echoFeedback: 0.5, dampening: 800 }; 
            }
            // 9. Deep Caves (Muffled highs, heavy slapback)
            else if (gameState.mapMode === 'dungeon') {
                baseAcoustics = { durationMult: 1.2, filterMult: 0.6, echoDelay: 0.15, echoFeedback: 0.4, dampening: 1500 }; 
            } 
            // 10. Castles & Ruins (Stone halls, tight reverb)
            else if (gameState.mapMode === 'castle') {
                baseAcoustics = { durationMult: 1.1, filterMult: 0.85, echoDelay: 0.08, echoFeedback: 0.3, dampening: 3000 }; 
            }
            
            // --- LORE & ATMOSPHERE WIN: Vitals-Based Acoustic Filtering! ---
            if (gameState.player) {
                // If health is critically low, simulate blood rushing to ears by heavily muffling all high frequencies
                if (gameState.player.health <= gameState.player.maxHealth * 0.25) {
                    baseAcoustics.filterMult *= 0.4;
                    baseAcoustics.dampening = Math.min(baseAcoustics.dampening, 800); 
                }
                
                // If suffering from Void Madness, echoes become disjointed and highly resonant
                if (gameState.player.madnessTurns > 0) {
                    baseAcoustics.echoDelay = Math.max(0.2, baseAcoustics.echoDelay + 0.1);
                    baseAcoustics.echoFeedback = Math.min(0.85, baseAcoustics.echoFeedback + 0.3);
                }
            }
        }
        
        return baseAcoustics; 
    },

    _getSpatialData: function(x) {
        // ROBUSTNESS WIN: Protect against NaN propagation if an entity was just deleted or passed undefined
        if (typeof x !== 'number' || isNaN(x) || typeof gameState === 'undefined' || !gameState.player || typeof gameState.player.x !== 'number') {
            return { pan: 0, distanceVol: 1.0, distanceFilter: 1.0 };
        }
        
        const dx = x - gameState.player.x;
        const absDx = Math.abs(dx);
        
        return {
            pan: Math.max(-1, Math.min(1, dx / 10)), 
            distanceVol: Math.max(0.05, 1.0 - (absDx * 0.06)), 
            distanceFilter: Math.max(0.1, 1.0 - (absDx * 0.05)) 
        };
    },

    // Dampened Delay Network (True Reverb)
    _routeToMaster: function(ctx, sourceNode, acoustics, spatial, isUI = false) {
        
        // --- UX WIN: UI Acoustic Bypass ---
        // UI sounds (hovering, clicking buttons) shouldn't echo through a cave!
        if (isUI) {
            sourceNode.connect(this._masterGain);
            return null; // Return null so the GC cleanup knows there are no panners
        }

        let panner = null;
        
        // COMPATIBILITY WIN: Graceful 3-Tier spatial fallback to support modern browsers,
        // older iOS Safari, and failing contexts equally without dropping audio.
        if (ctx.createStereoPanner) {
            panner = ctx.createStereoPanner();
            panner.pan.value = spatial.pan;
            sourceNode.connect(panner);
        } else if (ctx.createPanner) {
            panner = ctx.createPanner();
            panner.panningModel = 'equalpower';
            // Clamp pan to [-1, 1] strictly for the legacy node
            const safePan = Math.max(-1, Math.min(1, spatial.pan));
            panner.setPosition(safePan, 0, 1 - Math.abs(safePan));
            sourceNode.connect(panner);
        } else {
            panner = ctx.createGain(); 
            sourceNode.connect(panner);
        }

        if (acoustics.echoDelay > 0) {
            const delay = ctx.createDelay();
            delay.delayTime.value = acoustics.echoDelay;
            const feedback = ctx.createGain();
            feedback.gain.value = acoustics.echoFeedback;
            
            // Lowpass filter inside the loop absorbs high frequencies as the sound bounces!
            const dampFilter = ctx.createBiquadFilter();
            dampFilter.type = 'lowpass';
            
            // 🚨 NYQUIST FIX: Prevent InvalidAccessError crash
            // If you attempt to set a filter frequency higher than half the sample rate, Web Audio crashes.
            const maxFreq = (ctx.sampleRate / 2) - 1;
            dampFilter.frequency.value = Math.min(maxFreq, Math.max(10, acoustics.dampening));

            panner.connect(delay);
            delay.connect(dampFilter);
            dampFilter.connect(feedback);
            feedback.connect(delay);
            dampFilter.connect(this._masterGain);
            
            // Expose the nodes for explicit garbage collection
            panner._delayNode = delay;
            panner._feedbackNode = feedback;
            panner._dampFilter = dampFilter;
        } else {
            panner.connect(this._masterGain);
        }
        
        return panner;
    },

    // PERFORMANCE & MEMORY LEAK WIN: Strict memory cleanup for Web Audio API nodes.
    _cleanupRoute: function(pannerNode) {
        if (!pannerNode) return;
        // Wrapped in try-catches because sometimes the browser's GC beats us to it
        try { 
            if (pannerNode._delayNode) { pannerNode._delayNode.disconnect(); pannerNode._delayNode = null; } 
            if (pannerNode._feedbackNode) { pannerNode._feedbackNode.disconnect(); pannerNode._feedbackNode = null; }
            if (pannerNode._dampFilter) { pannerNode._dampFilter.disconnect(); pannerNode._dampFilter = null; }
            pannerNode.disconnect(); 
        } catch (e) {}
    },

    // BUG FIX & STABILITY: Safely validate oscillator types so typos don't crash the context
    _getSafeOscType: function(type) {
        const valid = ['sine', 'square', 'sawtooth', 'triangle'];
        return valid.includes(type) ? type : 'sine';
    },

    // --- CORE GENERATORS ---

    playNoise: function(duration, vol = 0.1, filterFreq = 1000, x = null, isUI = false) {
        if (!this.settings.master) return;
        const ctx = this.getCtx();
        if (!ctx) return;
        
        if (!this.noiseBuffer) this.initNoise();

        // UI Sounds completely ignore caves/echoes
        const acoustics = isUI ? { durationMult: 1.0, filterMult: 1.0, echoDelay: 0, echoFeedback: 0, dampening: 20000 } : this._getAcoustics();
        const spatial = isUI ? { pan: 0, distanceVol: 1.0, distanceFilter: 1.0 } : this._getSpatialData(x);
        
        const actualDuration = duration * acoustics.durationMult;
        // BUG FIX: Prevent log(0) errors in exponentialRampToValueAtTime by enforcing a tiny minimum
        const actualVol = Math.max(0.001, vol * spatial.distanceVol);

        const src = ctx.createBufferSource();
        src.buffer = this.noiseBuffer; 
        
        src.playbackRate.value = 0.6 + Math.random() * 0.8;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        
        // 🚨 NYQUIST FIX: Guarantee frequency NEVER exceeds sampleRate / 2
        const maxFreq = (ctx.sampleRate / 2) - 1;
        const targetFreq = (filterFreq + (Math.random() - 0.5) * 200) * acoustics.filterMult * spatial.distanceFilter;
        filter.frequency.value = Math.min(maxFreq, Math.max(10, targetFreq));

        const gain = ctx.createGain();
        const now = ctx.currentTime + 0.01; // AUDIO QUALITY WIN: Lookahead prevents envelope popping!

        // AUDIO QUALITY WIN: Dynamic Envelope Generation
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(actualVol, now + 0.02); 
        gain.gain.exponentialRampToValueAtTime(0.0001, now + actualDuration); 

        src.connect(filter);
        filter.connect(gain);
        
        const panner = this._routeToMaster(ctx, gain, acoustics, spatial, isUI);

        src.start(now);
        src.stop(now + actualDuration + 0.1); 
        
        // MEMORY LEAK FIX: Browser tabs suspended in the background sometimes fail to fire onended.
        // We use a timeout as a guaranteed cleanup fallback to unhook the nodes from the graph!
        const cleanup = () => {
            try { src.disconnect(); filter.disconnect(); gain.disconnect(); } catch(e) {}
            this._cleanupRoute(panner);
        };
        src.onended = cleanup;
        setTimeout(cleanup, (actualDuration + 0.5) * 1000);
    },

    playTone: function(freq, type, duration, vol = 0.1, pitchShift = true, slideTo = null, x = null, isUI = false) {
        if (!this.settings.master) return;
        const ctx = this.getCtx();
        if (!ctx) return;
        
        const acoustics = isUI ? { durationMult: 1.0, filterMult: 1.0, echoDelay: 0, echoFeedback: 0, dampening: 20000 } : this._getAcoustics();
        const spatial = isUI ? { pan: 0, distanceVol: 1.0, distanceFilter: 1.0 } : this._getSpatialData(x);
        
        const actualDuration = duration * acoustics.durationMult;
        const actualVol = Math.max(0.001, vol * spatial.distanceVol);

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = this._getSafeOscType(type);
        
        let finalFreq = freq;
        if (pitchShift) finalFreq = freq * (0.92 + Math.random() * 0.16); 
        if (finalFreq > 400) finalFreq *= (acoustics.filterMult * spatial.distanceFilter);

        const now = ctx.currentTime + 0.01; 
        
        // 🚨 NYQUIST FIX: Clamp limits
        const maxFreq = (ctx.sampleRate / 2) - 1;
        const startFreq = Math.min(maxFreq, Math.max(1, finalFreq));

        osc.frequency.setValueAtTime(startFreq, now);
        if (slideTo) {
            const endFreq = Math.min(maxFreq, Math.max(10, slideTo * spatial.distanceFilter));
            osc.frequency.exponentialRampToValueAtTime(endFreq, now + actualDuration);
        }

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(actualVol, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + actualDuration);

        osc.connect(gain);
        const panner = this._routeToMaster(ctx, gain, acoustics, spatial, isUI);

        osc.start(now);
        osc.stop(now + actualDuration + 0.1);
        
        const cleanup = () => {
            try { osc.disconnect(); gain.disconnect(); } catch(e) {}
            this._cleanupRoute(panner);
        };
        osc.onended = cleanup;
        setTimeout(cleanup, (actualDuration + 0.5) * 1000);
    },

    playChord: function(notes, type = 'sine', duration = 0.5, vol = 0.1, detune = 0, slideDown = false, x = null, isUI = false) {
        if (!this.settings.master) return;
        const ctx = this.getCtx();
        if (!ctx) return;
        
        const acoustics = isUI ? { durationMult: 1.0, filterMult: 1.0, echoDelay: 0, echoFeedback: 0, dampening: 20000 } : this._getAcoustics();
        const spatial = isUI ? { pan: 0, distanceVol: 1.0, distanceFilter: 1.0 } : this._getSpatialData(x);
        
        const actualDuration = duration * acoustics.durationMult;
        const noteVol = Math.max(0.001, vol / notes.length);
        const now = ctx.currentTime + 0.01;
        const maxFreq = (ctx.sampleRate / 2) - 1; // NYQUIST FIX

        notes.forEach((freq, index) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = this._getSafeOscType(type);
            
            const startFreq = Math.min(maxFreq, Math.max(1, (freq * acoustics.filterMult) + (index * detune)));
            osc.frequency.setValueAtTime(startFreq, now);
            
            if (slideDown) {
                const endFreq = Math.min(maxFreq, Math.max(10, startFreq * 0.5));
                osc.frequency.exponentialRampToValueAtTime(endFreq, now + actualDuration);
            }

            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.exponentialRampToValueAtTime(noteVol, now + 0.05); 
            gain.gain.exponentialRampToValueAtTime(0.0001, now + actualDuration);

            osc.connect(gain);
            const panner = this._routeToMaster(ctx, gain, acoustics, spatial, isUI);
            
            osc.start(now);
            osc.stop(now + actualDuration + 0.1);
            
            const cleanup = () => { 
                try { osc.disconnect(); gain.disconnect(); } catch(e) {}
                this._cleanupRoute(panner);
            };
            osc.onended = cleanup;
            setTimeout(cleanup, (actualDuration + 0.5) * 1000);
        });
    },

    playMelody: function(notes, type = 'sine', speed = 0.15, vol = 0.1, isUI = false) {
        if (!this.settings.master || !this.settings.ui) return;
        const ctx = this.getCtx();
        if (!ctx) return;
        
        const now = ctx.currentTime + 0.01;
        const acoustics = isUI ? { durationMult: 1.0, filterMult: 1.0, echoDelay: 0, echoFeedback: 0, dampening: 20000 } : this._getAcoustics();
        const maxFreq = (ctx.sampleRate / 2) - 1; // NYQUIST FIX
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = this._getSafeOscType(type);
        
        let totalDuration = notes.length * speed * acoustics.durationMult;
        const actualVol = Math.max(0.001, vol);
        
        notes.forEach((freq, index) => {
            const noteTime = now + (index * speed);
            if (freq > 0) {
                const adjFreq = Math.min(maxFreq, Math.max(1, freq * (freq > 500 ? acoustics.filterMult : 1.0)));
                osc.frequency.setValueAtTime(adjFreq, noteTime);
                
                gain.gain.setValueAtTime(0.0001, noteTime);
                gain.gain.exponentialRampToValueAtTime(actualVol, noteTime + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + (speed * acoustics.durationMult) - 0.01);
            } else {
                gain.gain.setValueAtTime(0.0001, noteTime);
            }
        });
        
        osc.connect(gain);
        
        // Pass a dummy spatial object since melodies are generally center-panned UI/Music
        const panner = this._routeToMaster(ctx, gain, acoustics, { pan: 0, distanceVol: 1.0, distanceFilter: 1.0 }, isUI);
        
        osc.start(now);
        osc.stop(now + totalDuration + 0.1);
        
        const cleanup = () => { 
            try { osc.disconnect(); gain.disconnect(); } catch(e) {}
            this._cleanupRoute(panner);
        };
        osc.onended = cleanup;
        setTimeout(cleanup, (totalDuration + 0.5) * 1000);
    },

    // --- SPECIFIC SOUND EFFECTS ---

    playStep: function(x) { 
        if (!this.settings.steps) return;
        if (!this._throttle('step', 80)) return; 
        
        // MOUNT AUDIO SYNERGY: Heavy mounts cause heavier footsteps!
        let weight = 1.0;
        if (typeof gameState !== 'undefined' && gameState.player && gameState.player.isMounted) {
            const mountTile = gameState.player.companion ? gameState.player.companion.tile : '';
            if (['Ø', '🦖', '🧌', '🐲'].includes(mountTile)) weight = 2.5; // Massive boom
            else if (['🐻', '🐗'].includes(mountTile)) weight = 1.5;
        }
        
        this.playNoise(0.08 * weight, 0.04 * weight, 500 / weight, x); 
        this.playTone(80 / weight, 'sine', 0.05 * weight, 0.05 * weight, true, 40 / weight, x);
    },
    
    // NEW: Shovel digging sound
    playDig: function(x) {
        if (!this.settings.steps) return; // Fallback to step settings for environmental actions
        if (!this._throttle('dig', 150)) return; 
        this.playNoise(0.15, 0.1, 400, x);
        this.playTone(80, 'triangle', 0.1, 0.1, true, 40, x);
    },

    // NEW: Fishing bite sound
    playFishBite: function(x) {
        if (!this.settings.ui) return;
        if (!this._throttle('fishBite', 200)) return; 
        this.playTone(1200, 'sine', 0.05, 0.15, false, 800, x);
        setTimeout(() => this.playNoise(0.05, 0.05, 2000, x), 20);
    },
    
    playAttack: function(type = 'normal', x) { 
        if (!this.settings.combat) return;
        if (!this._throttle('attack', 50)) return; 
        
        if (type === 'heavy') {
            // Layered physical impact: Crunch + Deep Sub Drop
            this.playNoise(0.1, 0.1, 1200, x);
            this.playTone(150, 'triangle', 0.15, 0.12, true, 20, x); 
            this.playTone(60, 'sine', 0.2, 0.2, false, 20, x); 
        } else if (type === 'light') {
            this.playTone(600, 'sine', 0.08, 0.08, true, 200, x);
        } else if (type === 'sweep') {
            this.playTone(200, 'sine', 0.2, 0.12, true, 100, x);
            this.playNoise(0.15, 0.05, 800, x); 
        } else if (type === 'pierce') {
            this.playTone(800, 'sawtooth', 0.05, 0.1, true, 100, x);
        } else {
            this.playTone(300 + (Math.random() * 100), 'sine', 0.1, 0.1, false, 50 + (Math.random() * 20), x);
        }
    },

    playBow: function(x) {
        if (!this.settings.combat) return;
        if (!this._throttle('bow', 150)) return; 
        // Layered Twang + Whoosh
        this.playTone(400, 'sawtooth', 0.1, 0.1, true, 200, x);
        setTimeout(() => this.playNoise(0.15, 0.04, 2000, x), 10);
    },
    
    playHit: function(x) { 
        if (!this.settings.combat) return;
        if (!this._throttle('hit', 80)) return;
        
        let material = 'flesh'; 
        if (typeof chunkManager !== 'undefined' && typeof gameState !== 'undefined') {
            let tileAtX = null;
            if (gameState.mapMode === 'overworld') tileAtX = chunkManager.getTile(x, gameState.player.y);
            else if (gameState.mapMode === 'dungeon') tileAtX = chunkManager.caveMaps[gameState.currentCaveId]?.[gameState.player.y]?.[x];
            else if (gameState.mapMode === 'castle') tileAtX = chunkManager.castleMaps[gameState.currentCastleId]?.[gameState.player.y]?.[x];
            
            // CONTENT WIN: Expanded Material Acoustic Tags
            if (tileAtX) {
                if (typeof ENEMY_DATA !== 'undefined' && ENEMY_DATA[tileAtX]) {
                    const tags = ENEMY_DATA[tileAtX].tags || []; 
                    if (tags.includes("bone")) material = 'bone';
                    else if (tags.includes("metal") || tags.includes("stone") || tags.includes("construct")) material = 'metal';
                    else if (tags.includes("ethereal") || tags.includes("void")) material = 'ethereal';
                    else if (tags.includes("bug") || tags.includes("aquatic") || tags.includes("fungus")) material = 'squish';
                    else if (tags.includes("wood") || tags.includes("plant")) material = 'wood';
                } else if (['🌳', '🌳e', '+', '🚪', '🏚', '🏚️', '📦', '⛵', 'c'].includes(tileAtX)) {
                    material = 'wood'; // Obstacles and doors
                }
            }
        }

        if (material === 'bone') {
            this.playTone(400, 'square', 0.05, 0.1, true, null, x); 
            this.playNoise(0.05, 0.15, 3000, x); 
        } else if (material === 'metal') {
            // High ping layered over a crunch
            this.playTone(1200, 'sine', 0.4, 0.1, false, 200, x); 
            this.playTone(800, 'triangle', 0.2, 0.15, true, 200, x); 
            this.playNoise(0.1, 0.1, 2000, x);
        } else if (material === 'ethereal') {
            this.playTone(200, 'sine', 0.4, 0.15, false, 50, x); 
            this.playNoise(0.3, 0.08, 400, x); 
        } else if (material === 'squish') {
            // Wet, low-pass filtered drop
            this.playTone(150, 'sine', 0.1, 0.15, false, 50, x);
            this.playNoise(0.1, 0.1, 400, x); // Heavily muffled noise
        } else if (material === 'wood') {
            // Hollow, resonant thud and splinter
            this.playTone(200, 'square', 0.1, 0.1, true, 50, x);
            this.playNoise(0.05, 0.1, 1500, x);
        } else {
            this.playTone(80, 'square', 0.15, 0.1, true, null, x); 
            this.playNoise(0.1, 0.1, 1500, x);
        }
    },

    playCrit: function(x) {
        if (!this.settings.combat) return;
        if (!this._throttle('crit', 200)) return; 
        this.playTone(1200, 'sine', 0.3, 0.15, false, 800, x);
        this.playTone(80, 'square', 0.2, 0.1, true, null, x); 
        this.playNoise(0.2, 0.15, 2000, x); 
    },
    
    playMagic: function(x) { 
        if (!this.settings.magic) return;
        if (!this._throttle('magic', 100)) return;
        // Rich Major 7th chord for magic casting instead of random tones
        this.playChord([440, 554.37, 659.25, 830.61], 'sine', 0.3, 0.08, 2.0, true, x);
    },

    playHeal: function(x) {
        if (!this.settings.magic) return;
        if (!this._throttle('heal', 150)) return; 
        // Warm, swelling chord
        this.playChord([261.63, 329.63, 392.00], 'sine', 0.6, 0.1, 1.0, false, x);
    },
    
    // --- UI SOUNDS (Bypass Reverb) ---
    playCoin: function() { 
        if (!this.settings.ui) return;
        if (!this._throttle('coin', 50)) return;
        this.playMelody([987.77, 1318.51], 'sine', 0.05, 0.06, true); 
    },
    
    // JUICE WIN: Improved UI Error feedback
    playError: function() {
        if (this.settings.ui) {
            if (!this._throttle('error', 100)) return;
            // Dull, staccato thud instead of a harsh screech
            this.playTone(100, 'triangle', 0.1, 0.05, false, 50, null, true);
            this.playNoise(0.05, 0.02, 300, null, true);
        }
    },

    playClick: function() {
        if (this.settings.ui) {
            if (!this._throttle('click', 50)) return;
            this.playNoise(0.02, 0.05, 3000, null, true);
        }
    },

    playHover: function() {
        if (this.settings.ui) {
            if (!this._throttle('hover', 50)) return;
            this.playTone(800, 'sine', 0.02, 0.02, false, null, null, true);
        }
    },
    
    // --- LORE EXPANSION SOUNDS ---

    playConsume: function() {
        if (!this.settings.ui) return;
        if (!this._throttle('consume', 150)) return; 
        // Glug/Crunch sound for eating/drinking
        this.playNoise(0.1, 0.05, 800, null, true);
        setTimeout(() => { this.playTone(300, 'triangle', 0.05, 0.05, true, 200, null, true); }, 50);
    },

    playEnchant: function() {
        if (!this.settings.magic) return;
        if (!this._throttle('enchant', 500)) return; 
        // Rising, magical arpeggio
        this.playMelody([440, 554.37, 659.25, 880], 'sine', 0.1, 0.15, true);
        this.playNoise(0.5, 0.05, 2000, null, true); // Shimmering background dust
    },

    playDisenchant: function() {
        if (!this.settings.magic) return;
        if (!this._throttle('disenchant', 300)) return; 
        // Shattering glass + discordant descending chord
        this.playNoise(0.2, 0.15, 4000, null, true); // Crack!
        this.playChord([880, 659.25, 622.25, 440], 'sawtooth', 0.4, 0.1, 5.0, true, null, true);
    },
    
    // --- EPIC/FANFARE SOUNDS ---

    playLevelUp: function() {
        if (!this._throttle('levelup', 1000)) return; 
        // JUICE WIN: Epic Arpeggio lead-in
        this.playMelody([261.63, 329.63, 392.00], 'sine', 0.1, 0.1, true);
        setTimeout(() => {
            this.playChord([261.63, 329.63, 392.00, 523.25], 'sine', 1.0, 0.2, 1.5, false, null, true);
        }, 300);
    },

    playQuestComplete: function() {
        if (!this._throttle('questcomplete', 1000)) return; 
        this.playMelody([392.00, 392.00, 392.00, 523.25, 0, 523.25], 'triangle', 0.12, 0.1, true);
    },

    playLootRare: function() {
        if (!this._throttle('lootrare', 500)) return; 
        this.playMelody([523.25, 659.25, 783.99, 1046.50], 'sine', 0.08, 0.08, true);
    },

    playSecret: function() {
        if (!this._throttle('secret', 1000)) return; 
        this.playMelody([329.63, 392.00, 493.88], 'triangle', 0.2, 0.08, true);
    },

    playWarning: function() {
        if (!this._throttle('warning', 1000)) return; 
        this.playMelody([400, 0, 400], 'square', 0.1, 0.1, true);
    },

    playDeath: function() {
        // JUICE WIN: Upgraded heart-stopping audio for death
        this.playNoise(2.0, 0.3, 100, null, true); // Low heavy thud
        this.playMelody([300, 280, 260, 200, 150, 100, 50], 'sawtooth', 0.5, 0.2, true); // Slower, deeper decay
    },

    playDiscovery: function() {
        if (!this._throttle('discovery', 2000)) return; 
        this.playChord([261.63, 329.63, 392.00, 523.25], 'sine', 2.0, 0.15, 2.0, false, null, true);
    },

    playBossSpawn: function() {
        if (!this._throttle('bossspawn', 3000)) return; 
        // JUICE WIN: Terrifying descending tritone rumble for Boss Spawns
        this.playChord([45, 64, 80], 'sawtooth', 4.0, 0.3, 5.0, true); // Affected by reverb
        this.playNoise(3.0, 0.4, 300); 
    },

    playCraftSuccess: function() {
        if (!this._throttle('craftsuccess', 200)) return; 
        this.playMelody([400, 600, 800], 'triangle', 0.1, 0.1, true);
    },

    playTimelineShift: function() {
        this.playChord([100, 150, 200], 'sawtooth', 2.0, 0.2, 5.0, true, null, true); 
        setTimeout(() => this.playChord([400, 600, 800], 'sine', 1.5, 0.15, 2.0, false, null, true), 500); 
        this.playNoise(2.0, 0.2, 2000, null, true); 
    },

    playVoidEnter: function() {
        if (!this._throttle('voidenter', 2000)) return; 
        this.playChord([40, 45, 50], 'square', 3.0, 0.2, 1.0, true);
        this.playNoise(2.0, 0.3, 400); 
    }
};

// ==========================================
// BROWSER AUDIO HARDWARE UNLOCKER
// ==========================================
// Forces the audio context to initialize the very first time the player interacts anywhere.
// iOS Safari specifically requires sound to be played during this event!

function forceUnlockAudio() {
    const ctx = AudioSystem.initAudioContext();
    if (ctx && ctx.state === 'running') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = 0.0001; 
        
        osc.connect(gain);
        gain.connect(ctx.destination); 
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.01);
        
        document.removeEventListener('click', forceUnlockAudio);
        document.removeEventListener('touchstart', forceUnlockAudio);
        document.removeEventListener('touchend', forceUnlockAudio);
        document.removeEventListener('pointerdown', forceUnlockAudio);
        document.removeEventListener('keydown', forceUnlockAudio);
        document.removeEventListener('mouseup', forceUnlockAudio);
    }
}

document.addEventListener('click', forceUnlockAudio, { once: true });
document.addEventListener('touchstart', forceUnlockAudio, { once: true });
document.addEventListener('touchend', forceUnlockAudio, { once: true });
document.addEventListener('pointerdown', forceUnlockAudio, { once: true });
document.addEventListener('keydown', forceUnlockAudio, { once: true });
document.addEventListener('mouseup', forceUnlockAudio, { once: true });

// --- END OF FILE audio.js ---
