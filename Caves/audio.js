// --- ADVANCED AUDIO SYSTEM (OPTIMIZED) ---
const AudioSystem = {
    ctx: new (window.AudioContext || window.webkitAudioContext)(),
    noiseBuffer: null, // Cache the buffer here

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

    // Initialize the buffer once
    initNoise: function() {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 2.0; 
        this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
    },

    playNoise: function(duration, vol = 0.1, filterFreq = 1000) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        if (!this.settings.master) return;

        // Lazy load the buffer if it doesn't exist
        if (!this.noiseBuffer) this.initNoise();

        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer; // Reuse existing buffer

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = filterFreq;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        src.start();
        src.stop(this.ctx.currentTime + duration);
    },

    playTone: (freq, type, duration, vol = 0.1) => {
        if (AudioSystem.ctx.state === 'suspended') AudioSystem.ctx.resume();
        if (!AudioSystem.settings.master) return;

        const osc = AudioSystem.ctx.createOscillator();
        const gain = AudioSystem.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, AudioSystem.ctx.currentTime);

        gain.gain.setValueAtTime(vol, AudioSystem.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, AudioSystem.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(AudioSystem.ctx.destination);
        osc.start();
        osc.stop(AudioSystem.ctx.currentTime + duration);
    },

    playStep: () => { if (AudioSystem.settings.steps) AudioSystem.playNoise(0.08, 0.05, 600); },
    playAttack: () => { 
        if (!AudioSystem.settings.master || !AudioSystem.settings.combat) return;
        if (AudioSystem.ctx.state === 'suspended') AudioSystem.ctx.resume();
        const osc = AudioSystem.ctx.createOscillator();
        const gain = AudioSystem.ctx.createGain();
        osc.frequency.setValueAtTime(300, AudioSystem.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, AudioSystem.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, AudioSystem.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, AudioSystem.ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(AudioSystem.ctx.destination);
        osc.start();
        osc.stop(AudioSystem.ctx.currentTime + 0.1);
    },
    playHit: () => { if (AudioSystem.settings.combat) AudioSystem.playTone(80, 'square', 0.15, 0.1); },
    playMagic: () => { if (AudioSystem.settings.magic) AudioSystem.playTone(600, 'sine', 0.3, 0.05); },
    playCoin: () => { if (AudioSystem.settings.ui) AudioSystem.playTone(1200, 'sine', 0.1, 0.05); }
};
