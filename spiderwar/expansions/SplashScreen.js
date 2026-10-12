// expansions/SplashScreen.js

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

export const SplashScreenExpansion = {
    init: (game) => {
        if (document.getElementById('preGameUI')) return;
        game.gameState = 'menu'; 
        
        const style = document.createElement('style');
        style.innerHTML = `
            #preGameUI {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: var(--color-void); font-family: var(--font-primary);
                z-index: 10000; transition: opacity 0.8s ease;
                display: flex; align-items: center; justify-content: center; flex-direction: column;
                color: var(--color-pumpkin); user-select: none;
            }

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
            }

            .skip-hint {
                position: relative; z-index: 2; margin: 30px; font-size: 1.2rem;
                color: rgba(255, 255, 255, 0.6); background: rgba(0,0,0,0.5); padding: 5px 15px; border-radius: 5px;
            }

            #splashText {
                position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                z-index: 2; 
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                width: 100%; text-align: center;
                text-shadow: 0 0 15px rgba(255, 157, 0, 0.8), 3px 3px 0px #000;
                pointer-events: none;
            }
            #splashText h1 { font-size: 6rem; margin: 0; letter-spacing: 4px; text-transform: uppercase; color: var(--color-pumpkin);}
            #splashText p { font-size: 1.5rem; margin: 20px 0 0 0; color: #ffffff; animation: splashPulse 3s infinite; }
            
            @keyframes splashPulse { 
                0% { opacity: 0.8; } 
                50% { opacity: 1; } 
                100% { opacity: 0.8; } 
            }

            #menuView {
                position: relative; z-index: 10; display: none; flex-direction: column; align-items: center;
                background: rgba(18, 10, 5, 0.85); padding: 40px 60px;
                border: 4px solid var(--color-pumpkin); border-radius: 12px;
                box-shadow: 0 15px 50px rgba(0,0,0,0.8), inset 0 0 20px rgba(255, 157, 0, 0.2);
                backdrop-filter: blur(10px);
            }
            #menuView h1 { 
                font-size: 4rem; margin: 0 0 30px 0; 
                text-shadow: 3px 3px 0px #000, 0 0 20px var(--color-pumpkin); 
                text-align: center; 
            }
            
            .menu-btn {
                background: rgba(34, 17, 0, 0.9); border: 2px solid var(--color-pumpkin); color: white;
                padding: 15px 40px; font-size: 1.5rem; font-family: inherit;
                margin: 10px 0; cursor: pointer; transition: 0.2s; width: 100%; font-weight: bold;
            }
            .menu-btn:hover:not(:disabled) { 
                background: var(--color-pumpkin); color: #000; 
                box-shadow: 0 5px 10px rgba(0,0,0,0.5);
            }
            .menu-btn:disabled { opacity: 0.3; cursor: not-allowed; border-color: #555; }

            #settingsView {
                position: absolute; z-index: 20; display: none; flex-direction: column;
                background: rgba(10,5,0,0.95); padding: 30px; border: 2px solid var(--color-pumpkin);
                border-radius: 8px; box-shadow: 0 0 50px #000; min-width: 350px;
            }
            .setting-row { display: flex; align-items: center; justify-content: space-between; gap: 15px; font-size: 1.2rem; margin-bottom: 20px; color: #fff;}
            .setting-row input[type="checkbox"] { width: 22px; height: 22px; cursor: pointer; accent-color: var(--color-pumpkin); }
            .setting-row select { background: #111; color: var(--color-pumpkin); border: 1px solid var(--color-pumpkin); padding: 8px 12px; font-family: inherit; font-size: 1.1rem; cursor: pointer; }

            #loadingView {
                position: relative; z-index: 10; display: none; flex-direction: column; align-items: center;
            }
            
            #loadBarContainer { 
                width: 400px; height: 30px; border: 3px solid var(--color-pumpkin); 
                background: #111; padding: 3px; margin-bottom: 15px; 
                box-shadow: 0 0 10px rgba(255, 157, 0, 0.2);
            }
            #loadBarFill { 
                width: 0%; height: 100%; background: var(--color-pumpkin); 
                transition: width 0.1s ease-out; 
            }
            #loadText { 
                color: #fff; font-weight: bold; font-size: 1.2rem; letter-spacing: 2px; text-transform: uppercase;
                text-shadow: 0 0 5px #000;
            }
        `;
        document.head.appendChild(style);

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
                <div id="coreMenuButtons" style="width: 100%; display: flex; flex-direction: column; align-items: center;">
                    <button class="menu-btn" id="btnNewGame">NEW GAME</button>
                    <button class="menu-btn" id="btnLoadGame" disabled>CONTINUE</button>
                    <button class="menu-btn" id="btnSettings">BROOD SETTINGS</button>
                </div>
                <div id="modMenuButtons" style="width: 100%; display: flex; flex-direction: column; align-items: center; margin-top: 10px; border-top: 1px solid rgba(255, 157, 0, 0.3); padding-top: 10px;"></div>
            </div>

            <div id="settingsView">
                <h2 style="margin-top:0; color: var(--color-pumpkin); text-align: center; text-shadow: 0 0 10px #000;">BROOD SETTINGS</h2>
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
                <div id="modSettings" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,157,0,0.3);"></div>
                <button class="menu-btn" id="btnCloseSettings" style="padding: 10px; font-size: 1rem; margin-top: 20px;">SAVE & RETURN</button>
            </div>

            <div id="loadingView">
                <div id="loadBarContainer"><div id="loadBarFill"></div></div>
                <div id="loadText">Awakening the Obsidian Brood... 0%</div>
            </div>
        `;
        document.body.appendChild(ui);

        game.menuAPI = {
            addButton: (id, text, onClickCallback) => {
                const container = document.getElementById('modMenuButtons');
                if (!container) return;
                const btn = document.createElement('button');
                btn.className = 'menu-btn';
                btn.id = id;
                btn.innerText = text;
                btn.addEventListener('click', () => { game.bus.emit('playSound', 'ping'); onClickCallback(); });
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

        const viewIntro = document.getElementById('introView');
        const viewMenu = document.getElementById('menuView');
        const viewSettings = document.getElementById('settingsView');
        const viewLoading = document.getElementById('loadingView');
        const introVideo = document.getElementById('introVideo');
        const interactBlocker = document.getElementById('introInteractBlocker');

        if (introVideo) {
            const playPromise = introVideo.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => {
                    interactBlocker.style.display = 'block';
                    document.getElementById('splashText').style.display = 'none';
                });
            }
        }

        const applyHoverSounds = () => {
            document.querySelectorAll('.menu-btn').forEach(btn => {
                btn.addEventListener('mouseenter', () => { if (!btn.disabled) game.bus.emit('playSound', 'ping'); });
            });
        };
        applyHoverSounds();

        try {
            const rawSaveData = localStorage.getItem('spiderRTS_saveData');
            if (rawSaveData) {
                const parsedData = JSON.parse(rawSaveData);
                if (parsedData && parsedData.eco) document.getElementById('btnLoadGame').disabled = false;
            }
        } catch (e) {
            localStorage.removeItem('spiderRTS_saveData');
        }

        const skipPref = localStorage.getItem('spiderRTS_skipIntro') === 'true';
        document.getElementById('chkSkipIntro').checked = skipPref;

        const diffPref = localStorage.getItem('spiderRTS_difficulty') || 'normal';
        document.getElementById('difficultySelect').value = diffPref;
        game.aiDifficulty = diffPref; 

        let menuShown = false; 

        const showMenu = () => {
            if (menuShown) return;
            menuShown = true;
            
            viewIntro.removeEventListener('click', showMenu);
            if (introVideo) introVideo.removeEventListener('ended', showMenu);
            
            viewIntro.style.display = 'none';
            viewMenu.style.display = 'flex';
            
            if (introVideo) {
                introVideo.pause(); 
                introVideo.removeAttribute('src'); 
                introVideo.load(); 
                introVideo.remove();
            }
            game.bus.emit('playSound', 'spell'); 
        };

        if (skipPref) showMenu(); 

        viewIntro.addEventListener('click', showMenu);
        if (introVideo) introVideo.addEventListener('ended', showMenu); 

        document.getElementById('btnSettings').addEventListener('click', () => { 
            viewSettings.style.display = 'flex'; 
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

        const startPreload = (isLoadGame) => {
            game.bus.emit('playSound', 'shoot');
            viewMenu.style.display = 'none';
            viewLoading.style.display = 'flex';
            
            const manifest = Array.from(game.assets.queue);
            let loadedCount = 0;
            const barFill = document.getElementById('loadBarFill');
            const loadText = document.getElementById('loadText');

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

            if (manifest.length === 0) { checkComplete(); return; }

            manifest.forEach(src => {
                if (game.assets.cache[src]) { checkComplete(); return; }
                const img = new Image();
                img.onload = () => { game.assets.cache[src] = img; checkComplete(); };
                img.onerror = () => { loadText.style.color = '#ff0000'; loadText.innerText = `WARNING: Missing Asset (${src})`; checkComplete(); };
                img.src = src;
            });
        };

        document.getElementById('btnNewGame').addEventListener('click', () => { startPreload(false); });
        document.getElementById('btnLoadGame').addEventListener('click', () => { startPreload(true); });
    }
};
