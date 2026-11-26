// --- START OF FILE audio.js ---

// ==========================================
// --- INTERNAL AUDIO HELPERS ---
// ==========================================

function _audioEscapeHtml(value) {
    return String(value === undefined || value === null ? "" : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

class SoundManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.sfxGain = null;
        this.ambientGain = null;
        this.compressor = null;
        this.noiseBuffer = null;
        this.pinkNoiseBuffer = null;

        this.enabled = false;
        this.initialized = false;

        this.masterVolume = 0.30;
        this.musicVolume = 0.30;
        this.sfxVolume = 1.0;

        // Voice polyphony limiter to prevent distortion or CPU spikes during heavy combat
        this._activeVoices = 0;
        this._maxVoices = 24;

        // --- SUBSPACE RADIO STATIONS (Multi-Track & Procedural Architecture) ---
        // Existing MP3 stations preserved verbatim; procedural stations use pure Web Audio synthesis.
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
                freq: "91.2 FM",
                name: "VOID SYNTHWAVE (PROCEDURAL)",
                type: "SYNTH",
                title: "Generative Deep-Space Arpeggiator"
            },
            {
                freq: "94.8 FM",
                name: "PULSAR TELEMETRY (PROCEDURAL)",
                type: "PULSAR",
                title: "Radio-Astronomy Chimes & Solar Wind"
            },
            {
                freq: "1620 AM",
                name: "CONCORD NEWS NETWORK",
                type: "NEWS",
                title: "Live Sector Telemetry & Market Feed"
            },
            {
                freq: "66.6 AM",
                name: "ECLIPSE SHADOW DISPATCH",
                type: "SHADOW",
                title: "Encrypted Cartel Wire & Contraband Tips"
            },
            {
                freq: "74.4 AM",
                name: "PRECURSOR NUMBERS STATION",
                type: "SIGNAL",
                title: "Unidentified Subspace Harmonic Beacon"
            },
            {
                freq: "88.0 AM",
                name: "SUBSPACE CARRIER WAVE",
                type: "DRONE",
                title: "Faction-Adaptive Hull Drone"
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
        this.shadowTimer = null;
        this.shadowInitialTimeout = null;
        this.synthTimer = null;
        this.pulsarTimer = null;
        this.signalTimer = null;
        this.signalInitialTimeout = null;

        this._synthStep = 0;
        this._synthChordIndex = 0;
        this._pulsarStep = 0;
        this._lastFactionTone = null;
        this._recentNews = [];
        this._recentShadow = [];
        this._recentSignals = [];

        this.bgMusic = null;
        this.bgMusicFailed = false;
        this.ambientNodes = null;
        this._lastSoundTime = {};
        this._customSfx = {};
    }

    // ==========================================
    // --- INITIALIZATION & EXPANDABILITY API ---
    // ==========================================

    init() {
        if (this.initialized) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;

            this.ctx = new AudioContext();

            try {
                const savedMaster = parseFloat(localStorage.getItem('wayfinder_master_vol'));
                const savedMusic = parseFloat(localStorage.getItem('wayfinder_music_vol'));
                const savedSfx = parseFloat(localStorage.getItem('wayfinder_sfx_vol'));
                const savedFreq = localStorage.getItem('wayfinder_radio_freq');
                const savedStation = parseInt(localStorage.getItem('wayfinder_radio_station'), 10);

                if (!isNaN(savedMaster)) this.masterVolume = Math.max(0, Math.min(1, savedMaster));
                if (!isNaN(savedMusic)) this.musicVolume = Math.max(0, Math.min(1, savedMusic));
                if (!isNaN(savedSfx)) this.sfxVolume = Math.max(0, Math.min(1, savedSfx));

                if (savedFreq) {
                    const matchedIdx = this.radioStations.findIndex(s => s.freq === savedFreq);
                    if (matchedIdx !== -1) this.currentStationIndex = matchedIdx;
                } else if (!isNaN(savedStation) && savedStation >= 0 && savedStation < this.radioStations.length) {
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
            this.sfxGain.gain.value = this.sfxVolume;

            this.ambientGain = this.ctx.createGain();
            this.ambientGain.gain.value = Math.max(0, Math.min(1.6, this.musicVolume / 0.30));

            this.sfxGain.connect(this.masterGain);
            this.ambientGain.connect(this.masterGain);
            this.masterGain.connect(this.compressor);
            this.compressor.connect(this.ctx.destination);

            // Pre-compute White Noise & Warm Pink Noise buffers once (2 seconds each)
            const bufferSize = this.ctx.sampleRate * 2;
            this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            this.pinkNoiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);

            const whiteData = this.noiseBuffer.getChannelData(0);
            const pinkData = this.pinkNoiseBuffer.getChannelData(0);
            let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                whiteData[i] = white;

                // Paul Kellet's economical pink-noise filter
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                pinkData[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
                b6 = white * 0.115926;
            }

            this.initialized = true;
            this._syncVolumeSliders();
            console.log("Audio System Initialized");
        } catch (err) {
            console.warn("Web Audio API could not be initialized:", err);
        }
    }

    // Expandability: Dynamically register a new radio station at runtime
    registerStation(stationConfig) {
        if (!stationConfig || !stationConfig.freq || !stationConfig.name || !stationConfig.type) return false;
        const activeFreq = this.radioStations[this.currentStationIndex]?.freq;
        const offIdx = this.radioStations.findIndex(s => s.type === "OFF");
        const insertIdx = offIdx !== -1 ? offIdx : this.radioStations.length;
        this.radioStations.splice(insertIdx, 0, stationConfig);
        if (activeFreq) {
            const newIdx = this.radioStations.findIndex(s => s.freq === activeFreq);
            if (newIdx !== -1) this.currentStationIndex = newIdx;
        }
        return true;
    }

    // Expandability: Register custom procedural SFX callbacks by name
    registerSfx(name, fn) {
        if (!name || typeof fn !== 'function') return false;
        this._customSfx[name] = fn;
        return true;
    }

    playCustomSfx(name, ...args) {
        if (this._customSfx[name]) {
            return this._customSfx[name].apply(this, args);
        }
    }

    _syncVolumeSliders() {
        const masterEl = document.getElementById('masterVolSlider');
        const musicEl = document.getElementById('musicVolSlider');
        if (masterEl) masterEl.value = String(this.masterVolume);
        if (musicEl) musicEl.value = String(this.musicVolume);
    }

    _saveStationPref() {
        try {
            const st = this.radioStations[this.currentStationIndex];
            if (st) localStorage.setItem('wayfinder_radio_freq', st.freq);
            localStorage.setItem('wayfinder_radio_station', String(this.currentStationIndex));
        } catch (e) {}
    }

    _ensureContextRunning() {
        if (!this.enabled) return;
        if (!this.initialized) this.init();

        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }

        const st = this.radioStations[this.currentStationIndex];
        if (!st || st.type === "OFF" || document.hidden) return;

        if (st.type === "DRONE") {
            if (!this.ambientNodes) this.startProceduralDrone();
        } else if (st.type === "NEWS") {
            if (!this.ambientNodes) this.startProceduralDrone();
            if (!this.newsTimer && !this.newsInitialTimeout) this.startNewsBroadcast();
        } else if (st.type === "SHADOW") {
            if (!this.ambientNodes) this.startProceduralDrone();
            if (!this.shadowTimer && !this.shadowInitialTimeout) this.startShadowDispatch();
        } else if (st.type === "SYNTH") {
            if (!this.ambientNodes) this.startProceduralDrone();
            if (!this.synthTimer) this.startGenerativeSynth();
        } else if (st.type === "PULSAR") {
            if (!this.ambientNodes) this.startProceduralDrone();
            if (!this.pulsarTimer) this.startPulsarAmbient();
        } else if (st.type === "SIGNAL") {
            if (!this.ambientNodes) this.startProceduralDrone();
            if (!this.signalTimer && !this.signalInitialTimeout) this.startNumbersStation();
        } else if (st.type === "MUSIC") {
            if (this.bgMusic && !this.bgMusicFailed && this.bgMusic.paused) {
                this.bgMusic.play().catch(() => {});
            } else if (this.bgMusicFailed && !this.ambientNodes) {
                this.startProceduralDrone();
            }
        }
    }

    setMasterVolume(val) {
        this.masterVolume = Math.max(0, Math.min(1, Number(val) || 0));
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.05);
        }

        this.updateAdaptiveMix();
        this._syncVolumeSliders();

        try { localStorage.setItem('wayfinder_master_vol', String(this.masterVolume)); } catch (e) {}
    }

    setMusicVolume(val) {
        this.musicVolume = Math.max(0, Math.min(1, Number(val) || 0));
        this.updateAdaptiveMix();
        this._syncVolumeSliders();

        try { localStorage.setItem('wayfinder_music_vol', String(this.musicVolume)); } catch (e) {}
    }

    setSfxVolume(val) {
        this.sfxVolume = Math.max(0, Math.min(1, Number(val) || 0));
        if (this.sfxGain && this.ctx) {
            this.sfxGain.gain.setTargetAtTime(this.sfxVolume, this.ctx.currentTime, 0.04);
        }
        try { localStorage.setItem('wayfinder_sfx_vol', String(this.sfxVolume)); } catch (e) {}
    }

    _getFactionDroneProfile() {
        let faction = "INDEPENDENT";
        let envMod = { cutoffOffset: 0, q: 1.5, tag: "" };

        if (typeof getFactionAt === 'function' && typeof playerX !== 'undefined' && typeof playerY !== 'undefined') {
            faction = getFactionAt(playerX, playerY) || "INDEPENDENT";
        }

        // Subtle environmental acoustic coloration (Nebula / Black Market / Singularity proximity)
        if (typeof chunkManager !== 'undefined' && typeof playerX !== 'undefined' && typeof playerY !== 'undefined') {
            const tile = chunkManager.getTile(playerX, playerY);
            const ch = typeof getTileChar === 'function' ? getTileChar(tile) : tile;
            if (ch === '~') {
                envMod = { cutoffOffset: -35, q: 3.2, tag: "NEBULA" };
            } else if (tile && tile.isBlackMarket) {
                envMod = { cutoffOffset: -25, q: 2.2, tag: "SHADOW" };
            }
        }

        let base;
        switch (faction) {
            case "CONCORD":
                base = { key: "CONCORD", root: 55.0, fifth: 82.41, sub: 27.5, cutoff: 210 };   // Warm A1 / E2
                break;
            case "KTHARR":
                base = { key: "KTHARR", root: 46.25, fifth: 69.30, sub: 23.12, cutoff: 175 };  // Deep F#1 / C#2
                break;
            case "ECLIPSE":
                base = { key: "ECLIPSE", root: 51.91, fifth: 77.78, sub: 25.96, cutoff: 165 }; // Mysterious G#1 / D#2
                break;
            default:
                base = { key: "INDEPENDENT", root: 55.0, fifth: 82.41, sub: 27.5, cutoff: 195 };
                break;
        }

        return {
            key: base.key + (envMod.tag ? `_${envMod.tag}` : ""),
            faction: base.key,
            root: base.root,
            fifth: base.fifth,
            sub: base.sub,
            cutoff: Math.max(95, base.cutoff + envMod.cutoffOffset),
            q: envMod.q
        };
    }

    updateAdaptiveMix() {
        if (!this.enabled) return;
        const isStealthed = typeof isSilentRunning !== 'undefined' && isSilentRunning;
        const inCombat = typeof currentGameState !== 'undefined' && currentGameState === 'combat';

        const stateDuck = isStealthed ? 0.45 : (inCombat ? 0.75 : 1.0);
        let targetMusicVol = this.musicVolume * stateDuck * (this.masterVolume / 0.30);

        if (this.bgMusic && !this.bgMusicFailed) {
            this.bgMusic.volume = Math.max(0, Math.min(1, targetMusicVol));
        }

        if (this.ambientGain && this.ctx) {
            const targetAmbient = Math.max(0, Math.min(1.6, (this.musicVolume / 0.30) * stateDuck));
            this.ambientGain.gain.setTargetAtTime(targetAmbient, this.ctx.currentTime, 0.15);
        }

        if (this.ambientNodes && this.ambientNodes.filter && this.ctx) {
            const profile = this._getFactionDroneProfile();
            const targetCutoff = isStealthed ? 105 : (inCombat ? 290 : profile.cutoff);
            this.ambientNodes.filter.frequency.setTargetAtTime(targetCutoff, this.ctx.currentTime, 0.3);
            this.ambientNodes.filter.Q.setTargetAtTime(isStealthed ? 1.0 : profile.q, this.ctx.currentTime, 0.3);

            // Smoothly glide hull drone pitch when crossing faction territory borders
            if (this._lastFactionTone !== profile.key && this.ambientNodes.osc1 && this.ambientNodes.osc2) {
                this._lastFactionTone = profile.key;
                this.ambientNodes.osc1.frequency.setTargetAtTime(profile.root, this.ctx.currentTime, 1.2);
                this.ambientNodes.osc2.frequency.setTargetAtTime(profile.fifth, this.ctx.currentTime, 1.2);
                if (this.ambientNodes.subOsc) {
                    this.ambientNodes.subOsc.frequency.setTargetAtTime(profile.sub, this.ctx.currentTime, 1.2);
                }
            }
        }
    }

    // ==========================================
    // --- SUBSPACE RADIO TUNER & PLAYLISTS ---
    // ==========================================

    _stopAllStationTimers() {
        if (this.newsInitialTimeout) { clearTimeout(this.newsInitialTimeout); this.newsInitialTimeout = null; }
        if (this.newsTimer) { clearInterval(this.newsTimer); this.newsTimer = null; }
        if (this.shadowInitialTimeout) { clearTimeout(this.shadowInitialTimeout); this.shadowInitialTimeout = null; }
        if (this.shadowTimer) { clearInterval(this.shadowTimer); this.shadowTimer = null; }
        if (this.synthTimer) { clearInterval(this.synthTimer); this.synthTimer = null; }
        if (this.pulsarTimer) { clearInterval(this.pulsarTimer); this.pulsarTimer = null; }
        if (this.signalInitialTimeout) { clearTimeout(this.signalInitialTimeout); this.signalInitialTimeout = null; }
        if (this.signalTimer) { clearInterval(this.signalTimer); this.signalTimer = null; }
    }

    initBackgroundMusic() {
        this.playCurrentStation(false);
    }

    playRadioTuningEffect() {
        if (!this.enabled) return;
        this.playNoise(0.14, 0.22, 1800, 0, 'bandpass', true);
        this.playTone(1400, 'sine', 55, 0.08, 620, 20);
        this.playTone(620, 'sine', 65, 0.08, 1180, 75);
    }

    getCurrentStationInfo() {
        const station = this.radioStations[this.currentStationIndex];
        if (!station) return { index: 0, freq: "OFF", name: "OFFLINE", trackTitle: "Muted", type: "OFF", trackIndex: 0, trackCount: 0, tracks: [] };

        let trackTitle = station.title || "";
        let trackIndex = 0;
        if (station.type === "MUSIC" && station.tracks && station.tracks.length > 0) {
            trackIndex = (station.trackIndex || 0) % station.tracks.length;
            trackTitle = station.tracks[trackIndex].title;
        }
        return {
            index: this.currentStationIndex,
            freq: station.freq,
            name: station.name,
            type: station.type,
            trackIndex: trackIndex,
            trackTitle: trackTitle,
            trackCount: (station.tracks && station.tracks.length) || 0,
            tracks: station.tracks ? station.tracks.slice() : []
        };
    }

    tuneToStation(index, showNotification = true) {
        if (index < 0 || index >= this.radioStations.length) return;
        if (!this.initialized) this.init();
        if (!this.enabled && this.radioStations[index].type !== "OFF") {
            this.enabled = true;
            try { localStorage.setItem('wayfinder_audio_pref', 'true'); } catch (e) {}
            const soundBtn = document.getElementById('soundButton');
            if (soundBtn) soundBtn.textContent = "Mute Audio";
        }
        this.currentStationIndex = index;
        this._saveStationPref();
        this.playCurrentStation(showNotification);
    }

    selectTrack(stationIndex, trackIndex) {
        const station = this.radioStations[stationIndex];
        if (!station || station.type !== "MUSIC" || !station.tracks || !station.tracks[trackIndex]) return;
        station.trackIndex = trackIndex;
        this.tuneToStation(stationIndex, true);
    }

    playCurrentStation(showNotification = false) {
        const station = this.radioStations[this.currentStationIndex];
        if (!station) return;

        if (this.bgMusic) {
            this.bgMusic.pause();
        }
        this.stopProceduralDrone();
        this._stopAllStationTimers();
        this.bgMusicFailed = false;

        let currentTrackTitle = station.title || "";
        let currentTrackSrc = null;

        if (station.type === "MUSIC" && station.tracks && station.tracks.length > 0) {
            station.trackIndex = (station.trackIndex || 0) % station.tracks.length;
            const trackObj = station.tracks[station.trackIndex];
            currentTrackTitle = trackObj.title;
            currentTrackSrc = trackObj.src;
        }

        const radioBtn = document.getElementById('radioStationButton');
        if (radioBtn) {
            radioBtn.textContent = `\uD83D\uDCFB Radio: ${station.freq}`;
            radioBtn.title = `${station.name} — ${currentTrackTitle}\nClick: Next Station | Shift+Click: Skip Track | Right-Click: Open Tuner`;
        }

        if (showNotification) {
            this.playRadioTuningEffect();
            if (typeof showToast === 'function') {
                showToast(`\uD83D\uDCFB [${_audioEscapeHtml(station.freq)}] ${_audioEscapeHtml(station.name)}<br><span style="font-size:11px; opacity:0.85;">\u266A ${_audioEscapeHtml(currentTrackTitle)}</span>`, "info");
            }
            if (typeof logMessage === 'function' && typeof currentGameState !== 'undefined' && currentGameState !== 'title_screen') {
                logMessage(`<span style="color:var(--accent-color)">[ SUBSPACE RADIO ]</span> Tuned to <b>${_audioEscapeHtml(station.freq)} - ${_audioEscapeHtml(station.name)}</b> (${_audioEscapeHtml(currentTrackTitle)})`);
            }
        }

        if (!this.enabled || station.type === "OFF") return;

        if (station.type === "DRONE") {
            this.startProceduralDrone();
            return;
        }

        if (station.type === "SYNTH") {
            this.startProceduralDrone();
            this.startGenerativeSynth();
            return;
        }

        if (station.type === "PULSAR") {
            this.startProceduralDrone();
            this.startPulsarAmbient();
            return;
        }

        if (station.type === "SIGNAL") {
            this.startProceduralDrone();
            this.startNumbersStation();
            return;
        }

        if (station.type === "NEWS") {
            this.startProceduralDrone();
            this.startNewsBroadcast();
            return;
        }

        if (station.type === "SHADOW") {
            this.startProceduralDrone();
            this.startShadowDispatch();
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
                this.updateAdaptiveMix();

                this.bgMusic.play().catch(() => {});
            } catch (err) {
                this.bgMusicFailed = true;
                if (this.enabled) this.startProceduralDrone();
            }
        }
    }

    // Cycles stations on 'R', skips tracks on 'Shift + R', or steps backward with step = -1
    nextRadioStation(skipTrackOnly = false, step = 1) {
        if (!this.initialized) this.init();
        if (!this.enabled) this.setMuteState(true);

        const station = this.radioStations[this.currentStationIndex];

        if (skipTrackOnly && station && station.type === "MUSIC" && station.tracks && station.tracks.length > 1) {
            station.trackIndex = ((station.trackIndex || 0) + 1) % station.tracks.length;
            this.playCurrentStation(true);
            return;
        }

        const total = this.radioStations.length;
        this.currentStationIndex = (this.currentStationIndex + step + total) % total;
        this._saveStationPref();

        this.playCurrentStation(true);
    }

    autoAdvanceTrack() {
        const station = this.radioStations[this.currentStationIndex];
        if (!station || station.type !== "MUSIC" || !station.tracks || station.tracks.length === 0) return;

        // BUG FIX: Seamlessly loop 1-track stations without resetting bgMusic.src or re-fetching the MP3
        if (station.tracks.length === 1 && this.bgMusic && !this.bgMusicFailed) {
            this.bgMusic.currentTime = 0;
            this.bgMusic.play().catch(() => {});
            return;
        }

        station.trackIndex = ((station.trackIndex || 0) + 1) % station.tracks.length;
        this.playCurrentStation(true);
    }

    // ==========================================
    // --- 91.2 FM: PROCEDURAL VOID SYNTHWAVE ---
    // ==========================================

    startGenerativeSynth() {
        if (this.synthTimer) return;

        // D Dorian space-ambient chord progressions (Hz)
        const chords = [
            [146.83, 220.00, 261.63, 329.63, 440.00], // Dm9
            [130.81, 196.00, 246.94, 293.66, 392.00], // Cmaj9
            [116.54, 174.61, 220.00, 261.63, 349.23], // Bbmaj9
            [110.00, 164.81, 196.00, 246.94, 329.63]  // Am9
        ];

        const playSynthPulse = () => {
            if (!this.enabled || document.hidden || !this.ctx || this.ctx.state !== 'running') return;
            const st = this.radioStations[this.currentStationIndex];
            if (!st || st.type !== "SYNTH") return;

            const isStealthed = typeof isSilentRunning !== 'undefined' && isSilentRunning;
            const inCombat = typeof currentGameState !== 'undefined' && currentGameState === 'combat';
            const chord = chords[this._synthChordIndex % chords.length];

            const stepInBar = this._synthStep % 8;
            const musicScale = Math.max(0.02, (this.musicVolume / 0.30) * (isStealthed ? 0.35 : 0.75));

            if (stepInBar === 0) {
                this._playAmbientNote(chord[0] * 0.5, 'triangle', 3.4, 0.09 * musicScale, 320);
                this._playAmbientNote(chord[1], 'sine', 3.2, 0.045 * musicScale, 600);
            }

            const noteDensity = isStealthed ? 0.35 : (inCombat ? 0.90 : 0.65);
            if (Math.random() < noteDensity) {
                const noteIdx = (stepInBar + Math.floor(Math.random() * 2)) % chord.length;
                const octaveBoost = (Math.random() < 0.25 && !isStealthed) ? 2 : 1;
                const freq = chord[noteIdx] * octaveBoost;
                const wave = inCombat ? 'sawtooth' : 'sine';
                const cutoff = isStealthed ? 450 : (inCombat ? 1100 : 850);
                this._playAmbientNote(freq, wave, inCombat ? 0.45 : 1.15, 0.055 * musicScale, cutoff);
            }

            this._synthStep++;
            if (this._synthStep % 8 === 0) {
                this._synthChordIndex = (this._synthChordIndex + 1) % chords.length;
            }
        };

        playSynthPulse();
        this.synthTimer = setInterval(playSynthPulse, 550);
    }

    // ==========================================
    // --- 94.8 FM: PULSAR TELEMETRY AMBIENT ---
    // ==========================================

    startPulsarAmbient() {
        if (this.pulsarTimer) return;

        // C Lydian shimmering astrometric intervals (Hz)
        const lydianScale = [261.63, 293.66, 329.63, 369.99, 392.00, 440.00, 493.88, 523.25, 587.33, 659.25];

        const playPulsarStep = () => {
            if (!this.enabled || document.hidden || !this.ctx || this.ctx.state !== 'running') return;
            const st = this.radioStations[this.currentStationIndex];
            if (!st || st.type !== "PULSAR") return;

            const isStealthed = typeof isSilentRunning !== 'undefined' && isSilentRunning;
            const inCombat = typeof currentGameState !== 'undefined' && currentGameState === 'combat';
            const scale = Math.max(0.02, (this.musicVolume / 0.30) * (isStealthed ? 0.35 : 0.70));

            // Soft rhythmic pulsar radio-tick every beat (inspired by PSR B0329+54 sonification)
            if (!isStealthed && (this._pulsarStep % 2 === 0 || inCombat)) {
                this._playAmbientNote(inCombat ? 196.0 : 130.81, 'triangle', 0.11, 0.032 * scale, 520);
            }

            // Glassy Lydian starlight chimes
            if (this._pulsarStep % 4 === 0 || Math.random() < (isStealthed ? 0.20 : 0.45)) {
                const note = lydianScale[Math.floor(Math.random() * lydianScale.length)];
                const oct = Math.random() < 0.30 ? 2 : 1;
                this._playAmbientNote(note * oct, 'sine', 2.4, 0.048 * scale, 1400);
            }

            // Occasional harmonic fifth pad swell
            if (this._pulsarStep % 12 === 0) {
                this._playAmbientNote(130.81, 'sine', 4.5, 0.06 * scale, 360);
                this._playAmbientNote(196.00, 'triangle', 4.2, 0.035 * scale, 480);
            }

            this._pulsarStep++;
        };

        playPulsarStep();
        this.pulsarTimer = setInterval(playPulsarStep, 720);
    }

    _playAmbientNote(freq, type, durSec, vol, cutoffFreq = 700) {
        if (!this.ctx || this.ctx.state !== 'running' || this._activeVoices >= this._maxVoices) return;
        let voiceCounted = false;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const filter = this.ctx.createBiquadFilter();
            const gain = this.ctx.createGain();

            osc.type = type || 'sine';
            osc.frequency.setValueAtTime(Math.max(24, Math.min(8000, freq)), now);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(Math.max(80, cutoffFreq), now);
            filter.Q.setValueAtTime(1.2, now);

            const safeVol = Math.max(0.0001, Math.min(0.35, vol));
            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.linearRampToValueAtTime(safeVol, now + Math.min(0.06, durSec * 0.2));
            gain.gain.exponentialRampToValueAtTime(0.0001, now + durSec);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ambientGain || this.masterGain);

            this._activeVoices++;
            voiceCounted = true;
            osc.onended = () => {
                this._activeVoices = Math.max(0, this._activeVoices - 1);
                try { osc.disconnect(); filter.disconnect(); gain.disconnect(); } catch (e) {}
            };

            osc.start(now);
            osc.stop(now + durSec + 0.02);
        } catch (e) {
            if (voiceCounted) this._activeVoices = Math.max(0, this._activeVoices - 1);
        }
    }

    // ==========================================
    // --- 74.4 AM: PRECURSOR NUMBERS STATION ---
    // ==========================================

    triggerNumbersTransmission(forceLog = false) {
        if (!this.enabled || document.hidden) return;
        const st = this.radioStations[this.currentStationIndex];
        if (!forceLog && (!st || st.type !== "SIGNAL")) return;
        if (!forceLog && (typeof currentGameState === 'undefined' || currentGameState !== 'galactic_map')) return;

        // Eerie 4-tone Precursor harmonic sequence + subtle shortwave static
        const motif = [523.25, 622.25, 783.99, 466.16]; // C5 - Eb5 - G5 - Bb4
        const musicScale = Math.max(0.04, Math.min(0.22, (this.musicVolume / 0.30) * 0.10));
        this.playNoise(0.22, musicScale * 0.6, 1400, 0, 'bandpass', true);
        motif.forEach((f, idx) => {
            this.playTone(f, 'sine', 220, musicScale, f * 0.995, idx * 240);
        });

        const transmissions = [
            `"39... 17... 39... 17... HARMONIC CONDUIT OPEN... BRING THE COMPASS..."`,
            `"ZERO-FOUR-SEVEN... SILENTIUM RELAY [280, 240]... THE FIRST CHORD ENDURES..."`,
            `"THREE SHARDS MAKE ONE SEXTANT... DO NOT SELL THE GLASS... ASSEMBLE IN TRANSIT..."`,
            `"XERXES LAYER ONE... RULED BY WHAT HAS NO WEIGHT... SPIRE RESONANCE DOUBLES MEMORY..."`,
            `"OBSIDIAN MONOLITH [-20, -35]... DO NOT TOUCH THE CORE WITHOUT VOID-EYES..."`,
            `"CHOIR SPIRE ALPHA [-115, -145]... OFFER ONE CRYSTAL TO HEAR THE HYMN..."`,
            `"WHISPERING PRISM [-85, -220]... ALIGN PRIME-FOCUS OPTICS TO SPLIT THE VOID..."`,
            `"CALLSIGN HESPERIA [-145, 185]... 2144 CE MOTIVATOR COLD... ARCHIVE INTACT..."`,
            `"WARNING: GRAVIMETRIC WELLS OBEY THE NAV-CORE... RIDE THE ERGOSPHERE..."`,
            `"CALLSIGN ARCHIVIST... HULL GRAVEYARD [-240, -260]... WE TRADE IN FORGOTTEN LIGHT..."`,
            `"PORT NOMAD BEACON [15, 210]... PROMETHIUM RESERVES NOMINAL... NO PILOT LEFT BEHIND..."`,
            `"SIGNAL ECHO: MACHINE WORLD ICE-WALLS REQUIRE QUANTUM SLICERS... PROCEED WITH CAUTION..."`
        ];

        const fresh = transmissions.filter(t => !this._recentSignals.includes(t));
        const pool = fresh.length > 0 ? fresh : transmissions;
        const picked = pool[Math.floor(Math.random() * pool.length)];

        this._recentSignals.push(picked);
        if (this._recentSignals.length > 6) this._recentSignals.shift();

        // Subtle immersion reward: occasionally decrypts Precursor lore on intercept
        if (typeof unlockLoreEntry === 'function' && Math.random() < 0.25) {
            if (picked.includes("FIRST CHORD")) unlockLoreEntry("PRECURSOR_ORIGINS");
            else unlockLoreEntry("XENO_PRECURSORS");
        }

        if (typeof logMessage === 'function') {
            logMessage(`<span style="color:#DDA0DD">[ 74.4 AM BEACON ]</span> <i>${_audioEscapeHtml(picked)}</i>`);
        }
    }

    startNumbersStation() {
        this.signalInitialTimeout = setTimeout(() => this.triggerNumbersTransmission(false), 3500);
        this.signalTimer = setInterval(() => this.triggerNumbersTransmission(false), 38000);
    }

    // ==========================================
    // --- 66.6 AM: ECLIPSE SHADOW DISPATCH ---
    // ==========================================

    triggerShadowDispatch(forceLog = false) {
        if (!this.enabled || document.hidden) return;
        const st = this.radioStations[this.currentStationIndex];
        if (!forceLog && (!st || st.type !== "SHADOW")) return;
        if (!forceLog && (typeof currentGameState === 'undefined' || currentGameState !== 'galactic_map')) return;

        // Low encrypted cipher handshake blip
        this.playTone(311.13, 'sawtooth', 75, 0.08, 233.08, 0);
        this.playTone(466.16, 'triangle', 95, 0.08, 311.13, 85);

        const dispatches = [
            `"Shadow Network Advisory: Port Erebus [-175, -80] Forger terminal online. Clean slates cheaper than SEC-COM fines."`,
            `"Dead-drop chatter: The Sunken Compass [-290, 95] is buying Xeno-Antiques and selling cheap Nano-Repair Kits."`,
            `"Blockade Runner Tip: Toggle Silent Running [Q] before entering Concord lanes—vent heat before hitting 5."`,
            `"Station Umbra [-450, 150] engineers are converting salvaged Tech Parts into Obsidian Tear Plating around the clock."`,
            `"Cartel Protocol: Earn 50+ Eclipse Standing and roaming Void Vultures will stand down and salute your hull."`,
            `"Black Market Wire: Foreign contraband fenced at Shadow Brokers fetches triple base value—never flip local stock."`,
            `"Rumor out of The Rusty Anchor: An Unshackled AI core is still sitting in bay three for any captain with nerve."`
        ];

        // Live Contraband Trade Route Tip via LocationUtils
        if (typeof LocationUtils !== 'undefined' && typeof LocationUtils.findBestTradeRoutes === 'function') {
            const hotRoutes = LocationUtils.findBestTradeRoutes({ limit: 4, onlyDiscovered: false, includeIllegal: true })
                .filter(r => r.illegal);
            if (hotRoutes.length > 0) {
                const r = hotRoutes[Math.floor(Math.random() * hotRoutes.length)];
                dispatches.push(`"HOT ROUTE: Move ${r.itemName} from ${r.from} [${r.fromCoords.x}, ${-r.fromCoords.y}] to ${r.to} [${r.toCoords.x}, ${-r.toCoords.y}] for ~+${r.profitPerUnit}c/unit."`);
            }
        }

        if (typeof playerNotoriety !== 'undefined' && playerNotoriety >= 10) {
            dispatches.push(`"HEAT WARNING: Your warrant count sits at ${playerNotoriety}. Pop a Sensor Decoy or visit The Forger before docking at Concord hubs."`);
        }

        if (typeof playerCargo !== 'undefined' && (playerCargo['HOT_CARGO'] || 0) > 0) {
            dispatches.push(`"PRIORITY BURST: Tracked Concord cores detected in your hold! Stay dark [Q]—Aegis interceptors are sweeping your vector."`);
        }

        const fresh = dispatches.filter(d => !this._recentShadow.includes(d));
        const pool = fresh.length > 0 ? fresh : dispatches;
        const msg = pool[Math.floor(Math.random() * pool.length)];

        this._recentShadow.push(msg);
        if (this._recentShadow.length > 5) this._recentShadow.shift();

        if (typeof unlockLoreEntry === 'function' && Math.random() < 0.20) {
            unlockLoreEntry("FACTION_SHADOW_NETWORK");
        }

        if (typeof logMessage === 'function') {
            logMessage(`<span style="color:#9933FF">[ 66.6 AM SHADOW WIRE ]</span> <i>${_audioEscapeHtml(msg)}</i>`);
        }
    }

    startShadowDispatch() {
        this.shadowInitialTimeout = setTimeout(() => this.triggerShadowDispatch(false), 3800);
        this.shadowTimer = setInterval(() => this.triggerShadowDispatch(false), 42000);
    }

    // ==========================================
    // --- 1620 AM: CONCORD NEWS NETWORK ---
    // ==========================================

    triggerNewsBulletin(forceLog = false) {
        if (!this.enabled || document.hidden) return;
        const st = this.radioStations[this.currentStationIndex];
        if (!forceLog && (!st || st.type !== "NEWS")) return;
        if (!forceLog && (typeof currentGameState === 'undefined' || currentGameState !== 'galactic_map')) return;

        // Teletype news jingle
        this.playTone(880, 'sine', 60, 0.08, null, 0);
        this.playTone(1320, 'sine', 60, 0.08, null, 80);
        this.playTone(1760, 'sine', 120, 0.08, null, 160);

        const headlines = [
            `"Concord Nav-Com reminds all pilots: keep your transponders active in Core Sectors."`,
            `"Fuel Rats Collective reports record rescues this cycle. Broadcast [Z] if stranded—and tip your tug pilot!"`,
            `"Astrometric Advisory: High gravimetric shear detected near deep-space singularities."`,
            `"Aegis Command warns independent haulers to avoid unmarked syndicate wagering buoys."`,
            `"University of Cygnus Prime [85, 65] announces open grants for Pulsar, Magnetar, and Quasar spectroscopy."`,
            `"Frothy Moon Outpost [58, -8] reports clear skies and fresh dark synth-ale on tap for deep-sky astronomers."`,
            `"Xy-Corp's Helios Refinery [-55, -110] posts record alloy smelting yields—Water and Food imports in high demand."`,
            `"Kepler Listening Post [-68, 42] offers priority payouts for recovered Syndicate Ledgers and Encrypted Data."`,
            `"Valkyrie Drift [135, -120] miners report rich platinum seams—fresh ale and droid servos trading at steep premiums."`,
            `"Solitude Research Platform [165, -175] opens bio-dome trade bays for outer-rim geneticists and couriers."`,
            `"Ceti Alpha Shipyards [-90, 130] drydocks operating at peak output—raw Platinum Ore and Rare Metals wanted."`,
            `"SEC-COM Advisory: Automated Terran War mines remain active in outer-rim trade corridors."`
        ];

        // Live Dynamic Telemetry Headlines
        if (typeof activeMarketTrend !== 'undefined' && activeMarketTrend && typeof COMMODITIES !== 'undefined') {
            const item = COMMODITIES[activeMarketTrend.item]?.name || activeMarketTrend.item;
            const status = activeMarketTrend.isBoom ? "CRITICAL SHORTAGE" : "MARKET SURPLUS";
            headlines.push(`"MARKET TICKER: ${status} of ${item} reported at ${activeMarketTrend.station}."`);
        }
        if (typeof playerActiveBounty !== 'undefined' && playerActiveBounty) {
            headlines.push(`"SEC-COM BOLO: High-value target ${playerActiveBounty.targetName} last tracked near [${playerActiveBounty.x}, ${-playerActiveBounty.y}]."`);
        }
        if (typeof playerActiveMission !== 'undefined' && playerActiveMission && !playerActiveMission.isComplete) {
            headlines.push(`"DISPATCH REMINDER: Contract '${playerActiveMission.title}' remains open on regional boards."`);
        }
        if (typeof playerNotoriety !== 'undefined' && playerNotoriety > 15) {
            const shipTitle = (typeof playerShip !== 'undefined' && playerShip.name) ? playerShip.name : 'an unidentified vessel';
            headlines.push(`"SECURITY ALERT: Aegis patrols are actively hunting outlaw Captain ${typeof playerName !== 'undefined' ? playerName : ''} aboard ${shipTitle}..."`);
        }
        if (typeof activeSkirmishes !== 'undefined' && Array.isArray(activeSkirmishes) && activeSkirmishes.length > 0) {
            const sk = activeSkirmishes[0];
            headlines.push(`"WARZONE FLASH: Active fleet engagement reported between Concord and ${sk.factionB} forces near [${sk.x}, ${-sk.y}]!"`);
        }
        if (typeof GameState !== 'undefined' && GameState.world && GameState.world.factionOffsets) {
            const offsets = GameState.world.factionOffsets;
            if (offsets.KTHARR < 20) {
                headlines.push(`"BORDER WATCH: K'tharr Ascendancy patrols have pushed westward to Macro-Sector ${offsets.KTHARR}."`);
            }
            if (offsets.ECLIPSE > -20) {
                headlines.push(`"CRIME DESK: Eclipse Cartel shadow-ports have expanded eastward to Macro-Sector ${offsets.ECLIPSE}."`);
            }
        }
        if (typeof playerColonies !== 'undefined') {
            const cols = Object.values(playerColonies).filter(c => c && c.established);
            cols.forEach(c => {
                if ((c.storage && (c.storage.FOOD_SUPPLIES || 0) <= 0)) {
                    headlines.push(`"COLONIAL ALERT: Emergency famine broadcast received from ${c.name} at [${c.x}, ${-c.y}]!"`);
                } else if (c.treasury >= 2000) {
                    headlines.push(`"COMMERCE WIRE: Boom cycle at frontier settlement ${c.name}—substantial tax tariffs awaiting governor pickup."`);
                }
            });
        }
        if (typeof window.activeProbes !== 'undefined' && Array.isArray(window.activeProbes) && window.activeProbes.length > 0) {
            const p = window.activeProbes[0];
            headlines.push(`"TELEMETRY RELAY: Autonomous sensor probe active at [${p.x}, ${-p.y}]. Data packets ready for pickup."`);
        }

        const fresh = headlines.filter(h => !this._recentNews.includes(h));
        const pool = fresh.length > 0 ? fresh : headlines;
        const msg = pool[Math.floor(Math.random() * pool.length)];

        this._recentNews.push(msg);
        if (this._recentNews.length > 6) this._recentNews.shift();

        if (typeof logMessage === 'function') {
            logMessage(`<span style="color:var(--gold-text)">[ 1620 AM NEWS ]</span> <i>${_audioEscapeHtml(msg)}</i>`);
        }
    }

    startNewsBroadcast() {
        this.newsInitialTimeout = setTimeout(() => this.triggerNewsBulletin(false), 4000);
        this.newsTimer = setInterval(() => this.triggerNewsBulletin(false), 45000);
    }

    // ==========================================
    // --- PROCEDURAL HULL DRONE (CLICK-FREE) ---
    // ==========================================

    startProceduralDrone() {
        if (!this.enabled) return;
        if (!this.initialized) this.init();
        if (!this.ctx || this.ambientNodes) return;

        if (this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }

        try {
            const now = this.ctx.currentTime;
            const profile = this._getFactionDroneProfile();
            this._lastFactionTone = profile.key;

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

            osc1.frequency.setValueAtTime(profile.root, now);
            osc2.frequency.setValueAtTime(profile.fifth, now);
            osc2.detune.setValueAtTime(6, now);
            subOsc.frequency.setValueAtTime(profile.sub, now);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(profile.cutoff, now);
            filter.Q.setValueAtTime(profile.q || 1.5, now);

            lfo.type = 'sine';
            lfo.frequency.setValueAtTime(0.125, now);
            lfoGain.gain.setValueAtTime(110, now);

            padGain.gain.setValueAtTime(0.0001, now);
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
            this.updateAdaptiveMix();
        } catch (e) {}
    }

    stopProceduralDrone() {
        if (!this.ambientNodes) return;
        const nodes = this.ambientNodes;
        this.ambientNodes = null;

        try {
            const isRunning = this.ctx && this.ctx.state === 'running';
            const now = this.ctx ? this.ctx.currentTime : 0;
            const stopAt = isRunning ? (now + 0.045) : now;

            if (this.ctx && nodes.padGain) {
                nodes.padGain.gain.cancelScheduledValues(now);
                if (isRunning) {
                    nodes.padGain.gain.setValueAtTime(Math.max(0.0001, nodes.padGain.gain.value || 0.01), now);
                    nodes.padGain.gain.exponentialRampToValueAtTime(0.0001, stopAt);
                } else {
                    nodes.padGain.gain.setValueAtTime(0.0001, now);
                }
            }

            nodes.osc1.stop(stopAt + 0.005);
            nodes.osc2.stop(stopAt + 0.005);
            if (nodes.subOsc) nodes.subOsc.stop(stopAt + 0.005);
            nodes.lfo.stop(stopAt + 0.005);

            setTimeout(() => {
                try {
                    nodes.padGain.disconnect();
                    nodes.osc1.disconnect();
                    nodes.osc2.disconnect();
                    if (nodes.subOsc) nodes.subOsc.disconnect();
                    nodes.filter.disconnect();
                    nodes.lfo.disconnect();
                    nodes.lfoGain.disconnect();
                } catch (e) {}
            }, 70);
        } catch (e) {}
    }

    // ==========================================
    // --- INTERACTIVE RADIO TUNER MODAL ---
    // ==========================================

    openRadioTuner() {
        if (typeof openGenericModal !== 'function') {
            this.nextRadioStation(false);
            return;
        }
        const sysMenu = document.getElementById('systemMenu');
        if (sysMenu) sysMenu.classList.add('hidden');

        openGenericModal("SUBSPACE RADIO RECEIVER");
        const listEl = document.getElementById('genericModalList');
        const detailEl = document.getElementById('genericDetailContent');
        const actionsEl = document.getElementById('genericModalActions');
        if (!listEl || !detailEl || !actionsEl) return;

        const info = this.getCurrentStationInfo();
        const profile = this._getFactionDroneProfile();
        const isStealthed = typeof isSilentRunning !== 'undefined' && isSilentRunning;
        const inCombat = typeof currentGameState !== 'undefined' && currentGameState === 'combat';
        const mixState = !this.enabled ? "MUTED" : (isStealthed ? "SILENT DUCKING (45%)" : (inCombat ? "COMBAT MIX (75%)" : "NOMINAL (100%)"));

        listEl.innerHTML = `<div class="trade-list-header" style="color:var(--accent-color); font-size:10px; letter-spacing:2px; border-bottom:1px solid #333;">AVAILABLE FREQUENCIES (${this.radioStations.length})</div>`;

        this.radioStations.forEach((st, idx) => {
            const isActive = idx === this.currentStationIndex;
            const subLabel = (st.type === "MUSIC" && st.tracks && st.tracks.length > 0)
                ? `${st.tracks.length} Track${st.tracks.length > 1 ? 's' : ''}`
                : (st.type === "PULSAR" || st.type === "SYNTH" ? "PROCEDURAL SYNTH" : st.type);

            const row = document.createElement('div');
            row.className = 'trade-item-row';
            row.style.cursor = 'pointer';
            if (isActive) {
                row.style.background = 'rgba(0, 224, 224, 0.12)';
                row.style.borderLeft = '3px solid var(--accent-color)';
            }
            row.innerHTML = `
                <div>
                    <div style="color:${isActive ? 'var(--accent-color)' : 'var(--item-name-color)'}; font-weight:bold; font-size:12px;">${isActive ? '▶ ' : ''}${_audioEscapeHtml(st.freq)} — ${_audioEscapeHtml(st.name)}</div>
                    <div style="color:var(--item-desc-color); font-size:10px; margin-top:3px;">${_audioEscapeHtml(subLabel)}</div>
                </div>
            `;
            row.onclick = () => {
                this.tuneToStation(idx, true);
                this.openRadioTuner();
            };
            listEl.appendChild(row);
        });

        // Multi-track playlist selector for MUSIC stations with 2+ tracks
        let trackListHtml = '';
        if (info.type === "MUSIC" && info.tracks.length > 1) {
            trackListHtml = `
                <div class="trade-math-area" style="text-align:left; margin-top:10px;">
                    <div style="font-size:10px; color:var(--gold-text); letter-spacing:1px; margin-bottom:6px; border-bottom:1px solid #333; padding-bottom:4px;">STATION PLAYLIST</div>
                    ${info.tracks.map((tr, tIdx) => {
                        const playing = tIdx === info.trackIndex;
                        return `<div onclick="soundManager.selectTrack(${info.index}, ${tIdx}); soundManager.openRadioTuner();" style="cursor:pointer; padding:5px 6px; font-size:11px; border-radius:3px; margin-bottom:3px; background:${playing ? 'rgba(0,224,224,0.12)' : 'transparent'}; color:${playing ? 'var(--accent-color)' : 'var(--text-color)'}; font-weight:${playing ? 'bold' : 'normal'};">
                            ${playing ? '▶ ' : `${tIdx + 1}. `}${_audioEscapeHtml(tr.title)}
                        </div>`;
                    }).join('')}
                </div>
            `;
        }

        detailEl.innerHTML = `
            <div style="text-align:center; padding: 12px 10px;">
                <div style="font-size:42px; margin-bottom:8px; filter: drop-shadow(0 0 12px var(--accent-color));">\uD83D\uDCFB</div>
                <div style="font-size:10px; color:var(--accent-color); letter-spacing:2px; margin-bottom:4px;">ACTIVE FREQUENCY</div>
                <h3 style="color:var(--item-name-color); margin:0 0 6px 0;">${_audioEscapeHtml(info.freq)} — ${_audioEscapeHtml(info.name)}</h3>
                <div style="font-size:12px; color:var(--gold-text); margin-bottom:12px;">\u266A ${_audioEscapeHtml(info.trackTitle)}</div>

                <div style="display:flex; justify-content:space-between; font-size:10px; background:rgba(0,0,0,0.3); border:1px solid var(--border-color); padding:6px 10px; border-radius:4px; margin-bottom:12px;">
                    <span style="color:var(--item-desc-color);">CARRIER: <b style="color:var(--accent-color);">${_audioEscapeHtml(profile.faction)}</b></span>
                    <span style="color:var(--item-desc-color);">MIX: <b style="color:${this.enabled ? 'var(--success)' : 'var(--danger)'};">${mixState}</b></span>
                </div>

                <div class="trade-math-area" style="text-align:left;">
                    <div style="font-size:10px; color:var(--accent-color); letter-spacing:1px; margin-bottom:8px; border-bottom:1px solid #333; padding-bottom:4px;">AUDIO MIXER</div>
                    <div class="trade-stat-row" style="align-items:center;">
                        <span>Master Gain (${Math.round(this.masterVolume * 100)}%):</span>
                        <input type="range" min="0" max="1" step="0.05" value="${this.masterVolume}" style="width:120px; accent-color:var(--accent-color); cursor:pointer;" oninput="soundManager.setMasterVolume(this.value); this.previousElementSibling.textContent='Master Gain ('+Math.round(this.value*100)+'%):';">
                    </div>
                    <div class="trade-stat-row" style="align-items:center; margin-top:8px;">
                        <span>Radio / Ambient (${Math.round(this.musicVolume * 100)}%):</span>
                        <input type="range" min="0" max="1" step="0.05" value="${this.musicVolume}" style="width:120px; accent-color:var(--accent-color); cursor:pointer;" oninput="soundManager.setMusicVolume(this.value); this.previousElementSibling.textContent='Radio / Ambient ('+Math.round(this.value*100)+'%):';">
                    </div>
                    <div class="trade-stat-row" style="align-items:center; margin-top:8px;">
                        <span>SFX Gain (${Math.round(this.sfxVolume * 100)}%):</span>
                        <input type="range" min="0" max="1" step="0.05" value="${this.sfxVolume}" style="width:120px; accent-color:var(--accent-color); cursor:pointer;" oninput="soundManager.setSfxVolume(this.value); this.previousElementSibling.textContent='SFX Gain ('+Math.round(this.value*100)+'%):';">
                    </div>
                </div>

                ${trackListHtml}

                <p style="font-size:11px; color:var(--item-desc-color); line-height:1.5; margin-top:10px; text-align:left;">
                    Tip: Press <b>R</b> during flight to cycle stations, <b>Shift+R</b> to skip tracks, or <b>Alt+R</b> to open this receiver.
                </p>
            </div>
        `;

        let btns = `
            <div style="display:flex; gap:8px; margin-bottom:8px;">
                <button class="action-button" style="flex:1; margin:0; padding:8px; font-size:11px; border-color:var(--accent-color); color:var(--accent-color);" onclick="soundManager.nextRadioStation(false, -1); soundManager.openRadioTuner();">◀ PREV</button>
                <button class="action-button" style="flex:1; margin:0; padding:8px; font-size:11px; border-color:var(--accent-color); color:var(--accent-color);" onclick="soundManager.nextRadioStation(false, 1); soundManager.openRadioTuner();">NEXT ▶</button>
            </div>
        `;

        if (info.type === "MUSIC" && info.trackCount > 1) {
            btns += `<button class="action-button" style="border-color:var(--gold-text); color:var(--gold-text);" onclick="soundManager.nextRadioStation(true); soundManager.openRadioTuner();">⏭ SKIP TRACK</button>`;
        } else if (info.type === "NEWS") {
            btns += `<button class="action-button" style="border-color:var(--gold-text); color:var(--gold-text);" onclick="soundManager.triggerNewsBulletin(true);">📡 REQUEST LIVE BULLETIN</button>`;
        } else if (info.type === "SHADOW") {
            btns += `<button class="action-button" style="border-color:#9933FF; color:#DDA0DD;" onclick="soundManager.triggerShadowDispatch(true);">🕶️ DECRYPT SHADOW WIRE</button>`;
        } else if (info.type === "SIGNAL") {
            btns += `<button class="action-button" style="border-color:#DDA0DD; color:#DDA0DD;" onclick="soundManager.triggerNumbersTransmission(true);">🌀 INTERCEPT SUBSPACE BURST</button>`;
        }

        btns += `
            <div style="display:flex; gap:8px; margin-bottom:8px;">
                <button class="action-button" style="flex:1; margin:0; padding:8px; font-size:11px;" onclick="soundManager.playSuccessChime();">🔊 TEST SFX</button>
                <button class="action-button" style="flex:1; margin:0; padding:8px; font-size:11px;" onclick="soundManager.toggleMute(); soundManager.openRadioTuner();">${this.enabled ? '🔇 MUTE ALL' : '🔊 UNMUTE'}</button>
            </div>
            <button class="action-button" style="border-color:#888; color:#888;" onclick="closeGenericModal()">CLOSE RECEIVER</button>
        `;

        actionsEl.innerHTML = btns;
    }

    // ==========================================
    // --- MUTE & THROTTLING CONTROLS ---
    // ==========================================

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
            this._stopAllStationTimers();
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
        if (!this.enabled || document.hidden) return;
        if (!this.initialized) this.init();
        if (!this.ctx) return;
        this._ensureContextRunning();

        // Never queue oscillators onto a suspended context (prevents burst replay on first click)
        if (this.ctx.state !== 'running') return;
        if (this._activeVoices >= this._maxVoices) return;

        let voiceCounted = false;
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

            this._activeVoices++;
            voiceCounted = true;
            osc.onended = () => {
                this._activeVoices = Math.max(0, this._activeVoices - 1);
                try { osc.disconnect(); gain.disconnect(); } catch (e) {}
            };

            osc.start(startTime);
            osc.stop(stopTime + 0.005);
        } catch (err) {
            if (voiceCounted) this._activeVoices = Math.max(0, this._activeVoices - 1);
        }
    }

    playNoise(duration, vol = 1, cutoffFreq = 800, delayMs = 0, filterType = 'lowpass', usePink = false) {
        if (!this.enabled || document.hidden) return;
        if (!this.initialized) this.init();
        const chosenBuffer = (usePink && this.pinkNoiseBuffer) ? this.pinkNoiseBuffer : this.noiseBuffer;
        if (!this.ctx || !chosenBuffer) return;
        this._ensureContextRunning();

        if (this.ctx.state !== 'running') return;
        if (this._activeVoices >= this._maxVoices) return;

        let voiceCounted = false;
        try {
            const durSec = Math.min(2.0, Math.max(0.02, Number(duration) || 0.2));
            const delaySec = Math.max(0, (Number(delayMs) || 0) / 1000);
            const safeVol = Math.max(0.0001, Math.min(1.0, Number(vol) || 0.5));
            const startTime = this.ctx.currentTime + delaySec;
            const stopTime = startTime + durSec;

            const noise = this.ctx.createBufferSource();
            noise.buffer = chosenBuffer;

            const maxOffset = Math.max(0, chosenBuffer.duration - durSec - 0.01);
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

            this._activeVoices++;
            voiceCounted = true;
            noise.onended = () => {
                this._activeVoices = Math.max(0, this._activeVoices - 1);
                try { noise.disconnect(); filter.disconnect(); gain.disconnect(); } catch (e) {}
            };

            noise.start(startTime, randomOffset, durSec);
            noise.stop(stopTime + 0.005);
        } catch (err) {
            if (voiceCounted) this._activeVoices = Math.max(0, this._activeVoices - 1);
        }
    }

    // --- CORE SFX LIBRARY ---
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
        this.playNoise(0.18, 0.25, 1400, 0, 'bandpass', false);
    }
    playExplosion() {
        if (!this._canPlay('explosion', 70)) return;
        this.playNoise(0.55, 0.55, 820, 0, 'lowpass', true);
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
        this.playNoise(0.22, 0.45, 650, 0, 'lowpass', true);
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
        this.playNoise(0.08, isStealthed ? 0.04 : 0.09, isStealthed ? 180 : 320, 0, 'lowpass', true);
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
        this.playNoise(0.12, 0.12, 1200, 40, 'bandpass', false);
    }
    playWarp() {
        if (!this._canPlay('warp', 250)) return;
        this.playTone(180, 'sawtooth', 1400, 0.20, 2200, 0);
        this.playTone(90, 'sine', 1400, 0.25, 880, 0);
        this.playNoise(0.6, 0.20, 900, 150, 'lowpass', true);
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

    // --- EXPANDED PROCEDURAL SFX ---
    playAirlock() {
        if (!this._canPlay('airlock', 250)) return;
        this.playNoise(0.28, 0.24, 1500, 0, 'bandpass', true);
        this.playTone(140, 'triangle', 120, 0.22, 65, 190);
    }
    playJumpComplete() {
        if (!this._canPlay('jumpComplete', 300)) return;
        this.playTone(520, 'sine', 220, 0.16, 260, 0);
        this.playTone(780, 'triangle', 340, 0.14, 1040, 120);
    }
    playTransmission() {
        if (!this._canPlay('transmission', 250)) return;
        this.playTone(1180, 'sine', 45, 0.09, 1480, 0);
        this.playTone(1480, 'sine', 45, 0.09, 1180, 60);
        this.playTone(1760, 'sine', 90, 0.10, null, 125);
    }
    playPowerDown() {
        if (!this._canPlay('powerDown', 200)) return;
        this.playTone(420, 'sawtooth', 380, 0.14, 75, 0);
        this.playTone(210, 'sine', 420, 0.16, 55, 20);
    }
    playPowerUp() {
        if (!this._canPlay('powerUp', 200)) return;
        this.playTone(90, 'sawtooth', 340, 0.12, 440, 0);
        this.playTone(180, 'sine', 380, 0.16, 660, 40);
    }
    playSuccessChime() {
        if (!this._canPlay('successChime', 180)) return;
        this.playTone(523.25, 'sine', 120, 0.14, null, 0);
        this.playTone(659.25, 'sine', 120, 0.14, null, 90);
        this.playTone(783.99, 'sine', 240, 0.16, null, 180);
    }
    playShieldRecharge() {
        if (!this._canPlay('shieldRecharge', 250)) return;
        this.playTone(320, 'sine', 240, 0.12, 740, 0);
        this.playTone(640, 'triangle', 200, 0.08, 1280, 90);
    }
    playDatapad() {
        if (!this._canPlay('datapad', 120)) return;
        this.playTone(1040, 'sine', 45, 0.09, 1320, 0);
        this.playTone(1320, 'sine', 65, 0.08, 1560, 50);
    }
}

const soundManager = new SoundManager();
window.soundManager = soundManager;

// ==========================================
// --- SELF-CONTAINED AUDIO & RADIO HOOKS ---
// ==========================================

(function initAudioHooks() {
    let _lastSilentRunningState = false;

    function hasBlockingOverlayOpen() {
        if (typeof window.UI !== 'undefined' && typeof window.UI.isAnyModalOpen === 'function') {
            return window.UI.isAnyModalOpen();
        }
        const ids = [
            'genericModalOverlay',
            'stationOverlay',
            'xerxesOverlay',
            'codexOverlay',
            'levelUpOverlay',
            'gameOverOverlay',
            'confirmationOverlay'
        ];
        for (let i = 0; i < ids.length; i++) {
            const el = document.getElementById(ids[i]);
            if (el && el.style.display && el.style.display !== 'none') return true;
        }
        return false;
    }

    function checkSilentRunningAudioTransition() {
        if (typeof isSilentRunning === 'undefined') return;
        const current = Boolean(isSilentRunning);
        if (current !== _lastSilentRunningState) {
            _lastSilentRunningState = current;
            if (current) soundManager.playPowerDown();
            else soundManager.playPowerUp();
        }
    }

    if (typeof GameBus !== 'undefined') {
        GameBus.on('HULL_DAMAGED', (data) => {
            if (data && data.amount > 0) soundManager.playHullHit();
        });
        GameBus.on('HULL_REPAIRED', (amount) => {
            if (amount > 0) soundManager.playRepair();
        });
        GameBus.on('TICK_PROCESSED', (tick) => {
            checkSilentRunningAudioTransition();
            soundManager.updateAdaptiveMix();
            if (tick && tick.isMovement && !tick.interrupt) soundManager.playThruster();
        });
        GameBus.on('UI_REFRESH_REQUESTED', () => {
            checkSilentRunningAudioTransition();
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
        let wantsAudio = true;
        try {
            const savedPref = localStorage.getItem('wayfinder_audio_pref');
            wantsAudio = savedPref === null ? true : (savedPref === 'true');
        } catch (e) {}

        soundManager.setMuteState(wantsAudio);

        // 1. Dynamically inject the Subspace Radio button into the System Menu right above Mute Audio
        const soundBtn = document.getElementById('soundButton');
        if (soundBtn && soundBtn.parentNode && !document.getElementById('radioStationButton')) {
            const radioBtn = document.createElement('button');
            radioBtn.id = 'radioStationButton';
            radioBtn.className = 'sys-btn';
            const info = soundManager.getCurrentStationInfo();
            radioBtn.textContent = `\uD83D\uDCFB Radio: ${info.freq}`;
            radioBtn.title = `${info.name} — ${info.trackTitle}\nClick: Next Station | Shift+Click: Skip Track | Right-Click: Open Tuner`;
            radioBtn.onclick = (e) => soundManager.nextRadioStation(Boolean(e && e.shiftKey));
            radioBtn.oncontextmenu = (e) => {
                e.preventDefault();
                soundManager.openRadioTuner();
            };
            soundBtn.parentNode.insertBefore(radioBtn, soundBtn);
        }

        // 2. Patch openHelpMenu() so Radio controls automatically appear in the Command Reference
        if (typeof window.openHelpMenu === 'function' && !window._radioHelpPatched) {
            const origHelp = window.openHelpMenu;
            window.openHelpMenu = function() {
                origHelp.apply(this, arguments);
                const listEl = document.getElementById('genericModalList');
                if (listEl) {
                    listEl.innerHTML += `
                        <div style="padding: 4px 10px 10px 10px; font-size: 12px; color: var(--text-color); line-height: 1.85; border-top: 1px dashed #333; margin-top: 4px;">
                            <span style="color:var(--gold-text); font-weight:bold;">R / SHIFT+R</span> : Cycle Radio / Skip Track<br>
                            <span style="color:var(--gold-text); font-weight:bold;">ALT+R</span> : Open Subspace Radio Receiver
                        </div>
                    `;
                }
            };
            window._radioHelpPatched = true;
        }

        // 3. Self-contained gameplay audio polish (Airlocks, Level-Up Fanfare, Wormhole Arrival, Datapad)
        if (typeof window.openStationView === 'function' && !window._audioDockHooked) {
            const origOpenStation = window.openStationView;
            window.openStationView = function() {
                const stationOverlay = document.getElementById('stationOverlay');
                const wasClosed = !stationOverlay || stationOverlay.style.display !== 'flex';
                origOpenStation.apply(this, arguments);
                if (wasClosed && stationOverlay && stationOverlay.style.display === 'flex') {
                    soundManager.playAirlock();
                }
            };
            window._audioDockHooked = true;
        }

        if (typeof window.closeStationView === 'function' && !window._audioUndockHooked) {
            const origCloseStation = window.closeStationView;
            window.closeStationView = function() {
                const stationOverlay = document.getElementById('stationOverlay');
                const wasOpen = stationOverlay && stationOverlay.style.display === 'flex';
                origCloseStation.apply(this, arguments);
                if (wasOpen) soundManager.playAirlock();
            };
            window._audioUndockHooked = true;
        }

        if (typeof window.renderLevelUpScreen === 'function' && !window._audioLevelUpHooked) {
            const origRenderLvl = window.renderLevelUpScreen;
            window.renderLevelUpScreen = function() {
                origRenderLvl.apply(this, arguments);
                soundManager.playLevelUp();
            };
            window._audioLevelUpHooked = true;
        }

        if (typeof window.executeWormholeJump === 'function' && !window._audioWormholeHooked) {
            const origJump = window.executeWormholeJump;
            window.executeWormholeJump = function() {
                origJump.apply(this, arguments);
                setTimeout(() => soundManager.playJumpComplete(), 550);
            };
            window._audioWormholeHooked = true;
        }

        if (typeof window.interactWithNPC === 'function' && !window._audioHailHooked) {
            const origInteractNpc = window.interactWithNPC;
            window.interactWithNPC = function() {
                soundManager.playHail();
                return origInteractNpc.apply(this, arguments);
            };
            window._audioHailHooked = true;
        }

        // 4. Hover & Typing SFX + 'R' / 'Alt+R' Radio Hotkey Listener
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

            // Never intercept browser reload shortcuts (Ctrl+R / Cmd+R)
            if (e.ctrlKey || e.metaKey) return;

            if (!e.repeat && (e.key === 'r' || e.key === 'R')) {
                if (typeof currentGameState !== 'undefined' && currentGameState === 'galactic_map') {
                    if (hasBlockingOverlayOpen()) return;

                    // Alt+R opens the full Subspace Radio Receiver modal
                    if (e.altKey) {
                        e.preventDefault();
                        soundManager.openRadioTuner();
                        return;
                    }

                    // Yield to 'R' Repair when docked with a damaged hull
                    const loc = typeof getCombinedLocationData === 'function' ? getCombinedLocationData(playerX, playerY) : null;
                    if (loc && typeof playerHull !== 'undefined' && typeof MAX_PLAYER_HULL !== 'undefined' && playerHull < MAX_PLAYER_HULL) {
                        return;
                    }

                    soundManager.nextRadioStation(e.shiftKey);
                }
            }
        });
    });
})();

// --- END OF FILE audio.js ---
