// --- START OF FILE fast-travel.js ---

// ==========================================
// FAST TRAVEL & LEYLINE SYSTEM
// ==========================================

const fastTravelModal = document.getElementById('fastTravelModal');
const fastTravelList = document.getElementById('fastTravelList');
const closeFastTravelButton = document.getElementById('closeFastTravelButton');

// PERFORMANCE WIN: Cache DOM lookups used during active gameplay/validation loops
const _ftDOMCache = {
    manaDisplay: null,
    getManaDisplay: () => _ftDOMCache.manaDisplay || (document.getElementById('manaDisplay') && (_ftDOMCache.manaDisplay = document.getElementById('manaDisplay')))
};

function openFastTravelModal() {
    if (typeof inputQueue !== 'undefined') inputQueue.length = 0;
    if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
    
    renderFastTravelList();
    
    const player = gameState.player;
    const travelCost = (player.talents && player.talents.includes('mana_flow')) ? 8 : 10;
    
    // LORE WIN: Dynamic UI text that reacts to dimensional status
    const title = document.getElementById('fastTravelTitle');
    const subtitle = fastTravelModal.querySelector('p.text-sm');
    
    if (gameState.currentRealm !== 0 && gameState.currentRealm) {
        if (title) title.innerHTML = "Leyline Interference";
        if (title) title.className = "text-3xl font-bold mb-2 text-red-500 animate-pulse";
        if (subtitle) {
            subtitle.innerHTML = `The local grid is severed. Only Prime Anchors remain visible.<br><span class="text-xs text-red-300 font-bold">(Emergency Recall Cost: ${travelCost} Mana)</span>`;
            subtitle.className = "text-sm text-gray-300 mb-6 bg-red-900 bg-opacity-20 p-2 rounded border border-red-800 text-center shadow-inner";
        }
    } else {
        if (title) title.innerHTML = "Leyline Network";
        if (title) title.className = "text-3xl font-bold mb-2 text-purple-400 drop-shadow-md";
        if (subtitle) {
            subtitle.innerHTML = `Travel the leylines to an attuned Waystone?<br><span class="text-xs text-purple-300 font-bold">(Base Cost: ${travelCost} Mana)</span>`;
            subtitle.className = "text-sm text-gray-300 mb-6 bg-purple-900 bg-opacity-20 p-2 rounded border border-purple-800 text-center shadow-inner";
        }
    }

    fastTravelModal.classList.remove('hidden');
    // Hide the lore modal if it was open (since we typically open this from a Waystone)
    const loreModal = document.getElementById('loreModal');
    if (loreModal) loreModal.classList.add('hidden');
}

// LORE & UI WIN: Expanded helper to determine biome icon from regional names
function getBiomeIcon(name) {
    if (!name) return '✨';
    const n = name.toLowerCase();
    if (n.includes('forest') || n.includes('wood')) return '🌲';
    if (n.includes('mountain') || n.includes('peak')) return '⛰️';
    if (n.includes('swamp') || n.includes('marsh')) return '🐸';
    if (n.includes('desert') || n.includes('sand')) return '🐪';
    if (n.includes('dead') || n.includes('ash')) return '💀';
    if (n.includes('water') || n.includes('sea') || n.includes('ocean')) return '🌊';
    if (n.includes('plains') || n.includes('expanse') || n.includes('valley')) return '🌿';
    if (n.includes('volcano') || n.includes('fire') || n.includes('infernal')) return '🌋';
    if (n.includes('crystal') || n.includes('glimmer')) return '💎';
    if (n.includes('ruin') || n.includes('castle') || n.includes('fortress')) return '🏰';
    return '✨'; // Default
}

function renderFastTravelList() {
    fastTravelList.innerHTML = '';
    const player = gameState.player;
    const waypoints = player.unlockedWaypoints || [];
    const playerX = player.x;
    const playerY = player.y;

    // PERFORMANCE: Use DocumentFragment to batch DOM inserts
    const fragment = document.createDocumentFragment();

    // Base Cost Calculation
    const baseTravelCost = (player.talents && player.talents.includes('mana_flow')) ? 8 : 10;

    // PERFORMANCE WIN: Native Math.hypot is highly optimized compared to manual squaring
    const getDist = (tx, ty) => Math.floor(Math.hypot(tx - playerX, ty - playerY));

    // Helper: Calculate Compass Direction (QoL WIN!)
    const getDir = (tx, ty) => {
        const dx = tx - playerX;
        const dy = ty - playerY; // Negative Y is North in our grid
        if (dx === 0 && dy === 0) return '';
        
        let ns = '';
        let ew = '';
        if (dy < 0) ns = 'North';
        else if (dy > 0) ns = 'South';
        
        if (dx < 0) ew = 'West';
        else if (dx > 0) ew = 'East';
        
        if (ns && ew) return ` (${ns}-${ew})`;
        if (ns) return ` (${ns})`;
        if (ew) return ` (${ew})`;
        return '';
    };

    // --- UI CATEGORY: SANCTUARIES ---
    const sanctuaryHeader = document.createElement('div');
    sanctuaryHeader.className = "text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2 mb-2 border-b border-gray-700 pb-1";
    sanctuaryHeader.textContent = "Prime Anchors";
    fragment.appendChild(sanctuaryHeader);

    // 1. PERMANENT FALLBACK: Safe Haven Village
    // MULTIVERSE LOGIC: If we are in an alternate dimension, the village is always visible as an escape hatch!
    if (playerX !== 0 || playerY !== 0 || (gameState.currentRealm && gameState.currentRealm !== 0)) {
        // NEWBIE GRACE PERIOD: Free travel to spawn if level 3 or under!
        const isFree = player.level <= 3;
        const cost = isFree ? 0 : baseTravelCost;
        const canAfford = player.mana >= cost;
        
        const btnClass = canAfford ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-gray-700 text-gray-400 opacity-50 cursor-not-allowed border-gray-600";
        const btnText = canAfford ? (isFree ? 'Free' : `-${cost} MP`) : 'OOM';

        // QoL WIN: Show dimension shift warning if returning from an alternate realm
        const isCrossRealm = (gameState.currentRealm && gameState.currentRealm !== 0);
        const dimensionBadge = isCrossRealm ? `<span class="ml-2 px-1 rounded bg-purple-900 text-purple-300 border border-purple-500 animate-pulse text-[9px] drop-shadow-md">DIMENSIONAL SHIFT</span>` : '';

        // SECURITY WIN: Using data-x and data-y attributes instead of inline onclick functions!
        const villageLi = document.createElement('li');
        villageLi.className = 'shop-item bg-blue-900 bg-opacity-20 border-blue-700 hover:border-blue-400 transition-all transform hover:-translate-y-0.5 shadow-sm hover:shadow-lg';
        villageLi.setAttribute('onmouseenter', "if(typeof AudioSystem !== 'undefined') AudioSystem.playHover()"); // JUICE
        villageLi.innerHTML = `
            <div>
                <span class="font-bold text-blue-400 drop-shadow-md">🛡️ Safe Haven Village</span>${dimensionBadge}
                <div class="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">Coords: 0, 0 <span class="ml-2 text-blue-300 font-bold bg-black bg-opacity-30 px-1 rounded border border-gray-700">(Dist: ${getDist(0, 0)}m${getDir(0, 0)})</span></div>
            </div>
            <button data-x="0" data-y="0" class="px-3 py-2 rounded text-xs font-bold shadow-md transition-transform active:scale-95 border-b-2 ${canAfford ? 'border-blue-800 active:border-b-0 active:mt-0.5' : 'border-gray-800'} ${btnClass}" ${canAfford ? '' : 'disabled'}>${btnText}</button>
        `;
        fragment.appendChild(villageLi);
    }

    // 2. PERMANENT FALLBACK: Personal Bed / Camp
    if (player.respawnPoint && (player.respawnPoint.x !== playerX || player.respawnPoint.y !== playerY)) {
        if (player.respawnPoint.x !== 0 || player.respawnPoint.y !== 0) {
            const rx = player.respawnPoint.x;
            const ry = player.respawnPoint.y;
            const canAfford = player.mana >= baseTravelCost;
            
            const btnClass = canAfford ? "bg-green-600 hover:bg-green-500 text-white" : "bg-gray-700 text-gray-400 opacity-50 cursor-not-allowed border-gray-600";
            const btnText = canAfford ? `-${baseTravelCost} MP` : 'OOM';

            const bedLi = document.createElement('li');
            bedLi.className = 'shop-item bg-green-900 bg-opacity-20 border-green-700 hover:border-green-400 transition-all transform hover:-translate-y-0.5 shadow-sm hover:shadow-lg';
            bedLi.setAttribute('onmouseenter', "if(typeof AudioSystem !== 'undefined') AudioSystem.playHover()");
            bedLi.innerHTML = `
                <div>
                    <span class="font-bold text-green-400 drop-shadow-md">⛺ Personal Camp (Bed)</span>
                    <div class="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">Coords: ${rx}, ${-ry} <span class="ml-2 text-green-300 font-bold bg-black bg-opacity-30 px-1 rounded border border-gray-700">(Dist: ${getDist(rx, ry)}m${getDir(rx, ry)})</span></div>
                </div>
                <button data-x="${rx}" data-y="${ry}" class="px-3 py-2 rounded text-xs font-bold shadow-md transition-transform active:scale-95 border-b-2 ${canAfford ? 'border-green-800 active:border-b-0 active:mt-0.5' : 'border-gray-800'} ${btnClass}" ${canAfford ? '' : 'disabled'}>${btnText}</button>
            `;
            fragment.appendChild(bedLi);
        }
    }

    // --- UI CATEGORY: WILDERNESS WAYSTONES ---
    // Hide regular waystones if the player is stuck in an alternate dimension
    if (gameState.currentRealm === 0 || !gameState.currentRealm) {
        const waystoneHeader = document.createElement('div');
        waystoneHeader.className = "text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-6 mb-2 border-b border-gray-700 pb-1 flex justify-between";
        waystoneHeader.innerHTML = `<span>Attuned Leyline Nodes</span> <span>${waypoints.length} Unlocked</span>`;
        fragment.appendChild(waystoneHeader);

        // BUG FIX: Filter out completely corrupted waypoints before processing math
        const availableWaypoints = waypoints
            .filter(wp => wp && typeof wp.x === 'number' && typeof wp.y === 'number' && (wp.x !== playerX || wp.y !== playerY)) 
            .map(wp => ({ ...wp, dist: getDist(wp.x, wp.y), dir: getDir(wp.x, wp.y) }))
            .sort((a, b) => a.dist - b.dist); // Sort by distance ascending

        if (availableWaypoints.length === 0) {
            const emptyLi = document.createElement('li');
            emptyLi.className = 'italic text-gray-500 p-4 text-center border border-gray-700 rounded-lg text-xs bg-black bg-opacity-20 shadow-inner';
            emptyLi.textContent = "You haven't attuned to any Wilderness Waystones yet. Explore the world to find them!";
            fragment.appendChild(emptyLi);
        } else {
            const canAffordBase = player.mana >= baseTravelCost;
            const btnClass = canAffordBase ? "bg-purple-600 hover:bg-purple-500 text-white" : "bg-gray-700 text-gray-400 opacity-50 cursor-not-allowed border-gray-600";
            const btnText = canAffordBase ? `-${baseTravelCost} MP` : 'OOM';

            availableWaypoints.forEach(wp => {
                const icon = getBiomeIcon(wp.name);
                const safeName = typeof escapeHtml === 'function' ? escapeHtml(wp.name) : wp.name;
                
                // JUICE & QoL WIN: Show danger warning for far-off waypoints
                const dangerBadge = wp.dist > 1500 ? `<span title="Extreme Danger Zone!" class="ml-2 animate-pulse drop-shadow-md text-red-500">💀</span>` : '';
                
                const li = document.createElement('li');
                li.className = 'shop-item bg-purple-900 bg-opacity-10 border-gray-700 hover:border-purple-500 transition-all transform hover:-translate-y-0.5 shadow-sm hover:shadow-lg';
                li.setAttribute('onmouseenter', "if(typeof AudioSystem !== 'undefined') AudioSystem.playHover()");
                li.innerHTML = `
                    <div>
                        <span class="font-bold text-purple-400 drop-shadow-md">${icon} ${safeName}${dangerBadge}</span>
                        <div class="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">Coords: ${wp.x}, ${-wp.y} <span class="ml-2 text-purple-300 font-bold bg-black bg-opacity-30 px-1 rounded border border-gray-700">(Dist: ${wp.dist}m${wp.dir})</span></div>
                    </div>
                    <button data-x="${wp.x}" data-y="${wp.y}" class="px-3 py-2 rounded text-xs font-bold shadow-md transition-transform active:scale-95 border-b-2 ${canAffordBase ? 'border-purple-800 active:border-b-0 active:mt-0.5' : 'border-gray-800'} ${btnClass}" ${canAffordBase ? '' : 'disabled'}>${btnText}</button>
                `;
                fragment.appendChild(li);
            });
        }
    }

    fastTravelList.appendChild(fragment);
}

// JUICE WIN: Make the handler fully asynchronous so we can await particle animations and build tension!
window.handleFastTravel = async function (targetX, targetY) {
    // 🚨 GLOBAL ENGINE LOCK
    if (isProcessingMove) return;
    isProcessingMove = true;

    // Instantly hide the modal so the player can see the visual effects!
    fastTravelModal.classList.add('hidden'); 

    try {
        const player = gameState.player;
        
        // Apply Talent Discount & Newbie Grace Period
        const isFreeRecall = (targetX === 0 && targetY === 0) && player.level <= 3;
        const TRAVEL_COST = isFreeRecall ? 0 : ((player.talents && player.talents.includes('mana_flow')) ? 8 : 10);

        // Calculate physical distance for dynamic juice
        const travelDist = Math.floor(Math.hypot(targetX - player.x, targetY - player.y));

        // --- GAMEPLAY WIN: True Euclidean Anti-Combat Teleport ---
        // You cannot flee via leylines if enemies are too close! (5 tile radius)
        let inCombat = false;
        const COMBAT_RADIUS_SQ = 25; 
        
        if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') {
            for (const enemyId in gameState.sharedEnemies) {
                const enemy = gameState.sharedEnemies[enemyId];
                if (Math.pow(enemy.x - player.x, 2) + Math.pow(enemy.y - player.y, 2) <= COMBAT_RADIUS_SQ) {
                    inCombat = true;
                    break;
                }
            }
        } else {
            inCombat = gameState.instancedEnemies.some(e => Math.pow(e.x - player.x, 2) + Math.pow(e.y - player.y, 2) <= COMBAT_RADIUS_SQ);
        }

        if (inCombat) {
            logMessage("{red:You cannot travel the leylines while enemies are nearby!}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            return; // Engine unlocks via finally block
        }

        // --- OBSTRUCTION CHECK ---
        const tile = chunkManager.getTile(targetX, targetY);
        // BUG FIX: Added dynamically built/destructible blocks to invalid list
        const invalidTiles = ['^', '~', '≈', '▓', '▒', '🧱', '🏚', '🏚️', '🌳']; 

        // Override if we are teleporting exactly to the village coords and they got corrupted somehow
        const isVillageBypass = (targetX === 0 && targetY === 0);

        if (invalidTiles.includes(tile) && !isVillageBypass) {
            logMessage("{red:The destination Waystone is obstructed by terrain. Teleport unsafe.}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            return;
        }

        // --- MANA CHECK ---
        if (player.mana < TRAVEL_COST) {
            logMessage(`{red:Not enough Mana to travel the leylines. (Need ${TRAVEL_COST})}`);
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            
            // JUICE: Flash the mana bar red so they clearly see why it failed
            const manaDisplay = _ftDOMCache.getManaDisplay();
            if (manaDisplay) {
                manaDisplay.classList.remove('stat-flash-red');
                void manaDisplay.offsetWidth;
                manaDisplay.classList.add('stat-flash-red');
            }
            return;
        }

        // --- DEPARTURE FX (With Async Delay & Tension Builder) ---
        if (typeof ParticleSystem !== 'undefined') {
            // Create a massive inward implosion effect
            for(let i = 0; i < 30; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = 4 + Math.random() * 2;
                ParticleSystem.spawn(player.x + Math.cos(angle) * dist, player.y + Math.sin(angle) * dist, isFreeRecall ? '#3b82f6' : '#a855f7', 'dust');
                const p = ParticleSystem.activeParticles[ParticleSystem.activeParticles.length-1];
                if (p) {
                    // Pull particles inward sharply
                    p.vx = -Math.cos(angle) * 0.3;
                    p.vy = -Math.sin(angle) * 0.3;
                    p.lifeFade = 0.03; // Live just long enough to reach the center
                }
            }
            ParticleSystem.createFloatingText(player.x, player.y, "Warping...", isFreeRecall ? "#60a5fa" : "#c084fc");
        }
        
        if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
        
        // JUICE WIN: Teleport Tension Builder
        // Screen rumbles slightly as the portal opens, then shakes violently on transit!
        gameState.screenShake = 3;
        await new Promise(resolve => setTimeout(() => {
            gameState.screenShake = 12;
            resolve();
        }, 200));

        // Wait for the particles to suck into the player before snapping the coordinates!
        await new Promise(resolve => setTimeout(resolve, 200));

        // Deduct Cost
        player.mana -= TRAVEL_COST;
        
        // Track database updates
        const updates = {
            mana: player.mana
        };

        // --- FORCE DISEMBARK BEFORE TELEPORT & FIX DB DESYNC ---
        if (player.isBoating || player.isSailing) {
            const boatTile = player.isSailing ? '⛵' : 'c';
            
            // Check which map we are currently in so we don't drop dungeon boats into the overworld!
            if (gameState.mapMode === 'overworld') {
                chunkManager.setWorldTile(player.x, player.y, boatTile);
            } else if (gameState.mapMode === 'dungeon') {
                chunkManager.caveMaps[gameState.currentCaveId][player.y][player.x] = boatTile;
            } else if (gameState.mapMode === 'castle') {
                chunkManager.castleMaps[gameState.currentCastleId][player.y][player.x] = boatTile;
            }

            if (player.isBoating) {
                player.isBoating = false;
                updates.isBoating = false; // Tell Firebase we got out
                logMessage("{gray:You leave your canoe behind to travel the leylines.}");
            }
            
            if (player.isSailing) {
                player.isSailing = false;
                updates.isSailing = false; // Tell Firebase we got out
                logMessage("{gray:You drop anchor and leave your ship behind.}");
            }
        }
        
        // --- MULTIVERSE CHECK (Returning to Prime Realm) ---
        // If the player uses Fast Travel to go back to 0,0, auto-pull them out of any alternate dimension.
        if (isVillageBypass && gameState.currentRealm !== 0) {
            logMessage("{cyan:The leylines pull you across the multiverse, safely back to the Prime Realm.}");
            gameState.currentRealm = 0;
            gameState.realmMutators = [];
            updates.currentRealm = 0;
            updates.realmMutators = [];
            
            // Purge memory of the alternate dimension
            chunkManager.loadedChunks = {};
            chunkManager.worldState = {};
            if (typeof EnemyNetworkManager !== 'undefined') EnemyNetworkManager.clearAll();
        }

        // Failsafe State Override
        gameState.mapMode = 'overworld';
        gameState.currentCaveId = null;
        gameState.currentCastleId = null;
        gameState.instancedEnemies = [];
        
        // Move Player
        player.x = targetX;
        player.y = targetY;
        updates.x = targetX;
        updates.y = targetY;

        // LORE WIN: Biome-Aware Arrival Messages!
        const arrivalTile = chunkManager.getTile(targetX, targetY);
        let arrivalFlavor = "You dissolve into pure energy and reappear at your destination.";
        
        if (isFreeRecall) arrivalFlavor = "The ancient wards of the Safe Haven welcome you.";
        else if (arrivalTile === 'F' || arrivalTile === '🌲') arrivalFlavor = "You step out of the leylines into the rustling canopy.";
        else if (arrivalTile === 'D') arrivalFlavor = "The leylines deposit you into the scorching heat of the dunes.";
        else if (arrivalTile === '^' || arrivalTile === '⛰') arrivalFlavor = "You arrive with a crack of thunder on the high peaks.";
        else if (arrivalTile === '≈') arrivalFlavor = "The teleport drops you squarely into the fetid muck.";
        else if (arrivalTile === '❄️' || arrivalTile === '🧊') arrivalFlavor = "A blast of freezing air greets your arrival.";
        else if (arrivalTile === 'd') arrivalFlavor = "You materialize into a cloud of choking ash.";
        else if (arrivalTile === '🌋') arrivalFlavor = "You materialize amidst intense heat and the smell of sulfur.";
        else if (arrivalTile === '💎c') arrivalFlavor = "The leylines deposit you in a shower of glowing crystal dust.";
        else if (arrivalTile === '🏰' || arrivalTile === 'V') arrivalFlavor = "You step onto the worked stone of civilization.";

        if (travelDist > 1000) {
            logMessage(`{purple:You cross a terrifying distance. The leylines scream as you re-enter reality!}`);
            gameState.screenShake = 25;
            if (typeof AudioSystem !== 'undefined' && typeof AudioSystem.playBossSpawn === 'function') AudioSystem.playBossSpawn(); // Heavy impact
        } else {
            logMessage(`{cyan:${arrivalFlavor}}`);
            gameState.screenShake = 10; // Standard landing impact
        }
        
        const manaDisplay = _ftDOMCache.getManaDisplay();
        if (typeof triggerStatAnimation === 'function') triggerStatAnimation(manaDisplay, 'stat-pulse-blue');

        // Ensure landing spot exists visually if it's not the village
        if (!isVillageBypass) {
            chunkManager.setWorldTile(player.x, player.y, '#'); 
        }
        
        if (typeof updateRegionDisplay === 'function') updateRegionDisplay();
        
        // --- ARRIVAL FX ---
        if (typeof ParticleSystem !== 'undefined') {
            ParticleSystem.createExplosion(player.x, player.y, isFreeRecall ? '#3b82f6' : '#a855f7', 25); 
            
            // Radial Ring Shockwave
            for(let i = 0; i < 15; i++) {
                const angle = Math.random() * Math.PI * 2;
                ParticleSystem.spawn(player.x, player.y, isFreeRecall ? '#93c5fd' : '#c084fc', 'dust');
                const p = ParticleSystem.activeParticles[ParticleSystem.activeParticles.length-1];
                if (p) {
                    p.vx = Math.cos(angle) * 0.4;
                    p.vy = Math.sin(angle) * 0.4;
                }
            }
        }
        
        // Ensure the new chunks and enemies are loaded from Firebase before rendering!
        if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') {
            const currentChunkX = Math.floor(player.x / chunkManager.CHUNK_SIZE);
            const currentChunkY = Math.floor(player.y / chunkManager.CHUNK_SIZE);
            
            for (let cy = -2; cy <= 2; cy++) {
                for (let cx = -2; cx <= 2; cx++) {
                    chunkManager.listenToChunkState(currentChunkX + cx, currentChunkY + cy);
                }
            }
            if (typeof chunkManager.unloadOutOfRangeChunks === 'function') {
                chunkManager.unloadOutOfRangeChunks(currentChunkX, currentChunkY);
            }
            if (typeof EnemyNetworkManager !== 'undefined') {
                EnemyNetworkManager.syncChunks(player.x, player.y);
            }
        }
        
        // Force complete redraw
        gameState.mapDirty = true;
        if (typeof render === 'function') render();
        if (typeof syncPlayerState === 'function') syncPlayerState();

        // Save state completely to Firebase (Routed through debouncer to prevent data loss!)
        if (typeof triggerDebouncedSave === 'function') {
            triggerDebouncedSave(updates);
        } else if (typeof playerRef !== 'undefined' && playerRef) {
            playerRef.update(updates).catch(e => console.error("Fast travel sync error:", e));
        }
        
        if (typeof renderStats === 'function') renderStats();

    } catch (error) {
        console.error("🚨 Critical fast travel error caught! Unlocking engine to prevent deadlock:", error);
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        logMessage("{red:The leylines violently reject you! Teleport failed.}");
    } finally {
        // 🚨 GLOBAL ENGINE UNLOCK
        // Guaranteed to run, ensuring the game never freezes permanently on an exception!
        setTimeout(() => { isProcessingMove = false; }, 200);
    }
};

// --- SECURITY & PERFORMANCE WIN: Event Delegation for the UI List ---
if (fastTravelList) {
    fastTravelList.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-x]');
        if (btn && !btn.disabled) {
            btn.disabled = true; // UX & SECURITY: Prevent double-click mana drain exploit
            const tx = parseInt(btn.dataset.x, 10);
            const ty = parseInt(btn.dataset.y, 10);
            if (!isNaN(tx) && !isNaN(ty)) {
                handleFastTravel(tx, ty);
            }
        }
    });
}

if (closeFastTravelButton) {
    closeFastTravelButton.addEventListener('click', () => {
        if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
        fastTravelModal.classList.add('hidden');
    });
}

// --- END OF FILE fast-travel.js ---
