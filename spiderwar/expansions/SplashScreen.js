// expansions/SplashScreen.js

export const SplashScreenExpansion = {
    init: (game) => {
        game.gameState = 'splash'; // Pause engine loop
        
        const style = document.createElement('style');
        style.innerHTML = `
            #splashScreen {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: #111111; display: flex; align-items: center; justify-content: center;
                z-index: 10000; cursor: pointer; transition: opacity 0.5s ease;
            }
            #splashScreen img {
                max-width: 100%; max-height: 100%; object-fit: contain;
            }
        `;
        document.head.appendChild(style);

        const splash = document.createElement('div');
        splash.id = 'splashScreen';
        splash.innerHTML = `<img src="assets/banner.jpg" alt="Spider Wars Splash">`;
        document.body.appendChild(splash);

        const startGame = (e) => {
            game.gameState = 'playing';
            splash.style.opacity = '0'; // Trigger fade
            
            // Remove from DOM once faded
            setTimeout(() => splash.remove(), 500);
            
            // Ensure audio unlock fires immediately on first click
            game.bus.emit('playSound', 'spell'); 
            
            splash.removeEventListener('click', startGame);
        };

        splash.addEventListener('click', startGame);
    }
};