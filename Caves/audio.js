// --- ADVANCED AUDIO SYSTEM (OPTIMIZED) ---
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

    getCtx: function() {
        if (!this._ctx) {
            this._ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this._ctx.state === 'suspended') {
            this._ctx.resume();
        }
        return this._ctx;
    },

    initNoise: function() {
        const ctx = this.getCtx();
        const bufferSize = ctx.sampleRate * 2.0; 
        this.noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
    },

    // Internal Throttler
    _throttle: function(id, msCooldown) {
        const now = Date.now();
        if (this._lastPlayed[id] && now - this._lastPlayed[id] < msCooldown) {
            return false;
        }
        this._lastPlayed[id] = now;
        return true;
    },

    // --- CORE GENERATORS ---

    playNoise: function(duration, vol = 0.1, filterFreq = 1000) {
        if (!this.settings.master) return;
        
        const ctx = this.getCtx();
        if (!this.noiseBuffer) this.initNoise();

        const src = ctx.createBufferSource();
        src.buffer = this.noiseBuffer; 
        
        src.playbackRate.value = 0.8 + Math.random() * 0.4;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = filterFreq + (Math.random() - 0.5) * 200;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        src.start();
        src.stop(ctx.currentTime + duration);
        
        src.onended = () => {
            src.disconnect();
            filter.disconnect();
            gain.disconnect();
        };
    },

    playTone: function(freq, type, duration, vol = 0.1, pitchShift = true, slideTo = null) {
        if (!this.settings.master) return;
        
        const ctx = this.getCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = type;
        
        let finalFreq = freq;
        if (pitchShift) {
            finalFreq = freq * (0.95 + Math.random() * 0.1); 
        }
        
        osc.frequency.setValueAtTime(finalFreq, ctx.currentTime);
        if (slideTo) {
            osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + duration);
        }

        gain.gain.setValueAtTime(vol, ctx.currentTime);
        // Add a tiny attack envelope to prevent audio popping clicks
        gain.gain.linearRampToValueAtTime(vol * 1.2, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
        
        osc.onended = () => {
            osc.disconnect();
            gain.disconnect();
        };
    },

    // EXPANDABILITY WIN: Generic Melody Sequencer
    // Allows easy creation of custom jingles for quests, puzzles, or rare loot!
    playMelody: function(notes, type = 'sine', speed = 0.15, vol = 0.1) {
        if (!this.settings.master || !this.settings.ui) return;
        const ctx = this.getCtx();
        const now = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = type;
        
        let totalDuration = notes.length * speed;
        
        // Build the sequence
        notes.forEach((freq, index) => {
            const noteTime = now + (index * speed);
            if (freq > 0) {
                osc.frequency.setValueAtTime(freq, noteTime);
                gain.gain.setValueAtTime(0, noteTime);
                gain.gain.linearRampToValueAtTime(vol, noteTime + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.01, noteTime + speed - 0.02);
            } else {
                // Rest note
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

    playStep: function() { 
        if (!this.settings.steps) return;
        // Throttle to max 1 step sound per 80ms to prevent crunching during multi-entity movement
        if (!this._throttle('step', 80)) return; 
        this.playNoise(0.08, 0.05, 600); 
    },
    
    // GAMEPLAY WIN: Dynamic Attack Types
    playAttack: function(type = 'normal') { 
        if (!this.settings.master || !this.settings.combat) return;
        if (!this._throttle('attack', 50)) return; // Prevent overlapping sweep blowouts
        
        const ctx = this.getCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
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
        
        osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration);
        
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
        
        osc.onended = () => { osc.disconnect(); gain.disconnect(); };
    },

    playBow: function() {
        if (this.settings.combat) {
            // Pluck sound
            this.playTone(400, 'triangle', 0.1, 0.1, true, 200);
            // Arrow travel whoosh
            setTimeout(() => this.playNoise(0.15, 0.03, 2000), 20);
        }
    },
    
    playHit: function() { 
        if (!this.settings.combat) return;
        if (!this._throttle('hit', 80)) return;
        this.playTone(80, 'square', 0.15, 0.1, true); 
    },

    playCrit: function() {
        if (!this.settings.combat) return;
        // High-pitched piercing ring for critical hits
        this.playTone(1200, 'sine', 0.3, 0.15, false, 800);
        this.playTone(80, 'square', 0.2, 0.1, true); // Accompanied by base hit impact
    },
    
    playMagic: function() { 
        if (!this.settings.magic) return;
        if (!this._throttle('magic', 100)) return;
        this.playTone(600, 'sine', 0.3, 0.05, true, 800); 
    },

    playHeal: function() {
        if (!this.settings.magic) return;
        // Shimmering ascending sound
        this.playTone(300, 'sine', 0.4, 0.05, false, 600);
        setTimeout(() => this.playTone(400, 'sine', 0.3, 0.05, false, 800), 100);
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
        if (this.settings.ui) this.playNoise(0.02, 0.05, 3000);
    },

    playHover: function() {
        if (this.settings.ui) {
            if (!this._throttle('hover', 50)) return;
            this.playTone(800, 'sine', 0.02, 0.02, false);
        }
    },
    
    // Upgraded Level Up using the new Melody Sequencer
    playLevelUp: function() {
        // C Major Arpeggio: C4, E4, G4, C5
        this.playMelody([261.63, 329.63, 392.00, 523.25], 'sine', 0.15, 0.1);
    }
};
