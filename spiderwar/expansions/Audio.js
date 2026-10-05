// expansions/Audio.js

// ==========================================
// THE OBSIDIAN BROOD SOUNDTRACK & SYNTH
// ==========================================
// A custom multi-layered Web Audio API Synthesizer designed to 
// create squishy bug noises, ethereal magic, and snappy web attacks.

export const AudioExpansion = {
    init: (game) => {
        let ctx;
        let masterGain;
        let noiseBuffer;
        
        // PERFORMANCE: Polyphony throttle tracker
        const soundThrottle = {};

        // 1. Audio Context Initialization & Browser Unlocking
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext; 
            ctx = new AudioContext();
            
            // Master Volume Mixer (Prevents distortion during massive swarm fights)
            masterGain = ctx.createGain();
            masterGain.gain.value = 0.4; 
            masterGain.connect(ctx.destination);

            // Pre-compute a 2-second white noise buffer for splats and impacts
            const bufferSize = ctx.sampleRate * 2;
            noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }

            // Browsers lock audio until user interaction. This unlocks it cleanly.
            const unlock = () => { 
                if(ctx && ctx.state === 'suspended') ctx.resume(); 
                window.removeEventListener('click', unlock); 
                window.removeEventListener('touchstart', unlock);
            };
            window.addEventListener('click', unlock); 
            window.addEventListener('touchstart', unlock);
        } catch (e) { 
            console.warn('[AudioEngine] Web Audio API not supported/disabled.', e); 
        }

        // ==========================================
        // 2. DATA-DRIVEN SOUND LIBRARY
        // ==========================================
        // Each sound is an array of "Layers". You can stack oscillators and noise!
        const SOUND_LIBRARY = {
            
            // "Thwip!" - High pitched sweeping triangle + sharp white noise burst
            'shoot': [
                { type: 'triangle', freqStart: 900, freqEnd: 200, attack: 0.01, decay: 0.15, vol: 0.06, pitchVar: 100 },
                { type: 'noise', filterFreq: 2500, filterType: 'highpass', attack: 0.01, decay: 0.1, vol: 0.05 }
            ],
            
            // "Schlorp" - Quick low crunch/squish for resource gathering
            'harvest': [
                { type: 'sawtooth', freqStart: 180, freqEnd: 80, attack: 0.01, decay: 0.12, vol: 0.03, pitchVar: 20 },
                { type: 'noise', filterFreq: 800, filterType: 'lowpass', attack: 0.01, decay: 0.08, vol: 0.04 }
            ],
            
            // "SPLAT!" - Heavy low-end crunch with extended noise decay
            'death': [
                { type: 'square', freqStart: 120, freqEnd: 40, attack: 0.01, decay: 0.3, vol: 0.05, pitchVar: 15 },
                { type: 'noise', filterFreq: 600, filterType: 'lowpass', attack: 0.01, decay: 0.4, vol: 0.08 }
            ],
            
            // "Wub-wub-wub" - Ethereal, layered magical frequencies
            'spell': [
                { type: 'sine', freqStart: 400, freqEnd: 600, attack: 0.1, decay: 0.7, vol: 0.08, pitchVar: 50 },
                { type: 'sine', freqStart: 1200, freqEnd: 1600, attack: 0.2, decay: 0.9, vol: 0.04, pitchVar: 100 },
                { type: 'triangle', freqStart: 200, freqEnd: 300, attack: 0.05, decay: 0.5, vol: 0.05, pitchVar: 20 }
            ],
            
            // "Thud" - Building dropping onto the dirt
            'build': [
                { type: 'triangle', freqStart: 200, freqEnd: 80, attack: 0.02, decay: 0.25, vol: 0.06, pitchVar: 30 },
                { type: 'noise', filterFreq: 400, filterType: 'lowpass', attack: 0.01, decay: 0.15, vol: 0.03 }
            ],

            // --- NEW SOUNDS ADDED FOR UI & BOSSES ---

            // "Bzzzt" - Low negative buzz for invalid actions/cannot afford
            'error': [
                { type: 'sawtooth', freqStart: 120, freqEnd: 100, attack: 0.01, decay: 0.15, vol: 0.05 }
            ],

            // "Ding" - High, clean chime for UI clicks and Minimap commands
            'ping': [
                { type: 'sine', freqStart: 1200, freqEnd: 1200, attack: 0.01, decay: 0.3, vol: 0.05, pitchVar: 50 }
            ],

            // "ROAR!" - Massive, low-frequency, layered monster scream
            'roar': [
                { type: 'sawtooth', freqStart: 150, freqEnd: 40, attack: 0.1, decay: 1.5, vol: 0.1, pitchVar: 20 },
                { type: 'square', freqStart: 100, freqEnd: 30, attack: 0.2, decay: 1.5, vol: 0.08, pitchVar: 20 },
                { type: 'noise', filterFreq: 400, filterType: 'lowpass', attack: 0.1, decay: 1.5, vol: 0.12 }
            ]
        };

        // ==========================================
        // 3. SYNTHESIZER PLAYBACK ENGINE
        // ==========================================
        const playSynthRecipe = (recipeName) => {
            if(!ctx || ctx.state === 'suspended') return;
            const layers = SOUND_LIBRARY[recipeName];
            if (!layers) return;

            const now = ctx.currentTime;

            // PERFORMANCE FIX: Polyphony Throttling
            if (soundThrottle[recipeName] && now - soundThrottle[recipeName] < 0.03) {
                return;
            }
            soundThrottle[recipeName] = now;

            layers.forEach(layer => {
                // 1. Setup Envelope (Gain Node)
                const gainNode = ctx.createGain();
                
                // AUDIO ROBUSTNESS FIX: Explicitly pin values before ramping to prevent Webkit NaN glitches
                gainNode.gain.setValueAtTime(0, now); 
                gainNode.gain.linearRampToValueAtTime(layer.vol, now + layer.attack); 
                gainNode.gain.setValueAtTime(layer.vol, now + layer.attack); // The Safety Pin!
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + layer.attack + layer.decay); 
                gainNode.gain.setValueAtTime(0, now + layer.attack + layer.decay);
                
                // 2. Setup Filter (If requested by the layer)
                let filterNode = null;
                if (layer.filterFreq) {
                    filterNode = ctx.createBiquadFilter();
                    filterNode.type = layer.filterType || 'lowpass';
                    filterNode.frequency.setValueAtTime(layer.filterFreq, now);
                    if (layer.filterQ) filterNode.Q.setValueAtTime(layer.filterQ, now);
                }

                // 3. Setup Sound Source (Noise or Oscillator)
                let sourceNode;
                if (layer.type === 'noise') {
                    sourceNode = ctx.createBufferSource();
                    sourceNode.buffer = noiseBuffer;
                } else {
                    sourceNode = ctx.createOscillator();
                    sourceNode.type = layer.type;
                    
                    const varAmount = layer.pitchVar ? (Math.random() * layer.pitchVar - (layer.pitchVar / 2)) : 0;
                    const startFreq = Math.max(10, layer.freqStart + varAmount); 
                    
                    sourceNode.frequency.setValueAtTime(startFreq, now);
                    if (layer.freqEnd) {
                        const endFreq = Math.max(10, layer.freqEnd + varAmount);
                        sourceNode.frequency.exponentialRampToValueAtTime(endFreq, now + layer.attack + layer.decay);
                    }
                }

                // 4. Audio Routing (Source -> [Filter] -> Envelope -> Master Mixer)
                if (filterNode) {
                    sourceNode.connect(filterNode);
                    filterNode.connect(gainNode);
                } else {
                    sourceNode.connect(gainNode);
                }
                gainNode.connect(masterGain);

                // 5. Play and Cleanup
                sourceNode.start(now);
                sourceNode.stop(now + layer.attack + layer.decay);
            });
        };

        // ==========================================
        // 4. GLOBAL AUDIO API EXPORT
        // ==========================================
        game.audio = {
            // Allows external files/UI to change the volume (0.0 to 1.0)
            setVolume: (val) => { 
                if (masterGain) masterGain.gain.value = Math.max(0, Math.min(1, val)); 
            },
            
            // Allows new Expansion Packs to add custom synth recipes!
            registerSound: (name, recipeArray) => {
                SOUND_LIBRARY[name] = recipeArray;
            },
            
            // Direct playback hook
            play: playSynthRecipe
        };

        // Hook up the GameBus listener
        game.bus.on('playSound', (type) => {
            playSynthRecipe(type);
        });
    }
};
