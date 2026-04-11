class SoundManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.enabled = false; // Start muted until user interaction
        this.initialized = false;
        
        // --- NEW: HTML5 Audio Object for Ambient Track ---
        this.bgMusic = null;
    }

    init() {
        if (this.initialized) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3; // Default master volume (30%)
        this.masterGain.connect(this.ctx.destination);
        
        this.initialized = true;
        console.log("Audio System Initialized");
    }

    initBackgroundMusic() {
        if (this.bgMusic) return; // Prevent creating multiple tracks

        // Create the audio object pointing to your new AI track
        this.bgMusic = new Audio('assets/Orbiting_A_Sleeping_Star.mp3');
        this.bgMusic.loop = true; 
        this.bgMusic.volume = 0.3; // 30% volume sits nicely behind SFX

        // Only auto-play if the player's settings allow audio
        if (this.enabled) {
            this.bgMusic.play().catch(err => {
                console.warn("Browser blocked autoplay. Music will start on first click.", err);
            });
        }
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
            
            // Dynamically play the background music based on the toggle
            if (this.bgMusic) {
                // Browsers require a user interaction first, the catch handles the error gracefully
                this.bgMusic.play().catch(e => console.warn("Awaiting user interaction to play audio:", e));
            } else {
                // If they unmute and it hasn't been created yet, initialize it!
                this.initBackgroundMusic();
            }
            console.log("Audio Enabled - Music Playing");
        } else {
            this.ctx.suspend();
            if (this.bgMusic) {
                this.bgMusic.pause();
            }
            console.log("Audio Suspended");
        }
        
        return this.enabled;
    }

    toggleMute() {
        // A simple wrapper that flips the current state and saves it
        return this.setMuteState(!this.enabled);
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
