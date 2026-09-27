// expansions/SplashScreen.js

export const SplashScreenExpansion = {
    init: (game) => {
        game.gameState = 'splash'; // Pause engine loop
        
        const style = document.createElement('style');
        style.innerHTML = `
            #splashScreen {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: #050200; 
                display: flex; align-items: center; justify-content: center; flex-direction: column;
                z-index: 10000; cursor: pointer; transition: opacity 0.8s ease;
                overflow: hidden;
            }
            
            /* The looping background video */
            #splashScreen video {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                object-fit: cover; /* Ensures the video fills the whole screen without stretching */
                opacity: 0.5; /* Darkened slightly so the text is readable */
                pointer-events: none; /* Clicks pass through the video to the main div */
            }

            /* The Overlay Text */
            #splashText {
                position: relative; z-index: 2; text-align: center;
                font-family: 'Courier New', monospace; color: #ff9d00;
                text-shadow: 0 0 15px rgba(255, 157, 0, 0.8), 3px 3px 0px #000;
                user-select: none;
            }
            #splashText h1 { font-size: 5rem; margin: 0; letter-spacing: 4px; text-transform: uppercase; }
            #splashText p { font-size: 1.5rem; margin-top: 20px; color: #ffffff; animation: splashPulse 1.5s infinite; }
            
            @keyframes splashPulse { 
                0% { opacity: 0.2; } 
                50% { opacity: 1; } 
                100% { opacity: 0.2; } 
            }
        `;
        document.head.appendChild(style);

        const splash = document.createElement('div');
        splash.id = 'splashScreen';
        
        // HTML5 Video tag with autoplay, loop, muted, and playsinline (for mobile)
        splash.innerHTML = `
            <video src="assets/intro.mp4" autoplay loop muted playsinline></video>
            <div id="splashText">
                <h1>Pumpkin Patch RTS</h1>
                <p>[ CLICK TO COMMAND THE SWARM ]</p>
            </div>
        `;
        document.body.appendChild(splash);

        const startGame = (e) => {
            game.gameState = 'playing';
            splash.style.opacity = '0'; // Trigger CSS fade out
            
            // Remove from DOM once faded
            setTimeout(() => splash.remove(), 800);
            
            // Ensure audio unlock fires immediately on first click
            game.bus.emit('playSound', 'spell'); 
            
            splash.removeEventListener('click', startGame);
        };

        splash.addEventListener('click', startGame);
    }
};
