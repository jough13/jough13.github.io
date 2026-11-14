// --- START OF FILE audio.js ---

class SoundManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.sfxGain = null;
        this.ambientGain = null;
        this.compressor = null;
        this.noiseBuffer = null;

        this.enabled = false; // Start muted until user preference is applied
        this.initialized = false;

        // Volume settings (persisted in localStorage)
        this.masterVolume = 0.30;
        this.musicVolume = 0.30;

        // HTML5 Audio Object for Ambient Track
        this.bgMusic = null;
        this.bgMusicFailed = false;

        // Procedural Ambient Pad Nodes (Fallback if MP3 is missing)
        this.ambientNodes = null;

        // Rate-limiting timestamps to prevent audio spam on rapid ticks
        this._lastSoundTime = {};
    }

    init() {
        if (this.initialized) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;

            this.ctx = new AudioContext();

            // Load saved volume levels if present
            try {
                const savedMaster = parseFloat(localStorage.getItem('wayfinder_master_vol'));
                const savedMusic = parseFloat(localStorage.getItem('wayfinder_music_vol'));
                if (!isNaN(savedMaster)) this.masterVolume = Math.max(0, Math.min(1, savedMaster));
                if (!isNaN(savedMusic)) this.musicVolume = Math.max(0, Math.min(1, savedMusic));
            } catch (e) {}

            // Dynamics compressor prevents harsh clipping when multiple SFX overlap
            this.compressor = this.ctx.createDynamicsCompressor();
            this.compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
            this.compressor.knee.setValueAtTime(12, this.ctx.currentTime);
            this.compressor.ratio.setValueAtTime(6, this.ctx.currentTime);
            this.compressor.attack.setValueAtTime(0.005, this.ctx.currentTime);
            this.compressor.release.setValueAtTime(0.15, this.ctx.currentTime);

            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = this.masterVolume;

            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.value = 1.0;

            this.ambientGain = this.ctx.createGain();
            this.ambientGain.gain.value = 1.0;

            this.sfxGain.connect(this.masterGain);
            this.ambientGain.connect(this.masterGain);
            this.masterGain.connect(this.compressor);
            this.compressor.connect(this.ctx.destination);

            // Pre-compute a 2-second white/pink noise buffer once to avoid main-thread GC lag during combat
            const bufferSize = this.ctx.sampleRate * 2;
            this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = this.noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            this.initialized = true;
            console.log("Audio System Initialized");
        } catch (err) {
            console.warn("Web Audio API could not be initialized:", err);
        }
    }

    // Safely ensures the audio context is running and background music is active after a user gesture
    _ensureContextRunning() {
        if (!this.enabled) return;
        if (!this.initialized) this.init();

        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }

        // If browser blocked initial autoplay on boot, start the music now that the user interacted
        if (this.bgMusic && !this.bgMusicFailed && this.bgMusic.paused && !document.hidden) {
            this.bgMusic.play().catch(() => {});
        } else if (this.bgMusicFailed && !this.ambientNodes && !document.hidden) {
            this.startProceduralDrone();
        }
    }

    setMasterVolume(val) {
        this.masterVolume = Math.max(0, Math.min(1, Number(val) || 0));
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.05);
        }
        try {
            localStorage.setItem('wayfinder_master_vol', String(this.masterVolume));
        } catch (e) {}
    }

    setMusicVolume(val) {
        this.musicVolume = Math.max(0, Math.min(1, Number(val) || 0));
        if (this.bgMusic) {
            this.bgMusic.volume = this.musicVolume;
        }
        if (this.ambientGain && this.ctx) {
            this.ambientGain.gain.setTargetAtTime(this.musicVolume / 0.30, this.ctx.currentTime, 0.1);
        }
        try {
            localStorage.setItem('wayfinder_music_vol', String(this.musicVolume));
        } catch (e) {}
    }

    // Subtly ducks ambient music during Silent Running or heavy combat
    updateAdaptiveMix() {
        if (!this.enabled) return;
        const isStealthed = typeof isSilentRunning !== 'undefined' && isSilentRunning;
        const inCombat = typeof currentGameState !== 'undefined' && currentGameState === 'combat';

        const targetMusicVol = isStealthed
            ? this.musicVolume * 0.45
            : (inCombat ? this.musicVolume * 0.75 : this.musicVolume);

        if (this.bgMusic && !this.bgMusicFailed) {
            this.bgMusic.volume = Math.max(0, Math.min(1, targetMusicVol));
        }

        if (this.ambientNodes && this.ambientNodes.filter && this.ctx) {
            const targetCutoff = isStealthed ? 110 : (inCombat ? 280 : 200);
            this.ambientNodes.filter.frequency.setTargetAtTime(targetCutoff, this.ctx.currentTime, 0.25);
        }
    }

    initBackgroundMusic() {
        if (this.bgMusic) {
            if (this.enabled && !this.bgMusicFailed && this.bgMusic.paused) {
                this.bgMusic.play().catch(() => {});
            }
            return;
        }

        try {
            this.bgMusic = new Audio('assets/Orbiting_A_Sleeping_Star.mp3');
            this.bgMusic.loop = true;
            this.bgMusic.volume = this.musicVolume;

            // If the MP3 asset is missing, fall back cleanly to the procedural Web Audio space drone
            this.bgMusic.addEventListener('error', (e) => {
                if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
                this.bgMusicFailed = true;
                if (this.enabled) this.startProceduralDrone();
            });

            if (this.enabled) {
                this.bgMusic.play().catch(() => {
                    // Autoplay blocked until first user gesture; _ensureContextRunning() will start it seamlessly
                });
            }
        } catch (err) {
            this.bgMusicFailed = true;
            if (this.enabled) this.startProceduralDrone();
        }
    }

    startProceduralDrone() {
        if (!this.enabled) return;
        if (!this.initialized) this.init();
        if (!this.ctx || this.ambientNodes) return;

        if (this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
        
        try {
            const now = this.ctx.currentTime;
            const osc1 = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const subOsc = this.ctx.createOscillator();
            const filter = this.ctx.createBiquadFilter();
            const padGain = this.ctx.createGain();

            // LFO (Low Frequency Oscillator) to make the space drone "breathe"
            const lfo = this.ctx.createOscillator();
            const lfoGain = this.ctx.createGain();

            osc1.type = 'sawtooth';
            osc2.type = 'triangle';
            subOsc.type = 'sine';

            osc1.frequency.setValueAtTime(55.0, now);   // Deep A1 drone
            osc2.frequency.setValueAtTime(82.41, now);  // E2 fifth harmony
            osc2.detune.setValueAtTime(6, now);         // Warm chorus detune
            subOsc.frequency.setValueAtTime(27.5, now); // Sub-bass A0 foundation

            // Filter setup
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(200, now);
            filter.Q.setValueAtTime(1.5, now);

            // LFO Setup: Cycles every 8 seconds (0.125 Hz)
            lfo.type = 'sine';
            lfo.frequency.setValueAtTime(0.125, now);
            lfoGain.gain.setValueAtTime(130, now); // Sweeps filter by +/- 130Hz

            // Smooth fade-in to avoid any initial pop
            padGain.gain.setValueAtTime(0.001, now);
            padGain.gain.exponentialRampToValueAtTime(0.06, now + 1.5);

            // Connections
            lfo.connect(lfoGain);
            lfoGain.connect(filter.frequency);

            osc1.connect(filter);
            osc2.connect(filter);
            subOsc.connect(filter);
            filter.connect(padGain);
            padGain.connect(this.ambientGain || this.masterGain);

            lfo.start(now);
            osc1.start(now);
            osc2.start(now);
            subOsc.start(now);
            
            this.ambientNodes = { osc1, osc2, subOsc, filter, padGain, lfo, lfoGain };
        } catch (e) {}
    }

    stopProceduralDrone() {
        if (!this.ambientNodes) return;
        try {
            this.ambientNodes.osc1.stop();
            this.ambientNodes.osc2.stop();
            if (this.ambientNodes.subOsc) this.ambientNodes.subOsc.stop();
            this.ambientNodes.lfo.stop();
            this.ambientNodes.padGain.disconnect();
            
            // Clean up to prevent memory leaks
            this.ambientNodes.osc1.disconnect();
            this.ambientNodes.osc2.disconnect();
            if (this.ambientNodes.subOsc) this.ambientNodes.subOsc.disconnect();
            this.ambientNodes.filter.disconnect();
            this.ambientNodes.lfo.disconnect();
            this.ambientNodes.lfoGain.disconnect();
        } catch (e) {}
        this.ambientNodes = null;
    }

    setMuteState(wantsAudio) {
        if (!this.initialized) this.init();

        this.enabled = Boolean(wantsAudio);

        try {
            localStorage.setItem('wayfinder_audio_pref', this.enabled ? 'true' : 'false');
        } catch (e) {
            console.warn("Could not save audio preference.");
        }

        if (this.enabled) {
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume().catch(() => {});
            }

            if (this.bgMusic && !this.bgMusicFailed) {
                this.bgMusic.play().catch(() => {});
            } else if (this.bgMusicFailed) {
                this.startProceduralDrone();
            } else {
                this.initBackgroundMusic();
            }
        } else {
            if (this.ctx && this.ctx.state === 'running') {
                this.ctx.suspend().catch(() => {});
            }
            if (this.bgMusic) {
                this.bgMusic.pause();
            }
            this.stopProceduralDrone();
        }

        // Keep System Menu sound button label in sync
        const soundBtn = document.getElementById('soundButton');
        if (soundBtn) {
            soundBtn.textContent = this.enabled ? "Mute Audio" : "Enable Audio";
        }

        return this.enabled;
    }

    toggleMute() {
        return this.setMuteState(!this.enabled);
    }

    // Internal helper to prevent overlapping identical sounds within `minGapMs`
    _canPlay(key, minGapMs = 30) {
        const now = performance.now();
        if (this._lastSoundTime[key] && (now - this._lastSoundTime[key]) < minGapMs) {
            return false;
        }
        this._lastSoundTime[key] = now;
        return true;
    }

    // ==========================================
    // --- SYNTH GENERATORS (SFX) ---
    // ==========================================

    playTone(freq, type, duration, vol = 1, slideTo = null, delayMs = 0) {
        if (!this.enabled) return;
        if (!this.initialized) this.init();
        if (!this.ctx) return;
        this._ensureContextRunning();

        try {
            // Safeguard: If passed seconds instead of milliseconds (e.g., 0.1, 0.5), auto-convert
            let durMs = Number(duration) || 100;
            if (durMs > 0 && durMs < 10) {
                durMs *= 1000;
            }

            const durSec = Math.max(0.015, durMs / 1000);
            const delaySec = Math.max(0, (Number(delayMs) || 0) / 1000);
            const safeFreq = Math.max(20, Math.min(16000, Number(freq) || 440));
            const safeVol = Math.max(0.0001, Math.min(1.0, (Number(vol) || 0.2) * 0.5));
            const startTime = this.ctx.currentTime + delaySec;
            const stopTime = startTime + durSec;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = type || 'sine';
            osc.frequency.setValueAtTime(safeFreq, startTime);

            if (slideTo !== null && slideTo !== undefined) {
                const safeSlide = Math.max(15, Math.min(16000, Number(slideTo) || 100));
                osc.frequency.exponentialRampToValueAtTime(safeSlide, stopTime);
            }

            // Micro-attack envelope (3ms) eliminates speaker clicks at note start
            gain.gain.setValueAtTime(0.0001, startTime);
            gain.gain.linearRampToValueAtTime(safeVol, startTime + Math.min(0.004, durSec * 0.2));
            gain.gain.exponentialRampToValueAtTime(0.0001, stopTime);

            osc.connect(gain);
            gain.connect(this.sfxGain || this.masterGain);

            osc.onended = () => {
                try {
                    osc.disconnect();
                    gain.disconnect();
                } catch (e) {}
            };

            osc.start(startTime);
            osc.stop(stopTime + 0.005);
        } catch (err) {
            // Silently ignore Web Audio timing edge cases
        }
    }

    playNoise(duration, vol = 1, cutoffFreq = 800, delayMs = 0, filterType = 'lowpass') {
        if (!this.enabled) return;
        if (!this.initialized) this.init();
        if (!this.ctx || !this.noiseBuffer) return;
        this._ensureContextRunning();

        try {
            const durSec = Math.min(2.0, Math.max(0.02, Number(duration) || 0.2));
            const delaySec = Math.max(0, (Number(delayMs) || 0) / 1000);
            const safeVol = Math.max(0.0001, Math.min(1.0, Number(vol) || 0.5));
            const startTime = this.ctx.currentTime + delaySec;
            const stopTime = startTime + durSec;

            const noise = this.ctx.createBufferSource();
            noise.buffer = this.noiseBuffer;

            // Randomize start offset inside the 2s cached buffer so every explosion/thruster sounds organic
            const maxOffset = Math.max(0, this.noiseBuffer.duration - durSec - 0.01);
            const randomOffset = Math.random() * maxOffset;

            const filter = this.ctx.createBiquadFilter();
            filter.type = filterType || 'lowpass';
            filter.frequency.setValueAtTime(Math.max(40, cutoffFreq), startTime);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(safeVol, startTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, stopTime);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.sfxGain || this.masterGain);

            noise.onended = () => {
                try {
                    noise.disconnect();
                    filter.disconnect();
                    gain.disconnect();
                } catch (e) {}
            };

            noise.start(startTime, randomOffset, durSec);
            noise.stop(stopTime + 0.005);
        } catch (err) {}
    }

    // ==========================================
    // --- PRE-BUILT SOUND EFFECTS ---
    // ==========================================

    playUIHover() {
        if (!this._canPlay('hover', 40)) return;
        this.playTone(620, 'sine', 65, 0.07, 660);
    }

    playUIClick() {
        if (!this._canPlay('click', 25)) return;
        this.playTone(820, 'sine', 80, 0.16, 920);
    }

    playUIRefresh() {
        if (!this._canPlay('refresh', 100)) return;
        this.playTone(520, 'sine', 70, 0.08, 780);
    }

    playTyping() {
        if (!this._canPlay('type', 22)) return;
        this.playTone(900 + Math.random() * 320, 'triangle', 32, 0.05);
    }

    playError() {
        if (!this._canPlay('error', 80)) return;
        this.playTone(160, 'sawtooth', 140, 0.28, 115, 0);
        this.playTone(115, 'sawtooth', 220, 0.28, 85, 120);
    }

    playAlarm() {
        // High priority repeating klaxon, rate-limited to once every 2.5 seconds
        if (!this._canPlay('alarm', 2500)) return;
        this.playTone(620, 'square', 360, 0.10, 500, 0);
        this.playTone(820, 'square', 360, 0.10, 700, 420);
    }

    playBuy() {
        if (!this._canPlay('buy', 50)) return;
        this.playTone(440, 'sine', 100, 0.20, 660, 0);
        this.playTone(880, 'sine', 200, 0.20, 920, 95);
    }

    playMissionComplete() {
        if (!this._canPlay('missionComplete', 800)) return;
        this.playTone(440, 'triangle', 150, 0.22, null, 0);      // A4
        this.playTone(554.37, 'triangle', 150, 0.22, null, 140); // C#5
        this.playTone(659.25, 'triangle', 150, 0.22, null, 280); // E5
        this.playTone(880, 'triangle', 420, 0.26, 890, 420);     // A5
    }

    playGain() {
        if (!this._canPlay('gain', 60)) return;
        this.playTone(330, 'sine', 140, 0.14, 440, 0);
        this.playTone(554.37, 'sine', 140, 0.14, 659.25, 95);
        this.playTone(740, 'sine', 280, 0.16, 880, 190);
    }

    playLevelUp() {
        if (!this._canPlay('levelUp', 500)) return;
        const notes = [440, 554.37, 659.25, 880, 1108.73]; // A Major 9th arpeggio
        notes.forEach((freq, idx) => {
            this.playTone(freq, 'triangle', 240, 0.22, freq * 1.015, idx * 85);
        });
    }

    playLaser() {
        if (!this._canPlay('laser', 45)) return;
        // Dual-layer sci-fi pulse laser
        this.playTone(880, 'sawtooth', 190, 0.20, 180, 0);
        this.playTone(1320, 'square', 140, 0.08, 240, 0);
    }

    playCritical() {
        if (!this._canPlay('crit', 60)) return;
        this.playTone(1350, 'square', 120, 0.25, 320, 0);
        this.playTone(920, 'sawtooth', 240, 0.25, 140, 75);
        this.playNoise(0.18, 0.25, 1400, 0);
    }

    playExplosion() {
        if (!this._canPlay('explosion', 70)) return;
        this.playNoise(0.55, 0.50, 820, 0);
        this.playTone(110, 'square', 420, 0.40, 18, 0);
        this.playTone(65, 'sine', 500, 0.45, 15, 20);
    }

    playShieldHit() {
        if (!this._canPlay('shieldHit', 60)) return;
        this.playTone(1500, 'sawtooth', 110, 0.26, 480, 0);
        this.playTone(950, 'sine', 160, 0.18, 1350, 35);
    }

    playHullHit() {
        if (!this._canPlay('hullHit', 60)) return;
        this.playNoise(0.22, 0.42, 650, 0);
        this.playTone(210, 'square', 210, 0.38, 45, 0);
    }

    playRepair() {
        if (!this._canPlay('repair', 120)) return;
        this.playTone(350, 'sine', 120, 0.16, 520, 0);
        this.playTone(520, 'sine', 180, 0.16, 720, 105);
    }

    playThruster() {
        if (!this._canPlay('thruster', 90)) return;
        const isStealthed = typeof isSilentRunning !== 'undefined' && isSilentRunning;
        // Quieter, lower-frequency thruster wash when running in Silent Running mode
        this.playNoise(0.08, isStealthed ? 0.035 : 0.075, isStealthed ? 180 : 320, 0);
    }

    playScan() {
        if (!this._canPlay('scan', 120)) return;
        this.playTone(2000, 'sine', 450, 0.18, 1750, 0);
        this.playTone(1000, 'triangle', 450, 0.08, 1400, 50);
    }

    playHail() {
        if (!this._canPlay('hail', 150)) return;
        this.playTone(680, 'sine', 90, 0.15, null, 0);
        this.playTone(880, 'sine', 150, 0.15, null, 105);
    }

    playMining() {
        if (!this._canPlay('mining', 80)) return;
        const baseFreq = 1150 + Math.random() * 400;
        this.playTone(baseFreq, 'sine', 280, 0.20, baseFreq * 0.85, 0);
        this.playNoise(0.12, 0.12, 1200, 40);
    }

    playWarp() {
        if (!this._canPlay('warp', 250)) return;
        this.playTone(180, 'sawtooth', 1400, 0.20, 2200, 0);
        this.playTone(90, 'sine', 1400, 0.25, 880, 0);
        this.playNoise(0.6, 0.18, 900, 150);
    }

    playAbilityActivate() {
        if (!this._canPlay('ability', 100)) return;
        this.playTone(580, 'sine', 380, 0.20, 1220, 0);
        this.playTone(870, 'triangle', 320, 0.12, 1640, 60);
    }

    playWarning() {
        if (!this._canPlay('warning', 400)) return;
        this.playTone(420, 'sawtooth', 360, 0.28, 390, 0);
        this.playTone(420, 'sawtooth', 360, 0.28, 390, 440);
    }
}

// Ensure global instantiation stays intact
const soundManager = new SoundManager();
window.soundManager = soundManager;

// ==========================================
// --- SELF-CONTAINED AUDIO & BOOT HOOKS ---
// ==========================================

(function initAudioHooks() {
    
    // 1. Hook GameBus Events for Automatic Audio Feedback
    if (typeof GameBus !== 'undefined') {
        GameBus.on('HULL_DAMAGED', (data) => {
            if (data && data.amount > 0) {
                soundManager.playHullHit();
            }
        });

        GameBus.on('HULL_REPAIRED', (amount) => {
            if (amount > 0) {
                soundManager.playRepair();
            }
        });

        GameBus.on('TICK_PROCESSED', (tick) => {
            soundManager.updateAdaptiveMix();
            if (tick && tick.isMovement && !tick.interrupt) {
                soundManager.playThruster();
            }
        });
        
        // Dynamic Low Vitals Alarm (Only during active flight or combat, never on Title/Game Over/Station menus)
        GameBus.on('UI_REFRESH_REQUESTED', () => {
            soundManager.updateAdaptiveMix();

            if (typeof currentGameState !== 'undefined' &&
                currentGameState !== 'galactic_map' &&
                currentGameState !== 'combat') {
                return;
            }

            const stationModal = document.getElementById('stationOverlay');
            if (stationModal && stationModal.style.display === 'flex') return;

            if (typeof playerHull !== 'undefined' && typeof MAX_PLAYER_HULL !== 'undefined') {
                if (playerHull > 0 && playerHull < (MAX_PLAYER_HULL * 0.25)) {
                    soundManager.playAlarm();
                }
            }
        });
    }

    // 2. Pause/Resume Audio Cleanly on Browser Tab Switch
    document.addEventListener('visibilitychange', () => {
        if (!soundManager.enabled) return;
        if (document.hidden) {
            if (soundManager.ctx && soundManager.ctx.state === 'running') {
                soundManager.ctx.suspend().catch(() => {});
            }
            if (soundManager.bgMusic) soundManager.bgMusic.pause();
        } else {
            if (soundManager.ctx && soundManager.ctx.state === 'suspended') {
                soundManager.ctx.resume().catch(() => {});
            }
            if (soundManager.bgMusic && !soundManager.bgMusicFailed) {
                soundManager.bgMusic.play().catch(() => {});
            }
        }
    });

    // 3. One-Time User Gesture Autoplay Unlocker
    // Ensures background music and Web Audio resume on the very first click, tap, or keypress
    const unlockAudioOnGesture = () => {
        if (soundManager.enabled) {
            soundManager._ensureContextRunning();
        }
    };
    ['pointerdown', 'keydown', 'touchstart'].forEach(evtName => {
        document.addEventListener(evtName, unlockAudioOnGesture, { passive: true });
    });

    // 4. Sync Mute Button Text, Set Initial State, & Add De-Bounced Hover/Typing SFX on DOM Load
    window.addEventListener('DOMContentLoaded', () => {
        const savedPref = localStorage.getItem('wayfinder_audio_pref');
        const wantsAudio = savedPref === null ? true : (savedPref === 'true');
        
        // Sets the internal boolean and updates the button label automatically
        soundManager.setMuteState(wantsAudio);

        // Track last hovered interactive element so moving across child spans doesn't re-trigger hover SFX
        let lastHoveredTarget = null;
        document.addEventListener('mouseover', (e) => {
            if (!soundManager.enabled || !e.target || typeof e.target.closest !== 'function') return;
            const target = e.target.closest('button, .station-action-btn, .trade-item-row, .perk-card, .codex-cat-btn, .codex-entry-btn, .save-card-content');
            if (!target) {
                lastHoveredTarget = null;
                return;
            }
            if (target !== lastHoveredTarget && !target.disabled) {
                lastHoveredTarget = target;
                soundManager.playUIHover();
            }
        });

        // Subtle terminal keystroke sound when typing into Spire / Vault / Seed inputs
        document.addEventListener('keydown', (e) => {
            if (!soundManager.enabled) return;
            if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
                if (e.key.length === 1 || e.key === 'Backspace') {
                    soundManager.playTyping();
                }
            }
        });
    });
})();

// --- END OF FILE audio.js ---
