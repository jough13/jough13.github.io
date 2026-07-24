// --- START OF FILE fast-travel.js ---

// ==========================================
// FAST TRAVEL & LEYLINE SYSTEM
// ==========================================

const fastTravelModal = document.getElementById('fastTravelModal');
const fastTravelList = document.getElementById('fastTravelList');
const closeFastTravelButton = document.getElementById('closeFastTravelButton');

// PERFORMANCE WIN: Expanded DOM Cache
// Prevents querying the DOM every time the modal is opened
const _ftDOMCache = {
    manaDisplay: null,
    title: null,
    subtitle: null,
    getManaDisplay: () => _ftDOMCache.manaDisplay || (document.getElementById('manaDisplay') && (_ftDOMCache.manaDisplay = document.getElementById('manaDisplay'))),
    getTitle: () => _ftDOMCache.title || (document.getElementById('fastTravelTitle') && (_ftDOMCache.title = document.getElementById('fastTravelTitle'))),
    getSubtitle: () => _ftDOMCache.subtitle || (fastTravelModal.querySelector('p.text-sm') && (_ftDOMCache.subtitle = fastTravelModal.querySelector('p.text-sm')))
};

// PERFORMANCE & EXPANDABILITY WIN: Data-Driven Biome Icons
// Clean, iterable array replaces a massive block of if/includes statements!
const BIOME_ICON_MAP = [
    { words: ['forest', 'wood', 'thicket'], icon: '🌲' },
    { words: ['mountain', 'peak', 'crag'], icon: '⛰️' },
    { words: ['swamp', 'marsh', 'bog'], icon: '🐸' },
    { words: ['desert', 'sand', 'dune'], icon: '🐪' },
    { words: ['dead', 'ash', 'wastes'], icon: '💀' },
    { words: ['water', 'sea', 'ocean', 'lake'], icon: '🌊' },
    { words: ['plains', 'expanse', 'valley'], icon: '🌿' },
    { words: ['volcano', 'fire', 'infernal'], icon: '🌋' },
    { words: ['crystal', 'glimmer', 'spire'], icon: '💎' },
    { words: ['ruin', 'castle', 'fortress', 'keep'], icon: '🏰' },
    { words: ['mine', 'delve', 'tunnel'], icon: '⛏️' },
    { words: ['void', 'abyss', 'rift'], icon: '🌌' },
    { words: ['camp', 'hideout', 'spot'], icon: '⛺' }
];

function getBiomeIcon(name) {
    if (!name) return '✨';
    const n = name.toLowerCase();
    
    // 🚀 PERFORMANCE WIN: Hard loop bypasses lambda allocation of .some()
    for (let i = 0; i < BIOME_ICON_MAP.length; i++) {
        const words = BIOME_ICON_MAP[i].words;
        for (let j = 0; j < words.length; j++) {
            if (n.includes(words[j])) return BIOME_ICON_MAP[i].icon;
        }
    }
    return '✨'; // Default
}

function openFastTravelModal() {
    if (typeof inputQueue !== 'undefined') inputQueue.length = 0;
    if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
    
    renderFastTravelList();
    
    const player = gameState.player;
    const travelCost = (player.talents && player.talents.includes('mana_flow')) ? 8 : 10;
    
    const title = _ftDOMCache.getTitle();
    const subtitle = _ftDOMCache.getSubtitle();
    
    // LORE WIN: Dynamic UI text that reacts to dimensional status
    if (gameState.currentRealm !== 0 && gameState.currentRealm) {
        if (title) {
            title.innerHTML = "Leyline Interference";
            title.className = "text-3xl font-bold mb-2 text-red-500 animate-pulse";
        }
        if (subtitle) {
            subtitle.innerHTML = `The local grid is severed. Only Prime Anchors remain visible.<br><span class="text-xs text-red-300 font-bold">(Emergency Recall Cost: ${travelCost} Mana)</span>`;
            subtitle.className = "text-sm text-gray-300 mb-6 bg-red-900 bg-opacity-20 p-2 rounded border border-red-800 text-center shadow-inner";
        }
    } else {
        if (title) {
            title.innerHTML = "Leyline Network";
            title.className = "text-3xl font-bold mb-2 text-purple-400 drop-shadow-md";
        }
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

    // UX WIN: Concise Compass Abbreviations save space on mobile UI
    const getDir = (tx, ty) => {
        const dx = tx - playerX;
        const dy = ty - playerY; // Negative Y is North in our grid
        if (dx === 0 && dy === 0) return '';
        
        let dirStr = '';
        if (dy < 0) dirStr += 'N';
        else if (dy > 0) dirStr += 'S';
        
        if (dx < 0) dirStr += 'W';
        else if (dx > 0) dirStr += 'E';
        
        return dirStr ? ` (${dirStr})` : '';
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
        
        const dx = 0 - playerX;
        const dy = 0 - playerY;
        const distToVillage = Math.floor(Math.sqrt(dx * dx + dy * dy));
        
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
                <div class="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">Coords: 0, 0 <span class="ml-2 text-blue-300 font-bold bg-black bg-opacity-30 px-1 rounded border border-gray-700">(Dist: ${distToVillage}m${getDir(0, 0)})</span></div>
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
            
            const dx = rx - playerX;
            const dy = ry - playerY;
            const distToCamp = Math.floor(Math.sqrt(dx * dx + dy * dy));
            
            const btnClass = canAfford ? "bg-green-600 hover:bg-green-500 text-white" : "bg-gray-700 text-gray-400 opacity-50 cursor-not-allowed border-gray-600";
            const btnText = canAfford ? `-${baseTravelCost} MP` : 'OOM';

            const bedLi = document.createElement('li');
            bedLi.className = 'shop-item bg-green-900 bg-opacity-20 border-green-700 hover:border-green-400 transition-all transform hover:-translate-y-0.5 shadow-sm hover:shadow-lg';
            bedLi.setAttribute('onmouseenter', "if(typeof AudioSystem !== 'undefined') AudioSystem.playHover()");
            bedLi.innerHTML = `
                <div>
                    <span class="font-bold text-green-400 drop-shadow-md">⛺ Personal Camp (Bed)</span>
                    <div class="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">Coords: ${rx}, ${-ry} <span class="ml-2 text-green-300 font-bold bg-black bg-opacity-30 px-1 rounded border border-gray-700">(Dist: ${distToCamp}m${getDir(rx, ry)})</span></div>
                </div>
                <button data-x="${rx}" data-y="${ry}" class="px-3 py-2 rounded text-xs font-bold shadow-md transition-transform active:scale-95 border-b-2 ${canAfford ? 'border-green-800 active:border-b-0 active:mt-0.5' : 'border-gray-800'} ${btnClass}" ${canAfford ? '' : 'disabled'}>${btnText}</button>
            `;
            fragment.appendChild(bedLi);
        }
    }

    // --- UI CATEGORY: WILDERNESS WAYSTONES ---
    // Hide regular waystones if the player is stuck in an alternate dimension
    if (gameState.currentRealm === 0 || !gameState.currentRealm) {
        
        // BUG FIX & PERFORMANCE WIN: 
        // 1. Deduplication to prevent corrupted DB arrays from showing double waypoints
        // 2. Sort by distance squared (distSq) to avoid computing Math.sqrt inside the loop comparison
        const seenCoords = new Set();
        
        const availableWaypoints = waypoints
            .filter(wp => {
                // Remove malformed or current location
                if (!wp || typeof wp.x !== 'number' || typeof wp.y !== 'number') return false;
                if (wp.x === playerX && wp.y === playerY) return false;
                
                // Remove exact coordinate duplicates
                const coordKey = `${wp.x},${wp.y}`;
                if (seenCoords.has(coordKey)) return false;
                seenCoords.add(coordKey);
                
                return true;
            })
            .map(wp => {
                const dx = wp.x - playerX;
                const dy = wp.y - playerY;
                const distSq = (dx * dx) + (dy * dy);
                return { ...wp, distSq, dist: Math.floor(Math.sqrt(distSq)), dir: getDir(wp.x, wp.y) };
            })
            .sort((a, b) => a.distSq - b.distSq); // Sort entirely via integer squares!

        const waystoneHeader = document.createElement('div');
        waystoneHeader.className = "text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-6 mb-2 border-b border-gray-700 pb-1 flex justify-between";
        waystoneHeader.innerHTML = `<span>Attuned Leyline Nodes</span> <span>${availableWaypoints.length} Unlocked</span>`;
        fragment.appendChild(waystoneHeader);

        if (availableWaypoints.length === 0) {
            const emptyLi = document.createElement('li');
            emptyLi.className = 'italic text-gray-500 p-4 text-center border border-gray-700 rounded-lg text-xs bg-black bg-opacity-20 shadow-inner font-serif';
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
                const dangerBadge = wp.dist > 1500 ? `<span title="Extreme Danger Zone!" class="ml-2 animate-pulse drop-shadow-md text-red-500 font-bold">💀</span>` : '';
                
                const li = document.createElement('li');
                li.className = 'shop-item bg-purple-900 bg-opacity-10 border-gray-700 hover:border-purple-500 transition-all transform hover:-translate-y-0.5 shadow-sm hover:shadow-lg relative group';
                li.setAttribute('onmouseenter', "if(typeof AudioSystem !== 'undefined') AudioSystem.playHover()");
                
                // QoL WIN: Renaming & Forget Buttons
                // Pops up seamlessly when hovering over the item!
                li.innerHTML = `
                    <div class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                        <button data-rename-x="${wp.x}" data-rename-y="${wp.y}" title="Rename Waypoint" class="bg-gray-800 hover:bg-gray-600 text-gray-300 rounded px-1.5 py-0.5 text-[9px] font-bold border border-gray-600 shadow-sm">✏️ Rename</button>
                        <button data-forget-x="${wp.x}" data-forget-y="${wp.y}" title="Un-attune (Forget Waypoint)" class="bg-red-900 hover:bg-red-700 text-red-300 rounded px-1.5 py-0.5 text-[9px] font-bold border border-red-700 shadow-sm">🗑️</button>
                    </div>
                    <div>
                        <span class="font-bold text-purple-400 drop-shadow-md">${icon} ${safeName}${dangerBadge}</span>
                        <div class="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">Coords: ${wp.x}, ${-wp.y} <span class="ml-2 text-purple-300 font-bold bg-black bg-opacity-30 px-1 rounded border border-gray-700">(Dist: ${wp.dist}m${wp.dir})</span></div>
                    </div>
                    <button data-x="${wp.x}" data-y="${wp.y}" class="px-3 py-2 rounded text-xs font-bold shadow-md transition-transform active:scale-95 border-b-2 ${canAffordBase ? 'border-purple-800 active:border-b-0 active:mt-0.5' : 'border-gray-800'} ${btnClass} ml-2" ${canAffordBase ? '' : 'disabled'}>${btnText}</button>
                `;
                fragment.appendChild(li);
            });
        }
    }

    fastTravelList.appendChild(fragment);
}

// QoL WIN: Dynamic Custom Naming Function
window.renameWaypoint = function(wpX, wpY) {
    if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
    
    const player = gameState.player;
    if (!player.unlockedWaypoints) return;
    
    const wpIndex = player.unlockedWaypoints.findIndex(w => w.x === wpX && w.y === wpY);
    if (wpIndex === -1) return;
    
    const currentName = player.unlockedWaypoints[wpIndex].name;
    const newName = prompt("Enter a new name for this Waystone (Max 24 characters):", currentName);
    
    // SECURITY WIN: Strict sanitization and falsy validation
    if (newName && newName.trim() !== '') {
        const cleanName = newName.substring(0, 24).replace(/[^a-zA-Z0-9 \-']/g, '').trim();
        if (cleanName.length > 0) {
            player.unlockedWaypoints[wpIndex].name = cleanName;
            logMessage(`{gray:Waystone renamed to "${cleanName}".}`);
            
            // Save to Firebase
            if (typeof playerRef !== 'undefined') {
                playerRef.update({ unlockedWaypoints: player.unlockedWaypoints }).catch(e => console.error(e));
            }
            // Re-render instantly
            renderFastTravelList();
        }
    }
};

// QoL EXPANSION: Forget Waypoint
window.forgetWaypoint = function(wpX, wpY) {
    if (typeof AudioSystem !== 'undefined') AudioSystem.playWarning();
    
    const player = gameState.player;
    if (!player.unlockedWaypoints) return;
    
    const wpIndex = player.unlockedWaypoints.findIndex(w => w.x === wpX && w.y === wpY);
    if (wpIndex === -1) return;
    
    const currentName = player.unlockedWaypoints[wpIndex].name;
    const safeName = typeof escapeHtml === 'function' ? escapeHtml(currentName) : currentName;
    
    if (confirm(`Are you sure you want to un-attune from '${safeName}' at (${wpX}, ${-wpY})?\n\nYou will have to physically walk back there to unlock it again.`)) {
        player.unlockedWaypoints.splice(wpIndex, 1);
        logMessage(`{red:You severed your connection to the ${safeName} waystone.}`);
        
        if (typeof AudioSystem !== 'undefined') AudioSystem.playNoise(0.5, 0.1, 400); // Tearing sound
        
        // Save to Firebase
        if (typeof playerRef !== 'undefined') {
            playerRef.update({ unlockedWaypoints: player.unlockedWaypoints }).catch(e => console.error(e));
        }
        // Re-render instantly
        renderFastTravelList();
    }
};

// JUICE WIN: Make the handler fully asynchronous so we can await particle animations and build tension!
window.handleFastTravel = async function (targetX, targetY) {
    // 🚨 GLOBAL ENGINE LOCK
    if (isProcessingMove) return;
    isProcessingMove = true;
    let didTeleport = false; // UX/BUG FIX WIN: Determines if we should apply post-teleport lock

    // Instantly hide the modal so the player can see the visual effects!
    fastTravelModal.classList.add('hidden'); 

    try {
        const player = gameState.player;
        
        // Apply Talent Discount & Newbie Grace Period
        const isFreeRecall = (targetX === 0 && targetY === 0) && player.level <= 3;
        const TRAVEL_COST = isFreeRecall ? 0 : ((player.talents && player.talents.includes('mana_flow')) ? 8 : 10);

        // Calculate physical distance for dynamic juice and lore mechanics
        const dx = targetX - player.x;
        const dy = targetY - player.y;
        const travelDist = Math.floor(Math.sqrt(dx * dx + dy * dy));

        // --- GAMEPLAY & PERFORMANCE WIN: Fast-Path Combat Checks ---
        // Uses Manhattan Distance boundary box before attempting costly Euclidean math!
        let inCombat = false;
        const COMBAT_RADIUS_SQ = 25; 
        
        if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') {
            const sharedEnemies = Object.values(gameState.sharedEnemies || {});
            for (let i = 0; i < sharedEnemies.length; i++) {
                const enemy = sharedEnemies[i];
                if (enemy && enemy.health > 0 && typeof enemy.x === 'number' && typeof enemy.y === 'number') {
                    // Fast-path Manhattan distance check
                    const eDx = Math.abs(enemy.x - player.x);
                    const eDy = Math.abs(enemy.y - player.y);
                    if (eDx <= 5 && eDy <= 5 && (eDx * eDx + eDy * eDy) <= COMBAT_RADIUS_SQ) {
                        inCombat = true;
                        break;
                    }
                }
            }
        } else {
            if (gameState.instancedEnemies) {
                for (let i = 0; i < gameState.instancedEnemies.length; i++) {
                    const e = gameState.instancedEnemies[i];
                    if (e && e.health > 0) {
                        const eDx = Math.abs(e.x - player.x);
                        const eDy = Math.abs(e.y - player.y);
                        if (eDx <= 5 && eDy <= 5 && (eDx * eDx + eDy * eDy) <= COMBAT_RADIUS_SQ) {
                            inCombat = true;
                            break;
                        }
                    }
                }
            }
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

        // --- DESTINATION OCCUPANCY CHECK (Telefrag Prevention) ---
        let isOccupied = false;
        if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') {
            const destEnemyId = `overworld:${targetX},${-targetY}`;
            if (gameState.sharedEnemies && gameState.sharedEnemies[destEnemyId]) isOccupied = true;
        } else {
            if (gameState.instancedEnemies && gameState.instancedEnemies.some(e => e.x === targetX && e.y === targetY)) isOccupied = true;
        }

        if (isOccupied && !isVillageBypass) {
            logMessage("{red:A hostile presence blocks the destination. The leylines refuse to connect.}");
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
                const initialLen = ParticleSystem.activeParticles.length;
                ParticleSystem.spawn(player.x + Math.cos(angle) * dist, player.y + Math.sin(angle) * dist, isFreeRecall ? '#3b82f6' : '#a855f7', 'dust');
                
                // 🚨 BUG FIX & ROBUSTNESS WIN: Validated Particle Modification
                // Prevents modifying an older ghost particle if the active pool is completely empty!
                if (ParticleSystem.activeParticles.length > initialLen) {
                    const p = ParticleSystem.activeParticles[ParticleSystem.activeParticles.length-1];
                    if (p) {
                        // Pull particles inward sharply
                        p.vx = -Math.cos(angle) * 0.3;
                        p.vy = -Math.sin(angle) * 0.3;
                        p.lifeFade = 0.03; 
                    }
                }
            }
            ParticleSystem.createFloatingText(player.x, player.y, "Warping...", isFreeRecall ? "#60a5fa" : "#c084fc");
        }
        
        // JUICE WIN: Rising magical tone builds tension before the snap!
        if (typeof AudioSystem !== 'undefined') {
            AudioSystem.playTone(200, 'sine', 0.4, 0.2, false, 800); // Rises from 200hz to 800hz!
        }
        
        // JUICE WIN: Teleport Tension Builder
        // Screen rumbles slightly as the portal opens, then shakes violently on transit!
        gameState.screenShake = 3;
        await new Promise(resolve => setTimeout(() => {
            gameState.screenShake = 12;
            resolve();
        }, 200));

        // Wait for the particles to suck into the player before snapping the coordinates!
        await new Promise(resolve => setTimeout(resolve, 200));

        // Mark the actual teleportation point of no return!
        didTeleport = true;

        // Deduct Cost securely (Math.max prevents negative anomalies)
        player.mana = Math.max(0, player.mana - TRAVEL_COST);
        
        // Track database updates
        const updates = {};
        
        // --- GAMEPLAY EXPANSION: The Toll of the Leylines & Magic Surges ---
        // Fast travel strains the body. The further you go, the hungrier/thirstier you get.
        const distanceToll = Math.floor(travelDist / 500); // 1 point of drain per 500 tiles
        
        if (distanceToll > 0) {
            player.hunger = Math.max(0, player.hunger - distanceToll);
            player.thirst = Math.max(0, player.thirst - distanceToll);
            updates.hunger = player.hunger;
            updates.thirst = player.thirst;
            
            // Visual feedback for the toll
            if (typeof triggerStatAnimation === 'function') {
                const hDisp = document.getElementById('hungerDisplay');
                const tDisp = document.getElementById('thirstDisplay');
                if (hDisp) triggerStatAnimation(hDisp, 'stat-flash-red');
                if (tDisp) triggerStatAnimation(tDisp, 'stat-flash-red');
            }
        }
        
        // 5% chance the leylines are overflowing, refunding the mana!
        if (!isFreeRecall && Math.random() < 0.05) {
            player.mana = Math.min(player.maxMana, player.mana + TRAVEL_COST);
            logMessage("{fuchsia:A surge in the leylines refunds your magical energy!}");
            
            if (typeof triggerStatAnimation === 'function' && _ftDOMCache.getManaDisplay()) {
                triggerStatAnimation(_ftDOMCache.getManaDisplay(), 'stat-pulse-purple');
            }
        }
        
        updates.mana = player.mana; // Push final mana state

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
        
        // --- LORE WIN: DIMENSIONAL BLEED ---
        // If the player is suffering from Madness, the teleport becomes unstable!
        let finalX = targetX;
        let finalY = targetY;

        if (player.madnessTurns > 0 && !isVillageBypass && Math.random() < 0.50) {
            logMessage("{purple:Your fractured mind destabilizes the leylines! You materialise off-target!}");
            
            // Scatter them 1 to 5 tiles away from the destination
            let foundSafeSpot = false;
            for (let r = 1; r <= 5; r++) {
                if (foundSafeSpot) break;
                for (let dy = -r; dy <= r; dy++) {
                    for (let dx = -r; dx <= r; dx++) {
                        const checkX = targetX + dx;
                        const checkY = targetY + dy;
                        const checkTile = chunkManager.getTile(checkX, checkY);
                        
                        if (['.', 'F', 'd', 'D', '❄️', '🍄'].includes(checkTile)) {
                            finalX = checkX;
                            finalY = checkY;
                            foundSafeSpot = true;
                            break;
                        }
                    }
                    if (foundSafeSpot) break;
                }
            }
        }

        // Move Player
        player.x = finalX;
        player.y = finalY;
        updates.x = finalX;
        updates.y = finalY;

        // LORE WIN: Biome & Weather-Aware Arrival Messages!
        const arrivalTile = chunkManager.getTile(finalX, finalY) || '.';
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
        else if (arrivalTile === '🍄') arrivalFlavor = "Spores puff into the air as the leylines deposit you in the fungal jungle.";
        else if (arrivalTile === '🏰' || arrivalTile === 'V') arrivalFlavor = "You step onto the worked stone of civilization.";

        // Weather Synergy!
        let weatherFlavor = "";
        if (!isFreeRecall && gameState.weather !== 'clear') {
            if (gameState.weather === 'rain') weatherFlavor = " The rain instantly soaks your clothes.";
            else if (gameState.weather === 'snow') weatherFlavor = " A biting chill cuts through you immediately.";
            else if (gameState.weather === 'storm') weatherFlavor = " Thunder greets your arrival.";
            else if (gameState.weather === 'fog') weatherFlavor = " Thick mist immediately obscures your vision.";
        }

        if (travelDist > 1000) {
            logMessage(`{purple:You cross a terrifying distance. The leylines scream as you re-enter reality!}`);
            gameState.screenShake = 25;
            if (typeof AudioSystem !== 'undefined' && typeof AudioSystem.playBossSpawn === 'function') {
                AudioSystem.playBossSpawn(); // Heavy impact
            } else if (typeof AudioSystem !== 'undefined') {
                AudioSystem.playMagic();
            }
        } else {
            logMessage(`{cyan:${arrivalFlavor}${weatherFlavor}}`);
            gameState.screenShake = 10; // Standard landing impact
            if (typeof AudioSystem !== 'undefined') AudioSystem.playStep();
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
        // 🚨 UX WIN: Smart Engine Unlock
        // If the player successfully teleported, we want to hold the 200ms lock to allow visual FX
        // and network data to load cleanly. But if they failed (e.g. Obstructed, No Mana), we 
        // instantly un-lock them so their controls don't randomly feel "sticky" for a split second!
        if (didTeleport) {
            setTimeout(() => { isProcessingMove = false; }, 200);
        } else {
            isProcessingMove = false;
        }
    }
};

// --- SECURITY & BUG FIX WIN: Safe Event Delegation ---
// We explicitly resolve the async handleFastTravel so we can reliably un-disable the UI button
// in the event the teleport fails locally (e.g. out of mana, enemy blocked).
if (fastTravelList && !fastTravelList.dataset.listenersBound) {
    fastTravelList.addEventListener('click', (e) => {
        
        // 1. Did they click the rename button?
        const renameBtn = e.target.closest('button[data-rename-x]');
        if (renameBtn) {
            const tx = parseInt(renameBtn.dataset.renameX, 10);
            const ty = parseInt(renameBtn.dataset.renameY, 10);
            if (!isNaN(tx) && !isNaN(ty) && typeof window.renameWaypoint === 'function') {
                window.renameWaypoint(tx, ty);
            }
            return;
        }

        // 2. Did they click the forget button?
        const forgetBtn = e.target.closest('button[data-forget-x]');
        if (forgetBtn) {
            const tx = parseInt(forgetBtn.dataset.forgetX, 10);
            const ty = parseInt(forgetBtn.dataset.forgetY, 10);
            if (!isNaN(tx) && !isNaN(ty) && typeof window.forgetWaypoint === 'function') {
                window.forgetWaypoint(tx, ty);
            }
            return;
        }

        // 3. Did they click the teleport button?
        const btn = e.target.closest('button[data-x]');
        if (btn && !btn.disabled) {
            btn.disabled = true; // UX & SECURITY: Prevent double-click mana drain exploit
            const tx = parseInt(btn.dataset.x, 10);
            const ty = parseInt(btn.dataset.y, 10);
            if (!isNaN(tx) && !isNaN(ty)) {
                // Wrap in Promise.resolve so we can definitively catch the end of the async function
                Promise.resolve(handleFastTravel(tx, ty)).finally(() => {
                    // Re-enable in case the modal didn't close (meaning the teleport was rejected)
                    if (btn) btn.disabled = false;
                });
            } else {
                btn.disabled = false;
            }
        }
    });
    fastTravelList.dataset.listenersBound = 'true';
}

if (closeFastTravelButton && !closeFastTravelButton.dataset.listenersBound) {
    closeFastTravelButton.addEventListener('click', () => {
        if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
        fastTravelModal.classList.add('hidden');
    });
    closeFastTravelButton.dataset.listenersBound = 'true';
}

// --- END OF FILE fast-travel.js ---
