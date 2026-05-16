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
        subtitle.textContent = `Travel to an attuned Waystone? (Cost: ${travelCost} Mana)`;
    }

    fastTravelModal.classList.remove('hidden');
    // Hide the lore modal if it was open (since we opened this from there)
    loreModal.classList.add('hidden');
}

function renderFastTravelList() {
    fastTravelList.innerHTML = '';
    const waypoints = gameState.player.unlockedWaypoints || [];
    const playerX = gameState.player.x;
    const playerY = gameState.player.y;

    if (waypoints.length <= 1) {
        fastTravelList.innerHTML = '<li class="italic text-gray-500 p-2">You haven\'t attuned to any other Waystones yet. Explore the world to find them!</li>';
        return;
    }

    // EASY WIN: Calculate distances and sort the list so closest waystones are at the top!
    const availableWaypoints = waypoints
        .filter(wp => wp.x !== playerX || wp.y !== playerY) // Filter out current spot
        .map(wp => {
            const dist = Math.floor(Math.sqrt(Math.pow(wp.x - playerX, 2) + Math.pow(wp.y - playerY, 2)));
            return { ...wp, dist };
        })
        .sort((a, b) => a.dist - b.dist); // Sort by distance ascending

    availableWaypoints.forEach(wp => {
        const li = document.createElement('li');
        li.className = 'shop-item hover:border-indigo-500 transition-all'; // Reuse shop styling for nice boxes
        li.innerHTML = `
            <div>
                <span class="font-bold text-indigo-400">${wp.name}</span>
                <div class="text-xs text-gray-400 mt-1">Coords: ${wp.x}, ${-wp.y} <span class="ml-2 text-indigo-300">(Distance: ${wp.dist})</span></div>
            </div>
            <button class="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded text-xs font-bold shadow-md transition-transform active:scale-95" onclick="handleFastTravel(${wp.x}, ${wp.y})">Travel</button>
        `;
        fastTravelList.appendChild(li);
    });
}

window.handleFastTravel = function (targetX, targetY) {
    const player = gameState.player;
    
    // Apply Talent Discount
    const TRAVEL_COST = (player.talents && player.talents.includes('mana_flow')) ? 8 : 10;

    // Ensure the destination chunk is loaded or generate it temporarily to check the tile
    const tile = chunkManager.getTile(targetX, targetY);
    const invalidTiles = ['^', '~', '≈', '▓']; // Mountains, Water, Walls

    if (invalidTiles.includes(tile)) {
        logMessage("The Waystone is obstructed by terrain. Teleport unsafe.");
        return;
    }

    if (player.mana < TRAVEL_COST) {
        logMessage(`Not enough Mana to travel the leylines. (Need ${TRAVEL_COST})`);
        return;
    }

    // --- DEPARTURE FX ---
    if (typeof ParticleSystem !== 'undefined') {
        ParticleSystem.createExplosion(player.x, player.y, '#8b5cf6', 15); // Purple explosion
    }
    if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();

    // Deduct Cost
    player.mana -= TRAVEL_COST;
    
    // Failsafe State Override.
    gameState.mapMode = 'overworld';
    gameState.currentCaveId = null;
    gameState.currentCastleId = null;
    gameState.instancedEnemies = [];

    // --- FORCE DISEMBARK BEFORE TELEPORT ---
    if (player.isBoating) {
        player.isBoating = false;
        chunkManager.setWorldTile(player.x, player.y, 'c'); // Drop canoe in the water here
        logMessage("You leave your canoe behind to travel the leylines.");
    }
    if (player.isSailing) {
        player.isSailing = false;
        chunkManager.setWorldTile(player.x, player.y, '⛵'); // Drop ship in the water here
        logMessage("You drop anchor and leave your ship behind to travel the leylines.");
    }
    
    // Move Player
    player.x = targetX;
    player.y = targetY;

    logMessage("You dissolve into pure energy and reappear at the Waystone.");
    triggerStatAnimation(statDisplays.mana, 'stat-pulse-blue');

    // Teleport logic
    chunkManager.setWorldTile(player.x, player.y, '#'); // Ensure landing spot exists visually
    updateRegionDisplay();
    
    // --- ARRIVAL FX ---
    if (typeof ParticleSystem !== 'undefined') {
        ParticleSystem.createExplosion(player.x, player.y, '#3b82f6', 15); // Blue explosion
    }
    
    // Force complete redraw
    gameState.mapDirty = true;
    render();
    syncPlayerState();

    // Unload far chunks to prevent memory leaks after huge jumps
    const currentChunkX = Math.floor(player.x / chunkManager.CHUNK_SIZE);
    const currentChunkY = Math.floor(player.y / chunkManager.CHUNK_SIZE);
    chunkManager.unloadOutOfRangeChunks(currentChunkX, currentChunkY);

    fastTravelModal.classList.add('hidden');
    
    // Save to Firebase
    playerRef.update({ 
        mana: player.mana, 
        x: player.x, 
        y: player.y 
    });
};

closeFastTravelButton.addEventListener('click', () => fastTravelModal.classList.add('hidden'));
