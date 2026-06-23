// --- START OF FILE audio.js ---

// ==========================================
// ADVANCED PROCEDURAL AUDIO SYSTEM
// ==========================================

const AudioSystem = {
    _ctx: null, 
    _masterGain: null,
    _compressor: null,
    noiseBuffer: null, 
    
    // PERFORMANCE WIN: Audio Throttling
    // Prevents audio blowout/CPU spikes if 20 enemies move/attack on the exact same frame.
    _lastPlayed: {},

    // Settings State
    settings: JSON.parse(localStorage.getItem('audioSettings')) || {
        master: true,
        steps: true,
        combat: true,
        magic: true,
        ui: true
    },

    saveSettings: () => {
        localStorage.setItem('audioSettings', JSON.stringify(AudioSystem.settings));
    },

    // --- MOBILE BROWSER COMPATIBILITY FIX ---
    // iOS and Android Chrome strictly block AudioContext from starting unless 
    // triggered directly by a user gesture. This wrapper guarantees it unlocks.
    initAudioContext: function() {
        if (!this._ctx) {
            this._ctx = new (window.AudioContext || window.webkitAudioContext)();
            
            // AUDIO QUALITY WIN: Studio-grade Mastering Chain
            this._masterGain = this._ctx.createGain();
            this._masterGain.gain.value = 0.7; // Leave 30% headroom
            
            this._compressor = this._ctx.createDynamicsCompressor();
            this._compressor.threshold.value = -12; // Start compressing at -12dB
            this._compressor.knee.value = 30;       // Smooth transition
            this._compressor.ratio.value = 12;      // Hard limiting
            this._compressor.attack.value = 0.003;  // React instantly
            this._compressor.release.value = 0.25;  // Let go naturally

            this._masterGain.connect(this._compressor);
            this._compressor.connect(this._ctx.destination);
        }
        return this._ctx;
    },

    getCtx: function() {
        const ctx = this.initAudioContext();
        // PERFORMANCE & ROBUSTNESS WIN: Only resume if explicitly suspended
        if (ctx && ctx.state === 'suspended') {
            ctx.resume().catch(e => console.warn("AudioContext resume failed:", e));
        }
        return ctx;
    },

    // AUDIO QUALITY WIN: Pink Noise Generator
    // White noise is harsh. Pink noise sounds like natural wind, water, and deep impacts!
    initNoise: function() {
        const ctx = this.getCtx();
        if (!ctx) return;
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

    // Internal Throttler
    _throttle: function(id, msCooldown) {
        const now = Date.now();
        if (Math.random() < 0.05) {
            for (const key in this._lastPlayed) {
                if (now - this._lastPlayed[key] > 5000) delete this._lastPlayed[key];
            }
        }
        if (this._lastPlayed[id] && now - this._lastPlayed[id] < msCooldown) return false;
        this._lastPlayed[id] = now;
        return true;
    },

    // --- IMMERSION: DYNAMIC ACOUSTICS & DISTANCE ATTENUATION ---
    _getAcoustics: function() {
        if (typeof gameState !== 'undefined') {
            if (gameState.currentRealm !== 0 || gameState.currentCaveTheme === 'VOID' || gameState.currentCaveTheme === 'ABYSS') {
                return { durationMult: 1.5, filterMult: 0.35, echoDelay: 0.35, echoFeedback: 0.6, dampening: 1000 };
            }
            if (gameState.mapMode === 'skyrealm') {
                return { durationMult: 0.8, filterMult: 1.5, echoDelay: 0.4, echoFeedback: 0.4, dampening: 4000 };
            }
            if (gameState.mapMode === 'dungeon' || gameState.mapMode === 'underworld') {
                // Deep caves: Heavy echo, heavily muffled highs
                return { durationMult: 1.2, filterMult: 0.6, echoDelay: 0.15, echoFeedback: 0.4, dampening: 1500 }; 
            } else if (gameState.mapMode === 'castle') {
                // Castles/Ruins: Slapback echo
                return { durationMult: 1.1, filterMult: 0.85, echoDelay: 0.08, echoFeedback: 0.25, dampening: 3000 }; 
            }
        }
        return { durationMult: 1.0, filterMult: 1.0, echoDelay: 0, echoFeedback: 0, dampening: 20000 }; // Open air
    },

    _getSpatialData: function(x) {
        if (x === undefined || typeof gameState === 'undefined' || !gameState.player) {
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

    // AUDIO QUALITY WIN: Dampened Delay Network (True Reverb)
    _routeToMaster: function(ctx, sourceNode, acoustics, spatial) {
        let panner = null;
        if (ctx.createStereoPanner) {
            panner = ctx.createStereoPanner();
            panner.pan.value = spatial.pan;
            sourceNode.connect(panner);
        } else {
            panner = sourceNode; 
        }

        if (acoustics.echoDelay > 0) {
            const delay = ctx.createDelay();
            delay.delayTime.value = acoustics.echoDelay;
            const feedback = ctx.createGain();
            feedback.gain.value = acoustics.echoFeedback;
            
            // Lowpass filter inside the loop absorbs high frequencies as the sound bounces!
            const dampFilter = ctx.createBiquadFilter();
            dampFilter.type = 'lowpass';
            dampFilter.frequency.value = acoustics.dampening;

            panner.connect(delay);
            delay.connect(dampFilter);
            dampFilter.connect(feedback);
            feedback.connect(delay);
            dampFilter.connect(this._masterGain);
            
            panner._delayNode = delay;
            panner._feedbackNode = feedback;
            panner._dampFilter = dampFilter;
        }

        panner.connect(this._masterGain);
        return panner;
    },

    _cleanupRoute: function(pannerNode) {
        if (!pannerNode) return;
        if (pannerNode._delayNode) pannerNode._delayNode.disconnect();
        if (pannerNode._feedbackNode) pannerNode._feedbackNode.disconnect();
        if (pannerNode._dampFilter) pannerNode._dampFilter.disconnect();
        pannerNode.disconnect();
    },

    // --- CORE GENERATORS ---

    playNoise: function(duration, vol = 0.1, filterFreq = 1000, x) {
        if (!this.settings.master || !this.getCtx()) return;
        
        const ctx = this._ctx;
        if (!this.noiseBuffer) this.initNoise();

        const acoustics = this._getAcoustics();
        const spatial = this._getSpatialData(x);
        
        const actualDuration = duration * acoustics.durationMult;
        const actualVol = vol * spatial.distanceVol;

        const src = ctx.createBufferSource();
        src.buffer = this.noiseBuffer; 
        
        src.playbackRate.value = 0.6 + Math.random() * 0.8;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = (filterFreq + (Math.random() - 0.5) * 200) * acoustics.filterMult * spatial.distanceFilter;

        const gain = ctx.createGain();
        const now = ctx.currentTime + 0.01; // AUDIO QUALITY WIN: Lookahead prevents envelope popping!

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(actualVol, now + 0.02); 
        gain.gain.exponentialRampToValueAtTime(0.0001, now + actualDuration); 

        src.connect(filter);
        filter.connect(gain);
        
        const panner = this._routeToMaster(ctx, gain, acoustics, spatial);

        src.start(now);
        src.stop(now + actualDuration + 0.1); // Add slight pad to stop time
        
        src.onended = () => {
            src.disconnect(); filter.disconnect(); gain.disconnect();
            this._cleanupRoute(panner);
        };
    },

    playTone: function(freq, type, duration, vol = 0.1, pitchShift = true, slideTo = null, x) {
        if (!this.settings.master || !this.getCtx()) return;
        
        const ctx = this._ctx;
        const acoustics = this._getAcoustics();
        const spatial = this._getSpatialData(x);
        
        const actualDuration = duration * acoustics.durationMult;
        const actualVol = vol * spatial.distanceVol;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        
        let finalFreq = freq;
        if (pitchShift) finalFreq = freq * (0.92 + Math.random() * 0.16); 
        if (finalFreq > 400) finalFreq *= (acoustics.filterMult * spatial.distanceFilter);

        const now = ctx.currentTime + 0.01; 

        osc.frequency.setValueAtTime(finalFreq, now);
        if (slideTo) {
            osc.frequency.exponentialRampToValueAtTime(Math.max(10, slideTo * spatial.distanceFilter), now + actualDuration);
        }

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(actualVol, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + actualDuration);

        const panner = this._routeToMaster(ctx, gain, acoustics, spatial);
        osc.connect(gain);

        osc.start(now);
        osc.stop(now + actualDuration + 0.1);
        
        osc.onended = () => {
            osc.disconnect(); gain.disconnect();
            this._cleanupRoute(panner);
        };
    },

    playChord: function(notes, type = 'sine', duration = 0.5, vol = 0.1, detune = 0, slideDown = false) {
        if (!this.settings.master || !this.getCtx()) return;
        const ctx = this._ctx;
        const acoustics = this._getAcoustics();
        const actualDuration = duration * acoustics.durationMult;
        const noteVol = vol / notes.length;
        const now = ctx.currentTime + 0.01;

        notes.forEach((freq, index) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = type;
            const startFreq = (freq * acoustics.filterMult) + (index * detune);
            osc.frequency.setValueAtTime(startFreq, now);
            
            if (slideDown) {
                osc.frequency.exponentialRampToValueAtTime(Math.max(10, startFreq * 0.5), now + actualDuration);
            }

            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.exponentialRampToValueAtTime(noteVol, now + 0.05); 
            gain.gain.exponentialRampToValueAtTime(0.0001, now + actualDuration);

            osc.connect(gain);
            const panner = this._routeToMaster(ctx, gain, acoustics, this._getSpatialData());
            
            osc.start(now);
            osc.stop(now + actualDuration + 0.1);
            
            osc.onended = () => { 
                osc.disconnect(); gain.disconnect(); 
                this._cleanupRoute(panner);
            };
        });
    },

    playMelody: function(notes, type = 'sine', speed = 0.15, vol = 0.1) {
        if (!this.settings.master || !this.settings.ui || !this.getCtx()) return;
        
        const ctx = this._ctx;
        const now = ctx.currentTime + 0.01;
        const acoustics = this._getAcoustics();
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        
        let totalDuration = notes.length * speed * acoustics.durationMult;
        
        notes.forEach((freq, index) => {
            const noteTime = now + (index * speed);
            if (freq > 0) {
                const adjFreq = freq * (freq > 500 ? acoustics.filterMult : 1.0);
                osc.frequency.setValueAtTime(adjFreq, noteTime);
                
                gain.gain.setValueAtTime(0.0001, noteTime);
                gain.gain.exponentialRampToValueAtTime(vol, noteTime + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + (speed * acoustics.durationMult) - 0.01);
            } else {
                gain.gain.setValueAtTime(0.0001, noteTime);
            }
        });
        
        osc.connect(gain);
        const panner = this._routeToMaster(ctx, gain, acoustics, this._getSpatialData());
        osc.start(now);
        osc.stop(now + totalDuration + 0.1);
        
        osc.onended = () => { 
            osc.disconnect(); gain.disconnect(); 
            this._cleanupRoute(panner);
        };
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
        this.playChord([440, 554.37, 659.25, 830.61], 'sine', 0.3, 0.08, 2.0, true);
    },

    playHeal: function(x) {
        if (!this.settings.magic) return;
        // Warm, swelling chord
        this.playChord([261.63, 329.63, 392.00], 'sine', 0.6, 0.1, 1.0);
    },
    
    playCoin: function() { 
        if (!this.settings.ui) return;
        if (!this._throttle('coin', 50)) return;
        this.playMelody([987.77, 1318.51], 'sine', 0.05, 0.06); 
    },
    
    playError: function() {
        if (this.settings.ui) this.playTone(150, 'sawtooth', 0.15, 0.05, false, 100);
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
// Forces the audio context to initialize the very first time the player clicks anywhere.
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
        document.removeEventListener('pointerdown', forceUnlockAudio);
        document.removeEventListener('keydown', forceUnlockAudio);
    }
}

document.addEventListener('click', forceUnlockAudio, { once: true });
document.addEventListener('touchstart', forceUnlockAudio, { once: true });
document.addEventListener('pointerdown', forceUnlockAudio, { once: true });
document.addEventListener('keydown', forceUnlockAudio, { once: true });

// --- END OF FILE audio.js ---
