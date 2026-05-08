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

        // --- 1. Setup Variables (Dynamic Scaling & Z-Axis) ---
        let chosenThemeKey;
        
        // Bulletproof Coordinate & Floor Depth Extraction
        const parts = caveId.split('_');
        let floorZ = 1;
        let cX = 0, cY = 0;
        
        const lastPart = parts[parts.length - 1];
        const secondToLast = parts[parts.length - 2];
        const thirdToLast = parts[parts.length - 3];
        
        if (!isNaN(parseInt(thirdToLast)) && !isNaN(parseInt(secondToLast)) && !isNaN(parseInt(lastPart))) {
            // It has X, Y, Z (e.g. cave_10_20_2)
            cX = parseInt(thirdToLast);
            cY = parseInt(secondToLast);
            floorZ = parseInt(lastPart);
        } else if (!isNaN(parseInt(secondToLast)) && !isNaN(parseInt(lastPart))) {
            // It has X, Y (e.g. sunken_whirlpool_10_20)
            cX = parseInt(secondToLast);
            cY = parseInt(lastPart);
            floorZ = 1;
        }

        // PERFORMANCE: Use Squared Distance to avoid Math.sqrt() costs
        const distSq = (cX * cX) + (cY * cY);
        const SAFE_ZONE_SQ = 150 * 150; // 22500

        // JUICE: Randomize cave aspect ratio so they aren't perfect squares!
        // Min size 90, Max size 150
        const randomSize = Alea(stringToSeed(caveId + ':size'));
        let CAVE_WIDTH = 90 + Math.floor(randomSize() * 60);
        let CAVE_HEIGHT = 90 + Math.floor(randomSize() * 60);
        
        // Deeper floors = More enemies
        let enemyCount = 30 + (floorZ * 10); 

        // Safe Zone Density Nerf (Fewer enemies near spawn)
        if (distSq < SAFE_ZONE_SQ && floorZ === 1) { 
            enemyCount = 10; 
            CAVE_WIDTH = 70; CAVE_HEIGHT = 70; // Keep newbie caves small
        }

        // --- THEME SELECTION LOGIC ---
        if (caveId === 'cave_landmark' || floorZ >= 5) {
            chosenThemeKey = 'ABYSS'; 
            CAVE_WIDTH = 150; CAVE_HEIGHT = 150; enemyCount = 80;   
        } else if (caveId.startsWith('volcano_')) {
            chosenThemeKey = 'FIRE'; // Force Fire Theme
            enemyCount = Math.max(enemyCount, 40); // Volcanoes are highly populated!
        } else if (caveId.startsWith('void_')) {
            chosenThemeKey = 'VOID'; // Force Void Theme
            enemyCount = Math.max(enemyCount, 25);   
        } else if (caveId.startsWith('sunken_')) {
            chosenThemeKey = 'SUNKEN'; // Force Sunken Theme
            enemyCount = Math.max(enemyCount, 25);   
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
        // PERFORMANCE: Use new Array for better V8 engine memory pre-allocation
        const map = Array.from({
            length: CAVE_HEIGHT
        }, () => new Array(CAVE_WIDTH).fill(theme.wall));

        const random = Alea(stringToSeed(caveId));
        let x = Math.floor(CAVE_WIDTH / 2);
        let y = Math.floor(CAVE_HEIGHT / 2);

        const startPos = {
            x,
            y
        };
        
        // Bigger maps need more carving steps
        let steps = Math.floor((CAVE_WIDTH * CAVE_HEIGHT) * 0.4);
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
        const roomAttempts = 8; // Increased attempts for bigger maps

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
                            let scaledStats = getScaledEnemy(enemyTemplate, cX, cY);
                            
                            // Boost stats based on Floor Depth!
                            if (floorZ > 1) {
                                scaledStats.maxHealth = Math.floor(scaledStats.maxHealth * (1 + (floorZ * 0.2)));
                                scaledStats.attack += floorZ;
                                scaledStats.xp = Math.floor(scaledStats.xp * (1 + (floorZ * 0.5)));
                                scaledStats.name = `Deep ${scaledStats.name}`; // Prefix for deep enemies
                            }

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
                                spellDamage: Math.floor((enemyTemplate.spellDamage || 0) * (1 + (Math.floor(Math.sqrt(distSq) / 50) * 0.1))),
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
        const lootQuantity = Math.floor(random() * 6) + 2; // More loot in bigger caves
        
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
        // If within 150 tiles of spawn, remove "Hard" enemies from the spawn pool
        if (distSq < SAFE_ZONE_SQ && floorZ === 1) {
            // Added Golems (🧌), Draugr (Z), Scorpions (🦂), and Spiders (@) to the ban list!
            const hardEnemies =['C', 'm', 'o', 'Ø', 'Y', 'D', '🐲', '🧙', 'v', 'f', '🧌', 'Z', '🦂', '@'];
            enemyTypes = enemyTypes.filter(e => !hardEnemies.includes(e));
            
            // Safety fallback: If we filtered everything out, add basics
            if (enemyTypes.length === 0) enemyTypes = ['r', 'b', 'g'];
        }
        
        for (let i = 0; i < enemyCount; i++) {
            const randY = Math.floor(random() * (CAVE_HEIGHT - 2)) + 1;
            const randX = Math.floor(random() * (CAVE_WIDTH - 2)) + 1;

            if (map[randY][randX] === theme.floor && (randX !== startPos.x || randY !== startPos.y)) {
                const enemyTile = enemyTypes[Math.floor(random() * enemyTypes.length)];
                const enemyTemplate = ENEMY_DATA[enemyTile];

                let scaledStats = getScaledEnemy(enemyTemplate, cX, cY);
                
                // Boost stats based on Floor Depth!
                if (floorZ > 1) {
                    scaledStats.maxHealth = Math.floor(scaledStats.maxHealth * (1 + (floorZ * 0.2)));
                    scaledStats.attack += floorZ;
                    scaledStats.xp = Math.floor(scaledStats.xp * (1 + (floorZ * 0.5)));
                    scaledStats.name = `Deep ${scaledStats.name}`; // Prefix for deep enemies
                }

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

        // CRITICAL BUG FIX: Dungeon Stairs Fallback
        // Guaranteed to find a spot for stairs, preventing unbeatable dungeons.
        let stairsPlaced = false;
        let stairsAttempts = 0;
        let minStairsDistSq = 30 * 30; // Starts requiring distance > 30 tiles

        while (!stairsPlaced && stairsAttempts < 1000) {
            const sx = Math.floor(random() * (CAVE_WIDTH - 2)) + 1;
            const sy = Math.floor(random() * (CAVE_HEIGHT - 2)) + 1;
            
            const dx = sx - startPos.x;
            const dy = sy - startPos.y;
            const distFromStartSq = (dx * dx) + (dy * dy);

            // Place stairs if it's an open floor and meets distance criteria
            if (map[sy][sx] === theme.floor && distFromStartSq >= minStairsDistSq) {
                map[sy][sx] = '<';
                stairsPlaced = true;
            }
            stairsAttempts++;

            // Gradually relax constraints if the map is too tight to prevent infinite lock
            if (stairsAttempts > 500) minStairsDistSq = 15 * 15;
            if (stairsAttempts > 800) minStairsDistSq = 0;
        }
        
        // Final ultimate failsafe
        if (!stairsPlaced) {
            map[startPos.y + 1][startPos.x] = '<';
        }

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
            let minBossDistSq = 30 * 30;

            while (!bossPlaced && attempts < 1000) {
                // Pick a random spot
                const bx = Math.floor(random() * (CAVE_WIDTH - 2)) + 1;
                const by = Math.floor(random() * (CAVE_HEIGHT - 2)) + 1;

                const dx = bx - startPos.x;
                const dy = by - startPos.y;
                const distFromStartSq = (dx * dx) + (dy * dy);

                if (map[by][bx] === theme.floor && distFromStartSq >= minBossDistSq) {
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
                
                // Relax constraints
                if (attempts > 500) minBossDistSq = 15 * 15;
                if (attempts > 800) minBossDistSq = 0;
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

        const isDark = castleId.includes('landmark') || castleId.includes('darkcastle');
        const random = Alea(stringToSeed(castleId)); 

        // 1. Layout Selection: Dark castles get Fortresses, Safe castles get civilian layouts
        let chosenLayoutKey;
        if (forcedLayoutKey && CASTLE_LAYOUTS[forcedLayoutKey]) {
            chosenLayoutKey = forcedLayoutKey; 
        } else {
            if (isDark) {
                chosenLayoutKey = 'FORTRESS'; 
            } else {
                const safeLayouts = ['COURTYARD', 'LIBRARY_WING', 'TOWER'];
                chosenLayoutKey = safeLayouts[Math.floor(random() * safeLayouts.length)];
            }
        }
        
        const layout = CASTLE_LAYOUTS[chosenLayoutKey];
        const baseMap = layout.map;
        
        this.castleSpawnPoints = this.castleSpawnPoints || {};
        this.castleSpawnPoints[castleId] = layout.spawn;

        const map = baseMap.map(row => [...row]);

        // PERFORMANCE: Optimized Array Padding
        // Replaced slow while-loop push with ultra-fast array concat/fill
        const maxWidth = Math.max(...map.map(r => r.length));
        for (let y = 0; y < map.length; y++) {
            if (map[y].length < maxWidth) {
                map[y] = map[y].concat(new Array(maxWidth - map[y].length).fill('▓'));
            }
        }

        // --- NEW: ONLY SPAWN MERCHANTS/VILLAGERS IN SAFE CASTLES ---
        if (!isDark) {
            const npcTypesToSpawn = ['N', 'N']; 
            let hasShop = baseMap.some(row => row.includes('§'));
            let hasHealer = baseMap.some(row => row.includes('H'));
            
            if (!hasShop) npcTypesToSpawn.push('§');
            if (!hasHealer) npcTypesToSpawn.push('H');
            
            for (const npcTile of npcTypesToSpawn) {
                let placed = false;
                for (let i = 0; i < 50 && !placed; i++) {
                    const randY = Math.floor(random() * (map.length - 2)) + 1;
                    const randX = Math.floor(random() * (map[0].length - 2)) + 1;
                    if (map[randY][randX] === '.') {
                        map[randY][randX] = npcTile; 
                        placed = true;
                    }
                }
            }
        }

        // Ensure the tiles adjacent to spawn are walkable
        const spawnX = layout.spawn.x;
        const spawnY = layout.spawn.y;
        const adjacentCoords = [[spawnY - 1, spawnX], [spawnY + 1, spawnX], [spawnY, spawnX - 1],[spawnY, spawnX + 1]];
        const protectedTiles = ['▓', 'X', 'B', '📖'];

        for (const[y, x] of adjacentCoords) {
            if (map[y] && map[y][x]) {
                const originalTile = (baseMap[y] && baseMap[y][x]) ? baseMap[y][x] : '▓';
                if (!protectedTiles.includes(originalTile)) map[y][x] = '.';
            }
        }
        if (map[spawnY] && map[spawnY][spawnX] !== undefined) map[spawnY][spawnX] = '.';

        // Extract Guards and Enemies to Entities
        this.friendlyNpcs = this.friendlyNpcs || {};
        this.friendlyNpcs[castleId] =[];
        
        this.castleEnemies = this.castleEnemies || {};
        this.castleEnemies[castleId] =[];

        const parts = castleId.split('_');
        const cX = parseInt(parts[parts.length - 2]) || 0;
        const cY = parseInt(parts[parts.length - 1]) || 0;

        // --- NEW: LIGHT VS DARK FILTERING ---
        for (let y = 0; y < map.length; y++) {
            for (let x = 0; x < map[0].length; x++) {
                const tile = map[y][x];

                if (tile === 'G' || tile === '🎖️') {
                    map[y][x] = '.'; // Always clear the static tile
                    if (!isDark) {
                        // Only add guards to safe castles
                        this.friendlyNpcs[castleId].push({
                            id: `guard_${x}_${y}`, x: x, y: y, name: tile === '🎖️' ? "Captain" : "Castle Guard", tile: tile, role: 'guard',
                            dialogue:["The night shift is quiet.", "Keep your weapons sheathed.", "Nothing to report."]
                        });
                    }
                } 
                else if (ENEMY_DATA[tile]) {
                    map[y][x] = '.'; // Always clear the static tile
                    if (isDark) {
                        // Only spawn monsters in Dark Castles!
                        const enemyTemplate = ENEMY_DATA[tile];
                        const scaledStats = getScaledEnemy(enemyTemplate, cX, cY);
                        
                        this.castleEnemies[castleId].push({
                            id: `${castleId}:enemy_${x}_${y}`,
                            x: x, y: y, tile: tile,
                            name: scaledStats.name,
                            health: scaledStats.maxHealth, maxHealth: scaledStats.maxHealth,
                            attack: scaledStats.attack, defense: enemyTemplate.defense,
                            xp: scaledStats.xp, loot: enemyTemplate.loot,
                            caster: enemyTemplate.caster || false, castRange: enemyTemplate.castRange || 0,
                            spellDamage: enemyTemplate.spellDamage || 0, inflicts: enemyTemplate.inflicts || null,
                            isBoss: enemyTemplate.isBoss || false,
                            madnessTurns: 0, frostbiteTurns: 0, poisonTurns: 0, rootTurns: 0
                        });
                    }
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
            if (doc.exists) {
                const data = doc.data();
                let needsCleanup = false;
                const cleanupUpdates = {};
                const now = Date.now();

                // --- NEW: Decentralized Garbage Collection ---
                for (const key in data) {
                    const val = data[key];
                    if (typeof val === 'object' && val !== null && val.expires) {
                        if (now > val.expires) {
                            needsCleanup = true;
                            cleanupUpdates[key] = firebase.firestore.FieldValue.delete();
                            delete data[key]; // Erase locally
                        }
                    }
                }

                this.worldState[chunkId] = data;

                // If this client found expired items, tell Firebase to delete them for everyone!
                if (needsCleanup) {
                    docRef.update(cleanupUpdates).catch(console.error);
                }
            } else {
                this.worldState[chunkId] = {};
            }

            if (onInitialLoad) {
                onInitialLoad();
                onInitialLoad = null; 
            }

            if (typeof gameState !== 'undefined') gameState.mapDirty = true;
            if (typeof render === 'function') render();
        });
    },

    setWorldTile(worldX, worldY, newTile, ttlHours = 0) {
        const chunkX = Math.floor(worldX / this.CHUNK_SIZE);
        const chunkY = Math.floor(worldY / this.CHUNK_SIZE);
        
        if (isNaN(chunkX) || isNaN(chunkY)) return;
        
        const chunkId = `${chunkX},${chunkY}`;
        const localX = (worldX % this.CHUNK_SIZE + this.CHUNK_SIZE) % this.CHUNK_SIZE;
        const localY = (worldY % this.CHUNK_SIZE + this.CHUNK_SIZE) % this.CHUNK_SIZE;
        const tileKey = `${localX},${localY}`;
        
        if (!this.worldState[chunkId]) this.worldState[chunkId] = {};
        
        // --- NEW: Time-To-Live (TTL) Logic ---
        let tileData = newTile;
        if (ttlHours > 0) {
            // Save as an object with an expiration timestamp
            tileData = { t: newTile, expires: Date.now() + (ttlHours * 60 * 60 * 1000) };
        }
        
        this.worldState[chunkId][tileKey] = tileData;

        if (typeof gameState !== 'undefined') gameState.mapDirty = true;

        // OPTIMIZATION: Only send the specific tile that changed, not the whole chunk!
        const updateObj = {};
        updateObj[tileKey] = tileData;

        db.collection('worldState').doc(chunkId).set(updateObj, {
            merge: true
        }).catch(err => console.error("Map update failed:", err));
    },

    getEnemySpawn(biome, distSq, random) {
        // PERFORMANCE: Using pre-squared thresholds (500^2, 1500^2, etc.)
        const TIER_THRESHOLDS_SQ = [250000, 2250000, 9000000, 36000000];

        let tier = 0;
        for (let i = 0; i < TIER_THRESHOLDS_SQ.length; i++) {
            if (distSq > TIER_THRESHOLDS_SQ[i]) tier = i + 1;
            else break;
        }

        const spawns = {
            '.': { 0: ['r', 'r', 'b'], 1: ['b', 'w', 'o'], 2: ['o', 'C', '🐺'], 3: ['o', '🐺', 'Ø'], 4: ['Ø', '🦖', '🤖'] },
            'F': { 0: ['🐍', '🦌', '🐗'], 1: ['w', '🐗', '🐻'], 2: ['🐻', '🐺', '🕸'], 3: ['🐺', '🐻', '🌲'], 4: ['🌲', '🧛', '👾'] },
            '^': { 0: ['🦇', 'g', 'R'], 1: ['g', 's', '🦅'], 2: ['s', '🧌', 'Y'], 3: ['Y', '🧌', '🐲'], 4: ['🐲', '🦖', '🤖'] },
            '≈': { 0: ['🦟', '🐸', '🐍'], 1: ['🐍', 'l', 'Z'], 2: ['Z', 'l', 'a'], 3: ['Z', 'a', '🐉h'], 4: ['🐉h', '👾', '🧛'] },
            'D': { 0: ['🦂s', '🐍', '🌵'], 1: ['🦂', '🐍c', '🌵'], 2: ['🦂', 'm', 'a'], 3: ['m', 'a', '🔥e'], 4: ['🔥e', '🦖', '🤖'] },
            'd': { 0: ['s', 'b', 'R'], 1: ['s', 'Z', 'a'], 2: ['Z', 'a', '😈d'], 3: ['😈d', 'v', '🧙'], 4: ['🧙', '👾', '🧛'] },
            '~': { 0: ['🐸', '🦈'], 1: ['🦈', 'l'], 2: ['🦈', '🐉h', '🦑'], 3: ['🐉h', '🦑'], 4: ['🦑', '👾'] }
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

                // PERFORMANCE: Pre-calculate Squared Distance for entire loop
                const distSq = (worldX * worldX) + (worldY * worldY);

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

                // --- NATURAL SPAWN SAFETY OVERRIDE ---
                if (distSq <= 100) { 
                    if (['^', '~', '≈', 'd'].includes(tile)) {
                        tile = moist > 0.5 ? 'F' : '.'; 
                    }
                }

                const featureRoll = random();

                // OPTIMIZATION NOTICE
                // We NO LONGER call this.setWorldTile() during procedural generation!
                // The client will render these from chunkData automatically. 
                // This saves literally 99% of your Firebase database write quotas!

                // --- 1. LEGENDARY LANDMARKS (Unique, Very Rare) ---
                if (tile === '.' && featureRoll < 0.000001 && distSq > 2250000) { // dist > 1500
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
                // --- NIGHT-TIME ANOMALIES ---
                else if (tile === 'F' && featureRoll > 0.0001 && featureRoll < 0.0003) {
                    chunkData[y][x] = '🌺'; // Moonblooms in forests
                }
                else if (tile === '^' && featureRoll > 0.0001 && featureRoll < 0.0003) {
                    chunkData[y][x] = '☄️'; // Star-metal in mountains
                }
                // --- END NEW ANOMALIES ---
                else if ((tile === 'd' || tile === 'D') && featureRoll < 0.000005) { // Void Rift
                    chunkData[y][x] = 'Ω';
                }
                // --- 3. RARE STRUCTURES (Scaled by Distance) ---
                else if (tile === '.' && featureRoll < 0.000005) { // Safe Haven
                    chunkData[y][x] = 'V';
                }
                else if (tile === '~' && featureRoll < 0.00005) { // Whirlpool in deep ocean
                    chunkData[y][x] = '🌀';
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
                else if (tile === '~' && featureRoll < 0.0005 && distSq > 4000000) {
                    // Far out in the ocean (> 2000 tiles from spawn)
                    if (random() < 0.5) chunkData[y][x] = '🌋'; // Volcano Island
                    else chunkData[y][x] = '🛕'; // Abyssal Temple
                }
                else if (tile === '^' && featureRoll < 0.008) {
                    chunkData[y][x] = '⛰';
                }
                else if (tile === 'd' && featureRoll < 0.004) {
                    chunkData[y][x] = '⛰';
                }
                else if ((tile === '.' || tile === 'F') && featureRoll > 0.0005 && featureRoll < 0.0015) {
                    // 50% chance for a castle to be Dark/Ruined if you are far from home!
                    if (distSq > 640000 && random() < 0.5) { // dist > 800
                        chunkData[y][x] = '🕍'; // Dark Castle
                    } else {
                        chunkData[y][x] = '🏰'; // Safe Castle
                    }
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
                        // EXCLUDE the shipwreck from generic dry land spawns
                        return allowedTypes.includes(data.type) && f !== '🚢'; 
                    });

                    if (features.length > 0) {
                        const featureTile = features[Math.floor(random() * features.length)];
                        chunkData[y][x] = featureTile;
                    } else {
                        chunkData[y][x] = tile;
                    }
                }
                // --- ADD THIS: SHIPWRECKS (Water & Shorelines) ---
                else if (featureRoll > 0.0020 && featureRoll < 0.0024) {
                    let isShipwreckSpot = false;
                    
                    // 1. Valid if it's already in the water
                    if (tile === '~' || tile === '≈') {
                        isShipwreckSpot = true; 
                    } 
                    // 2. If it's on land, check if it's on a beach/shoreline
                    else if (['.', 'D', 'd', 'F'].includes(tile)) {
                        // Check the elevation noise 1 tile in every direction to see if it drops below sea level (< 0.35)
                        const eN = elevationNoise.noise(worldX / 70, (worldY - 1) / 70);
                        const eS = elevationNoise.noise(worldX / 70, (worldY + 1) / 70);
                        const eE = elevationNoise.noise((worldX + 1) / 70, worldY / 70);
                        const eW = elevationNoise.noise((worldX - 1) / 70, worldY / 70);
                        
                        if (eN < 0.35 || eS < 0.35 || eE < 0.35 || eW < 0.35) {
                            isShipwreckSpot = true; // It's a shore!
                        }
                    }

                    if (isShipwreckSpot) {
                        chunkData[y][x] = '🚢';
                    } else {
                        // It rolled the number but wasn't near water, just leave the terrain alone
                        chunkData[y][x] = tile; 
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
                else if (tile === 'D' && featureRoll < 0.008) {
                    chunkData[y][x] = '🌴';
                }
                else {
                    // --- 9. ENEMY & RESOURCE SPAWNING ---
                    const hostileRoll = random();

                    let spawnChance = 0.0015;
                    if (tile === 'F') spawnChance = 0.0025;
                    if (tile === 'd') spawnChance = 0.0040;
                    if (tile === '^') spawnChance = 0.0020;

                    if (hostileRoll < spawnChance) {
                        const effectiveDistSq = (distSq < 40000) ? 0 : distSq; // safe zone dist < 200
                        const enemyTile = this.getEnemySpawn(tile, effectiveDistSq, random);

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
            const val = this.worldState[chunkId][tileKey];
            // If it's a TTL object, return the 't' (tile) property. Otherwise, return the string.
            return (typeof val === 'object' && val !== null) ? val.t : val;
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
