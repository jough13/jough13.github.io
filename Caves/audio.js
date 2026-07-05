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
        // Only resume if explicitly suspended, 
        // wrapped in a try/catch because Safari sometimes throws errors if resumed too aggressively.
        if (ctx && ctx.state === 'suspended') {
            try {
                ctx.resume().catch(() => {});
            } catch (e) {}
        }
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
        // PERFORMANCE WIN: Smarter O(1) garbage collection for the throttle Map
        if (this._lastPlayed.size > 50) {
            for (const [key, time] of this._lastPlayed.entries()) {
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
        if (typeof gameState !== 'undefined') {
            // LORE WIN: Deeply immersive acoustic profiles based on the environment!
            
            // 1. The Void & Abyss (Eerie, endless echoes)
            if (gameState.currentRealm !== 0 || gameState.currentCaveTheme === 'VOID' || gameState.currentCaveTheme === 'ABYSS') {
                return { durationMult: 1.6, filterMult: 0.35, echoDelay: 0.35, echoFeedback: 0.65, dampening: 1000 };
            }
            // 2. Crystal Caves & Frozen Ruins (High resonance, bright ringing)
            if (gameState.currentCaveTheme === 'CRYSTAL' || gameState.currentCaveTheme === 'FROZEN_RUIN') {
                return { durationMult: 2.0, filterMult: 1.2, echoDelay: 0.2, echoFeedback: 0.7, dampening: 8000 };
            }
            // 3. Sand Tombs (Dry, dusty, heavily muffled)
            if (gameState.currentCaveTheme === 'SAND_TOMB') {
                return { durationMult: 0.6, filterMult: 0.5, echoDelay: 0.02, echoFeedback: 0.1, dampening: 800 };
            }
            // 4. Sunken Temples & Grottos (Underwater muffling)
            if (gameState.currentCaveTheme === 'SUNKEN' || gameState.currentCaveTheme === 'GROTTO') {
                return { durationMult: 0.8, filterMult: 0.25, echoDelay: 0.1, echoFeedback: 0.2, dampening: 600 };
            }
            // 5. Sky Realm (Wind swept, quick decay)
            if (gameState.mapMode === 'skyrealm') {
                return { durationMult: 0.8, filterMult: 1.5, echoDelay: 0.4, echoFeedback: 0.3, dampening: 4000 };
            }
            // 6. Deep Caves (Muffled highs, heavy slapback)
            if (gameState.mapMode === 'dungeon' || gameState.mapMode === 'underworld') {
                return { durationMult: 1.2, filterMult: 0.6, echoDelay: 0.15, echoFeedback: 0.4, dampening: 1500 }; 
            } 
            // 7. Castles & Ruins (Stone halls, tight reverb)
            if (gameState.mapMode === 'castle') {
                return { durationMult: 1.1, filterMult: 0.85, echoDelay: 0.08, echoFeedback: 0.3, dampening: 3000 }; 
            }
        }
        // Open air default
        return { durationMult: 1.0, filterMult: 1.0, echoDelay: 0, echoFeedback: 0, dampening: 20000 }; 
    },

    _getSpatialData: function(x) {
        // ROBUSTNESS WIN: Protect against NaN propagation if an entity was just deleted
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
    _routeToMaster: function(ctx, sourceNode, acoustics, spatial) {
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
        try { if (pannerNode._delayNode) pannerNode._delayNode.disconnect(); } catch (e) {}
        try { if (pannerNode._feedbackNode) pannerNode._feedbackNode.disconnect(); } catch (e) {}
        try { if (pannerNode._dampFilter) pannerNode._dampFilter.disconnect(); } catch (e) {}
        try { pannerNode.disconnect(); } catch (e) {}
    },

    // BUG FIX & STABILITY: Safely validate oscillator types so typos don't crash the context
    _getSafeOscType: function(type) {
        const valid = ['sine', 'square', 'sawtooth', 'triangle'];
        return valid.includes(type) ? type : 'sine';
    },

    // --- CORE GENERATORS ---

    playNoise: function(duration, vol = 0.1, filterFreq = 1000, x) {
        if (!this.settings.master || !this.getCtx()) return;
        
        const ctx = this._ctx;
        if (!this.noiseBuffer) this.initNoise();

        const acoustics = this._getAcoustics();
        const spatial = this._getSpatialData(x);
        
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
        
        const panner = this._routeToMaster(ctx, gain, acoustics, spatial);

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

    playTone: function(freq, type, duration, vol = 0.1, pitchShift = true, slideTo = null, x) {
        if (!this.settings.master || !this.getCtx()) return;
        
        const ctx = this._ctx;
        const acoustics = this._getAcoustics();
        const spatial = this._getSpatialData(x);
        
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
        const panner = this._routeToMaster(ctx, gain, acoustics, spatial);

        osc.start(now);
        osc.stop(now + actualDuration + 0.1);
        
        const cleanup = () => {
            try { osc.disconnect(); gain.disconnect(); } catch(e) {}
            this._cleanupRoute(panner);
        };
        osc.onended = cleanup;
        setTimeout(cleanup, (actualDuration + 0.5) * 1000);
    },

    playChord: function(notes, type = 'sine', duration = 0.5, vol = 0.1, detune = 0, slideDown = false, x) {
        if (!this.settings.master || !this.getCtx()) return;
        const ctx = this._ctx;
        const acoustics = this._getAcoustics();
        const spatial = this._getSpatialData(x);
        
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
            const panner = this._routeToMaster(ctx, gain, acoustics, spatial);
            
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

    playMelody: function(notes, type = 'sine', speed = 0.15, vol = 0.1) {
        if (!this.settings.master || !this.settings.ui || !this.getCtx()) return;
        
        const ctx = this._ctx;
        const now = ctx.currentTime + 0.01;
        const acoustics = this._getAcoustics();
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
        const panner = this._routeToMaster(ctx, gain, acoustics, this._getSpatialData());
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
        this.playNoise(0.15, 0.1, 400, x);
        this.playTone(80, 'triangle', 0.1, 0.1, true, 40, x);
    },

    // NEW: Fishing bite sound
    playFishBite: function(x) {
        if (!this.settings.ui) return;
        this.playTone(1200, 'sine', 0.05, 0.15, false, 800, x);
        setTimeout(() => this.playNoise(0.05, 0.05, 2000, x), 20);
    },
    
    playAttack: function(type = 'normal', x) { 
        if (!this.settings.master || !this.settings.combat || !this.getCtx()) return;
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
        // Layered Twang + Whoosh
        this.playTone(400, 'sawtooth', 0.1, 0.1, true, 200, x);
        setTimeout(() => this.playNoise(0.15, 0.04, 2000, x), 10);
    },
    
    playHit: function(x) { 
        if (!this.settings.combat || !this.getCtx()) return;
        if (!this._throttle('hit', 80)) return;
        
        let material = 'flesh'; 
        if (typeof chunkManager !== 'undefined' && typeof gameState !== 'undefined') {
            let tileAtX = null;
            if (gameState.mapMode === 'overworld') tileAtX = chunkManager.getTile(x, gameState.player.y);
            else if (gameState.mapMode === 'dungeon') tileAtX = chunkManager.caveMaps[gameState.currentCaveId]?.[gameState.player.y]?.[x];
            
            if (tileAtX && typeof ENEMY_DATA !== 'undefined' && ENEMY_DATA[tileAtX]) {
                const tags = ENEMY_DATA[tileAtX].tags || []; 
                if (tags.includes("bone")) material = 'bone';
                else if (tags.includes("metal") || tags.includes("stone") || tags.includes("construct")) material = 'metal';
                else if (tags.includes("ethereal") || tags.includes("void")) material = 'ethereal';
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
        } else {
            this.playTone(80, 'square', 0.15, 0.1, true, null, x); 
            this.playNoise(0.1, 0.1, 1500, x);
        }
    },

    playCrit: function(x) {
        if (!this.settings.combat) return;
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
        // Warm, swelling chord
        this.playChord([261.63, 329.63, 392.00], 'sine', 0.6, 0.1, 1.0, false, x);
    },
    
    playCoin: function() { 
        if (!this.settings.ui) return;
        if (!this._throttle('coin', 50)) return;
        this.playMelody([987.77, 1318.51], 'sine', 0.05, 0.06); 
    },
    
    // JUICE WIN: Improved UI Error feedback
    playError: function() {
        if (this.settings.ui) {
            if (!this._throttle('error', 100)) return;
            // Dull, staccato thud instead of a harsh screech
            this.playTone(100, 'triangle', 0.1, 0.05, false, 50);
            this.playNoise(0.05, 0.02, 300);
        }
    },

    playClick: function() {
        if (this.settings.ui) {
            if (!this._throttle('click', 50)) return;
            this.playNoise(0.02, 0.05, 3000);
        }
    },

    playHover: function() {
        if (this.settings.ui) {
            if (!this._throttle('hover', 50)) return;
            this.playTone(800, 'sine', 0.02, 0.02, false);
        }
    },
    
    // --- LORE EXPANSION SOUNDS ---

    playConsume: function() {
        if (!this.settings.ui) return;
        // Glug/Crunch sound for eating/drinking
        this.playNoise(0.1, 0.05, 800);
        setTimeout(() => { this.playTone(300, 'triangle', 0.05, 0.05, true, 200); }, 50);
    },

    playEnchant: function() {
        if (!this.settings.magic) return;
        // Rising, magical arpeggio
        this.playMelody([440, 554.37, 659.25, 880], 'sine', 0.1, 0.15);
        this.playNoise(0.5, 0.05, 2000); // Shimmering background dust
    },

    playDisenchant: function() {
        if (!this.settings.magic) return;
        // Shattering glass + discordant descending chord
        this.playNoise(0.2, 0.15, 4000); // Crack!
        this.playChord([880, 659.25, 622.25, 440], 'sawtooth', 0.4, 0.1, 5.0, true);
    },
    
    // --- EPIC/FANFARE SOUNDS ---

    playLevelUp: function() {
        this.playChord([261.63, 329.63, 392.00, 523.25], 'sine', 0.8, 0.15, 1.5);
    },

    playQuestComplete: function() {
        this.playMelody([392.00, 392.00, 392.00, 523.25, 0, 523.25], 'triangle', 0.12, 0.1);
    },

    playLootRare: function() {
        this.playMelody([523.25, 659.25, 783.99, 1046.50], 'sine', 0.08, 0.08);
    },

    playSecret: function() {
        this.playMelody([329.63, 392.00, 493.88], 'triangle', 0.2, 0.08);
    },

    playWarning: function() {
        this.playMelody([400, 0, 400], 'square', 0.1, 0.1);
    },

    playDeath: function() {
        this.playMelody([300, 280, 260, 200], 'sawtooth', 0.4, 0.15);
    },

    playDiscovery: function() {
        this.playChord([261.63, 329.63, 392.00, 523.25], 'sine', 2.0, 0.15, 2.0);
    },

    playBossSpawn: function() {
        this.playChord([50, 55, 60], 'sawtooth', 3.0, 0.2, 5.0);
    },

    playCraftSuccess: function() {
        this.playMelody([400, 600, 800], 'triangle', 0.1, 0.1);
    },

    playTimelineShift: function() {
        this.playChord([100, 150, 200], 'sawtooth', 2.0, 0.2, 5.0, true); 
        setTimeout(() => this.playChord([400, 600, 800], 'sine', 1.5, 0.15, 2.0), 500); 
        this.playNoise(2.0, 0.2, 2000); 
    },

    playVoidEnter: function() {
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
