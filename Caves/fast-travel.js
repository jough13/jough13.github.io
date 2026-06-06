// ==========================================
// FAST TRAVEL & LEYLINE SYSTEM
// ==========================================

const fastTravelModal = document.getElementById('fastTravelModal');
const fastTravelList = document.getElementById('fastTravelList');
const closeFastTravelButton = document.getElementById('closeFastTravelButton');

function openFastTravelModal() {
    renderFastTravelList();
    
    // EASY WIN: Dynamic UI text that respects the Archmage 'mana_flow' talent!
    const player = gameState.player;
    const travelCost = (player.talents && player.talents.includes('mana_flow')) ? 8 : 10;
    
    const subtitle = fastTravelModal.querySelector('p.text-sm');
    if (subtitle) {
        subtitle.innerHTML = `Travel the leylines to an attuned Waystone?<br><span class="text-xs text-purple-300 font-bold">(Base Cost: ${travelCost} Mana)</span>`;
    }

    fastTravelModal.classList.remove('hidden');
    // Hide the lore modal if it was open (since we typically open this from a Waystone)
    const loreModal = document.getElementById('loreModal');
    if (loreModal) loreModal.classList.add('hidden');
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

    // Helper: Calculate Distance
    const getDist = (tx, ty) => Math.floor(Math.sqrt(Math.pow(tx - playerX, 2) + Math.pow(ty - playerY, 2)));

    // Helper: Calculate Compass Direction (QoL WIN!)
    const getDir = (tx, ty) => {
        const dx = tx - playerX;
        const dy = ty - playerY; // Negative Y is North in our grid
        if (dx === 0 && dy === 0) return '';
        let dir = '';
        if (dy < 0) dir += 'N';
        else if (dy > 0) dir += 'S';
        if (dx > 0) dir += 'E';
        else if (dx < 0) dir += 'W';
        return dir ? ` ${dir}` : '';
    };

    // --- UI CATEGORY: SANCTUARIES ---
    const sanctuaryHeader = document.createElement('div');
    sanctuaryHeader.className = "text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2 mb-2 border-b border-gray-700 pb-1";
    sanctuaryHeader.textContent = "Sanctuaries";
    fragment.appendChild(sanctuaryHeader);

    // 1. PERMANENT FALLBACK: Safe Haven Village
    if (playerX !== 0 || playerY !== 0) {
        // NEWBIE GRACE PERIOD: Free travel to spawn if level 3 or under!
        const isFree = player.level <= 3;
        const cost = isFree ? 0 : baseTravelCost;
        const canAfford = player.mana >= cost;
        
        const btnClass = canAfford ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-gray-700 text-gray-400 opacity-50 cursor-not-allowed";
        const btnText = canAfford ? (isFree ? 'Free' : `-${cost} MP`) : 'OOM';

        const villageLi = document.createElement('li');
        villageLi.className = 'shop-item bg-blue-900 bg-opacity-20 border-blue-700 hover:border-blue-400 transition-all transform hover:-translate-y-0.5';
        villageLi.innerHTML = `
            <div>
                <span class="font-bold text-blue-400">Safe Haven Village</span>
                <div class="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">Coords: 0, 0 <span class="ml-2 text-blue-300">(Dist: ${getDist(0, 0)}m${getDir(0, 0)})</span></div>
            </div>
            <button class="px-3 py-2 rounded text-xs font-bold shadow-md transition-transform active:scale-95 ${btnClass}" ${canAfford ? '' : 'disabled'} onclick="handleFastTravel(0, 0)">${btnText}</button>
        `;
        fragment.appendChild(villageLi);
    }

    // 2. PERMANENT FALLBACK: Personal Bed / Camp
    if (player.respawnPoint && (player.respawnPoint.x !== playerX || player.respawnPoint.y !== playerY)) {
        if (player.respawnPoint.x !== 0 || player.respawnPoint.y !== 0) {
            const rx = player.respawnPoint.x;
            const ry = player.respawnPoint.y;
            const canAfford = player.mana >= baseTravelCost;
            
            const btnClass = canAfford ? "bg-green-600 hover:bg-green-500 text-white" : "bg-gray-700 text-gray-400 opacity-50 cursor-not-allowed";
            const btnText = canAfford ? `-${baseTravelCost} MP` : 'OOM';

            const bedLi = document.createElement('li');
            bedLi.className = 'shop-item bg-green-900 bg-opacity-20 border-green-700 hover:border-green-400 transition-all transform hover:-translate-y-0.5';
            bedLi.innerHTML = `
                <div>
                    <span class="font-bold text-green-400">Personal Camp (Bed)</span>
                    <div class="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">Coords: ${rx}, ${-ry} <span class="ml-2 text-green-300">(Dist: ${getDist(rx, ry)}m${getDir(rx, ry)})</span></div>
                </div>
                <button class="px-3 py-2 rounded text-xs font-bold shadow-md transition-transform active:scale-95 ${btnClass}" ${canAfford ? '' : 'disabled'} onclick="handleFastTravel(${rx}, ${ry})">${btnText}</button>
            `;
            fragment.appendChild(bedLi);
        }
    }

    // --- UI CATEGORY: WILDERNESS WAYSTONES ---
    const waystoneHeader = document.createElement('div');
    waystoneHeader.className = "text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-6 mb-2 border-b border-gray-700 pb-1 flex justify-between";
    waystoneHeader.innerHTML = `<span>Wilderness Waystones</span> <span>${waypoints.length} Unlocked</span>`;
    fragment.appendChild(waystoneHeader);

    const availableWaypoints = waypoints
        .filter(wp => wp.x !== playerX || wp.y !== playerY) // Filter out current spot
        .map(wp => ({ ...wp, dist: getDist(wp.x, wp.y), dir: getDir(wp.x, wp.y) }))
        .sort((a, b) => a.dist - b.dist); // Sort by distance ascending

    if (availableWaypoints.length === 0) {
        const emptyLi = document.createElement('li');
        emptyLi.className = 'italic text-gray-500 p-4 text-center border border-gray-700 rounded-lg text-xs';
        emptyLi.textContent = "You haven't attuned to any Wilderness Waystones yet. Explore the world to find them!";
        fragment.appendChild(emptyLi);
    } else {
        const canAffordBase = player.mana >= baseTravelCost;
        const btnClass = canAffordBase ? "bg-purple-600 hover:bg-purple-500 text-white" : "bg-gray-700 text-gray-400 opacity-50 cursor-not-allowed";
        const btnText = canAffordBase ? `-${baseTravelCost} MP` : 'OOM';

        availableWaypoints.forEach(wp => {
            const li = document.createElement('li');
            li.className = 'shop-item bg-purple-900 bg-opacity-10 border-gray-700 hover:border-purple-500 transition-all transform hover:-translate-y-0.5';
            li.innerHTML = `
                <div>
                    <span class="font-bold text-purple-400">${wp.name}</span>
                    <div class="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">Coords: ${wp.x}, ${-wp.y} <span class="ml-2 text-purple-300">(Dist: ${wp.dist}m${wp.dir})</span></div>
                </div>
                <button class="px-3 py-2 rounded text-xs font-bold shadow-md transition-transform active:scale-95 ${btnClass}" ${canAffordBase ? '' : 'disabled'} onclick="handleFastTravel(${wp.x}, ${wp.y})">${btnText}</button>
            `;
            fragment.appendChild(li);
        });
    }

    fastTravelList.appendChild(fragment);
}

window.handleFastTravel = function (targetX, targetY) {
    // Prevent double-clicking
    if (isProcessingMove) return;

    const player = gameState.player;
    
    // Apply Talent Discount & Newbie Grace Period
    const isFreeRecall = (targetX === 0 && targetY === 0) && player.level <= 3;
    const TRAVEL_COST = isFreeRecall ? 0 : ((player.talents && player.talents.includes('mana_flow')) ? 8 : 10);

    // --- GAMEPLAY WIN: Anti-Combat Teleport ---
    // You cannot flee via leylines if enemies are too close! (5 tile radius)
    let inCombat = false;
    if (gameState.mapMode === 'overworld') {
        for (const enemyId in gameState.sharedEnemies) {
            const enemy = gameState.sharedEnemies[enemyId];
            if (Math.abs(enemy.x - player.x) <= 5 && Math.abs(enemy.y - player.y) <= 5) {
                inCombat = true;
                break;
            }
        }
    } else {
        inCombat = gameState.instancedEnemies.some(e => Math.abs(e.x - player.x) <= 5 && Math.abs(e.y - player.y) <= 5);
    }

    if (inCombat) {
        logMessage("{red:You cannot travel the leylines while enemies are nearby!}");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }

    // --- OBSTRUCTION CHECK ---
    const tile = chunkManager.getTile(targetX, targetY);
    const invalidTiles = ['^', '~', '≈', '▓', '▒']; // Mountains, Water, Walls

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
        return;
    }

    // --- ENGINE LOCK ---
    isProcessingMove = true;

    // --- DEPARTURE FX ---
    if (typeof ParticleSystem !== 'undefined') {
        ParticleSystem.createExplosion(player.x, player.y, '#8b5cf6', 15); // Purple explosion
    }
    if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
    
    // JUICE: Teleport Sickness Screen Shake
    gameState.screenShake = 15;

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

    if (isFreeRecall) {
        logMessage("{cyan:The leylines gently carry you back to safety.}");
    } else {
        logMessage("{purple:You dissolve into pure energy and reappear at your destination.}");
    }
    
    if (typeof triggerStatAnimation === 'function') triggerStatAnimation(document.getElementById('manaDisplay'), 'stat-pulse-blue');

    // Ensure landing spot exists visually if it's not the village
    if (!isVillageBypass) {
        chunkManager.setWorldTile(player.x, player.y, '#'); 
    }
    
    if (typeof updateRegionDisplay === 'function') updateRegionDisplay();
    
    // --- ARRIVAL FX ---
    if (typeof ParticleSystem !== 'undefined') {
        ParticleSystem.createExplosion(player.x, player.y, '#3b82f6', 20); // Blue explosion
    }
    
    // Force complete redraw
    gameState.mapDirty = true;
    if (typeof render === 'function') render();
    if (typeof syncPlayerState === 'function') syncPlayerState();

    // Unload far chunks to prevent memory leaks after huge jumps
    const currentChunkX = Math.floor(player.x / chunkManager.CHUNK_SIZE);
    const currentChunkY = Math.floor(player.y / chunkManager.CHUNK_SIZE);
    if (typeof chunkManager.unloadOutOfRangeChunks === 'function') {
        chunkManager.unloadOutOfRangeChunks(currentChunkX, currentChunkY);
    }

    fastTravelModal.classList.add('hidden');
    
    // Save state completely to Firebase
    if (typeof playerRef !== 'undefined' && playerRef) {
        playerRef.update(updates).catch(e => console.error("Fast travel sync error:", e));
    }
    
    if (typeof renderStats === 'function') renderStats();

    // Unlock Engine after a brief delay to simulate travel time
    setTimeout(() => { isProcessingMove = false; }, 300);
};

if (closeFastTravelButton) {
    closeFastTravelButton.addEventListener('click', () => fastTravelModal.classList.add('hidden'));
}
