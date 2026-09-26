// expansions/Audio.js

export const AudioExpansion = {
    init: (game) => {
        let ctx;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext; ctx = new AudioContext();
            const unlock = () => { if(ctx && ctx.state === 'suspended') ctx.resume(); window.removeEventListener('click', unlock); window.removeEventListener('touchstart', unlock);};
            window.addEventListener('click', unlock); window.addEventListener('touchstart', unlock);
        } catch (e) { console.warn('Audio Context disabled'); }
        
        const playTone = (freq, type, duration, vol=0.05) => {
            if(!ctx || ctx.state === 'suspended') return;
            const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.type = type; osc.frequency.setValueAtTime(freq, ctx.currentTime);
            osc.connect(gain); gain.connect(ctx.destination); gain.gain.setValueAtTime(vol, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
            osc.start(); osc.stop(ctx.currentTime + duration);
        };
        game.bus.on('playSound', (type) => {
            if (type === 'shoot') playTone(600, 'square', 0.1, 0.02); 
            if (type === 'harvest') playTone(150, 'sawtooth', 0.1, 0.05); 
            if (type === 'death') playTone(100, 'sawtooth', 0.4, 0.08); 
            if (type === 'spell') playTone(800, 'sine', 0.5, 0.05); 
            if (type === 'build') playTone(300, 'triangle', 0.2, 0.05); 
        });
    }
};