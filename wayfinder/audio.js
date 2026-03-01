class SoundManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.enabled = false; // Start muted until user interaction (browser policy)
        this.initialized = false;
        
        // Music placeholders for your audio guy!
        this.currentMusicTrack = null; 
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

    // --- SYNTH GENERATORS (Temporary until your buddy adds real files!) ---

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

    // ==========================================
    // --- UI & MENU SFX PRESETS ---
    // ==========================================

    playUIHover() { this.playTone(800, 'sine', 0.05, 0.1); }
    playUIClick() { this.playTone(1200, 'sine', 0.1, 0.2, 600); }
    
    // The missing sound from the image loader! A soft tech sweep.
    playUIRefresh() { this.playTone(400, 'triangle', 0.15, 0.1, 800); }
    
    // Low pitched rejection buzz
    playError() { this.playTone(150, 'sawtooth', 0.3, 0.3, 100); }
    
    // For typing text to the screen (like the Xerxes terminal)
    playTextBeep() { this.playTone(1500, 'square', 0.02, 0.05); }

    // ==========================================
    // --- ECONOMY & REWARD SFX ---
    // ==========================================

    // Quick double-chime for generic positive things
    playGain() {
        this.playTone(1000, 'sine', 0.1, 0.2);
        setTimeout(() => this.playTone(1500, 'sine', 0.2, 0.2), 100);
    }
    
    // The missing sound from the Proving Grounds (Coin jingle / Register ring)
    playBuy() { 
        this.playTone(1200, 'sine', 0.1, 0.2);
        setTimeout(() => this.playTone(1600, 'sine', 0.3, 0.2), 50);
    }
    
    // Deeper clunk for selling goods or paying fines
    playSell() { this.playTone(800, 'triangle', 0.1, 0.2, 600); }

    // Magical chime for leveling up or solving Spire puzzles
    playAbilityActivate() {
        this.playTone(600, 'sine', 0.4, 0.3);
        setTimeout(() => this.playTone(900, 'sine', 0.4, 0.3), 100);
        setTimeout(() => this.playTone(1200, 'sine', 0.4, 0.3), 200);
    }

    // ==========================================
    // --- COMBAT & EXPLORATION SFX ---
    // ==========================================
    
    playLaser() { this.playTone(800 + Math.random()*200, 'sawtooth', 0.2, 0.3, 100); }
    
    playExplosion() {
        this.playNoise(0.5, 0.5);
        this.playTone(100, 'square', 0.4, 0.4, 10); 
    }
    
    // When enemy shields take a hit (glassy zap)
    playShieldHit() { this.playTone(1500, 'sawtooth', 0.1, 0.3, 500); }
    
    // When actual hull armor takes a hit (dull thud)
    playHullHit() { this.playNoise(0.2, 0.4); this.playTone(200, 'square', 0.2, 0.4, 50); }

    // Sensor ping for scanning the environment
    playScan() { this.playTone(2000, 'sine', 0.5, 0.2, 1800); }

    playMining() { this.playTone(1200 + Math.random()*400, 'sine', 0.3, 0.2); }

    playWarp() { this.playTone(200, 'square', 1.5, 0.2, 2000); }
    
    playWarning() { 
        // Klaxon alarm for low hull / hostiles approaching
        this.playTone(400, 'sawtooth', 0.4, 0.3);
        setTimeout(() => this.playTone(400, 'sawtooth', 0.4, 0.3), 500);
    }

    // ==========================================
    // --- MUSIC HOOKS (For later implementation) ---
    // ==========================================
    
    /* Hey Audio Dev! When you are ready, replace these with HTML5 <audio> 
       tag manipulation or use a library like Howler.js! 
    */
    
    playMusicTrack(trackName) {
        if (!this.enabled) return;
        console.log(`[AUDIO HOOK] Fading in music track: ${trackName}`);
        // e.g., 'ambient_space', 'combat_loop', 'cantina_theme'
    }
    
    stopMusic() {
        console.log(`[AUDIO HOOK] Fading out all music.`);
    }
}

const soundManager = new SoundManager();
