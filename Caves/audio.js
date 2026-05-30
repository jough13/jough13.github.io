// --- START OF FILE audio.js ---

// ==========================================
// ADVANCED PROCEDURAL AUDIO SYSTEM
// ==========================================

const AudioSystem = {
    _ctx: null, 
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

    // --- IMMERSION: DYNAMIC ACOUSTICS & PANNING ---
    
    // Simulates echoes and muffling if underground
    _getAcoustics: function() {
        if (typeof gameState !== 'undefined' && (gameState.mapMode === 'dungeon' || gameState.mapMode === 'castle')) {
            // Echo tail is 50% longer, high frequencies are slightly muffled
            return { durationMult: 1.5, filterMult: 0.7 }; 
        }
        return { durationMult: 1.0, filterMult: 1.0 }; // Open air
    },

    // Calculates stereo panning based on horizontal distance from the player
    _getPan: function(x) {
        if (x === undefined || typeof gameState === 'undefined' || !gameState.player) return 0;
        const dx = x - gameState.player.x;
        // Max pan (1.0 or -1.0) reached at 10 tiles away
        return Math.max(-1, Math.min(1, dx / 10));
    },

    // --- CORE GENERATORS ---

    playNoise: function(duration, vol = 0.1, filterFreq = 1000, x) {
        if (!this.settings.master || !this.getCtx()) return;
        
        const ctx = this._ctx;
        if (!this.noiseBuffer) this.initNoise();

        const acoustics = this._getAcoustics();
        const actualDuration = duration * acoustics.durationMult;

        const src = ctx.createBufferSource();
        src.buffer = this.noiseBuffer; 
        
        // Anti-Fatigue: Wider randomized pitch modulation
        src.playbackRate.value = 0.6 + Math.random() * 0.8;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = (filterFreq + (Math.random() - 0.5) * 200) * acoustics.filterMult;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + actualDuration);

        // SPATIAL AUDIO: Stereo Panning
        let panner = null;
        if (ctx.createStereoPanner) {
            panner = ctx.createStereoPanner();
            panner.pan.value = this._getPan(x);
        }

        // Build the audio graph
        src.connect(filter);
        if (panner) {
            filter.connect(panner);
            panner.connect(gain);
        } else {
            filter.connect(gain);
        }
        gain.connect(ctx.destination);

        src.start();
        src.stop(ctx.currentTime + actualDuration);
        
        src.onended = () => {
            src.disconnect(); filter.disconnect(); gain.disconnect();
            if (panner) panner.disconnect();
        };
    },

    playTone: function(freq, type, duration, vol = 0.1, pitchShift = true, slideTo = null, x) {
        if (!this.settings.master || !this.getCtx()) return;
        
        const ctx = this._ctx;
        const acoustics = this._getAcoustics();
        const actualDuration = duration * acoustics.durationMult;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = type;
        
        let finalFreq = freq;
        if (pitchShift) {
            // Anti-Fatigue: Subtle pitch shift
            finalFreq = freq * (0.92 + Math.random() * 0.16); 
        }
        
        // Apply acoustic muffling to high frequencies
        if (finalFreq > 500 && acoustics.filterMult < 1.0) {
            finalFreq *= acoustics.filterMult;
        }

        osc.frequency.setValueAtTime(finalFreq, ctx.currentTime);
        if (slideTo) {
            osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + actualDuration);
        }

        gain.gain.setValueAtTime(0.01, ctx.currentTime);
        // Add a tiny attack envelope to prevent audio popping clicks
        gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + actualDuration);

        // SPATIAL AUDIO
        let panner = null;
        if (ctx.createStereoPanner) {
            panner = ctx.createStereoPanner();
            panner.pan.value = this._getPan(x);
        }

        if (panner) {
            osc.connect(panner);
            panner.connect(gain);
        } else {
            osc.connect(gain);
        }
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + actualDuration);
        
        osc.onended = () => {
            osc.disconnect(); gain.disconnect();
            if (panner) panner.disconnect();
        };
    },

    // EXPANDABILITY WIN: Generic Melody Sequencer
    // Allows easy creation of custom jingles for quests, puzzles, or rare loot!
    playMelody: function(notes, type = 'sine', speed = 0.15, vol = 0.1) {
        if (!this.settings.master || !this.settings.ui || !this.getCtx()) return;
        
        const ctx = this._ctx;
        const now = ctx.currentTime;
        const acoustics = this._getAcoustics();
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = type;
        
        let totalDuration = notes.length * speed * acoustics.durationMult;
        
        // Build the sequence
        notes.forEach((freq, index) => {
            const noteTime = now + (index * speed);
            if (freq > 0) {
                const adjFreq = freq * (freq > 500 ? acoustics.filterMult : 1.0);
                osc.frequency.setValueAtTime(adjFreq, noteTime);
                
                gain.gain.setValueAtTime(0, noteTime);
                gain.gain.linearRampToValueAtTime(vol, noteTime + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.01, noteTime + (speed * acoustics.durationMult) - 0.01);
            } else {
                // Rest note (Silence)
                gain.gain.setValueAtTime(0, noteTime);
            }
        });
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + totalDuration);
        
        osc.onended = () => { osc.disconnect(); gain.disconnect(); };
    },

    // --- SPECIFIC SOUND EFFECTS ---

    playStep: function(x) { 
        if (!this.settings.steps) return;
        // Throttle to max 1 step sound per 80ms to prevent crunching during multi-entity movement
        if (!this._throttle('step', 80)) return; 
        this.playNoise(0.08, 0.05, 600, x); 
    },
    
    // GAMEPLAY WIN: Dynamic Attack Types & Spatial Panning
    playAttack: function(type = 'normal', x) { 
        if (!this.settings.master || !this.settings.combat || !this.getCtx()) return;
        if (!this._throttle('attack', 50)) return; // Prevent overlapping sweep blowouts
        
        const ctx = this._ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const acoustics = this._getAcoustics();
        
        let startFreq = 300, endFreq = 50, duration = 0.1, vol = 0.1;

        if (type === 'heavy') {
            startFreq = 150; endFreq = 20; duration = 0.15; vol = 0.15;
            osc.type = 'triangle';
        } else if (type === 'light') {
            startFreq = 600; endFreq = 200; duration = 0.08; vol = 0.08;
            osc.type = 'sine';
        } else {
            // Normal
            startFreq = 300 + (Math.random() * 100);
            endFreq = 50 + (Math.random() * 20);
            osc.type = 'sine';
        }
        
        const actualDuration = duration * acoustics.durationMult;

        osc.frequency.setValueAtTime(startFreq * acoustics.filterMult, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + actualDuration);
        
        gain.gain.setValueAtTime(0.01, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.02);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + actualDuration);
        
        let panner = null;
        if (ctx.createStereoPanner) {
            panner = ctx.createStereoPanner();
            panner.pan.value = this._getPan(x);
        }

        if (panner) {
            osc.connect(panner); panner.connect(gain);
        } else {
            osc.connect(gain);
        }
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + actualDuration);
        
        osc.onended = () => { osc.disconnect(); gain.disconnect(); if (panner) panner.disconnect(); };
    },

    playBow: function(x) {
        if (this.settings.combat) {
            // Pluck sound
            this.playTone(400, 'triangle', 0.1, 0.1, true, 200, x);
            // Arrow travel whoosh
            setTimeout(() => this.playNoise(0.15, 0.03, 2000, x), 20);
        }
    },
    
    playHit: function(x) { 
        if (!this.settings.combat) return;
        if (!this._throttle('hit', 80)) return;
        this.playTone(80, 'square', 0.15, 0.1, true, null, x); 
    },

    playCrit: function(x) {
        if (!this.settings.combat) return;
        // High-pitched piercing ring for critical hits
        this.playTone(1200, 'sine', 0.3, 0.15, false, 800, x);
        this.playTone(80, 'square', 0.2, 0.1, true, null, x); // Accompanied by base hit impact
    },
    
    playMagic: function(x) { 
        if (!this.settings.magic) return;
        if (!this._throttle('magic', 100)) return;
        this.playTone(600, 'sine', 0.3, 0.05, true, 800, x); 
    },

    playHeal: function(x) {
        if (!this.settings.magic) return;
        // Shimmering ascending sound
        this.playTone(300, 'sine', 0.4, 0.05, false, 600, x);
        setTimeout(() => this.playTone(400, 'sine', 0.3, 0.05, false, 800, x), 100);
    },
    
    playCoin: function() { 
        if (!this.settings.ui) return;
        if (!this._throttle('coin', 50)) return;
        this.playTone(1200, 'sine', 0.1, 0.05, true); 
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
    
    // --- JUICE: SEQUENCED JINGLES ---
    
    playLevelUp: function() {
        // C Major Arpeggio: C4, E4, G4, C5
        this.playMelody([261.63, 329.63, 392.00, 523.25], 'sine', 0.15, 0.1);
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
        // Sharp, alarming double-beep (Traps, Blood Moon)
        this.playMelody([400, 0, 400], 'square', 0.1, 0.1);
    },

    playDeath: function() {
        // Dissonant, descending dirge
        this.playMelody([300, 280, 260, 200], 'sawtooth', 0.3, 0.15);
    }
};

// Global Boot Hook
// Forces the audio context to initialize the very first time the player clicks anywhere
document.addEventListener('click', function unlockAudioContext() {
    AudioSystem.initAudioContext();
    document.removeEventListener('click', unlockAudioContext);
}, { once: true });
