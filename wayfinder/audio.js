class SoundManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.enabled = false; // Start muted until user interaction (browser policy)
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3; // Default volume (30%)
        this.masterGain.connect(this.ctx.destination);
        this.enabled = true;
        this.initialized = true;
        console.log("Audio System Initialized");
    }

    toggleMute() {
        if (!this.initialized) this.init();
        this.enabled = !this.enabled;
        if (this.enabled) this.ctx.resume();
        else this.ctx.suspend();
        return this.enabled;
    }

    // --- SOUND GENERATORS ---

    playTone(freq, type, duration, vol = 1, slideTo = null) {
        if (!this.enabled || !this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type; // 'sine', 'square', 'sawtooth', 'triangle'
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        if (slideTo) {
            osc.frequency.exponentialRampToValueAtTime(slideTo, this.ctx.currentTime + duration);
        }

        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
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
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        noise.connect(gain);
        gain.connect(this.masterGain);
        noise.start();
    }

    // --- GAME SFX PRESETS ---

    playUIHover() { this.playTone(800, 'sine', 0.05, 0.1); }
    playUIClick() { this.playTone(1200, 'sine', 0.1, 0.2, 600); }

    playGain() {
        // A bright, quick double-chime
        this.playTone(1000, 'sine', 0.1, 0.2);
        setTimeout(() => this.playTone(1500, 'sine', 0.2, 0.2), 100);
    }
    
    playError() { this.playTone(150, 'sawtooth', 0.3, 0.3, 100); }
    
    playLaser() { 
        // Pew pew!
        this.playTone(800 + Math.random()*200, 'sawtooth', 0.2, 0.3, 100); 
    }

    playExplosion() {
        // Boom!
        this.playNoise(0.5, 0.5);
        this.playTone(100, 'square', 0.4, 0.4, 10); // Sub-bass rumble
    }

    playMining() {
        // High pitched metallic 'ting'
        this.playTone(1200 + Math.random()*400, 'sine', 0.3, 0.2); 
    }

    playWarp() {
        // Power up slide
        this.playTone(200, 'square', 1.5, 0.2, 2000);
    }

    playAbilityActivate() {
        // Magical chime
        this.playTone(600, 'sine', 0.4, 0.3);
        setTimeout(() => this.playTone(900, 'sine', 0.4, 0.3), 100);
        setTimeout(() => this.playTone(1200, 'sine', 0.4, 0.3), 200);
    }
}

const soundManager = new SoundManager();
