const chunkManager = {
    CHUNK_SIZE: 16,
    loadedChunks: {},
    worldState: {},
    caveMaps: {},
    caveThemes: {},
    castleMaps: {},
    caveEnemies: {},
generateCave(caveId) {
        if (this.caveMaps[caveId]) return this.caveMaps[caveId];

        // --- 1. Setup Variables (Dynamic Scaling) ---
        let chosenThemeKey;
        let CAVE_WIDTH = 70;
        let CAVE_HEIGHT = 70;
        let enemyCount = 20;

        // Calculate cave location from ID (format: cave_X_Y)
        const parts = caveId.split('_');
        const cX = parts.length > 2 ? parseInt(parts[1]) : 0;
        const cY = parts.length > 2 ? parseInt(parts[2]) : 0;
        const dist = Math.sqrt(cX * cX + cY * cY);

        // Safe Zone Density Nerf (Fewer enemies near spawn)
        if (dist < 150) { 
            enemyCount = 10; 
        }

        // --- THEME SELECTION LOGIC ---
        if (caveId === 'cave_landmark') {
            chosenThemeKey = 'ABYSS'; // Force the Epic Theme
            CAVE_WIDTH = 100;  // Huge map
            CAVE_HEIGHT = 100; // Huge map
            enemyCount = 60;   // Triple the enemies
        } else if (caveId.startsWith('void_')) {
            chosenThemeKey = 'VOID'; // Force Void Theme
            enemyCount = 25;   
        } else {
            // Normal procedural cave
            const randomTheme = Alea(stringToSeed(caveId + ':theme'));
            // Filter out special themes
            const themeKeys = Object.keys(CAVE_THEMES).filter(k => k !== 'ABYSS' && k !== 'VOID');
            chosenThemeKey = themeKeys[Math.floor(randomTheme() * themeKeys.length)];
        }
        // -----------------------

        const theme = CAVE_THEMES[chosenThemeKey];
        this.caveThemes[caveId] = chosenThemeKey; // Remember the theme

        // 2. Generate the map layout (Random Walk)
        const map = Array.from({
            length: CAVE_HEIGHT
        }, () => Array(CAVE_WIDTH).fill(theme.wall));

        const random = Alea(stringToSeed(caveId));
        let x = Math.floor(CAVE_WIDTH / 2);
        let y = Math.floor(CAVE_HEIGHT / 2);

        const startPos = {
            x,
            y
        };
        let steps = 2000;
        while (steps > 0) {
            map[y][x] = theme.floor; // Use theme's floor
            const direction = Math.floor(random() * 4);
            if (direction === 0 && x > 1) x--;
            else if (direction === 1 && x < CAVE_WIDTH - 2) x++;
            else if (direction === 2 && y > 1) y--;
            else if (direction === 3 && y < CAVE_HEIGHT - 2) y++;
            steps--;
        }

        // --- 3. STAMP THEMED ROOMS ---
        // Initialize the enemy list here
        if (!this.caveEnemies[caveId]) {
            this.caveEnemies[caveId] = [];
        }

        const roomTemplates = Object.values(CAVE_ROOM_TEMPLATES);
        const roomAttempts = 5; // Try to place 5 rooms

        for (let i = 0; i < roomAttempts; i++) {
            // Pick a random room template
            const room = roomTemplates[Math.floor(random() * roomTemplates.length)];

            // Pick a random top-left corner for the room
            const roomX = Math.floor(random() * (CAVE_WIDTH - room.width - 2)) + 1;
            const roomY = Math.floor(random() * (CAVE_HEIGHT - room.height - 2)) + 1;

            // Stamp the room
            for (let ry = 0; ry < room.height; ry++) {
                for (let rx = 0; rx < room.width; rx++) {

                    const mapX = roomX + rx;
                    const mapY = roomY + ry;
                    const templateTile = room.map[ry][rx];

                    if (templateTile === ' ') continue; // Skip empty spaces

                    let tileToPlace = null;

                    if (templateTile === 'W') {
                        tileToPlace = theme.wall;
                    } else if (templateTile === 'F') {
                        tileToPlace = theme.floor;
                    } else {
                        tileToPlace = templateTile; // It's an item or enemy
                    }

                    // --- FIX: GHOST TILE LOGIC ---
                    if (ENEMY_DATA[tileToPlace]) {
                        // 1. If it's an enemy, set the underlying map tile to FLOOR
                        // This prevents the "White C" ghost under the "Red C" enemy
                        map[mapY][mapX] = theme.floor;

                        // 2. Create the Entity
                        const enemyTemplate = ENEMY_DATA[tileToPlace];
                        
                        // Generate scaled stats based on cave coordinates
                        const scaledStats = getScaledEnemy(enemyTemplate, cX, cY);

                        this.caveEnemies[caveId].push({
                            id: `${caveId}:${mapX},${mapY}`,
                            x: mapX,
                            y: mapY,
                            tile: tileToPlace,
                            name: scaledStats.name,
                            isElite: scaledStats.isElite || false,
                            color: scaledStats.color || null,
                            health: scaledStats.maxHealth,
                            maxHealth: scaledStats.maxHealth,
                            attack: scaledStats.attack,
                            defense: enemyTemplate.defense,
                            xp: scaledStats.xp,
                            loot: enemyTemplate.loot,
                            caster: enemyTemplate.caster || false,
                            castRange: enemyTemplate.castRange || 0,
                            spellDamage: Math.floor((enemyTemplate.spellDamage || 0) * (1 + (Math.floor(dist / 50) * 0.1))),
                            inflicts: enemyTemplate.inflicts || null,
                            madnessTurns: 0,
                            frostbiteTurns: 0,
                            poisonTurns: 0,
                            rootTurns: 0
                        });
                    } else {
                        // Not an enemy? Stamp the tile normally (Walls, Items, Floor)
                        map[mapY][mapX] = tileToPlace;
                    }
                }
            }
        }

        // --- 3b. THEME SPECIFIC TERRAIN GENERATION ---

        // VOLCANO: Generate Lava Pools (~30% of floor becomes Lava)
        if (chosenThemeKey === 'FIRE') {
            const lavaChance = 0.30;
            for (let y = 1; y < CAVE_HEIGHT - 1; y++) {
                for (let x = 1; x < CAVE_WIDTH - 1; x++) {
                    if (map[y][x] === theme.floor && random() < lavaChance) {
                        map[y][x] = '~'; // Turn floor into Lava
                    }
                }
            }
            // Ensure Start Area is safe
            map[startPos.y][startPos.x] = '.';
            map[startPos.y + 1][startPos.x] = '.';
            map[startPos.y - 1][startPos.x] = '.';
            map[startPos.y][startPos.x + 1] = '.';
            map[startPos.y][startPos.x - 1] = '.';
        }

        // SUNKEN TEMPLE: Flood the ruins
        if (chosenThemeKey === 'SUNKEN') {
            const shallowChance = 0.40; // 40% Shallow Water (Drains Stamina)
            const deepChance = 0.05;    // 5% Deep Water (Obstacle)

            for (let y = 1; y < CAVE_HEIGHT - 1; y++) {
                for (let x = 1; x < CAVE_WIDTH - 1; x++) {
                    if (map[y][x] === theme.floor) {
                        const roll = random();
                        if (roll < deepChance) {
                            map[y][x] = '~'; // Deep Water (Block)
                        } else if (roll < shallowChance + deepChance) {
                            map[y][x] = '≈'; // Shallow Water (Stamina Drain)
                        }
                    }
                }
            }
            // Ensure Start Area is safe
            map[startPos.y][startPos.x] = '.';
            map[startPos.y + 1][startPos.x] = '.';
            map[startPos.y - 1][startPos.x] = '.';
            map[startPos.y][startPos.x + 1] = '.';
            map[startPos.y][startPos.x - 1] = '.';
        }

        // --- 4. Place procedural loot and decorations ---

        const CAVE_LOOT_TABLE = ['+', '🔮', 'Y', 'S', '$', '📄', '🍄', '🏺', '⚰️'];
        const lootQuantity = Math.floor(random() * 4);

        for (let i = 0; i < lootQuantity; i++) {
            const itemToPlace = CAVE_LOOT_TABLE[Math.floor(random() * CAVE_LOOT_TABLE.length)];
            let placed = false;
            for (let attempt = 0; attempt < 5 && !placed; attempt++) {
                const randY = Math.floor(random() * (CAVE_HEIGHT - 2)) + 1;
                const randX = Math.floor(random() * (CAVE_WIDTH - 2)) + 1;

                const lootId = `${caveId}:${randX},${-randY}`;

                if (gameState.lootedTiles.has(lootId)) {
                    continue; // Skip placing loot here, it's already taken
                }

                if (map[randY][randX] === theme.floor) {
                    map[randY][randX] = itemToPlace;
                    placed = true;
                }
            }
        }

        // --- Safety check for themes without decorations ---
        const themeDecorations = theme.decorations || [];
        const specialItems = themeDecorations.filter(item => !CAVE_LOOT_TABLE.includes(item));

        for (const itemToPlace of specialItems) {
            let placed = false;
            for (let attempt = 0; attempt < 5 && !placed; attempt++) {
                const randY = Math.floor(random() * (CAVE_HEIGHT - 2)) + 1;
                const randX = Math.floor(random() * (CAVE_WIDTH - 2)) + 1;
                if (map[randY][randX] === theme.floor) {
                    map[randY][randX] = itemToPlace;
                    placed = true;
                }
            }
        }

        // --- 4b. Place Phase Walls (Only in Void) ---
        if (chosenThemeKey === 'VOID') {
            for (let i = 0; i < 40; i++) {
                const randY = Math.floor(random() * (CAVE_HEIGHT - 4)) + 2;
                const randX = Math.floor(random() * (CAVE_WIDTH - 4)) + 2;
                // Turn a normal wall into a phase wall
                if (map[randY][randX] === theme.wall) {
                    map[randY][randX] = theme.phaseWall;
                }
            }
        }

        // --- 5. Place procedural enemies ---
        let enemyTypes = theme.enemies || Object.keys(ENEMY_DATA);

        // --- FIX: SAFE ZONE CAVE NERF ---
        // If within 250 tiles of spawn, remove "Hard" enemies from the spawn pool
        if (dist < 250) {
            // Filter out Chiefs (C), Mages (m), Orcs (o), Ogres (Ø), Yetis (Y), Demons (D), etc.
            const hardEnemies = ['C', 'm', 'o', 'Ø', 'Y', 'D', '🐲', '🧙', 'v', 'f'];
            enemyTypes = enemyTypes.filter(e => !hardEnemies.includes(e));
            
            // Safety fallback: If we filtered everything out, add basics
            if (enemyTypes.length === 0) enemyTypes = ['r', 'b', 'g'];
        }
        // --------------------------------

        for (let i = 0; i < enemyCount; i++) {

            const randY = Math.floor(random() * (CAVE_HEIGHT - 2)) + 1;
            const randX = Math.floor(random() * (CAVE_WIDTH - 2)) + 1;

            if (map[randY][randX] === theme.floor && (randX !== startPos.x || randY !== startPos.y)) {
                const enemyTile = enemyTypes[Math.floor(random() * enemyTypes.length)];
                const enemyTemplate = ENEMY_DATA[enemyTile];

                const scaledStats = getScaledEnemy(enemyTemplate, cX, cY);

                map[randY][randX] = enemyTile;

                this.caveEnemies[caveId].push({
                    id: `${caveId}:${randX},${randY}`,
                    x: randX,
                    y: randY,
                    tile: enemyTile,
                    name: scaledStats.name, 
                    health: scaledStats.maxHealth, 
                    maxHealth: scaledStats.maxHealth,
                    attack: scaledStats.attack,
                    defense: enemyTemplate.defense,
                    xp: scaledStats.xp,
                    loot: enemyTemplate.loot,
                    teleporter: enemyTemplate.teleporter || false,
                    caster: enemyTemplate.caster || false,
                    castRange: enemyTemplate.castRange || 0,
                    spellDamage: enemyTemplate.spellDamage || 0,
                    inflicts: enemyTemplate.inflicts || null,

                    isElite: scaledStats.isElite || false,
                    color: scaledStats.color || null,

                    madnessTurns: 0,
                    frostbiteTurns: 0,
                    poisonTurns: 0,
                    rootTurns: 0
                });
            }
        }

        // --- 6. Place the Exit ---
        map[startPos.y][startPos.x] = '>';

        // --- 7. Secret Wall Generation ---
        const secretWallTile = theme.secretWall;

        if (secretWallTile) {
            for (let y = 2; y < CAVE_HEIGHT - 2; y++) {
                for (let x = 2; x < CAVE_WIDTH - 2; x++) {

                    if (map[y][x] === theme.floor) {
                        // Check if this is a "dead end" (3 walls)
                        let wallCount = 0;
                        let floorDir = null; // 0:North, 1:South, 2:West, 3:East

                        if (map[y - 1][x] === theme.wall) wallCount++;
                        else floorDir = 0;
                        if (map[y + 1][x] === theme.wall) wallCount++;
                        else floorDir = 1;
                        if (map[y][x - 1] === theme.wall) wallCount++;
                        else floorDir = 2;
                        if (map[y][x + 1] === theme.wall) wallCount++;
                        else floorDir = 3;

                        // If it's a dead end and we roll the dice (5% chance)
                        if (wallCount === 3 && random() > 0.95) {

                            // Find the wall opposite the entrance and carve
                            if (floorDir === 0 && map[y + 2][x] === theme.wall) {
                                map[y + 1][x] = secretWallTile;
                                map[y + 2][x] = '$';
                            } else if (floorDir === 1 && map[y - 2][x] === theme.wall) {
                                map[y - 1][x] = secretWallTile;
                                map[y - 2][x] = '$';
                            } else if (floorDir === 2 && map[y][x + 2] === theme.wall) {
                                map[y][x + 1] = secretWallTile;
                                map[y][x + 2] = '$';
                            } else if (floorDir === 3 && map[y][x - 2] === theme.wall) {
                                map[y][x - 1] = secretWallTile;
                                map[y][x - 2] = '$';
                            }
                        }
                    }
                }
            }
        }

        // --- 8. Landmark Boss Placement ---
        if (caveId === 'cave_landmark') {
            let bossPlaced = false;
            let attempts = 0;
            while (!bossPlaced && attempts < 1000) {
                // Pick a random spot
                const bx = Math.floor(random() * (CAVE_WIDTH - 2)) + 1;
                const by = Math.floor(random() * (CAVE_HEIGHT - 2)) + 1;

                // Must be floor, and far from entrance (distance > 30)
                const distFromStart = Math.sqrt(Math.pow(bx - startPos.x, 2) + Math.pow(by - startPos.y, 2));

                if (map[by][bx] === theme.floor && distFromStart > 30) {
                    const bossTile = '🧙';
                    const bossTemplate = ENEMY_DATA[bossTile];

                    // Place on map
                    map[by][bx] = bossTile;

                    // Add to enemy list
                    this.caveEnemies[caveId].push({
                        id: `${caveId}:BOSS`, // Unique ID
                        x: bx,
                        y: by,
                        tile: bossTile,
                        name: bossTemplate.name,
                        health: bossTemplate.maxHealth,
                        maxHealth: bossTemplate.maxHealth,
                        attack: bossTemplate.attack,
                        defense: bossTemplate.defense,
                        xp: bossTemplate.xp,
                        loot: bossTemplate.loot,
                        caster: true,
                        castRange: bossTemplate.castRange,
                        spellDamage: bossTemplate.spellDamage,
                        isBoss: true, // Important flag
                        madnessTurns: 0,
                        frostbiteTurns: 0,
                        poisonTurns: 0,
                        rootTurns: 0
                    });
                    bossPlaced = true;
                }
                attempts++;
            }

            if (!bossPlaced) {
                console.warn("⚠️ Boss placement RNG failed. Forcing spawn at center.");

                // Pick the dead center of the map
                const bx = Math.floor(CAVE_WIDTH / 2);
                const by = Math.floor(CAVE_HEIGHT / 2);

                // Force the terrain to be a floor (in case it was a wall)
                map[by][bx] = theme.floor;

                // Place the Boss Tile
                const bossTile = '🧙';
                map[by][bx] = bossTile;

                const bossTemplate = ENEMY_DATA[bossTile];

                // Add to enemy list manually
                this.caveEnemies[caveId].push({
                    id: `${caveId}:BOSS`,
                    x: bx,
                    y: by,
                    tile: bossTile,
                    name: bossTemplate.name,
                    health: bossTemplate.maxHealth,
                    maxHealth: bossTemplate.maxHealth,
                    attack: bossTemplate.attack,
                    defense: bossTemplate.defense,
                    xp: bossTemplate.xp,
                    loot: bossTemplate.loot,
                    caster: true,
                    castRange: bossTemplate.castRange,
                    spellDamage: bossTemplate.spellDamage,
                    isBoss: true,
                    madnessTurns: 0,
                    frostbiteTurns: 0,
                    poisonTurns: 0,
                    rootTurns: 0
                });
            }
        }

        // Ensure entrance is clear
        map[startPos.y][startPos.x] = '>';
        this.caveMaps[caveId] = map;
        return map;
    },

    generateCastle(castleId, forcedLayoutKey = null) { // <-- ADD THIS
        if (this.castleMaps[castleId]) return this.castleMaps[castleId];

        // 1. Use the castleId to pick a layout
        let chosenLayoutKey;
        if (forcedLayoutKey && CASTLE_LAYOUTS[forcedLayoutKey]) {
            chosenLayoutKey = forcedLayoutKey; // Use the forced layout
        } else {
            // Pick a random one
            const randomLayout = Alea(stringToSeed(castleId + ':layout'));
            const layoutKeys = Object.keys(CASTLE_LAYOUTS);
            chosenLayoutKey = layoutKeys[Math.floor(randomLayout() * layoutKeys.length)];
        }
        const layout = CASTLE_LAYOUTS[chosenLayoutKey];

        // 2. Get the base map and spawn point from the chosen layout
        const baseMap = layout.map;
        // Store the spawn point so the movement handler can use it
        this.castleSpawnPoints = this.castleSpawnPoints || {};
        this.castleSpawnPoints[castleId] = layout.spawn;

        // --- MODIFICATION END ---

        const map = baseMap.map(row => [...row]);

        const random = Alea(stringToSeed(castleId)); 

        // Calculate the maximum width of any row
let maxWidth = 0;
for (let r of map) {
    if (r.length > maxWidth) maxWidth = r.length;
}

// Pad shorter rows with walls ('▓') or void (' ') to match maxWidth
for (let y = 0; y < map.length; y++) {
    while (map[y].length < maxWidth) {
        map[y].push('▓'); // Fill gaps on the right side with Wall
    }
}

        const npcTypesToSpawn = ['N', 'N', '§', 'H']; // 2 Villagers, 1 Shop, 1 Healer
        let spawnAttempts = 50; // Try 50 times to place them

        for (const npcTile of npcTypesToSpawn) {
            let placed = false;
            for (let i = 0; i < spawnAttempts && !placed; i++) {
                // Find a random x, y
                const randY = Math.floor(random() * (map.length - 2)) + 1;
                const randX = Math.floor(random() * (map[0].length - 2)) + 1;

                // Check if it's a floor tile
                if (map[randY][randX] === '.') {
                    map[randY][randX] = npcTile; // Place the NPC
                    placed = true;
                }
            }
        }

        // Ensure the tiles adjacent to spawn are walkable, fixing the
        // bug where players can be walled-in by procedural generation.
        const spawnX = layout.spawn.x;
        const spawnY = layout.spawn.y;

        // List of adjacent coordinates [y, x]
        const adjacentCoords = [
            [spawnY - 1, spawnX], // North
            [spawnY + 1, spawnX], // South
            [spawnY, spawnX - 1], // West
            [spawnY, spawnX + 1] // East
        ];

        // These tiles should NOT be overwritten
        const protectedTiles = ['▓', 'X', 'B', '📖'];

        for (const [y, x] of adjacentCoords) {
            // Bounds check
            if (map[y] && map[y][x]) {
                // Get the *original* tile from the layout
                const originalTile = (baseMap[y] && baseMap[y][x]) ? baseMap[y][x] : '▓';

                // If the original tile is NOT a protected tile,
                // force it to be a floor.
                // This clears any '▒' (rubble) or 'N', 'H', '§' (NPCs)
                if (!protectedTiles.includes(originalTile)) {
                    map[y][x] = '.';
                }
            }
        }

                if (map[spawnY] && map[spawnY][spawnX] !== undefined) {
            map[spawnY][spawnX] = '.';
        } else {
            console.error(`CRITICAL: Spawn point {x:${spawnX}, y:${spawnY}} is out of bounds for layout!`);
            // Fallback: Force spawn to 1,1 to prevent crash
            if(map[1] && map[1][1]) map[1][1] = '.';
            // Note: Player might spawn in a wall if layout is tiny, but game won't crash.
        }

        // Finally, ensure the spawn tile itself is a floor tile
        map[spawnY][spawnX] = '.';

        // Extract Guards to Entities (Living World) ---
        // Clear old friendly NPCs for this ID to prevent duplicates
        this.friendlyNpcs = this.friendlyNpcs || {};
        this.friendlyNpcs[castleId] = [];

        for (let y = 0; y < map.length; y++) {
            for (let x = 0; x < map[0].length; x++) {
                if (map[y][x] === 'G') {
                    // Found a static guard tile. Remove it.
                    map[y][x] = '.';

                    // Create a mobile guard entity
                    this.friendlyNpcs[castleId].push({
                        id: `guard_${x}_${y}`,
                        x: x,
                        y: y,
                        name: "Castle Guard",
                        tile: 'G',
                        role: 'guard',
                        dialogue: [
                            "The night shift is quiet. Just how I like it.",
                            "Keep your weapons sheathed in the village.",
                            "I heard wolves howling to the east.",
                            "Patrolling makes my feet ache.",
                            "Nothing to report."
                        ]
                    });
                }
            }
        }

        this.castleMaps[castleId] = map;
        return map;
    },

    listenToChunkState(chunkX, chunkY, onInitialLoad = null) { // Added callback param
        const chunkId = `${chunkX},${chunkY}`;

        // If we are already listening, just fire the callback immediately
        if (worldStateListeners[chunkId]) {
            if (onInitialLoad) onInitialLoad();
            return;
        }

        const docRef = db.collection('worldState').doc(chunkId);

        worldStateListeners[chunkId] = docRef.onSnapshot(doc => {
            this.worldState[chunkId] = doc.exists ? doc.data() : {};

            // If this is the first time data arrived, fire the callback
            if (onInitialLoad) {
                onInitialLoad();
                onInitialLoad = null; // Ensure it only runs once
            }

            render();
        });
    },

    setWorldTile(worldX, worldY, newTile) {
        const chunkX = Math.floor(worldX / this.CHUNK_SIZE);
        const chunkY = Math.floor(worldY / this.CHUNK_SIZE);
        const chunkId = `${chunkX},${chunkY}`;
        
        const localX = (worldX % this.CHUNK_SIZE + this.CHUNK_SIZE) % this.CHUNK_SIZE;
        const localY = (worldY % this.CHUNK_SIZE + this.CHUNK_SIZE) % this.CHUNK_SIZE;
        
        if (!this.worldState[chunkId]) this.worldState[chunkId] = {};
        const tileKey = `${localX},${localY}`;
        
        this.worldState[chunkId][tileKey] = newTile;

        // --- FIX: Sanitize before saving to prevent "Unsupported field value: undefined" crash ---
        const safeData = sanitizeForFirebase(this.worldState[chunkId]);

        db.collection('worldState').doc(chunkId).set(safeData, {
            merge: true
        }).catch(err => {
            console.error("Map update failed (visual only):", err);
        });
    },

    // Helper: Determine enemy spawn based on Biome and Distance
    getEnemySpawn(biome, dist, random) {
        // --- CONFIGURATION ---
        // Tier 0: 0-500 (Tutorial/Easy - Rats, Snakes, Weak Bandits)
        // Tier 1: 500-1500 (Standard - Wolves, Goblins, Skeletons)
        // Tier 2: 1500-3000 (Hard - Bears, Orcs, Draugr)
        // Tier 3: 3000-6000 (Very Hard - Golems, Yetis, Demons)
        // Tier 4: 6000+ (Nightmare - Dragons, Rexes, Horrors)
        const TIER_THRESHOLDS = [500, 1500, 3000, 6000];

        // 1. Calculate Tier dynamically
        let tier = 0;
        for (let i = 0; i < TIER_THRESHOLDS.length; i++) {
            if (dist > TIER_THRESHOLDS[i]) {
                tier = i + 1;
            } else {
                break;
            }
        }

        // 2. Define Spawn Tables
        const spawns = {
            '.': { // Plains
                0: ['r', 'r', 'b'], // Rat, Rat, Bandit
                1: ['b', 'w', 'o'], // Bandit, Wolf, Orc
                2: ['o', 'C', '🐺'], // Orc, Chief, Dire Wolf
                3: ['o', '🐺', 'Ø'], // Orc, Dire Wolf, Ogre
                4: ['Ø', '🦖', '🤖'] // Ogre, Rex, Guardian
            },
            'F': { // Forest
                0: ['🐍', '🦌', '🐗'], // Snake, Stag, Boar
                1: ['w', '🐗', '🐻'], // Wolf, Boar, Bear
                2: ['🐻', '🐺', '🕸'], // Bear, Dire Wolf, Web (Spider)
                3: ['🐺', '🐻', '🌲'], // Dire Wolf, Bear, Ent (Treant)
                4: ['🌲', '🧛', '👾'] // Treant, Vampire, Horror
            },
            '^': { // Mountain
                0: ['🦇', 'g', 'R'], // Bat, Goblin, Recruit
                1: ['g', 's', '🦅'], // Goblin, Skeleton, Eagle
                // WAS: 2: ['s', '🗿', 'Y'],
                2: ['s', '🧌', 'Y'], // Skeleton, Golem (New Icon), Yeti
                // WAS: 3: ['Y', 'Ø', '🐲'],
                3: ['Y', '🧌', '🐲'], // Yeti, Golem, Drake
                4: ['🐲', '🦖', '🤖'] // Drake, Rex, Guardian
            },
            '≈': { // Swamp
                0: ['🦟', '🐸', '🐍'], // Mosquito, Toad, Snake
                1: ['🐍', 'l', 'Z'], // Snake, Leech, Draugr
                2: ['Z', 'l', '💀'], // Draugr, Leech, Necro Tome (Trap)
                3: ['Z', '💀', 'Hydra'], // Draugr, Necro, Hydra
                4: ['Hydra', '👾', '🧛'] // Hydra, Horror, Vampire
            },
            'D': { // Desert
                0: ['🦂s', '🐍', '🌵'], // Small Scorpion, Snake, Cactus
                1: ['🦂', '🐍c', '🌵'], // Giant Scorpion, Cobra, Cactus
                2: ['🦂', 'm', '💀'], // Scorpion, Mage, Necro
                3: ['m', '💀', 'Efreet'], // Mage, Necro, Efreet
                4: ['Efreet', '🦖', '🤖'] // Efreet, Rex, Guardian
            },
            'd': { // Deadlands
                0: ['s', 'b', 'R'], // Skeleton, Bandit, Recruit
                1: ['s', 'Z', 'a'], // Skeleton, Draugr, Acolyte
                2: ['Z', 'a', 'D'], // Draugr, Acolyte, Demon
                3: ['D', 'v', '🧙'], // Demon, Void Stalker, Necro Lord
                4: ['🧙', '👾', '🧛'] // Necro Lord, Horror, Vampire
            }
        };

        // 3. Select Enemy
        const table = spawns[biome];
        // If biome isn't listed (e.g. Water), no spawn
        if (!table) return null;

        // Cap the tier at the maximum defined for this biome
        const maxDefinedTier = Math.max(...Object.keys(table).map(Number));
        const safeTier = Math.min(tier, maxDefinedTier);

        const tierList = table[safeTier];
        if (!tierList) return null;

        // Weighted Random Selection
        // 60% Common, 30% Uncommon, 10% Rare
        const roll = random();
        if (roll < 0.60) return tierList[0];
        if (roll < 0.90) return tierList[1];
        return tierList[2];
    },

    generateChunk(chunkX, chunkY) {
        const chunkKey = `${chunkX},${chunkY}`;
        const random = Alea(stringToSeed(WORLD_SEED + ':' + chunkKey));

        let chunkData = Array.from({ length: this.CHUNK_SIZE }, () => Array(this.CHUNK_SIZE));

        for (let y = 0; y < this.CHUNK_SIZE; y++) {
            for (let x = 0; x < this.CHUNK_SIZE; x++) {
                const worldX = chunkX * this.CHUNK_SIZE + x;
                const worldY = chunkY * this.CHUNK_SIZE + y;

                // Calculate Distance from Spawn (0,0)
                const dist = Math.sqrt(worldX * worldX + worldY * worldY);

                // --- BIOME GENERATION ---
                const elev = elevationNoise.noise(worldX / 70, worldY / 70);
                const moist = moistureNoise.noise(worldX / 50, worldY / 50);

                let tile = '.';
                if (elev < 0.35) tile = '~';
                else if (elev < 0.4 && moist > 0.7) tile = '≈';
                else if (elev > 0.8) tile = '^';
                else if (elev > 0.6 && moist < 0.3) tile = 'd';
                else if (moist < 0.15) tile = 'D';
                else if (moist > 0.55) tile = 'F';
                else tile = '.';

                // --- SAFETY OVERRIDE: SPAWN IS ALWAYS SAFE ---
                if (Math.abs(worldX) < 3 && Math.abs(worldY) < 3) {
                    tile = '.';
                }

                const featureRoll = random();

                // ... inside generateChunk loop ...

// --- PUZZLE SPAWNS (Deterministic Locations) ---
// We place the 4 obelisks at specific distances in cardinal directions from spawn (0,0)

// North Obelisk (High Y negative)
if (worldX === 0 && worldY === -50) { 
    this.setWorldTile(worldX, worldY, '⬆️'); // USE NEW KEY
    chunkData[y][x] = '⬆️';
}
// East Obelisk (High X positive)
else if (worldX === 50 && worldY === 0) { 
    this.setWorldTile(worldX, worldY, '➡️'); // USE NEW KEY
    chunkData[y][x] = '➡️';
}
// West Obelisk
else if (worldX === -50 && worldY === 0) { 
    this.setWorldTile(worldX, worldY, '⬅️'); // USE NEW KEY
    chunkData[y][x] = '⬅️';
}
// South Obelisk
else if (worldX === 0 && worldY === 50) { 
    this.setWorldTile(worldX, worldY, '⬇️'); // USE NEW KEY
    chunkData[y][x] = '⬇️';
}
// The Vault Entrance (Somewhere tricky)
else if (worldX === 35 && worldY === 35) {
    this.setWorldTile(worldX, worldY, '🚪'); // USE NEW KEY
    chunkData[y][x] = '🚪';
}
// The Vault Entrance (Somewhere tricky)
else if (worldX === 35 && worldY === 35) {
    this.setWorldTile(worldX, worldY, '⛩️d');
    chunkData[y][x] = '⛩️d';
}

                // --- 1. LEGENDARY LANDMARKS (Unique, Very Rare) ---
                if (tile === '.' && featureRoll < 0.0000005) { // 1 in 2M
                    this.setWorldTile(worldX, worldY, '♛');
                    chunkData[y][x] = '♛';
                }
                else if ((tile === 'd' || tile === '^') && featureRoll < 0.000001) {
                    this.setWorldTile(worldX, worldY, '🕳️');
                    chunkData[y][x] = '🕳️';
                }

                // --- 2. BIOME ANOMALIES (Very Rare) ---
                else if (tile === 'F' && featureRoll < 0.0001) {
                    this.setWorldTile(worldX, worldY, '🌳e');
                    chunkData[y][x] = '🌳e';
                }
                else if (tile === '^' && featureRoll < 0.0001) {
                    this.setWorldTile(worldX, worldY, '🗿k');
                    chunkData[y][x] = '🗿k';
                }
                else if (tile === 'D' && featureRoll < 0.0001) {
                    this.setWorldTile(worldX, worldY, '🦴d');
                    chunkData[y][x] = '🦴d';
                }

                // --- 3. RARE STRUCTURES (Scaled by Distance) ---
                else if (tile === '.' && featureRoll < 0.000005) { // Safe Haven
                    this.setWorldTile(worldX, worldY, 'V');
                    chunkData[y][x] = 'V';
                }
                else if (tile === '.' && featureRoll < 0.00003) { // Shrine
                    this.setWorldTile(worldX, worldY, '⛩️');
                    chunkData[y][x] = '⛩️';
                }
                else if (tile === '.' && featureRoll < 0.0003) { // Forgotten Letter (Lore)
                    this.setWorldTile(worldX, worldY, '📜l');
                    chunkData[y][x] = '📜l';
                }
                else if (tile === '.' && featureRoll < 0.00004) { // Obelisk
                    this.setWorldTile(worldX, worldY, '|');
                    chunkData[y][x] = '|';
                }
                else if (tile === '.' && featureRoll < 0.00005) { // Wishing Well
                    this.setWorldTile(worldX, worldY, '⛲');
                    chunkData[y][x] = '⛲';
                }
                else if ((tile === 'd' || tile === 'D') && featureRoll < 0.000005) { // Void Rift
                    this.setWorldTile(worldX, worldY, 'Ω');
                    chunkData[y][x] = 'Ω';
                }

                // --- 4. MAJOR STRUCTURES (Explicit Spawn Rates) ---
                else if (tile === '^' && featureRoll < 0.008) {
                    this.setWorldTile(worldX, worldY, '⛰');
                    chunkData[y][x] = '⛰';
                }
                else if (tile === 'd' && featureRoll < 0.004) {
                    this.setWorldTile(worldX, worldY, '⛰');
                    chunkData[y][x] = '⛰';
                }
                else if ((tile === '.' || tile === 'F') && featureRoll > 0.0005 && featureRoll < 0.0015) {
                    this.setWorldTile(worldX, worldY, '🏰');
                    chunkData[y][x] = '🏰';
                }
                else if ((tile === '.' || tile === 'F') && featureRoll > 0.0015 && featureRoll < 0.0020) {
                    this.setWorldTile(worldX, worldY, '⛰');
                    chunkData[y][x] = '⛰';
                }

                // --- 5. COMMON FEATURES ---
                else if (tile === '.' && featureRoll < 0.0005) {
    // 1. Grab every key from TILE_DATA
    let features = Object.keys(TILE_DATA);

    // 2. Filter to ONLY include generic, non-breaking features
    features = features.filter(f => {
        const data = TILE_DATA[f];
        
        // We ONLY want these specific types to spawn randomly in the fields
        const allowedTypes = [
            'lore',           // Signposts
            'lore_statue',    // Statues / Hermits
            'loot_container', // Chests / Shipwrecks
            'campsite',       // Tents
            'decoration'      // Trees / Rocks
        ];

        return allowedTypes.includes(data.type);
    });

    // 3. Pick one at random from the safe list
    if (features.length > 0) {
        const featureTile = features[Math.floor(random() * features.length)];
        this.setWorldTile(worldX, worldY, featureTile);
        chunkData[y][x] = featureTile;
    }
}

                // --- 6. RIDDLE STATUES ---
                else if (tile === '.' && featureRoll < 0.00008) {
                    this.setWorldTile(worldX, worldY, '?');
                    chunkData[y][x] = '?';
                }

                // --- 7. GENERIC STRUCTURES ---
                else if (tile !== '~' && tile !== '≈' && featureRoll < 0.0001) {
                    this.setWorldTile(worldX, worldY, '🏛️');
                    chunkData[y][x] = '🏛️';
                }
                else if (tile !== '~' && tile !== '≈' && featureRoll < 0.0002) {
                    this.setWorldTile(worldX, worldY, '⛺');
                    chunkData[y][x] = '⛺';
                }

                // --- 8. ARCHAEOLOGY SPOTS (The Fix!) ---
                // We check this BEFORE enemies so you don't get a goblin standing on a dig spot
                else if (['.', 'd', 'D', 'F'].includes(tile) && featureRoll < (tile === 'd' || tile === 'D' ? 0.0015 : 0.0005)) {
                    this.setWorldTile(worldX, worldY, '∴');
                    chunkData[y][x] = '∴';
                }

                else {
                    // --- 9. ENEMY & RESOURCE SPAWNING ---
                    const hostileRoll = random();

                    // Base Spawn Chance
                    let spawnChance = 0.0015;

                    // Biome Modifiers
                    if (tile === 'F') spawnChance = 0.0025;
                    if (tile === 'd') spawnChance = 0.0040;
                    if (tile === '^') spawnChance = 0.0020;

                    if (hostileRoll < spawnChance) {
        
        // --- NEW SAFETY CHECK ---
        // If within 200 tiles of spawn, force distance to 0 for spawn calculation.
        // This ensures even if a Mountain spawns at x=10, y=10, 
        // it generates Bats (Tier 0) instead of Yetis (Tier 3).
        const effectiveDist = (dist < 200) ? 0 : dist;

        // Pass effectiveDist instead of dist
        const enemyTile = this.getEnemySpawn(tile, effectiveDist, random);

        if (enemyTile && (ENEMY_DATA[enemyTile] || TILE_DATA[enemyTile])) {
                            chunkData[y][x] = enemyTile;
                            if (TILE_DATA[enemyTile]) {
                                this.setWorldTile(worldX, worldY, enemyTile);
                            }
                        } else {
                            chunkData[y][x] = tile;
                        }
                    }
                    // --- 10. RESOURCE FALLBACKS ---
                    else if (tile === '^' && hostileRoll < 0.03) {
                        this.setWorldTile(worldX, worldY, '🏚');
                        chunkData[y][x] = '🏚';
                    }
                    else if (tile === 'F' && hostileRoll < 0.03) {
                        this.setWorldTile(worldX, worldY, '🌳');
                        chunkData[y][x] = '🌳';
                    }
                    else {
                        chunkData[y][x] = tile;
                    }
                }
            }
        }

        // --- SMOOTHING PASS ---
        for (let y = 1; y < this.CHUNK_SIZE - 1; y++) {
            for (let x = 1; x < this.CHUNK_SIZE - 1; x++) {
                const currentTile = chunkData[y][x];
                const naturalTerrain = ['.', 'F', 'd', 'D', '^', '~', '≈'];
                if (!naturalTerrain.includes(currentTile)) continue;

                const neighbors = [
                    chunkData[y - 1][x], chunkData[y + 1][x],
                    chunkData[y][x - 1], chunkData[y][x + 1]
                ];

                const counts = {};
                let maxCount = 0;
                let dominantTile = null;

                neighbors.forEach(n => {
                    if (naturalTerrain.includes(n)) {
                        counts[n] = (counts[n] || 0) + 1;
                        if (counts[n] > maxCount) {
                            maxCount = counts[n];
                            dominantTile = n;
                        }
                    }
                });

                if (maxCount >= 3 && dominantTile !== currentTile) {
                    chunkData[y][x] = dominantTile;
                }
            }
        }

        this.loadedChunks[chunkKey] = chunkData;
    },

    getTile(worldX, worldY) {
        const chunkX = Math.floor(worldX / this.CHUNK_SIZE);
        const chunkY = Math.floor(worldY / this.CHUNK_SIZE);
        const chunkId = `${chunkX},${chunkY}`;

        const localX = (worldX % this.CHUNK_SIZE + this.CHUNK_SIZE) % this.CHUNK_SIZE;
        const localY = (worldY % this.CHUNK_SIZE + this.CHUNK_SIZE) % this.CHUNK_SIZE;
        const tileKey = `${localX},${localY}`;
        if (this.worldState[chunkId] && this.worldState[chunkId][tileKey] !== undefined) {
            return this.worldState[chunkId][tileKey];
        }
        if (!this.loadedChunks[chunkId]) {
            this.generateChunk(chunkX, chunkY);
        }
        const chunk = this.loadedChunks[chunkId];
        return chunk[localY][localX];
    },
    unloadOutOfRangeChunks: function (playerChunkX, playerChunkY) {
        // This defines how many chunks to keep loaded around the player.
        // '2' means a 5x5 grid (2 chunks N, S, E, W + the center one).
        const VIEW_RADIUS_CHUNKS = 2;

        // 1. Create a Set of all chunk IDs that *should* be visible.
        const visibleChunkIds = new Set();
        for (let y = -VIEW_RADIUS_CHUNKS; y <= VIEW_RADIUS_CHUNKS; y++) {
            for (let x = -VIEW_RADIUS_CHUNKS; x <= VIEW_RADIUS_CHUNKS; x++) {
                const chunkId = `${playerChunkX + x},${playerChunkY + y}`;
                visibleChunkIds.add(chunkId);
            }
        }

        // 2. Loop through all chunk listeners we currently have active.
        for (const chunkId in worldStateListeners) {

            // 3. If an active listener is *not* in our visible set...
            if (!visibleChunkIds.has(chunkId)) {

                // 4. ...unload it!
                // console.log(`Unloading chunk: ${chunkId}`); // For debugging

                // Call the unsubscribe function to stop listening
                worldStateListeners[chunkId]();

                // Remove it from our tracking object
                delete worldStateListeners[chunkId];

                // (Optional but recommended) Clear the cached terrain data
                if (this.loadedChunks[chunkId]) {
                    delete this.loadedChunks[chunkId];
                }

                // (Optional but recommended) Clear the cached world state
                if (this.worldState[chunkId]) {
                    delete this.worldState[chunkId];
                }
            }
        }
    }
};

// --- SPATIAL PARTITIONING HELPERS ---
const SPATIAL_CHUNK_SIZE = 16; // Match your chunkManager size

function getSpatialKey(x, y) {
    const cx = Math.floor(x / SPATIAL_CHUNK_SIZE);
    const cy = Math.floor(y / SPATIAL_CHUNK_SIZE);
    return `${cx},${cy}`;
}

function updateSpatialMap(enemyId, oldX, oldY, newX, newY) {
    // 1. Remove from old bucket if it exists
    if (oldX !== null && oldY !== null && oldX !== undefined && oldY !== undefined) {
        const oldKey = getSpatialKey(oldX, oldY);
        if (gameState.enemySpatialMap.has(oldKey)) {
            const set = gameState.enemySpatialMap.get(oldKey);
            set.delete(enemyId);
            if (set.size === 0) gameState.enemySpatialMap.delete(oldKey); // Cleanup
        }
    }

    // 2. Add to new bucket
    if (newX !== null && newY !== null && newX !== undefined && newY !== undefined) {
        const newKey = getSpatialKey(newX, newY);
        if (!gameState.enemySpatialMap.has(newKey)) {
            gameState.enemySpatialMap.set(newKey, new Set());
        }
        gameState.enemySpatialMap.get(newKey).add(enemyId);
    }
}

// --- OPTIMIZATION: Spatial Hash ---
const SpatialHash = {
    buckets: new Map(),
    getKey: (x, y) => `${x},${y}`,
    add: function(entity, x, y) {
        this.buckets.set(this.getKey(x, y), entity);
    },
    remove: function(x, y) {
        this.buckets.delete(this.getKey(x, y));
    },
    get: function(x, y) {
        return this.buckets.get(this.getKey(x, y));
    },
    clear: function() {
        this.buckets.clear();
    }
};
