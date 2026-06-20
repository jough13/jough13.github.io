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
            // Prevents massive AoE spells from clipping and blowing out the speakers
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
        if (this._ctx.state === 'suspended') {
            this._ctx.resume().catch(e => console.warn("AudioContext resume failed:", e));
        }
        return this._ctx;
    },

    getCtx: function() {
        return this.initAudioContext();
    },

    initNoise: function() {
        const ctx = this.getCtx();
        const bufferSize = ctx.sampleRate * 2.0; // 2 seconds of noise buffer
        this.noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1; // White noise
        }
    },

    // Internal Throttler
    _throttle: function(id, msCooldown) {
        const now = Date.now();
        
        // Clean up old throttle timestamps occasionally to prevent memory leaks
        if (Math.random() < 0.05) {
            for (const key in this._lastPlayed) {
                if (now - this._lastPlayed[key] > 5000) delete this._lastPlayed[key];
            }
        }

        if (this._lastPlayed[id] && now - this._lastPlayed[id] < msCooldown) {
            return false;
        }
        this._lastPlayed[id] = now;
        return true;
    },

    // --- IMMERSION: DYNAMIC ACOUSTICS & DISTANCE ATTENUATION ---
    
    // Simulates echoes and muffling based on dimension and depth!
    _getAcoustics: function() {
        if (typeof gameState !== 'undefined') {
            // LORE WIN: Void / Alternate Realms sound oppressive, distorted, and echoing
            if (gameState.currentRealm !== 0 || gameState.currentCaveTheme === 'VOID') {
                return { durationMult: 1.5, filterMult: 0.4, echoDelay: 0.3, echoFeedback: 0.5 };
            }
            // Sky Realm: Thin air, high frequencies pass easily, massive open echo
            if (gameState.mapMode === 'skyrealm') {
                return { durationMult: 0.8, filterMult: 1.5, echoDelay: 0.4, echoFeedback: 0.4 };
            }
            if (gameState.mapMode === 'dungeon' || gameState.mapMode === 'underworld') {
                // Deep caves: Heavy echo, muffled highs
                return { durationMult: 1.2, filterMult: 0.6, echoDelay: 0.15, echoFeedback: 0.35 }; 
            } else if (gameState.mapMode === 'castle') {
                // Castles/Ruins: Slapback echo, less muffling
                return { durationMult: 1.1, filterMult: 0.85, echoDelay: 0.08, echoFeedback: 0.2 }; 
            }
        }
        return { durationMult: 1.0, filterMult: 1.0, echoDelay: 0, echoFeedback: 0 }; // Open air
    },

    // JUICE WIN: Calculates stereo panning, volume dropoff, and high-frequency loss based on distance!
    _getSpatialData: function(x) {
        if (x === undefined || typeof gameState === 'undefined' || !gameState.player) {
            return { pan: 0, distanceVol: 1.0, distanceFilter: 1.0 };
        }
        const dx = x - gameState.player.x;
        const absDx = Math.abs(dx);
        
        return {
            pan: Math.max(-1, Math.min(1, dx / 10)), // Stereo pan
            distanceVol: Math.max(0.05, 1.0 - (absDx * 0.06)), // Fades out as distance increases
            distanceFilter: Math.max(0.1, 1.0 - (absDx * 0.05)) // Muffles far sounds (loss of treble)
        };
    },

    // Helper to connect a node to the master chain (with optional reverb)
    _routeToMaster: function(ctx, sourceNode, acoustics, spatial) {
        // 1. Panner
        let panner = null;
        if (ctx.createStereoPanner) {
            panner = ctx.createStereoPanner();
            panner.pan.value = spatial.pan;
            sourceNode.connect(panner);
        } else {
            panner = sourceNode; // Fallback
        }

        // 2. Reverb (Delay Network)
        if (acoustics.echoDelay > 0) {
            const delay = ctx.createDelay();
            delay.delayTime.value = acoustics.echoDelay;
            const feedback = ctx.createGain();
            feedback.gain.value = acoustics.echoFeedback;

            // Route signal to delay
            panner.connect(delay);
            // Route delay back into itself
            delay.connect(feedback);
            feedback.connect(delay);
            // Route delay to master
            delay.connect(this._masterGain);
        }

        // 3. Dry Signal to Master
        panner.connect(this._masterGain);
        return panner;
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
        
        // Anti-Fatigue: Wider randomized pitch modulation
        src.playbackRate.value = 0.6 + Math.random() * 0.8;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        // Apply acoustic cave muffling AND distance muffling
        filter.frequency.value = (filterFreq + (Math.random() - 0.5) * 200) * acoustics.filterMult * spatial.distanceFilter;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(actualVol, ctx.currentTime + 0.01); // Quick attack
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + actualDuration); // No pop

        // Build the audio graph
        src.connect(filter);
        filter.connect(gain);
        
        this._routeToMaster(ctx, gain, acoustics, spatial);

        src.start();
        src.stop(ctx.currentTime + actualDuration);
        
        src.onended = () => {
            src.disconnect(); filter.disconnect(); gain.disconnect();
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
        if (pitchShift) {
            // Anti-Fatigue: Subtle pitch shift
            finalFreq = freq * (0.92 + Math.random() * 0.16); 
        }
        
        // Apply acoustic & distance muffling to high frequencies
        if (finalFreq > 400) {
            finalFreq *= (acoustics.filterMult * spatial.distanceFilter);
        }

        osc.frequency.setValueAtTime(finalFreq, ctx.currentTime);
        if (slideTo) {
            osc.frequency.exponentialRampToValueAtTime(slideTo * spatial.distanceFilter, ctx.currentTime + actualDuration);
        }

        // QoL WIN: Anti-Popping Envelopes
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(actualVol, ctx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + actualDuration);

        this._routeToMaster(ctx, gain, acoustics, spatial);
        osc.connect(gain);

        osc.start();
        osc.stop(ctx.currentTime + actualDuration);
        
        osc.onended = () => {
            osc.disconnect(); gain.disconnect();
        };
    },

    // EXPANDABILITY WIN: The Polyphonic Engine
    // Plays multiple tones simultaneously. Perfect for thick, lush rewards or terrifying bosses!
    playChord: function(notes, type = 'sine', duration = 0.5, vol = 0.1, detune = 0, slideDown = false) {
        if (!this.settings.master || !this.getCtx()) return;
        const ctx = this._ctx;
        const acoustics = this._getAcoustics();
        const actualDuration = duration * acoustics.durationMult;
        
        // Distribute volume so chords don't blow out the speakers
        const noteVol = vol / notes.length;

        notes.forEach((freq, index) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = type;
            // Apply slight detuning to create a richer, "chorus" effect
            const startFreq = (freq * acoustics.filterMult) + (index * detune);
            osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
            
            if (slideDown) {
                osc.frequency.exponentialRampToValueAtTime(startFreq * 0.5, ctx.currentTime + actualDuration);
            }

            gain.gain.setValueAtTime(0.0001, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(noteVol, ctx.currentTime + 0.05); 
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + actualDuration);

            osc.connect(gain);
            this._routeToMaster(ctx, gain, acoustics, this._getSpatialData());
            
            osc.start();
            osc.stop(ctx.currentTime + actualDuration);
            
            osc.onended = () => { osc.disconnect(); gain.disconnect(); };
        });
    },

    playMelody: function(notes, type = 'sine', speed = 0.15, vol = 0.1) {
        if (!this.settings.master || !this.settings.ui || !this.getCtx()) return;
        
        const ctx = this._ctx;
        const now = ctx.currentTime;
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
                
                // Crisp envelope per note
                gain.gain.setValueAtTime(0.0001, noteTime);
                gain.gain.exponentialRampToValueAtTime(vol, noteTime + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + (speed * acoustics.durationMult) - 0.01);
            } else {
                // Rest note
                gain.gain.setValueAtTime(0.0001, noteTime);
            }
        });
        
        osc.connect(gain);
        this._routeToMaster(ctx, gain, acoustics, this._getSpatialData());
        osc.start(now);
        osc.stop(now + totalDuration);
        
        osc.onended = () => { osc.disconnect(); gain.disconnect(); };
    },

    // --- SPECIFIC SOUND EFFECTS ---

    playStep: function(x) { 
        if (!this.settings.steps) return;
        if (!this._throttle('step', 80)) return; 
        
        // Add a low-frequency thump to the dust noise to make footsteps feel grounded
        this.playNoise(0.08, 0.04, 500, x); 
        this.playTone(80, 'sine', 0.05, 0.05, true, 40, x);
    },
    
    // CONTENT EXPANSION: Added Sweep and Pierce variants
    playAttack: function(type = 'normal', x) { 
        if (!this.settings.master || !this.settings.combat || !this.getCtx()) return;
        if (!this._throttle('attack', 50)) return; 
        
        const ctx = this._ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const acoustics = this._getAcoustics();
        const spatial = this._getSpatialData(x);
        
        let startFreq = 300, endFreq = 50, duration = 0.1, vol = 0.1;

        if (type === 'heavy') {
            startFreq = 150; endFreq = 20; duration = 0.15; vol = 0.15;
            osc.type = 'triangle';
            // Layer a crunch noise on top for physical impact feel
            this.playNoise(0.1, 0.08, 1200, x);
        } else if (type === 'light') {
            startFreq = 600; endFreq = 200; duration = 0.08; vol = 0.08;
            osc.type = 'sine';
        } else if (type === 'sweep') {
            // Long, wide swing (Cleave / Whirlwind)
            startFreq = 200; endFreq = 100; duration = 0.2; vol = 0.12;
            osc.type = 'sine';
            this.playNoise(0.15, 0.05, 800, x); // Mix with wind noise
        } else if (type === 'pierce') {
            // Fast, sharp thrust (Daggers / Spears)
            startFreq = 800; endFreq = 100; duration = 0.05; vol = 0.1;
            osc.type = 'sawtooth';
        } else {
            // Normal
            startFreq = 300 + (Math.random() * 100);
            endFreq = 50 + (Math.random() * 20);
            osc.type = 'sine';
        }
        
        const actualDuration = duration * acoustics.durationMult;
        const actualVol = vol * spatial.distanceVol;

        osc.frequency.setValueAtTime(startFreq * acoustics.filterMult * spatial.distanceFilter, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + actualDuration);
        
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(actualVol, ctx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + actualDuration);
        
        osc.connect(gain);
        this._routeToMaster(ctx, gain, acoustics, spatial);

        osc.start();
        osc.stop(ctx.currentTime + actualDuration);
        
        osc.onended = () => { osc.disconnect(); gain.disconnect(); };
    },

    playBow: function(x) {
        if (this.settings.combat) {
            this.playTone(400, 'triangle', 0.1, 0.1, true, 200, x);
            setTimeout(() => this.playNoise(0.15, 0.03, 2000, x), 20);
        }
    },
    
    // JUICE WIN: Intelligent, material-aware hit sounds!
    playHit: function(x) { 
        if (!this.settings.combat || !this.getCtx()) return;
        if (!this._throttle('hit', 80)) return;
        
        let material = 'flesh'; // Default
        
        // Smart Context: Check what tile is at X!
        if (typeof chunkManager !== 'undefined' && typeof gameState !== 'undefined') {
            let tileAtX = null;
            if (gameState.mapMode === 'overworld') tileAtX = chunkManager.getTile(x, gameState.player.y);
            else if (gameState.mapMode === 'dungeon') tileAtX = chunkManager.caveMaps[gameState.currentCaveId]?.[gameState.player.y]?.[x];
            
            if (tileAtX && typeof ENEMY_DATA !== 'undefined' && ENEMY_DATA[tileAtX]) {
                const enemyTemplate = ENEMY_DATA[tileAtX];
                const tags = enemyTemplate.tags || []; // Safe fallback
                
                if (tags.includes("bone")) material = 'bone';
                else if (tags.includes("metal") || tags.includes("stone")) material = 'metal';
                else if (tags.includes("ethereal")) material = 'ethereal';
            }
        }

        if (material === 'bone') {
            this.playTone(400, 'square', 0.05, 0.1, true, null, x); // Sharp crack
            this.playNoise(0.05, 0.15, 3000, x); // High pitch snap
        } else if (material === 'metal') {
            this.playTone(800, 'triangle', 0.3, 0.15, true, 200, x); // Ringing clang
            this.playNoise(0.1, 0.1, 2000, x);
        } else if (material === 'ethereal') {
            this.playTone(200, 'sine', 0.4, 0.15, false, 50, x); // Bass drop
            this.playNoise(0.2, 0.08, 400, x); // Muffled woosh
        } else {
            // Default Flesh Crunch
            this.playTone(80, 'square', 0.15, 0.1, true, null, x); 
            this.playNoise(0.1, 0.1, 1500, x);
        }
    },

    playCrit: function(x) {
        if (!this.settings.combat) return;
        this.playTone(1200, 'sine', 0.3, 0.15, false, 800, x);
        this.playTone(80, 'square', 0.2, 0.1, true, null, x); 
        this.playNoise(0.2, 0.15, 2000, x); // Extra crunch
    },
    
    playMagic: function(x) { 
        if (!this.settings.magic) return;
        if (!this._throttle('magic', 100)) return;
        
        // Rich dual-tone for magic
        this.playTone(600, 'sine', 0.3, 0.05, true, 800, x); 
        this.playTone(900, 'sine', 0.3, 0.03, true, 1200, x); 
    },

    playHeal: function(x) {
        if (!this.settings.magic) return;
        this.playTone(300, 'sine', 0.4, 0.05, false, 600, x);
        setTimeout(() => this.playTone(400, 'sine', 0.3, 0.05, false, 800, x), 100);
    },
    
    playCoin: function() { 
        if (!this.settings.ui) return;
        if (!this._throttle('coin', 50)) return;
        // JUICE WIN: Classic two-note coin sound (e.g. B5 -> E6)
        this.playMelody([987.77, 1318.51], 'sine', 0.05, 0.08); 
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
    
    // --- JUICE & EXPANDABILITY: SEQUENCED JINGLES ---
    
    playLevelUp: function() {
        // Glorious, detuned C Major Arpeggio
        this.playChord([261.63, 329.63, 392.00, 523.25], 'sine', 0.6, 0.15, 1.5);
    },

    playQuestComplete: function() {
        // Triumphant Fanfare
        this.playMelody([392.00, 392.00, 392.00, 523.25, 0, 523.25], 'triangle', 0.12, 0.1);
    },

    playLootRare: function() {
        // Shimmering chime
        this.playMelody([523.25, 659.25, 783.99, 1046.50], 'sine', 0.08, 0.08);
    },

    playSecret: function() {
        // Mysterious ascending minor chord
        this.playMelody([329.63, 392.00, 493.88], 'triangle', 0.2, 0.08);
    },

    playWarning: function() {
        // Sharp, alarming double-beep
        this.playMelody([400, 0, 400], 'square', 0.1, 0.1);
    },

    playDeath: function() {
        // Dissonant, descending dirge
        this.playMelody([300, 280, 260, 200], 'sawtooth', 0.3, 0.15);
    },

    playDiscovery: function() {
        // A lush, lingering magical chord when finding a new Biome or Waystone
        this.playChord([261.63, 329.63, 392.00, 523.25], 'sine', 1.5, 0.15, 2.0);
    },

    playBossSpawn: function() {
        // Terrifying, dissonant, detuned low rumble
        this.playChord([50, 55, 60], 'sawtooth', 2.0, 0.2, 5.0);
    },

    playCraftSuccess: function() {
        // Satisfying metallic/chime sequence
        this.playMelody([400, 600, 800], 'triangle', 0.1, 0.1);
    },

    // LORE WIN: Massive, reality-bending audio for the Timeline Restore feature!
    playTimelineShift: function() {
        this.playChord([100, 150, 200], 'sawtooth', 1.5, 0.2, 5.0, true); // Deep dive
        setTimeout(() => this.playChord([400, 600, 800], 'sine', 1.0, 0.15, 2.0), 500); // Heavenly finish
        this.playNoise(1.5, 0.2, 2000); // Rushing wind
    },

    // LORE WIN: Dropping into the Void
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
        // Play 10 milliseconds of pure silence to satisfy Apple's API requirements
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = 0.0001; // True silence
        
        osc.connect(gain);
        gain.connect(ctx.destination); // Bypass master chain for unlocker
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.01);
        
        // Remove the listeners once successfully unlocked
        document.removeEventListener('click', forceUnlockAudio);
        document.removeEventListener('touchstart', forceUnlockAudio);
        document.removeEventListener('pointerdown', forceUnlockAudio);
        document.removeEventListener('keydown', forceUnlockAudio);
    }
}

// Bind to ALL major input vectors so tablet/stylus/keyboard players unlock audio flawlessly
document.addEventListener('click', forceUnlockAudio, { once: true });
document.addEventListener('touchstart', forceUnlockAudio, { once: true });
document.addEventListener('pointerdown', forceUnlockAudio, { once: true });
document.addEventListener('keydown', forceUnlockAudio, { once: true });

// --- END OF FILE audio.js ---
