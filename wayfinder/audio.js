class SoundManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.enabled = false; // Start muted until user interaction
        this.initialized = false;
        
        // Ambient Drone State
        this.ambientPlaying = false;
        this.ambientNodes = [];
        this.ambientFilter = null;
    }

    init() {
        if (this.initialized) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3; // Default master volume (30%)
        this.masterGain.connect(this.ctx.destination);
        
        // Removed this.enabled = true; and this.startAmbientDrone();
        // We leave those to toggleMute() so the logic doesn't fight itself!
        this.initialized = true;
        console.log("Audio System Initialized");
    }

    setMuteState(wantsAudio) {
        // Ensure the context exists
        if (!this.initialized) this.init();
        
        this.enabled = wantsAudio;
        
        // Save the player's preference globally
        try {
            localStorage.setItem('wayfinder_audio_pref', this.enabled ? 'true' : 'false');
        } catch(e) { console.warn("Could not save audio preference."); }
        
        if (this.enabled) {
            this.ctx.resume();
            if (!this.ambientPlaying) this.startAmbientDrone();
            console.log("Audio Enabled - Drone Active");
        } else {
            this.ctx.suspend();
            console.log("Audio Suspended");
        }
        
        return this.enabled;
    }

    toggleMute() {
        // A simple wrapper that flips the current state and saves it
        return this.setMuteState(!this.enabled);
    }

    // ==========================================
    // --- GENERATIVE AMBIENT DRONE ---
    // ==========================================

    startAmbientDrone() {
        if (!this.enabled || !this.ctx || this.ambientPlaying) return;
        this.ambientPlaying = true;

        // 1. Create a "Breathing" Lowpass Filter.
        this.ambientFilter = this.ctx.createBiquadFilter();
        this.ambientFilter.type = 'lowpass';
        this.ambientFilter.frequency.value = 400; // Lower baseline for a darker, richer tone
        this.ambientFilter.connect(this.masterGain);

        // --- Filter Modulation (The Cavern Effect) ---
        // This slowly sweeps the filter frequency up and down every 10 seconds.
        // It makes the drone sound like it is echoing through a massive, shifting space.
        const filterLfo = this.ctx.createOscillator();
        const filterLfoGain = this.ctx.createGain();
        filterLfo.type = 'sine';
        filterLfo.frequency.value = 0.1; // 10 second cycle
        filterLfoGain.gain.value = 300; // Sweeps the filter between 100Hz and 700Hz
        
        filterLfo.connect(filterLfoGain);
        filterLfoGain.connect(this.ambientFilter.frequency);
        filterLfo.start();

        // Save this new LFO so we can stop it later
        this.ambientNodes.push({ osc: filterLfo, gain: filterLfoGain, lfo: filterLfo, lfoGain: filterLfoGain });

        // 2. The Frequencies
        const baseFreq = 130.81; // C3 (Main Audible Root)
        const subFreq = 65.41;   // C2 (Felt, rather than heard)

        // 3. The Enriched Layers (Volumes kept very low)
        
        // Osc 1: The Sub-Bass (Pure Sine for warmth, very quiet)
        this._createDroneOsc(subFreq, 'sine', 0.10, 0.03); 

        // Osc 2: The Main Root (Triangle for texture)
        this._createDroneOsc(baseFreq, 'triangle', 0.12, 0.05); 
        
        // Osc 3: The Binaural Detune (Creates the hypnotic pulse)
        this._createDroneOsc(baseFreq + 1.5, 'sine', 0.12, 0.04); 
        
        // Osc 4: The "Lyrical" Perfect Fifth (G3 - Melancholic space vibe)
        this._createDroneOsc(baseFreq * 1.5, 'sine', 0.06, 0.02); 
        
        // Osc 5: The Shimmering Octave (C4 - Barely a whisper)
        this._createDroneOsc(baseFreq * 2, 'triangle', 0.03, 0.015);
    }

    _createDroneOsc(freq, type, maxVol, lfoSpeed) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        // Low Frequency Oscillator (LFO) to make the volume "breathe"
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.value = freq;

        lfo.type = 'sine';
        lfo.frequency.value = lfoSpeed;
        
        // Set the LFO to slowly modulate the volume of this specific oscillator
        gain.gain.value = maxVol / 2;
        lfoGain.gain.value = maxVol / 2;
        
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain); 

        osc.connect(gain);
        gain.connect(this.ambientFilter);

        osc.start();
        lfo.start();

        this.ambientNodes.push({ osc, gain, lfo, lfoGain });
    }

    stopAmbientDrone() {
        if (!this.ambientPlaying) return;
        this.ambientNodes.forEach(node => {
            // Fade out smoothly over 3 seconds so it doesn't just abruptly pop
            node.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 1);
            setTimeout(() => {
                try { node.osc.stop(); node.lfo.stop(); } catch(e){}
            }, 3000);
        });
        this.ambientNodes = [];
        this.ambientPlaying = false;
    }

    // ==========================================
    // --- SYNTH GENERATORS (SFX) ---
    // ==========================================

    playTone(freq, type, duration, vol = 1, slideTo = null) {
        if (!this.enabled || !this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type; 
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        if (slideTo) {
            osc.frequency.exponentialRampToValueAtTime(slideTo, this.ctx.currentTime + (duration / 1000));
        }

        gain.gain.setValueAtTime(vol * 0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + (duration / 1000));

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + (duration / 1000));
    }

    playNoise(duration, vol = 1) {
        if (!this.enabled || !this.ctx) return;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();
        
        // Heavy lowpass filter on the noise to make it sound like deep rumbles rather than static hiss
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;

        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start();
    }

    // --- PRE-BUILT SOUND EFFECTS ---
    playUIHover() { this.playTone(600, 'sine', 100, 0.1); }
    playUIClick() { this.playTone(800, 'sine', 100, 0.2); }
    playError() { this.playTone(150, 'sawtooth', 300, 0.3, 100); }
    playBuy() { 
        this.playTone(400, 'sine', 100, 0.2, 600); 
        setTimeout(() => this.playTone(800, 'sine', 200, 0.2), 100);
    }
    playGain() {
        this.playTone(300, 'sine', 150, 0.1, 400);
        setTimeout(() => this.playTone(500, 'sine', 150, 0.1, 600), 100);
        setTimeout(() => this.playTone(700, 'sine', 300, 0.1, 800), 200);
    }
    playLaser() { this.playTone(800, 'sawtooth', 200, 0.2, 200); }
    playExplosion() {
        this.playNoise(0.5, 0.5);
        this.playTone(100, 'square', 0.4, 0.4, 10); 
    }
    playShieldHit() { this.playTone(1500, 'sawtooth', 0.1, 0.3, 500); }
    playHullHit() { this.playNoise(0.2, 0.4); this.playTone(200, 'square', 0.2, 0.4, 50); }
    playScan() { this.playTone(2000, 'sine', 0.5, 0.2, 1800); }
    playMining() { this.playTone(1200 + Math.random()*400, 'sine', 0.3, 0.2); }
    playWarp() { this.playTone(200, 'square', 1.5, 0.2, 2000); }
    playAbilityActivate() { this.playTone(600, 'sine', 400, 0.2, 1200); }
    
    playWarning() { 
        this.playTone(400, 'sawtooth', 0.4, 0.3);
        setTimeout(() => this.playTone(400, 'sawtooth', 0.4, 0.3), 500);
    }
}

// Ensure global instantiation stays intact
const soundManager = new SoundManager();
