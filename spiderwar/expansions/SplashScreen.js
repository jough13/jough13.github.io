// expansions/SplashScreen.js

// ==========================================
// 1. LORE FLAVOR TEXTS (For Loading Screen)
// ==========================================
const LOAD_FLAVOR_TEXTS = [
    "Awakening the Obsidian Brood...",
    "Weaving silk networks...",
    "Incubating volatile ticks...",
    "Summoning the Phantom Swarm...",
    "Harvesting midnight dew...",
    "Calibrating Obelisk coils...",
    "Sharpening tarantula fangs...",
    "Appeasing the Rotwood Behemoth..."
];

// ==========================================
// 2. EXPANSION LOGIC
// ==========================================
export const SplashScreenExpansion = {
    init: (game) => {
        // SAFETY FIX: Prevent UI duplication on hot-reloads
        if (document.getElementById('preGameUI')) return;

        game.gameState = 'menu'; // Pause the main RTS loop
        
        // --- 1. INJECT STYLES ---
        const style = document.createElement('style');
        style.innerHTML = `
            #preGameUI {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: var(--color-void); font-family: var(--font-primary);
                z-index: 10000; transition: opacity 0.8s ease;
                display: flex; align-items: center; justify-content: center; flex-direction: column;
                color: var(--color-pumpkin); user-select: none;
                perspective: 1000px; /* [JUICE] Needed for 3D parallax effect */
            }

            /* --- INTRO VIDEO VIEW --- */
            #introView {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                display: flex; align-items: flex-end; justify-content: flex-end;
                cursor: pointer; z-index: 50;
            }
            #introView video {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                object-fit: cover; opacity: 0.6; pointer-events: none;
            }
            
            #introInteractBlocker {
                position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                background: rgba(10, 5, 0, 0.9); border: 2px solid var(--color-pumpkin);
                padding: 20px 40px; border-radius: 8px; font-size: 1.5rem; text-align: center;
                display: none; z-index: 60; box-shadow: 0 0 30px #000;
                animation: splashPulse 1.5s infinite;
            }

            .skip-hint {
                position: relative; z-index: 2; margin: 30px; font-size: 1.2rem;
                color: rgba(255, 255, 255, 0.6); background: rgba(0,0,0,0.5); padding: 5px 15px; border-radius: 5px;
            }

            /* The Overlay Text for Intro */
            #splashText {
                position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                z-index: 2; text-align: center;
                text-shadow: 0 0 15px rgba(255, 157, 0, 0.8), 3px 3px 0px #000;
                pointer-events: none;
            }
            #splashText h1 { font-size: 6rem; margin: 0; letter-spacing: 4px; text-transform: uppercase; color: var(--color-pumpkin);}
            #splashText p { font-size: 1.5rem; margin-top: 20px; color: #ffffff; animation: splashPulse 1.5s infinite; }
            
            @keyframes splashPulse { 
                0% { opacity: 0.4; transform: translate(-50%, -50%) scale(0.98); } 
                50% { opacity: 1; transform: translate(-50%, -50%) scale(1.02); box-shadow: 0 0 40px var(--color-pumpkin); } 
                100% { opacity: 0.4; transform: translate(-50%, -50%) scale(0.98); } 
            }

            /* --- MAIN MENU VIEW --- */
            #menuView {
                position: relative; z-index: 10; display: none; flex-direction: column; align-items: center;
                background: rgba(18, 10, 5, 0.85); padding: 40px 60px;
                border: 4px solid var(--color-pumpkin); border-radius: 12px;
                box-shadow: 0 15px 50px rgba(0,0,0,0.8), inset 0 0 20px rgba(255, 157, 0, 0.2);
                backdrop-filter: blur(10px);
                transition: transform 0.1s ease-out; /* [JUICE] Parallax smoothing */
                transform-style: preserve-3d;
            }
            #menuView h1 { 
                font-size: 4rem; margin: 0 0 30px 0; 
                text-shadow: 3px 3px 0px #000, 0 0 20px var(--color-pumpkin); 
                text-align: center; 
                transform: translateZ(30px); /* [JUICE] Pops off the menu background */
            }
            
            .menu-btn {
                background: rgba(34, 17, 0, 0.9); border: 2px solid var(--color-pumpkin); color: white;
                padding: 15px 40px; font-size: 1.5rem; font-family: inherit;
                margin: 10px 0; cursor: pointer; transition: 0.2s; width: 100%; font-weight: bold;
                transform: translateZ(20px);
            }
            .menu-btn:hover:not(:disabled) { 
                background: var(--color-pumpkin); color: #000; 
                transform: translateZ(30px) scale(1.05); 
                box-shadow: 0 10px 20px rgba(0,0,0,0.5);
            }
            .menu-btn:disabled { opacity: 0.3; cursor: not-allowed; border-color: #555; }

            /* --- SETTINGS MODAL --- */
            #settingsView {
                position: absolute; z-index: 20; display: none; flex-direction: column;
                background: rgba(10,5,0,0.95); padding: 30px; border: 2px solid var(--color-pumpkin);
                border-radius: 8px; box-shadow: 0 0 50px #000; min-width: 350px;
            }
            .setting-row { display: flex; align-items: center; justify-content: space-between; gap: 15px; font-size: 1.2rem; margin-bottom: 20px; color: #fff;}
            .setting-row input[type="checkbox"] { width: 22px; height: 22px; cursor: pointer; accent-color: var(--color-pumpkin); }
            .setting-row select { background: #111; color: var(--color-pumpkin); border: 1px solid var(--color-pumpkin); padding: 8px 12px; font-family: inherit; font-size: 1.1rem; cursor: pointer; }

            /* --- LOADING VIEW --- */
            #loadingView {
                position: relative; z-index: 10; display: none; flex-direction: column; align-items: center;
            }
            
            #loadBarContainer { 
                width: 400px; height: 30px; border: 3px solid var(--color-pumpkin); 
                background: #111; padding: 3px; margin-bottom: 15px; 
                box-shadow: 0 0 20px rgba(255, 157, 0, 0.4);
            }
            #loadBarFill { 
                width: 0%; height: 100%; background: var(--color-pumpkin); 
                transition: width 0.1s ease-out; 
                box-shadow: 0 0 15px var(--color-pumpkin); /* [JUICE] Glowing bar */
            }
            #loadText { 
                color: #fff; font-weight: bold; font-size: 1.2rem; letter-spacing: 2px; text-transform: uppercase;
                text-shadow: 0 0 5px #fff;
            }
        `;
        document.head.appendChild(style);

        // --- 2. BUILD DOM STRUCTURE ---
        const ui = document.createElement('div');
        ui.id = 'preGameUI';
        ui.innerHTML = `
            <div id="introView">
                <video id="introVideo" src="assets/intro.mp4" autoplay loop muted playsinline></video>
                <div id="introInteractBlocker">[ CLICK TO INITIALIZE ENGINE ]</div>
                <div id="splashText">
                    <h1>SpiderWars!</h1>
                    <p>[ CLICK TO COMMAND THE SWARM ]</p>
                </div>
                <div class="skip-hint">Click anywhere to skip...</div>
            </div>

            <div id="menuView">
                <h1>SPIDERWARS!</h1>
                <div id="coreMenuButtons" style="width: 100%; display: flex; flex-direction: column; align-items: center; transform-style: preserve-3d;">
                    <button class="menu-btn" id="btnNewGame">NEW GAME</button>
                    <button class="menu-btn" id="btnLoadGame" disabled>CONTINUE</button>
                    <button class="menu-btn" id="btnSettings">BROOD SETTINGS</button>
                </div>
                <!-- [EXPANDABILITY] Container for mod-injected buttons -->
                <div id="modMenuButtons" style="width: 100%; display: flex; flex-direction: column; align-items: center; margin-top: 10px; border-top: 1px solid rgba(255, 157, 0, 0.3); padding-top: 10px; transform-style: preserve-3d;"></div>
            </div>

            <div id="settingsView">
                <h2 style="margin-top:0; color: var(--color-pumpkin); text-align: center; text-shadow: 0 0 10px var(--color-pumpkin);">BROOD SETTINGS</h2>
                
                <div id="coreSettings">
                    <div class="setting-row">
                        <label for="difficultySelect">AI Difficulty:</label>
                        <select id="difficultySelect">
                            <option value="easy">Easy</option>
                            <option value="normal" selected>Normal</option>
                            <option value="hard">Hard</option>
                            <option value="insane">Insane</option>
                        </select>
                    </div>

                    <div class="setting-row" style="justify-content: flex-start;">
                        <input type="checkbox" id="chkSkipIntro">
                        <label for="chkSkipIntro">Skip cinematic intro</label>
                    </div>
                </div>
                
                <!-- [EXPANDABILITY] Container for mod-injected settings -->
                <div id="modSettings" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,157,0,0.3);"></div>

                <button class="menu-btn" id="btnCloseSettings" style="padding: 10px; font-size: 1rem; margin-top: 20px;">SAVE & RETURN</button>
            </div>

            <div id="loadingView">
                <div id="loadBarContainer"><div id="loadBarFill"></div></div>
                <div id="loadText">Awakening the Obsidian Brood... 0%</div>
            </div>
        `;
        document.body.appendChild(ui);

        // --- 3. EXPANDABILITY API ---
        // Expose hooks so external mods can easily inject buttons and settings into the main menu!
        game.menuAPI = {
            addButton: (id, text, onClickCallback) => {
                const container = document.getElementById('modMenuButtons');
                if (!container) return;
                const btn = document.createElement('button');
                btn.className = 'menu-btn';
                btn.id = id;
                btn.innerText = text;
                btn.addEventListener('click', () => {
                    game.bus.emit('playSound', 'ping');
                    onClickCallback();
                });
                btn.addEventListener('mouseenter', () => game.bus.emit('playSound', 'ping'));
                container.appendChild(btn);
            },
            addSetting: (htmlString) => {
                const container = document.getElementById('modSettings');
                if (!container) return;
                const wrapper = document.createElement('div');
                wrapper.innerHTML = htmlString;
                container.appendChild(wrapper);
            }
        };

        // --- 4. DOM ELEMENTS & STATE ---
        const viewIntro = document.getElementById('introView');
        const viewMenu = document.getElementById('menuView');
        const viewSettings = document.getElementById('settingsView');
        const viewLoading = document.getElementById('loadingView');
        const introVideo = document.getElementById('introVideo');
        const interactBlocker = document.getElementById('introInteractBlocker');

        // [FIX] Robust Autoplay Policy handling
        if (introVideo) {
            const playPromise = introVideo.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => {
                    console.log("[Intro] Autoplay blocked by browser. Awaiting interaction.");
                    interactBlocker.style.display = 'block';
                    document.getElementById('splashText').style.display = 'none';
                });
            }
        }

        // [JUICE] Menu Hover Sounds
        const applyHoverSounds = () => {
            document.querySelectorAll('.menu-btn').forEach(btn => {
                btn.addEventListener('mouseenter', () => {
                    if (!btn.disabled) game.bus.emit('playSound', 'ping');
                });
            });
        };
        applyHoverSounds();

        // Load Player Preferences securely
        try {
            const rawSaveData = localStorage.getItem('spiderRTS_saveData');
            if (rawSaveData) {
                const parsedData = JSON.parse(rawSaveData);
                if (parsedData && parsedData.eco) {
                    document.getElementById('btnLoadGame').disabled = false;
                }
            }
        } catch (e) {
            console.warn("[SaveData] Corrupted save file detected and ignored.");
            localStorage.removeItem('spiderRTS_saveData');
        }

        const skipPref = localStorage.getItem('spiderRTS_skipIntro') === 'true';
        document.getElementById('chkSkipIntro').checked = skipPref;

        const diffPref = localStorage.getItem('spiderRTS_difficulty') || 'normal';
        document.getElementById('difficultySelect').value = diffPref;
        game.aiDifficulty = diffPref; 

        // --- 5. NAVIGATION & JUICE LOGIC ---
        let menuShown = false; 

        // [JUICE] 3D Parallax Mouse Tracking for the Main Menu
        const handleParallax = (e) => {
            if (!menuShown || viewSettings.style.display === 'flex') return;
            const xAxis = (window.innerWidth / 2 - e.pageX) / 25;
            const yAxis = (window.innerHeight / 2 - e.pageY) / 25;
            viewMenu.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
        };

        const showMenu = () => {
            if (menuShown) return;
            menuShown = true;
            
            // CLEANUP FIX: Remove listeners so they don't leak memory
            viewIntro.removeEventListener('click', showMenu);
            if (introVideo) introVideo.removeEventListener('ended', showMenu);
            
            viewIntro.style.display = 'none';
            viewMenu.style.display = 'flex';
            
            // Activate Parallax
            window.addEventListener('mousemove', handleParallax);
            
            // PERFORMANCE FIX: Completely wipe the video from the DOM to free up RAM!
            if (introVideo) {
                introVideo.pause(); 
                introVideo.removeAttribute('src'); 
                introVideo.load(); 
                introVideo.remove();
            }
            
            game.bus.emit('playSound', 'spell'); 
        };

        if (skipPref) { showMenu(); } 

        viewIntro.addEventListener('click', showMenu);
        if (introVideo) introVideo.addEventListener('ended', showMenu); 

        // Settings Menu Logic
        document.getElementById('btnSettings').addEventListener('click', () => { 
            viewSettings.style.display = 'flex'; 
            viewMenu.style.transform = `rotateY(0deg) rotateX(0deg)`; // Reset parallax
            game.bus.emit('playSound', 'shoot');
        });
        
        document.getElementById('btnCloseSettings').addEventListener('click', () => { 
            viewSettings.style.display = 'none'; 
            game.bus.emit('playSound', 'shoot');
        });
        
        document.getElementById('chkSkipIntro').addEventListener('change', (e) => {
            localStorage.setItem('spiderRTS_skipIntro', e.target.checked);
        });
        
        document.getElementById('difficultySelect').addEventListener('change', (e) => {
            const diff = e.target.value;
            localStorage.setItem('spiderRTS_difficulty', diff);
            game.aiDifficulty = diff; 
        });

        // --- 6. DYNAMIC PRELOADING ENGINE ---
        const startPreload = (isLoadGame) => {
            game.bus.emit('playSound', 'shoot');
            window.removeEventListener('mousemove', handleParallax); // Cleanup
            
            viewMenu.style.display = 'none';
            viewLoading.style.display = 'flex';
            
            const manifest = Array.from(game.assets.queue);
            let loadedCount = 0;
            
            const barFill = document.getElementById('loadBarFill');
            const loadText = document.getElementById('loadText');

            // [JUICE] Rotating Flavor Text
            let flavorIndex = 0;
            const flavorInterval = setInterval(() => {
                flavorIndex = (flavorIndex + 1) % LOAD_FLAVOR_TEXTS.length;
                const pct = manifest.length > 0 ? Math.floor((loadedCount / manifest.length) * 100) : 100;
                loadText.innerText = `${LOAD_FLAVOR_TEXTS[flavorIndex]} ${pct}%`;
            }, 800);

            const checkComplete = () => {
                loadedCount++;
                
                requestAnimationFrame(() => {
                    const pct = manifest.length > 0 ? Math.floor((loadedCount / manifest.length) * 100) : 100;
                    barFill.style.width = pct + '%';
                    loadText.innerText = `${LOAD_FLAVOR_TEXTS[flavorIndex]} ${pct}%`;

                    if (loadedCount >= manifest.length) {
                        // [PERFORMANCE] Strict interval cleanup!
                        clearInterval(flavorInterval);
                        
                        setTimeout(() => {
                            ui.style.opacity = '0';
                            
                            setTimeout(() => {
                                ui.remove();
                                game.gameState = 'playing'; 
                                
                                if (isLoadGame) game.bus.emit('triggerLoadGame');
                                
                            }, 800); 
                        }, 500); 
                    }
                });
            };

            if (manifest.length === 0) { 
                checkComplete(); 
                return; 
            }

            manifest.forEach(src => {
                if (game.assets.cache[src]) {
                    checkComplete();
                    return;
                }

                const img = new Image();
                img.onload = () => {
                    game.assets.cache[src] = img;
                    checkComplete();
                };
                img.onerror = () => {
                    // [FIX] Visual warning if an asset is completely missing!
                    console.warn(`[AssetManager] Missing asset: ${src}`);
                    loadText.style.color = '#ff0000';
                    loadText.innerText = `WARNING: Missing Asset (${src})`;
                    checkComplete(); 
                };
                img.src = src;
            });
        };

        // Attach preloader triggers
        document.getElementById('btnNewGame').addEventListener('click', () => { startPreload(false); });
        document.getElementById('btnLoadGame').addEventListener('click', () => { startPreload(true); });
    }
};
