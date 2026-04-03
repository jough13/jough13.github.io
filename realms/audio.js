// =============================================================================
// │ SOUND SYSTEM (Tone.js)                                                    │
// =============================================================================
let soundSynth, noiseSynth, metalSynth;

function initializeSounds() {
    if (typeof Tone === 'undefined') {
        console.warn("Tone.js not loaded. Sounds will be disabled.");
        return;
    }
    if (Tone.context.state !== 'running') {
        Tone.start().catch(e => console.warn("Tone.start() requires user interaction.", e));
    }
    try {
        soundSynth = new Tone.Synth({
            oscillator: { type: "sine" },
            envelope: { attack: 0.005, decay: 0.1, sustain: 0.05, release: 0.1 },
            volume: -20
        }).toDestination();

        noiseSynth = new Tone.NoiseSynth({
            noise: { type: 'white' },
            envelope: { attack: 0.005, decay: 0.05, sustain: 0, release: 0.1 },
            volume: -25
        }).toDestination();

        metalSynth = new Tone.MetalSynth({
            frequency: 50,
            envelope: { attack: 0.001, decay: 0.1, release: 0.1 },
            harmonicity: 3.1,
            modulationIndex: 16,
            resonance: 2000,
            octaves: 0.5,
            volume: -22
        }).toDestination();
    } catch (e) {
        console.error("Error initializing Tone.js synthesizers:", e);
        Tone = undefined; 
    }
}

function playSound(type, note = 'C4', duration = '16n') {
    if (gameState.isMuted || typeof Tone === 'undefined' || !soundSynth) return;
    if (Tone.context.state !== 'running') {
        Tone.start().catch(e => { });
        if (Tone.context.state !== 'running') return;
    }

    const baseTime = Tone.now() + 0.005;

    try {
        switch (type) {
            case 'step':
                if (baseTime - gameState.lastStepSoundTime >= MIN_STEP_SOUND_INTERVAL) {
                    noiseSynth.triggerAttackRelease(duration, baseTime, 0.3);
                    gameState.lastStepSoundTime = baseTime;
                }
                break;
            case 'dust':
                soundSynth.triggerAttackRelease('C6', '32n', baseTime);
                break;
            case 'scrap':
                metalSynth.triggerAttackRelease('8n', baseTime, 0.2);
                break;
            case 'rune':
                soundSynth.triggerAttackRelease('G5', '8n', baseTime);
                soundSynth.triggerAttackRelease('C6', '8n', baseTime + 0.1);
                break;
            case 'artifact':
                soundSynth.triggerAttackRelease('A5', '16n', baseTime);
                soundSynth.triggerAttackRelease('E6', '16n', baseTime + 0.05);
                break;
            case 'tome':
                noiseSynth.triggerAttackRelease("4n", baseTime, 0.1);
                break;
            case 'levelUp':
                soundSynth.triggerAttackRelease('C4', '8n', baseTime);
                soundSynth.triggerAttackRelease('E4', '8n', baseTime + 0.1);
                soundSynth.triggerAttackRelease('G4', '8n', baseTime + 0.2);
                soundSynth.triggerAttackRelease('C5', '4n', baseTime + 0.3);
                break;
            case 'companionFind':
                soundSynth.triggerAttackRelease('B5', '16n', baseTime);
                soundSynth.triggerAttackRelease('D6', '16n', baseTime + 0.07);
                soundSynth.triggerAttackRelease('F#6', '16n', baseTime + 0.14);
                break;
            case 'combatHit':
                metalSynth.triggerAttackRelease('16n', baseTime, 0.5);
                break;
            case 'combatMiss':
                noiseSynth.triggerAttackRelease("16n", baseTime, 0.4);
                break;
            case 'combatVictory':
                soundSynth.triggerAttackRelease('G4', '8n', baseTime);
                soundSynth.triggerAttackRelease('C5', '4n', baseTime + 0.1);
                break;
            case 'combatDefeat':
                soundSynth.triggerAttackRelease('C3', '1n', baseTime);
                break;
            default:
                soundSynth.triggerAttackRelease(note, duration, baseTime);
        }
    } catch (e) {
        // e
    }
}
