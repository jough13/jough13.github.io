// --- START OF FILE audio.js ---

class SoundManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.compressor = null;
        this.noiseBuffer = null;
        this.enabled = false; // Start muted until user interaction
        this.initialized = false;

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

            // Dynamics compressor prevents harsh clipping when multiple SFX overlap
            this.compressor = this.ctx.createDynamicsCompressor();
            this.compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
            this.compressor.knee.setValueAtTime(12, this.ctx.currentTime);
            this.compressor.ratio.setValueAtTime(6, this.ctx.currentTime);
            this.compressor.attack.setValueAtTime(0.005, this.ctx.currentTime);
            this.compressor.release.setValueAtTime(0.15, this.ctx.currentTime);

            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.3; // Default master volume (30%)

            this.masterGain.connect(this.compressor);
            this.compressor.connect(this.ctx.destination);

            // Pre-compute a 2-second white noise buffer once to avoid main-thread GC lag during combat
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

    initBackgroundMusic() {
        if (this.bgMusic) return; // Prevent creating multiple tracks

        try {
            this.bgMusic = new Audio('assets/Orbiting_A_Sleeping_Star.mp3');
            this.bgMusic.loop = true;
            this.bgMusic.volume = 0.3; // 30% volume sits nicely behind SFX

            // If the MP3 asset is missing, fall back to a procedural Web Audio space drone
            this.bgMusic.addEventListener('error', () => {
                this.bgMusicFailed = true;
                if (this.enabled) this.startProceduralDrone();
            });

            if (this.enabled) {
                this.bgMusic.play().catch(err => {
                    console.warn("Browser blocked autoplay. Music will start on first click.", err);
                });
            }
        } catch (err) {
            this.bgMusicFailed = true;
            if (this.enabled) this.startProceduralDrone();
        }
    }

    startProceduralDrone() {
        if (!this.enabled || !this.ctx || this.ambientNodes) return;
        try {
            const osc1 = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const filter = this.ctx.createBiquadFilter();
            const padGain = this.ctx.createGain();

            osc1.type = 'sawtooth';
            osc2.type = 'triangle';
            osc1.frequency.setValueAtTime(55.0, this.ctx.currentTime); // Deep A1 drone
            osc2.frequency.setValueAtTime(82.41, this.ctx.currentTime); // E2 fifth harmony
            osc2.detune.setValueAtTime(6, this.ctx.currentTime); // Warm chorus detune

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(180, this.ctx.currentTime);

            padGain.gain.setValueAtTime(0.06, this.ctx.currentTime);

            osc1.connect(filter);
            osc2.connect(filter);
            filter.connect(padGain);
            padGain.connect(this.masterGain);

            osc1.start();
            osc2.start();
            this.ambientNodes = { osc1, osc2, filter, padGain };
        } catch (e) {}
    }

    stopProceduralDrone() {
        if (!this.ambientNodes) return;
        try {
            this.ambientNodes.osc1.stop();
            this.ambientNodes.osc2.stop();
            this.ambientNodes.padGain.disconnect();
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
                this.bgMusic.play().catch(e => console.warn("Awaiting user interaction to play audio:", e));
            } else if (this.bgMusicFailed) {
                this.startProceduralDrone();
            } else {
                this.initBackgroundMusic();
            }
            console.log("Audio Enabled - Music Playing");
        } else {
            if (this.ctx && this.ctx.state === 'running') {
                this.ctx.suspend().catch(() => {});
            }
            if (this.bgMusic) {
                this.bgMusic.pause();
            }
            this.stopProceduralDrone();
            console.log("Audio Suspended");
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

    playTone(freq, type, duration, vol = 1, slideTo = null) {
        if (!this.enabled || !this.ctx) return;

        try {
            if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});

            // Safeguard: If passed seconds instead of milliseconds (e.g., 0.1, 0.5), auto-convert
            if (duration < 10) {
                duration *= 1000;
            }

            const durSec = Math.max(0.01, duration / 1000);
            const safeFreq = Math.max(20, Number(freq) || 440);
            const safeVol = Math.max(0.0001, (Number(vol) || 0.2) * 0.5);
            const now = this.ctx.currentTime;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = type || 'sine';
            osc.frequency.setValueAtTime(safeFreq, now);

            if (slideTo !== null && slideTo !== undefined) {
                const safeSlide = Math.max(10, Number(slideTo) || 100);
                osc.frequency.exponentialRampToValueAtTime(safeSlide, now + durSec);
            }

            gain.gain.setValueAtTime(safeVol, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + durSec);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.onended = () => {
                try {
                    osc.disconnect();
                    gain.disconnect();
                } catch (e) {}
            };

            osc.start(now);
            osc.stop(now + durSec);
        } catch (err) {
            // Silently ignore Web Audio timing edge cases
        }
    }

    playNoise(duration, vol = 1, cutoffFreq = 800) {
        if (!this.enabled || !this.ctx || !this.noiseBuffer) return;

        try {
            if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});

            const durSec = Math.min(2.0, Math.max(0.02, Number(duration) || 0.2));
            const safeVol = Math.max(0.0001, Number(vol) || 0.5);
            const now = this.ctx.currentTime;

            const noise = this.ctx.createBufferSource();
            noise.buffer = this.noiseBuffer;

            // Randomize start offset inside the 2s cached buffer so every explosion sounds organic
            const maxOffset = Math.max(0, this.noiseBuffer.duration - durSec - 0.01);
            const randomOffset = Math.random() * maxOffset;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(cutoffFreq, now);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(safeVol, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + durSec);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);

            noise.onended = () => {
                try {
                    noise.disconnect();
                    filter.disconnect();
                    gain.disconnect();
                } catch (e) {}
            };

            noise.start(now, randomOffset, durSec);
            noise.stop(now + durSec);
        } catch (err) {}
    }

    // ==========================================
    // --- PRE-BUILT SOUND EFFECTS ---
    // ==========================================

    playUIHover() {
        if (!this._canPlay('hover', 35)) return;
        this.playTone(600, 'sine', 80, 0.08);
    }

    playUIClick() {
        if (!this._canPlay('click', 25)) return;
        this.playTone(800, 'sine', 90, 0.18);
    }

    playUIRefresh() {
        if (!this._canPlay('refresh', 100)) return;
        this.playTone(520, 'sine', 70, 0.08, 780);
    }

    playTyping() {
        if (!this._canPlay('type', 20)) return;
        this.playTone(900 + Math.random() * 300, 'triangle', 35, 0.06);
    }

    playError() {
        if (!this._canPlay('error', 80)) return;
        this.playTone(150, 'sawtooth', 300, 0.3, 100);
    }

    playBuy() {
        this.playTone(400, 'sine', 100, 0.2, 600);
        setTimeout(() => this.playTone(800, 'sine', 200, 0.2), 100);
    }

    playGain() {
        this.playTone(300, 'sine', 150, 0.12, 400);
        setTimeout(() => this.playTone(500, 'sine', 150, 0.12, 600), 100);
        setTimeout(() => this.playTone(700, 'sine', 300, 0.14, 800), 200);
    }

    playLevelUp() {
        const notes = [440, 554.37, 659.25, 880]; // A Major arpeggio
        notes.forEach((freq, idx) => {
            setTimeout(() => this.playTone(freq, 'triangle', 220, 0.2, freq * 1.02), idx * 90);
        });
    }

    playLaser() {
        this.playTone(800, 'sawtooth', 200, 0.2, 200);
    }

    playCritical() {
        this.playTone(1200, 'square', 120, 0.25, 300);
        setTimeout(() => this.playTone(900, 'sawtooth', 220, 0.25, 150), 80);
    }

    playExplosion() {
        this.playNoise(0.5, 0.5, 800);
        this.playTone(100, 'square', 400, 0.4, 15);
    }

    playShieldHit() {
        if (!this._canPlay('shieldHit', 60)) return;
        this.playTone(1500, 'sawtooth', 100, 0.3, 500);
    }

    playHullHit() {
        if (!this._canPlay('hullHit', 60)) return;
        this.playNoise(0.2, 0.4, 650);
        this.playTone(200, 'square', 200, 0.4, 50);
    }

    playRepair() {
        this.playTone(350, 'sine', 120, 0.15, 520);
        setTimeout(() => this.playTone(520, 'sine', 180, 0.15, 700), 110);
    }

    playThruster() {
        if (!this._canPlay('thruster', 90)) return;
        this.playNoise(0.08, 0.08, 320);
    }

    playScan() {
        this.playTone(2000, 'sine', 500, 0.2, 1800);
    }

    playHail() {
        this.playTone(680, 'sine', 90, 0.15);
        setTimeout(() => this.playTone(880, 'sine', 140, 0.15), 110);
    }

    playMining() {
        this.playTone(1200 + Math.random() * 400, 'sine', 300, 0.2);
    }

    playWarp() {
        this.playTone(200, 'square', 1500, 0.2, 2000);
    }

    playAbilityActivate() {
        this.playTone(600, 'sine', 400, 0.2, 1200);
    }

    playWarning() {
        if (!this._canPlay('warning', 400)) return;
        this.playTone(400, 'sawtooth', 400, 0.3);
        setTimeout(() => this.playTone(400, 'sawtooth', 400, 0.3), 500);
    }
}

// Ensure global instantiation stays intact
const soundManager = new SoundManager();
window.soundManager = soundManager;

// ==========================================
// --- SELF-CONTAINED AUDIO & BOOT HOOKS ---
// ==========================================

(function initAudioHooks() {
    // 1. Restore bootSequence() & completeBootTransition() if omitted from script.js
    if (typeof window.completeBootTransition === 'undefined') {
        window.completeBootTransition = function(titleScreen, shouldEnableAudio) {
            if (titleScreen) {
                titleScreen.style.transition = "opacity 1.5s ease-out";
                titleScreen.style.opacity = "0";
                setTimeout(() => {
                    titleScreen.style.display = "none";
                }, 1500);
            }

            if (shouldEnableAudio && typeof soundManager !== 'undefined') {
                setTimeout(() => soundManager.playWarp(), 300);
                if (soundManager.bgMusic && !soundManager.bgMusicFailed) {
                    soundManager.bgMusic.play().catch(err => {
                        console.warn("Browser blocked autoplay until user interaction.", err);
                    });
                }
            }

            if (typeof logMessage === 'function') {
                logMessage("<span style='color:var(--accent-color); font-weight:bold;'>> SHIP SYSTEMS INITIALIZED.</span>");
                if (typeof soundManager !== 'undefined' && !soundManager.enabled) {
                    logMessage("> <span style='color:var(--warning)'>WARNING: Audio Telemetry remains offline. Use dashboard toggle to enable.</span>");
                }
                logMessage("> Life support green. Engines hot. Awaiting captain's orders.");
            }
        };
    }

    if (typeof window.bootSequence === 'undefined') {
        window.bootSequence = function() {
            const titleScreen = document.getElementById('titleScreenOverlay');
            let audioPref = localStorage.getItem('wayfinder_audio_pref');
            let shouldEnableAudio = (audioPref === null) ? false : (audioPref === 'true');

            if (typeof soundManager !== 'undefined') {
                soundManager.setMuteState(shouldEnableAudio);
            }

            let isReturningPlayer = false;
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith('wayfinder_')) {
                    isReturningPlayer = true;
                    break;
                }
            }

            if (!isReturningPlayer && titleScreen) {
                const isBodyLight = document.body.classList.contains('light-mode');
                const isOSLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
                const isLightMode = isBodyLight || isOSLight;
                const videoSrc = isLightMode ? 'assets/intro_white.mp4' : 'assets/intro_black.mp4';

                titleScreen.innerHTML = `
                    <video id="bootIntroVideo" style="width: 100vw; height: 100vh; object-fit: cover;" autoplay playsinline>
                        <source src="${videoSrc}" type="video/mp4">
                    </video>
                `;

                const video = document.getElementById('bootIntroVideo');
                if (video) {
                    video.muted = !shouldEnableAudio;
                    if (shouldEnableAudio && typeof soundManager !== 'undefined' && soundManager.bgMusic) {
                        soundManager.bgMusic.pause();
                    }
                    video.onended = () => window.completeBootTransition(titleScreen, shouldEnableAudio);
                    video.onerror = () => window.completeBootTransition(titleScreen, shouldEnableAudio);
                    video.onclick = () => {
                        video.pause();
                        window.completeBootTransition(titleScreen, shouldEnableAudio);
                    };
                } else {
                    window.completeBootTransition(titleScreen, shouldEnableAudio);
                }
            } else {
                window.completeBootTransition(titleScreen, shouldEnableAudio);
            }
        };
    }

    // 2. Hook GameBus Events for Automatic Audio Feedback
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
            if (tick && tick.isMovement && !tick.interrupt) {
                soundManager.playThruster();
            }
        });
    }

    // 3. Pause/Resume Audio Cleanly on Browser Tab Switch
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

    // 4. Sync Mute Button Text & Add Subtle Hover/Typing SFX on DOM Load
    window.addEventListener('DOMContentLoaded', () => {
        const audioPref = localStorage.getItem('wayfinder_audio_pref') === 'true';
        const soundBtn = document.getElementById('soundButton');
        if (soundBtn) {
            soundBtn.textContent = audioPref ? "Mute Audio" : "Enable Audio";
        }

        // Delegated hover sound for interactive buttons and rows
        document.addEventListener('mouseover', (e) => {
            if (!soundManager.enabled) return;
            const target = e.target.closest('button, .station-action-btn, .trade-item-row, .perk-card, .codex-cat-btn, .codex-entry-btn');
            if (target && !target.disabled) {
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
