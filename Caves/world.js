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

        // Safety fallback in case CAVE_ROOM_TEMPLATES isn't fully loaded
        const roomTemplates = Object.values(typeof CAVE_ROOM_TEMPLATES !== 'undefined' ? CAVE_ROOM_TEMPLATES : {});
        const roomAttempts = 5; // Try to place 5 rooms

        // Only attempt to stamp if we actually have templates!
        if (roomTemplates.length > 0) {
            for (let i = 0; i < roomAttempts; i++) {
                // Pick a random room template
                const room = roomTemplates[Math.floor(random() * roomTemplates.length)];

                // SAFETY CHECK 1: Ensure the room is valid and actually contains a map
                if (!room || !room.map || !room.width || !room.height) continue;

                // Pick a random top-left corner for the room
                const roomX = Math.floor(random() * (CAVE_WIDTH - room.width - 2)) + 1;
                const roomY = Math.floor(random() * (CAVE_HEIGHT - room.height - 2)) + 1;

                // Stamp the room
                for (let ry = 0; ry < room.height; ry++) {
                    
                    // SAFETY CHECK 2: Ensure this specific row exists before reading tiles!
                    if (room.map[ry] === undefined) continue;

                    for (let rx = 0; rx < room.width; rx++) {

                        const mapX = roomX + rx;
                        const mapY = roomY + ry;
                        const templateTile = room.map[ry][rx];

                        // Skip empty spaces or undefined tiles
                        if (!templateTile || templateTile === ' ') continue; 

                        let tileToPlace = null;

                        // FIX: Ensure floors inherit the biome theme!
                        if (templateTile === 'W') {
                            tileToPlace = theme.wall;
                        } else if (templateTile === 'F' || templateTile === '.') {
                            tileToPlace = theme.floor;
                        } else {
                            tileToPlace = templateTile; // It's an item or enemy
                        }

                        // --- GHOST TILE LOGIC ---
                        if (ENEMY_DATA[tileToPlace]) {
                            // 1. If it's an enemy, set the underlying map tile to FLOOR
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

        const CAVE_LOOT_TABLE = ['♥', '🔮', '💜', 'S', '$', '📄', '🍄', '🏺', '⚰️'];
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

        // --- SAFE ZONE CAVE NERF ---
        if (dist < 250) {
            const hardEnemies = ['C', 'm', 'o', 'Ø', 'Y', 'D', '🐲', '🧙', 'v', 'f'];
            enemyTypes = enemyTypes.filter(e => !hardEnemies.includes(e));
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

                    map[by][bx] = bossTile;

                    this.caveEnemies[caveId].push({
                        id: `${caveId}:BOSS`, // Unique ID
                        x: bx, y: by, tile: bossTile,
                        name: bossTemplate.name,
                        health: bossTemplate.maxHealth, maxHealth: bossTemplate.maxHealth,
                        attack: bossTemplate.attack, defense: bossTemplate.defense, xp: bossTemplate.xp,
                        loot: bossTemplate.loot, caster: true, castRange: bossTemplate.castRange, spellDamage: bossTemplate.spellDamage,
                        isBoss: true, madnessTurns: 0, frostbiteTurns: 0, poisonTurns: 0, rootTurns: 0
                    });
                    bossPlaced = true;
                }
                attempts++;
            }

            if (!bossPlaced) {
                console.warn("⚠️ Boss placement RNG failed. Forcing spawn at center.");
                const bx = Math.floor(CAVE_WIDTH / 2);
                const by = Math.floor(CAVE_HEIGHT / 2);

                // FIX: Carve an arena so the boss doesn't spawn entombed in walls!
                for(let oy=-1; oy<=1; oy++) {
                    for(let ox=-1; ox<=1; ox++) {
                        map[by+oy][bx+ox] = theme.floor;
                    }
                }

                const bossTile = '🧙';
                map[by][bx] = bossTile;
                const bossTemplate = ENEMY_DATA[bossTile];

                this.caveEnemies[caveId].push({
                    id: `${caveId}:BOSS`,
                    x: bx, y: by, tile: bossTile,
                    name: bossTemplate.name,
                    health: bossTemplate.maxHealth, maxHealth: bossTemplate.maxHealth,
                    attack: bossTemplate.attack, defense: bossTemplate.defense, xp: bossTemplate.xp,
                    loot: bossTemplate.loot, caster: true, castRange: bossTemplate.castRange, spellDamage: bossTemplate.spellDamage,
                    isBoss: true, madnessTurns: 0, frostbiteTurns: 0, poisonTurns: 0, rootTurns: 0
                });
            }
        }

        // Ensure entrance is clear
        map[startPos.y][startPos.x] = '>';
        this.caveMaps[caveId] = map;
        return map;
    },

    generateCastle(castleId, forcedLayoutKey = null) { 
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
        
        this.castleSpawnPoints = this.castleSpawnPoints || {};
        this.castleSpawnPoints[castleId] = layout.spawn;

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
                map[y].push('▓'); 
            }
        }

        // --- FIX: SMART NPC SPAWNING ---
        // Don't spawn procedural merchants if the layout already has them!
        const npcTypesToSpawn = ['N', 'N']; // Always spawn some random villagers
        
        let hasShop = baseMap.some(row => row.includes('§'));
        let hasHealer = baseMap.some(row => row.includes('H'));
        
        if (!hasShop) npcTypesToSpawn.push('§');
        if (!hasHealer) npcTypesToSpawn.push('H');
        
        let spawnAttempts = 50;

        for (const npcTile of npcTypesToSpawn) {
            let placed = false;
            for (let i = 0; i < spawnAttempts && !placed; i++) {
                const randY = Math.floor(random() * (map.length - 2)) + 1;
                const randX = Math.floor(random() * (map[0].length - 2)) + 1;

                if (map[randY][randX] === '.') {
                    map[randY][randX] = npcTile; 
                    placed = true;
                }
            }
        }

        // Ensure the tiles adjacent to spawn are walkable
        const spawnX = layout.spawn.x;
        const spawnY = layout.spawn.y;

        const adjacentCoords = [
            [spawnY - 1, spawnX], 
            [spawnY + 1, spawnX], 
            [spawnY, spawnX - 1], 
            [spawnY, spawnX + 1]  
        ];

        // These tiles should NOT be overwritten
        const protectedTiles = ['▓', 'X', 'B', '📖'];

        for (const [y, x] of adjacentCoords) {
            if (map[y] && map[y][x]) {
                const originalTile = (baseMap[y] && baseMap[y][x]) ? baseMap[y][x] : '▓';
                if (!protectedTiles.includes(originalTile)) {
                    map[y][x] = '.';
                }
            }
        }

        if (map[spawnY] && map[spawnY][spawnX] !== undefined) {
            map[spawnY][spawnX] = '.';
        } else {
            console.error(`CRITICAL: Spawn point {x:${spawnX}, y:${spawnY}} is out of bounds for layout!`);
            if(map[1] && map[1][1]) map[1][1] = '.';
        }

        // Extract Guards to Entities (Living World)
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

    listenToChunkState(chunkX, chunkY, onInitialLoad = null) { 
        // --- Block NaN chunk requests to fix the Permissions Error! ---
        if (isNaN(chunkX) || isNaN(chunkY)) return; 
        
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
                onInitialLoad = null; 
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

        const safeData = sanitizeForFirebase(this.worldState[chunkId]);

        db.collection('worldState').doc(chunkId).set(safeData, {
            merge: true
        }).catch(err => {
            console.error("Map update failed (visual only):", err);
        });
    },

    getEnemySpawn(biome, dist, random) {
        const TIER_THRESHOLDS = [500, 1500, 3000, 6000];

        let tier = 0;
        for (let i = 0; i < TIER_THRESHOLDS.length; i++) {
            if (dist > TIER_THRESHOLDS[i]) tier = i + 1;
            else break;
        }

        const spawns = {
            '.': { 0: ['r', 'r', 'b'], 1: ['b', 'w', 'o'], 2: ['o', 'C', '🐺'], 3: ['o', '🐺', 'Ø'], 4: ['Ø', '🦖', '🤖'] },
            'F': { 0: ['🐍', '🦌', '🐗'], 1: ['w', '🐗', '🐻'], 2: ['🐻', '🐺', '🕸'], 3: ['🐺', '🐻', '🌲'], 4: ['🌲', '🧛', '👾'] },
            '^': { 0: ['🦇', 'g', 'R'], 1: ['g', 's', '🦅'], 2: ['s', '🧌', 'Y'], 3: ['Y', '🧌', '🐲'], 4: ['🐲', '🦖', '🤖'] },
            '≈': { 0: ['🦟', '🐸', '🐍'], 1: ['🐍', 'l', 'Z'], 2: ['Z', 'l', 'a'], 3: ['Z', 'a', '🐉h'], 4: ['🐉h', '👾', '🧛'] },
            'D': { 0: ['🦂s', '🐍', '🌵'], 1: ['🦂', '🐍c', '🌵'], 2: ['🦂', 'm', 'a'], 3: ['m', 'a', '🔥e'], 4: ['🔥e', '🦖', '🤖'] },
            'd': { 0: ['s', 'b', 'R'], 1: ['s', 'Z', 'a'], 2: ['Z', 'a', '😈d'], 3: ['😈d', 'v', '🧙'], 4: ['🧙', '👾', '🧛'] }
        };

        const table = spawns[biome];
        if (!table) return null;

        const maxDefinedTier = Math.max(...Object.keys(table).map(Number));
        const safeTier = Math.min(tier, maxDefinedTier);
        const tierList = table[safeTier];
        if (!tierList) return null;

        const roll = random();
        if (roll < 0.60) return tierList[0];
        if (roll < 0.90) return tierList[1];
        return tierList[2];
    },

    generateChunk(chunkX, chunkY) {
        const chunkKey = `${chunkX},${chunkY}`;
        const random = Alea(stringToSeed(WORLD_SEED + ':' + chunkKey));

        let chunkData = Array.from({ length: this.CHUNK_SIZE }, () => Array(this.CHUNK_SIZE));

        const DETERMINISTIC_SPAWNS = {
            "0,-50": "⬆️", "50,0": "➡️", "-50,0": "⬅️", "0,50": "⬇️", "35,35": "🚪" 
        };

        for (let y = 0; y < this.CHUNK_SIZE; y++) {
            for (let x = 0; x < this.CHUNK_SIZE; x++) {
                const worldX = chunkX * this.CHUNK_SIZE + x;
                const worldY = chunkY * this.CHUNK_SIZE + y;

                // --- 1. DETERMINISTIC SPAWNS ---
                const dSpawn = DETERMINISTIC_SPAWNS[`${worldX},${worldY}`];
                if (dSpawn) {
                    chunkData[y][x] = dSpawn;
                    continue; 
                }

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

                // --- FIX: EXPANDED SAFETY OVERRIDE ---
                if (Math.abs(worldX) <= 6 && Math.abs(worldY) <= 6) {
                    tile = '.';
                }

                const featureRoll = random();

                // 🚨 OPTIMIZATION NOTICE 🚨
                // We NO LONGER call this.setWorldTile() during procedural generation!
                // The client will render these from chunkData automatically. 
                // This saves literally 99% of your Firebase database write quotas!

                // --- 1. LEGENDARY LANDMARKS (Unique, Very Rare) ---
                if (tile === '.' && featureRoll < 0.0000005) { 
                    chunkData[y][x] = '♛';
                }
                else if ((tile === 'd' || tile === '^') && featureRoll < 0.000001) {
                    chunkData[y][x] = '🕳️';
                }
                // --- 2. BIOME ANOMALIES (Very Rare) ---
                else if (tile === 'F' && featureRoll < 0.0001) {
                    chunkData[y][x] = '🌳e';
                }
                else if (tile === '^' && featureRoll < 0.0001) {
                    chunkData[y][x] = '🗿k';
                }
                else if (tile === 'D' && featureRoll < 0.0001) {
                    chunkData[y][x] = '🦴d';
                }
                // --- 3. RARE STRUCTURES (Scaled by Distance) ---
                else if (tile === '.' && featureRoll < 0.000005) { // Safe Haven
                    chunkData[y][x] = 'V';
                }
                else if (tile === '.' && featureRoll < 0.00003) { // Shrine
                    chunkData[y][x] = '⛩️';
                }
                else if (tile === '.' && featureRoll < 0.0003) { // Forgotten Letter (Lore)
                    chunkData[y][x] = '📜l';
                }
                else if (tile === '.' && featureRoll < 0.00004) { // Obelisk
                    chunkData[y][x] = '|';
                }
                else if (tile === '.' && featureRoll < 0.00005) { // Wishing Well
                    chunkData[y][x] = '⛲';
                }
                else if ((tile === 'd' || tile === 'D') && featureRoll < 0.000005) { // Void Rift
                    chunkData[y][x] = 'Ω';
                }
                // --- 4. MAJOR STRUCTURES (Explicit Spawn Rates) ---
                else if (tile === '^' && featureRoll < 0.008) {
                    chunkData[y][x] = '⛰';
                }
                else if (tile === 'd' && featureRoll < 0.004) {
                    chunkData[y][x] = '⛰';
                }
                else if ((tile === '.' || tile === 'F') && featureRoll > 0.0005 && featureRoll < 0.0015) {
                    chunkData[y][x] = '🏰';
                }
                else if ((tile === '.' || tile === 'F') && featureRoll > 0.0015 && featureRoll < 0.0020) {
                    chunkData[y][x] = '⛰';
                }
                // --- 5. COMMON FEATURES ---
                else if (tile === '.' && featureRoll < 0.0005) {
                    let features = Object.keys(TILE_DATA);
                    features = features.filter(f => {
                        const data = TILE_DATA[f];
                        const allowedTypes = ['lore', 'lore_statue', 'loot_container', 'campsite', 'decoration'];
                        return allowedTypes.includes(data.type);
                    });

                    if (features.length > 0) {
                        const featureTile = features[Math.floor(random() * features.length)];
                        chunkData[y][x] = featureTile;
                    }
                }
                // --- 6. RIDDLE STATUES ---
                else if (tile === '.' && featureRoll < 0.00008) {
                    chunkData[y][x] = '?';
                }
                // --- 7. GENERIC STRUCTURES ---
                else if (tile !== '~' && tile !== '≈' && featureRoll < 0.0001) {
                    chunkData[y][x] = '🏛️';
                }
                else if (tile !== '~' && tile !== '≈' && featureRoll < 0.0002) {
                    chunkData[y][x] = '⛺';
                }
                // --- 8. ARCHAEOLOGY SPOTS ---
                else if (['.', 'd', 'D', 'F'].includes(tile) && featureRoll < (tile === 'd' || tile === 'D' ? 0.0015 : 0.0005)) {
                    chunkData[y][x] = '∴';
                }
                else {
                    // --- 9. ENEMY & RESOURCE SPAWNING ---
                    const hostileRoll = random();

                    let spawnChance = 0.0015;
                    if (tile === 'F') spawnChance = 0.0025;
                    if (tile === 'd') spawnChance = 0.0040;
                    if (tile === '^') spawnChance = 0.0020;

                    if (hostileRoll < spawnChance) {
                        const effectiveDist = (dist < 200) ? 0 : dist;
                        const enemyTile = this.getEnemySpawn(tile, effectiveDist, random);

                        if (enemyTile && (ENEMY_DATA[enemyTile] || TILE_DATA[enemyTile])) {
                            chunkData[y][x] = enemyTile;
                        } else {
                            chunkData[y][x] = tile;
                        }
                    }
                    // --- 10. RESOURCE FALLBACKS ---
                    else if (tile === '^' && hostileRoll < 0.03) {
                        chunkData[y][x] = '🏚';
                    }
                    else if (tile === 'F' && hostileRoll < 0.03) {
                        chunkData[y][x] = '🌳';
                    }
                    else {
                        chunkData[y][x] = tile;
                    }
                }
            }
        }

        // --- ZERO-ALLOCATION SMOOTHING PASS ---
        const naturalTerrain = ['.', 'F', 'd', 'D', '^', '~', '≈'];
        
        for (let y = 1; y < this.CHUNK_SIZE - 1; y++) {
            for (let x = 1; x < this.CHUNK_SIZE - 1; x++) {
                const currentTile = chunkData[y][x];
                if (!naturalTerrain.includes(currentTile)) continue;

                const nN = chunkData[y - 1][x];
                const nS = chunkData[y + 1][x];
                const nW = chunkData[y][x - 1];
                const nE = chunkData[y][x + 1];

                // If 3 adjacent tiles share the same natural terrain type, assimilate to it
                if (naturalTerrain.includes(nN)) {
                    if ((nN === nS && nN === nE) || (nN === nS && nN === nW) || (nN === nE && nN === nW)) {
                        chunkData[y][x] = nN;
                        continue;
                    }
                }
                if (naturalTerrain.includes(nS) && nS === nE && nS === nW) {
                    chunkData[y][x] = nS;
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
        
        // Always check WorldState first (Diff overrides procedural)
        if (this.worldState[chunkId] && this.worldState[chunkId][tileKey] !== undefined) {
            return this.worldState[chunkId][tileKey];
        }
        if (!this.loadedChunks[chunkId]) {
            this.generateChunk(chunkX, chunkY);
        }
        return this.loadedChunks[chunkId][localY][localX];
    },
    
    unloadOutOfRangeChunks: function (playerChunkX, playerChunkY) {
        const VIEW_RADIUS_CHUNKS = 2;
        const visibleChunkIds = new Set();
        
        for (let y = -VIEW_RADIUS_CHUNKS; y <= VIEW_RADIUS_CHUNKS; y++) {
            for (let x = -VIEW_RADIUS_CHUNKS; x <= VIEW_RADIUS_CHUNKS; x++) {
                visibleChunkIds.add(`${playerChunkX + x},${playerChunkY + y}`);
            }
        }

        for (const chunkId in worldStateListeners) {
            if (!visibleChunkIds.has(chunkId)) {
                worldStateListeners[chunkId]();
                delete worldStateListeners[chunkId];

                if (this.loadedChunks[chunkId]) delete this.loadedChunks[chunkId];
                if (this.worldState[chunkId]) delete this.worldState[chunkId];
            }
        }
    }
};

// --- SPATIAL PARTITIONING HELPERS ---
const SPATIAL_CHUNK_SIZE = 16; 

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
            if (set.size === 0) gameState.enemySpatialMap.delete(oldKey); 
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
