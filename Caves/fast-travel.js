const fastTravelModal = document.getElementById('fastTravelModal');
const fastTravelList = document.getElementById('fastTravelList');
const closeFastTravelButton = document.getElementById('closeFastTravelButton');

function openFastTravelModal() {
    renderFastTravelList();
    fastTravelModal.classList.remove('hidden');
    // Hide the lore modal if it was open (since we opened this from there)
    loreModal.classList.add('hidden');
}

function renderFastTravelList() {
    fastTravelList.innerHTML = '';
    const waypoints = gameState.player.unlockedWaypoints || [];

    if (waypoints.length <= 1) {
        fastTravelList.innerHTML = '<li class="italic text-gray-500 p-2">You haven\'t attuned to any other Waystones yet. Explore the world to find them!</li>';
        return;
    }

    waypoints.forEach(wp => {
        // Don't show the one we are standing on
        if (wp.x === gameState.player.x && wp.y === gameState.player.y) return;

        const li = document.createElement('li');
        li.className = 'shop-item'; // Reuse shop styling for nice boxes
        li.innerHTML = `
            <div>
                <span class="font-bold text-indigo-400">${wp.name}</span>
                <div class="text-xs text-gray-400">Coords: ${wp.x}, ${-wp.y}</div>
            </div>
            <button class="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded text-xs font-bold" onclick="handleFastTravel(${wp.x}, ${wp.y})">Travel</button>
        `;
        fastTravelList.appendChild(li);
    });
}

window.handleFastTravel = function (targetX, targetY) {
    const player = gameState.player;
    const TRAVEL_COST = 10;

    // Ensure the destination chunk is loaded or generate it temporarily to check the tile
    const tile = chunkManager.getTile(targetX, targetY);
    const invalidTiles = ['^', '~', '≈', '▓']; // Mountains, Water, Walls

    if (invalidTiles.includes(tile)) {
        logMessage("The Waystone is obstructed by terrain. Teleport unsafe.");
        return;
    }

    if (player.mana < TRAVEL_COST) {
        logMessage("Not enough Mana to travel the leylines.");
        return;
    }

    player.mana -= TRAVEL_COST;
    player.x = targetX;
    player.y = targetY;

    logMessage("You dissolve into pure energy and reappear at the Waystone.");
    triggerStatAnimation(statDisplays.mana, 'stat-pulse-blue');

    // Teleport logic
    chunkManager.setWorldTile(player.x, player.y, '#'); // Ensure landing spot exists visually
    updateRegionDisplay();
    render();
    syncPlayerState();

    // Unload far chunks
    const currentChunkX = Math.floor(player.x / chunkManager.CHUNK_SIZE);
    const currentChunkY = Math.floor(player.y / chunkManager.CHUNK_SIZE);
    chunkManager.unloadOutOfRangeChunks(currentChunkX, currentChunkY);

    fastTravelModal.classList.add('hidden');
    playerRef.update({ mana: player.mana, x: player.x, y: player.y });
};

closeFastTravelButton.addEventListener('click', () => fastTravelModal.classList.add('hidden'));
