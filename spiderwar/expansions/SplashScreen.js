// expansions/SplashScreen.js

export const SplashScreenExpansion = {
    init: (game) => {
        game.gameState = 'menu'; // Pause the main RTS loop
        
        const style = document.createElement('style');
        style.innerHTML = `
            #preGameUI {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: #050200; font-family: 'Courier New', monospace;
                z-index: 10000; transition: opacity 0.8s ease;
                display: flex; align-items: center; justify-content: center; flex-direction: column;
                color: #ff9d00; user-select: none;
            }

            /* --- INTRO VIDEO VIEW --- */
            #introView {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                display: flex; align-items: flex-end; justify-content: flex-end;
                cursor: pointer;
            }
            #introView video {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                object-fit: cover; opacity: 0.6; pointer-events: none;
            }
            .skip-hint {
                position: relative; z-index: 2; margin: 30px; font-size: 1.2rem;
                color: rgba(255, 255, 255, 0.6); background: rgba(0,0,0,0.5); padding: 5px 15px; border-radius: 5px;
            }

            /* The Overlay Text for Intro */
            #splashText {
                position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                z-index: 2; text-align: center;
                font-family: 'Courier New', monospace; color: #ff9d00;
                text-shadow: 0 0 15px rgba(255, 157, 0, 0.8), 3px 3px 0px #000;
                pointer-events: none;
            }
            #splashText h1 { font-size: 6rem; margin: 0; letter-spacing: 4px; text-transform: uppercase; }
            #splashText p { font-size: 1.5rem; margin-top: 20px; color: #ffffff; animation: splashPulse 1.5s infinite; }
            
            @keyframes splashPulse { 
                0% { opacity: 0.2; } 
                50% { opacity: 1; } 
                100% { opacity: 0.2; } 
            }

            /* --- MAIN MENU VIEW --- */
            #menuView {
                position: relative; z-index: 10; display: none; flex-direction: column; align-items: center;
                background: rgba(10, 5, 0, 0.85); padding: 40px 60px;
                border: 4px solid #ff9d00; border-radius: 12px;
                box-shadow: 0 0 50px rgba(255, 157, 0, 0.2), inset 0 0 20px rgba(0,0,0,1);
                backdrop-filter: blur(8px);
            }
            #menuView h1 { font-size: 4rem; margin: 0 0 30px 0; text-shadow: 2px 2px 0px #000, 0 0 15px #ff9d00; text-align: center; }
            
            .menu-btn {
                background: rgba(34, 17, 0, 0.9); border: 2px solid #ff9d00; color: white;
                padding: 15px 40px; font-size: 1.5rem; font-family: 'Courier New', monospace;
                margin: 10px 0; cursor: pointer; transition: 0.2s; width: 100%; font-weight: bold;
            }
            .menu-btn:hover:not(:disabled) { background: #ff9d00; color: #000; transform: scale(1.05); }
            .menu-btn:disabled { opacity: 0.3; cursor: not-allowed; border-color: #555; }

            /* --- SETTINGS MODAL --- */
            #settingsView {
                position: absolute; z-index: 20; display: none; flex-direction: column;
                background: rgba(0,0,0,0.95); padding: 30px; border: 2px solid #ff9d00;
            }
            .setting-row { display: flex; align-items: center; gap: 15px; font-size: 1.2rem; margin-bottom: 20px; color: #fff;}
            .setting-row input[type="checkbox"] { width: 20px; height: 20px; cursor: pointer; }

            /* --- LOADING VIEW --- */
            #loadingView {
                position: relative; z-index: 10; display: none; flex-direction: column; align-items: center;
            }
            
            #loadBarContainer { width: 400px; height: 30px; border: 3px solid #ff9d00; background: #111; padding: 3px; margin-bottom: 15px; box-shadow: 0 0 20px rgba(255, 157, 0, 0.3);}
            #loadBarFill { width: 0%; height: 100%; background: #ff9d00; transition: width 0.1s; }
            #loadText { color: #fff; font-weight: bold; font-size: 1.2rem; letter-spacing: 2px; text-transform: uppercase;}
        `;
        document.head.appendChild(style);

        // All the UI structure
        const ui = document.createElement('div');
        ui.id = 'preGameUI';
        ui.innerHTML = `
            <div id="introView">
                <video id="introVideo" src="assets/intro.mp4" autoplay loop muted playsinline></video>
                <div id="splashText">
                    <h1>SpiderWars!</h1>
                    <p>[ CLICK TO COMMAND THE SWARM ]</p>
                </div>
                <div class="skip-hint">Click anywhere to skip...</div>
            </div>

            <div id="menuView">
                <h1>SPIDERWARS!</h1>
                <button class="menu-btn" id="btnNewGame">NEW GAME</button>
                <button class="menu-btn" id="btnLoadGame" disabled>CONTINUE</button>
                <button class="menu-btn" id="btnSettings">SETTINGS</button>
            </div>

            <div id="settingsView">
                <h2 style="margin-top:0;">SETTINGS</h2>
                <div class="setting-row">
                    <input type="checkbox" id="chkSkipIntro">
                    <label for="chkSkipIntro">Never show video intro</label>
                </div>
                <button class="menu-btn" id="btnCloseSettings" style="padding: 10px; font-size: 1rem;">BACK</button>
            </div>

            <div id="loadingView">
                <div id="loadBarContainer"><div id="loadBarFill"></div></div>
                <div id="loadText">Summoning Swarm... 0%</div>
            </div>
        `;
        document.body.appendChild(ui);

        // --- DOM Elements ---
        const viewIntro = document.getElementById('introView');
        const viewMenu = document.getElementById('menuView');
        const viewSettings = document.getElementById('settingsView');
        const viewLoading = document.getElementById('loadingView');
        const introVideo = document.getElementById('introVideo');

        // --- JS Fallback to force video play if autoplay is acting stubborn ---
        introVideo.play().catch(e => console.log("Autoplay prevented by browser, waiting for user click."));

        // --- State ---
        const hasSaveData = localStorage.getItem('spiderRTS_saveData') !== null;
        if (hasSaveData) document.getElementById('btnLoadGame').disabled = false;

        const skipPref = localStorage.getItem('spiderRTS_skipIntro') === 'true';
        document.getElementById('chkSkipIntro').checked = skipPref;

        // --- Navigation Logic ---
        const showMenu = () => {
            viewIntro.style.display = 'none';
            viewMenu.style.display = 'flex';
            introVideo.pause(); // Stop video to save resources
            game.bus.emit('playSound', 'spell'); // Unlock audio context!
        };

        if (skipPref) { showMenu(); } // Jump straight to menu if requested

        // 1. Intro Video Logic
        viewIntro.addEventListener('click', showMenu);
        introVideo.addEventListener('ended', showMenu); 

        // 2. Settings Logic
        document.getElementById('btnSettings').addEventListener('click', () => { viewSettings.style.display = 'flex'; });
        document.getElementById('btnCloseSettings').addEventListener('click', () => { viewSettings.style.display = 'none'; });
        document.getElementById('chkSkipIntro').addEventListener('change', (e) => {
            localStorage.setItem('spiderRTS_skipIntro', e.target.checked);
        });

        // 3. Preloading Engine
        const startPreload = (isLoadGame) => {
            viewMenu.style.display = 'none';
            viewLoading.style.display = 'flex';
            
            // Comprehensive list of every asset in the game
            const assetsToLoad = [
                'assets/soldier_black.png', 'assets/soldier_red.png', 'assets/black_spider.png', 'assets/red_spider.png',
                'assets/spitter_black.png', 'assets/spitter_red.png', 'assets/tarantula_black.png', 'assets/tarantula_red.png',
                'assets/widow_black.png', 'assets/widow_red.png', 'assets/goliath_black.png', 'assets/goliath_red.png',
                'assets/broodling_black.png', 'assets/broodling_red.png', 'assets/zombie_black.png', 'assets/zombie_red.png',
                'assets/nest_black.png', 'assets/nest_red.png', 'assets/eggsac_black.png', 'assets/eggsac_red.png',
                'assets/turret_black.png', 'assets/turret_red.png', 'assets/wall_black.png', 'assets/wall_red.png',
                'assets/pylon_black.png', 'assets/pylon_red.png', 'assets/mortar_black.png', 'assets/mortar_red.png',
                'assets/shrine_black.png', 'assets/shrine_red.png', 'assets/eggtrap_black.png', 'assets/eggtrap_red.png',
                'assets/pumpkin.png', 'assets/dewdrop.png', 'assets/corpse.png', 'assets/jackolantern.png',
                'assets/flytrap_open.png', 'assets/flytrap_closed.png', 'assets/ui_frame.png', 'assets/centipede_head.png', 'assets/centipede_body.png',
                'assets/tile_dirt.png', 'assets/tile_vines.png', 'assets/tile_pebbles.png', 'assets/tile_grass.png',
                'assets/water_straight.png', 'assets/water_corner.png', 'assets/water_end.png', 'assets/water_t.png', 'assets/water_cross.png',
                'assets/clutter_water.png', 'assets/clutter_grass.png', 'assets/clutter_pebbles.png'
            ];

            let loadedCount = 0;
            const barFill = document.getElementById('loadBarFill');
            const loadText = document.getElementById('loadText');

            const checkComplete = () => {
                loadedCount++;
                const pct = Math.floor((loadedCount / assetsToLoad.length) * 100);
                barFill.style.width = pct + '%';
                loadText.innerText = `Summoning Swarm... ${pct}%`;

                if (loadedCount === assetsToLoad.length) {
                    // Preloading Finished! Give it a tiny delay so the player sees 100%
                    setTimeout(() => {
                        ui.style.opacity = '0';
                        setTimeout(() => {
                            ui.remove();
                            game.gameState = 'playing'; // Unpause the game loop!
                            
                            // If they clicked Continue, tell Systems.js to load the save!
                            if (isLoadGame) game.bus.emit('triggerLoadGame');
                            
                        }, 800);
                    }, 500);
                }
            };

            // Force load all images
            assetsToLoad.forEach(src => {
                const img = new Image();
                img.onload = checkComplete;
                img.onerror = checkComplete; // Prevent freezing if a file is missing
                img.src = src;
            });
        };

        // 4. Buttons trigger preload
        document.getElementById('btnNewGame').addEventListener('click', () => { startPreload(false); });
        document.getElementById('btnLoadGame').addEventListener('click', () => { startPreload(true); });
    }
};
