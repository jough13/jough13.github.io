// --- START OF FILE audio.js ---

class SoundManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.sfxGain = null;
        this.ambientGain = null;
        this.compressor = null;
        this.noiseBuffer = null;

        this.enabled = false;
        this.initialized = false;

        this.masterVolume = 0.30;
        this.musicVolume = 0.30;

        // --- SUBSPACE RADIO STATIONS (Multi-Track Playlist Architecture) ---
        // Add as many tracks as you want to any station's `tracks` array!
        this.radioStations = [
            {
                freq: "101.5 FM",
                name: "DEEP VOID AMBIENT",
                type: "MUSIC",
                trackIndex: 0,
                tracks: [
                    { title: "Orbiting A Sleeping Star", src: "assets/Orbiting_A_Sleeping_Star.mp3" },
                    { title: "Weightless Horizon", src: "assets/Weightless_Horizon.mp3" }
                ]
            },
            {
                freq: "99.3 FM",
                name: "CONCORD CLASSICAL SYMPHONY",
                type: "MUSIC",
                trackIndex: 0,
                tracks: [
                    { title: "Approaching The Highport", src: "assets/Approaching_The_Highport.mp3" }
                ]
            },
            {
                freq: "104.9 FM",
                name: "XERXES UNDERGROUND",
                type: "MUSIC",
                trackIndex: 0,
                tracks: [
                    { title: "Cold Iron Gravity", src: "assets/Cold_Iron_Gravity.mp3" }
                ]
            },
            {
                freq: "112.7 FM",
                name: "PULSAR ARCADE FM",
                type: "MUSIC",
                trackIndex: 0,
                tracks: [
                    { title: "Sector Nine Arrival", src: "assets/Sector_Nine_Arrival.mp3" }
                ]
            },
            {
                freq: "1620 AM",
                name: "CONCORD NEWS NETWORK",
                type: "NEWS",
                title: "Live Sector Telemetry & Market Feed"
            },
            {
                freq: "88.0 AM",
                name: "SUBSPACE CARRIER WAVE",
                type: "DRONE",
                title: "Procedural Hull Drone"
            },
            {
                freq: "OFF",
                name: "COMMS RADIO OFFLINE",
                type: "OFF",
                title: "Receiver Muted"
            }
        ];
        this.currentStationIndex = 0;
        this.newsTimer = null;
        this.newsInitialTimeout = null;

        this.bgMusic = null;
        this.bgMusicFailed = false;
        this.ambientNodes = null;
        this._lastSoundTime = {};
    }

    init() {
        if (this.initialized) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;

            this.ctx = new AudioContext();

            try {
                const savedMaster = parseFloat(localStorage.getItem('wayfinder_master_vol'));
                const savedMusic = parseFloat(localStorage.getItem('wayfinder_music_vol'));
                const savedStation = parseInt(localStorage.getItem('wayfinder_radio_station'), 10);
                if (!isNaN(savedMaster)) this.masterVolume = Math.max(0, Math.min(1, savedMaster));
                if (!isNaN(savedMusic)) this.musicVolume = Math.max(0, Math.min(1, savedMusic));
                if (!isNaN(savedStation) && savedStation >= 0 && savedStation < this.radioStations.length) {
                    this.currentStationIndex = savedStation;
                }
            } catch (e) {}

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

    _ensureContextRunning() {
        if (!this.enabled) return;
        if (!this.initialized) this.init();

        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }

        const st = this.radioStations[this.currentStationIndex];
        if (!st || st.type === "OFF") return;

        if (st.type === "DRONE" || st.type === "NEWS") {
            if (!this.ambientNodes && !document.hidden) this.startProceduralDrone();
        } else if (st.type === "MUSIC") {
            if (this.bgMusic && !this.bgMusicFailed && this.bgMusic.paused && !document.hidden) {
                this.bgMusic.play().catch(() => {});
            } else if (this.bgMusicFailed && !this.ambientNodes && !document.hidden) {
                this.startProceduralDrone();
            }
        }
    }

    setMasterVolume(val) {
        this.masterVolume = Math.max(0, Math.min(1, Number(val) || 0));
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.05);
        }
        
        // Force the MP3 player to adapt instantly when the master volume slider moves
        this.updateAdaptiveMix();
        
        try { localStorage.setItem('wayfinder_master_vol', String(this.masterVolume)); } catch (e) {}
    }

    setMusicVolume(val) {
        this.musicVolume = Math.max(0, Math.min(1, Number(val) || 0));
        if (this.bgMusic) this.bgMusic.volume = this.musicVolume;
        if (this.ambientGain && this.ctx) {
            this.ambientGain.gain.setTargetAtTime(this.musicVolume / 0.30, this.ctx.currentTime, 0.1);
        }
        try { localStorage.setItem('wayfinder_music_vol', String(this.musicVolume)); } catch (e) {}
    }

    updateAdaptiveMix() {
        if (!this.enabled) return;
        const isStealthed = typeof isSilentRunning !== 'undefined' && isSilentRunning;
        const inCombat = typeof currentGameState !== 'undefined' && currentGameState === 'combat';

        let targetMusicVol = isStealthed
            ? this.musicVolume * 0.45
            : (inCombat ? this.musicVolume * 0.75 : this.musicVolume);

        // Multiply by the master volume (normalized against the 0.30 default base)
        targetMusicVol = targetMusicVol * (this.masterVolume / 0.30);

        if (this.bgMusic && !this.bgMusicFailed) {
            this.bgMusic.volume = Math.max(0, Math.min(1, targetMusicVol));
        } this.bgMusic.volume = Math.max(0, Math.min(1, targetMusicVol));
        }

        if (this.ambientNodes && this.ambientNodes.filter && this.ctx) {
            const targetCutoff = isStealthed ? 110 : (inCombat ? 280 : 200);
            this.ambientNodes.filter.frequency.setTargetAtTime(targetCutoff, this.ctx.currentTime, 0.25);
        }
    }

    // ==========================================
    // --- SUBSPACE RADIO TUNER & PLAYLISTS ---
    // ==========================================

    initBackgroundMusic() {
        this.playCurrentStation(false);
    }

    playRadioTuningEffect() {
        if (!this.enabled) return;
        // Static burst + frequency sweep just like tuning a stereo dial
        this.playNoise(0.14, 0.22, 1800, 0, 'bandpass');
        this.playTone(1400, 'sine', 55, 0.08, 620, 20);
        this.playTone(620, 'sine', 65, 0.08, 1180, 75);
    }

    playCurrentStation(showNotification = false) {
        const station = this.radioStations[this.currentStationIndex];
        if (!station) return;

        // Cleanly stop any active MP3, procedural drone, or news timer
        if (this.bgMusic) {
            this.bgMusic.pause();
        }
        this.stopProceduralDrone();
        if (this.newsInitialTimeout) {
            clearTimeout(this.newsInitialTimeout);
            this.newsInitialTimeout = null;
        }
        if (this.newsTimer) {
            clearInterval(this.newsTimer);
            this.newsTimer = null;
        }
        this.bgMusicFailed = false;

        // Determine current track title and file path if it's a playlist station
        let currentTrackTitle = station.title || "";
        let currentTrackSrc = null;

        if (station.type === "MUSIC" && station.tracks && station.tracks.length > 0) {
            station.trackIndex = (station.trackIndex || 0) % station.tracks.length;
            const trackObj = station.tracks[station.trackIndex];
            currentTrackTitle = trackObj.title;
            currentTrackSrc = trackObj.src;
        }

        // Sync System Menu button text using safe Unicode escape for the radio icon
        const radioBtn = document.getElementById('radioStationButton');
        if (radioBtn) {
            radioBtn.textContent = `\uD83D\uDCFB Radio: ${station.freq}`;
        }

        if (showNotification) {
            this.playRadioTuningEffect();
            if (typeof showToast === 'function') {
                showToast(`\uD83D\uDCFB [${station.freq}] ${station.name}<br><span style="font-size:11px; opacity:0.85;">\u266A ${currentTrackTitle}</span>`, "info");
            }
            if (typeof logMessage === 'function' && typeof currentGameState !== 'undefined' && currentGameState !== 'title_screen') {
                logMessage(`<span style="color:var(--accent-color)">[ SUBSPACE RADIO ]</span> Tuned to <b>${station.freq} - ${station.name}</b> (${currentTrackTitle})`);
            }
        }

        if (!this.enabled || station.type === "OFF") return;

        if (station.type === "DRONE") {
            this.startProceduralDrone();
            return;
        }

        if (station.type === "NEWS") {
            this.startProceduralDrone();
            this.startNewsBroadcast();
            return;
        }

        if (station.type === "MUSIC" && currentTrackSrc) {
            try {
                if (!this.bgMusic) {
                    this.bgMusic = new Audio();
                    this.bgMusic.addEventListener('ended', () => {
                        this.autoAdvanceTrack();
                    });
                    this.bgMusic.addEventListener('error', (e) => {
                        if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
                        this.bgMusicFailed = true;
                        if (this.enabled) this.startProceduralDrone();
                    });
                }

                this.bgMusic.src = currentTrackSrc;
                this.bgMusic.loop = false;
                this.bgMusic.volume = this.musicVolume;
                this.updateAdaptiveMix();

                this.bgMusic.play().catch(() => {});
            } catch (err) {
                this.bgMusicFailed = true;
                if (this.enabled) this.startProceduralDrone();
            }
        }
    }

    // Cycles stations on 'R', or skips tracks within the current playlist on 'Shift + R'
    nextRadioStation(skipTrackOnly = false) {
        if (!this.initialized) this.init();
        if (!this.enabled) this.setMuteState(true);

        const station = this.radioStations[this.currentStationIndex];

        if (skipTrackOnly && station && station.type === "MUSIC" && station.tracks && station.tracks.length > 1) {
            station.trackIndex = ((station.trackIndex || 0) + 1) % station.tracks.length;
            this.playCurrentStation(true);
            return;
        }

        this.currentStationIndex = (this.currentStationIndex + 1) % this.radioStations.length;
        try {
            localStorage.setItem('wayfinder_radio_station', String(this.currentStationIndex));
        } catch (e) {}

        this.playCurrentStation(true);
    }

    autoAdvanceTrack() {
        const station = this.radioStations[this.currentStationIndex];
        if (!station || station.type !== "MUSIC" || !station.tracks || station.tracks.length === 0) return;

        // Advance to the next track in the current station's playlist
        const hadMultipleTracks = station.tracks.length > 1;
        station.trackIndex = ((station.trackIndex || 0) + 1) % station.tracks.length;
        this.playCurrentStation(hadMultipleTracks);
    }

    // Procedural News & Telemetry Bulletins for 1620 AM
    startNewsBroadcast() {
        const triggerBulletin = () => {
            if (!this.enabled || document.hidden) return;
            const st = this.radioStations[this.currentStationIndex];
            if (!st || st.type !== "NEWS") return;
            if (typeof currentGameState === 'undefined' || currentGameState !== 'galactic_map') return;

            // Teletype news jingle
            this.playTone(880, 'sine', 60, 0.08, null, 0);
            this.playTone(1320, 'sine', 60, 0.08, null, 80);
            this.playTone(1760, 'sine', 120, 0.08, null, 160);

            let headlines = [
                `"Concord Nav-Com reminds all pilots: keep your transponders active in Core Sectors."`,
                `"Fuel Rats Collective reports record rescues this cycle. Remember to tip your tug pilot!"`,
                `"Astrometric Advisory: High gravimetric shear detected near deep-space singularities."`,
                `"Aegis Command warns independent haulers to avoid unmarked syndicate wagering buoys."`
            ];

            if (typeof activeMarketTrend !== 'undefined' && activeMarketTrend && typeof COMMODITIES !== 'undefined') {
                const item = COMMODITIES[activeMarketTrend.item]?.name || activeMarketTrend.item;
                const status = activeMarketTrend.isBoom ? "CRITICAL SHORTAGE" : "MARKET SURPLUS";
                headlines.push(`"MARKET TICKER: ${status} of ${item} reported at ${activeMarketTrend.station}."`);
            }
            if (typeof playerActiveBounty !== 'undefined' && playerActiveBounty) {
                headlines.push(`"SEC-COM BOLO: High-value target ${playerActiveBounty.targetName} last tracked near [${playerActiveBounty.x}, ${-playerActiveBounty.y}]."`);
            }
            if (typeof playerNotoriety !== 'undefined' && playerNotoriety > 15) {
                const shipTitle = (typeof playerShip !== 'undefined' && playerShip.name) ? playerShip.name : 'an unidentified vessel';
                headlines.push(`"SECURITY ALERT: Aegis patrols are actively hunting outlaw Captain ${typeof playerName !== 'undefined' ? playerName : ''} aboard ${shipTitle}..."`);
            }

            const msg = headlines[Math.floor(Math.random() * headlines.length)];
            if (typeof logMessage === 'function') {
                logMessage(`<span style="color:var(--gold-text)">[ 1620 AM NEWS ]</span> <i>${msg}</i>`);
            }
        };

        this.newsInitialTimeout = setTimeout(triggerBulletin, 4000);
        this.newsTimer = setInterval(triggerBulletin, 45000);
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
            const lfo = this.ctx.createOscillator();
            const lfoGain = this.ctx.createGain();

            osc1.type = 'sawtooth';
            osc2.type = 'triangle';
            subOsc.type = 'sine';

            osc1.frequency.setValueAtTime(55.0, now);
            osc2.frequency.setValueAtTime(82.41, now);
            osc2.detune.setValueAtTime(6, now);
            subOsc.frequency.setValueAtTime(27.5, now);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(200, now);
            filter.Q.setValueAtTime(1.5, now);

            lfo.type = 'sine';
            lfo.frequency.setValueAtTime(0.125, now);
            lfoGain.gain.setValueAtTime(130, now);

            padGain.gain.setValueAtTime(0.001, now);
            padGain.gain.exponentialRampToValueAtTime(0.06, now + 1.5);

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
        } catch (e) {}

        if (this.enabled) {
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume().catch(() => {});
            }
            this.playCurrentStation(false);
        } else {
            if (this.ctx && this.ctx.state === 'running') {
                this.ctx.suspend().catch(() => {});
            }
            if (this.bgMusic) this.bgMusic.pause();
            this.stopProceduralDrone();
            if (this.newsInitialTimeout) {
                clearTimeout(this.newsInitialTimeout);
                this.newsInitialTimeout = null;
            }
            if (this.newsTimer) {
                clearInterval(this.newsTimer);
                this.newsTimer = null;
            }
        }

        const soundBtn = document.getElementById('soundButton');
        if (soundBtn) {
            soundBtn.textContent = this.enabled ? "Mute Audio" : "Enable Audio";
        }
        return this.enabled;
    }

    toggleMute() {
        return this.setMuteState(!this.enabled);
    }

    _canPlay(key, minGapMs = 30) {
        const now = performance.now();
        if (this._lastSoundTime[key] && (now - this._lastSoundTime[key]) < minGapMs) {
            return false;
        }
        this._lastSoundTime[key] = now;
        return true;
    }

    // ==========================================
    // --- SYNTH GENERATORS & SFX ---
    // ==========================================

    playTone(freq, type, duration, vol = 1, slideTo = null, delayMs = 0) {
        if (!this.enabled) return;
        if (!this.initialized) this.init();
        if (!this.ctx) return;
        this._ensureContextRunning();

        try {
            let durMs = Number(duration) || 100;
            if (durMs > 0 && durMs < 10) durMs *= 1000;

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

            gain.gain.setValueAtTime(0.0001, startTime);
            gain.gain.linearRampToValueAtTime(safeVol, startTime + Math.min(0.004, durSec * 0.2));
            gain.gain.exponentialRampToValueAtTime(0.0001, stopTime);

            osc.connect(gain);
            gain.connect(this.sfxGain || this.masterGain);

            osc.onended = () => {
                try { osc.disconnect(); gain.disconnect(); } catch (e) {}
            };

            osc.start(startTime);
            osc.stop(stopTime + 0.005);
        } catch (err) {}
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
                try { noise.disconnect(); filter.disconnect(); gain.disconnect(); } catch (e) {}
            };

            noise.start(startTime, randomOffset, durSec);
            noise.stop(stopTime + 0.005);
        } catch (err) {}
    }

    playUIHover() { if (this._canPlay('hover', 40)) this.playTone(620, 'sine', 65, 0.07, 660); }
    playUIClick() { if (this._canPlay('click', 25)) this.playTone(820, 'sine', 80, 0.16, 920); }
    playUIRefresh() { if (this._canPlay('refresh', 100)) this.playTone(520, 'sine', 70, 0.08, 780); }
    playTyping() { if (this._canPlay('type', 22)) this.playTone(900 + Math.random() * 320, 'triangle', 32, 0.05); }
    playError() {
        if (!this._canPlay('error', 80)) return;
        this.playTone(160, 'sawtooth', 140, 0.28, 115, 0);
        this.playTone(115, 'sawtooth', 220, 0.28, 85, 120);
    }
    playAlarm() {
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
        this.playTone(440, 'triangle', 150, 0.22, null, 0);
        this.playTone(554.37, 'triangle', 150, 0.22, null, 140);
        this.playTone(659.25, 'triangle', 150, 0.22, null, 280);
        this.playTone(880, 'triangle', 420, 0.26, 890, 420);
    }
    playGain() {
        if (!this._canPlay('gain', 60)) return;
        this.playTone(330, 'sine', 140, 0.14, 440, 0);
        this.playTone(554.37, 'sine', 140, 0.14, 659.25, 95);
        this.playTone(740, 'sine', 280, 0.16, 880, 190);
    }
    playLevelUp() {
        if (!this._canPlay('levelUp', 500)) return;
        const notes = [440, 554.37, 659.25, 880, 1108.73];
        notes.forEach((freq, idx) => {
            this.playTone(freq, 'triangle', 240, 0.22, freq * 1.015, idx * 85);
        });
    }
    playLaser() {
        if (!this._canPlay('laser', 45)) return;
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

const soundManager = new SoundManager();
window.soundManager = soundManager;

// ==========================================
// --- SELF-CONTAINED AUDIO & RADIO HOOKS ---
// ==========================================

(function initAudioHooks() {
    if (typeof GameBus !== 'undefined') {
        GameBus.on('HULL_DAMAGED', (data) => {
            if (data && data.amount > 0) soundManager.playHullHit();
        });
        GameBus.on('HULL_REPAIRED', (amount) => {
            if (amount > 0) soundManager.playRepair();
        });
        GameBus.on('TICK_PROCESSED', (tick) => {
            soundManager.updateAdaptiveMix();
            if (tick && tick.isMovement && !tick.interrupt) soundManager.playThruster();
        });
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

    document.addEventListener('visibilitychange', () => {
        if (!soundManager.enabled) return;
        if (document.hidden) {
            if (soundManager.ctx && soundManager.ctx.state === 'running') {
                soundManager.ctx.suspend().catch(() => {});
            }
            if (soundManager.bgMusic) soundManager.bgMusic.pause();
        } else {
            soundManager._ensureContextRunning();
        }
    });

    const unlockAudioOnGesture = () => {
        if (soundManager.enabled) soundManager._ensureContextRunning();
    };
    ['pointerdown', 'keydown', 'touchstart'].forEach(evtName => {
        document.addEventListener(evtName, unlockAudioOnGesture, { passive: true });
    });

    window.addEventListener('DOMContentLoaded', () => {
        const savedPref = localStorage.getItem('wayfinder_audio_pref');
        const wantsAudio = savedPref === null ? true : (savedPref === 'true');
        soundManager.setMuteState(wantsAudio);

        // 1. Dynamically inject the Subspace Radio button into the System Menu right above Mute Audio
        const soundBtn = document.getElementById('soundButton');
        if (soundBtn && soundBtn.parentNode && !document.getElementById('radioStationButton')) {
            const radioBtn = document.createElement('button');
            radioBtn.id = 'radioStationButton';
            radioBtn.className = 'sys-btn';
            const st = soundManager.radioStations[soundManager.currentStationIndex];
            radioBtn.textContent = `\uD83D\uDCFB Radio: ${st ? st.freq : '101.5 FM'}`;
            radioBtn.onclick = (e) => soundManager.nextRadioStation(Boolean(e && e.shiftKey));
            soundBtn.parentNode.insertBefore(radioBtn, soundBtn);
        }

        // 2. Patch openHelpMenu() so 'R / SHIFT+R' automatically appears in the Command Reference
        if (typeof window.openHelpMenu === 'function' && !window._radioHelpPatched) {
            const origHelp = window.openHelpMenu;
            window.openHelpMenu = function() {
                origHelp.apply(this, arguments);
                const listEl = document.getElementById('genericModalList');
                if (listEl) {
                    listEl.innerHTML += `
                        <div style="padding: 0 10px 10px 10px; font-size: 13px; color: var(--text-color); line-height: 2.0;">
                            <span style="color:var(--gold-text); font-weight:bold;">R / SHIFT+R</span> : Cycle Radio Station / Skip Track
                        </div>
                    `;
                }
            };
            window._radioHelpPatched = true;
        }

        // 3. Hover & Typing SFX + 'R' Radio Hotkey Listener
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

        document.addEventListener('keydown', (e) => {
            if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
                if (soundManager.enabled && (e.key.length === 1 || e.key === 'Backspace')) {
                    soundManager.playTyping();
                }
                return;
            }

            // Press 'R' in normal flight to cycle the Subspace Radio (or 'Shift + R' to skip tracks)!
            // Automatically yields if you are in Combat (where R = Run) or docked with a damaged hull (where R = Repair)
            if (!e.repeat && (e.key === 'r' || e.key === 'R')) {
                if (typeof currentGameState !== 'undefined' && currentGameState === 'galactic_map') {
                    const genericModal = document.getElementById('genericModalOverlay');
                    if (genericModal && genericModal.style.display === 'flex') return;

                    const loc = typeof getCombinedLocationData === 'function' ? getCombinedLocationData(playerX, playerY) : null;
                    if (loc && typeof playerHull !== 'undefined' && typeof MAX_PLAYER_HULL !== 'undefined' && playerHull < MAX_PLAYER_HULL) {
                        return; // Let 'R' repair the ship when docked
                    }

                    soundManager.nextRadioStation(e.shiftKey);
                }
            }
        });
    });
})();

// --- END OF FILE audio.js ---
