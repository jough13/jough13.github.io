// --- START OF FILE data-maps.js ---

window.REALM_MUTATORS = {
    'lava_oceans': {
        name: "Infernal",
        description: "The oceans have boiled away into molten rock.",
        apply: (tile) => (tile === '~' || tile === '≈') ? '🌋' : tile, // Turns water to volcano/lava
        enemyBuff: 1.5 // 50% stronger enemies
    },
    'eternal_night': {
        name: "Umbral",
        description: "The sun never rises here. The shadows are alive.",
        apply: (tile) => tile, // Doesn't change terrain, but we'll hook it into the time engine
        enemyBuff: 2.0
    },
    'overgrown': {
        name: "Verdant",
        description: "Nature has consumed everything.",
        apply: (tile) => {
            if (tile === 'd' || tile === 'D') return 'F'; // Turns deadlands/deserts to forest
            if (tile === '.') return '🌳e'; // Turns plains to elder trees
            return tile;
        },
        enemyBuff: 1.2
    },
    'shattered': {
        name: "Shattered",
        description: "The earth is broken. Void rifts are everywhere.",
        apply: (tile) => (Math.random() < 0.05 && tile === '.') ? 'Ω' : tile,
        enemyBuff: 3.0
    }
};

window.TILE_DATA = {
    // ==========================================
    // --- EXPANSION: ENDGAME PLOT & NPCS ---
    // ==========================================
    '🪦': {
        type: 'anomaly',
        name: 'The Royal Tomb',
        flavor: "Massive obsidian doors block the way. They bear the crest of the Old King.",
        onInteract: (state, x, y) => {
            const hasCrown = state.player.inventory.some(i => i.name === 'Crown of the First King');
            const hasSword = state.player.inventory.some(i => i.name === 'Stormbringer');

            if (hasCrown && hasSword) {
                logMessage("{purple:The Crown hums. Stormbringer glows. The obsidian doors grind open...}");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
                
                // Teleport to the Boss Room!
                state.mapMode = 'dungeon';
                state.currentCaveId = 'tomb_of_alaric';
                state.currentCaveTheme = 'VOID'; // Dark, corrupted room
                state.overworldExit = { x: state.player.x, y: state.player.y };

                // Generate a custom 9x9 Boss Arena
                const arena = [
                    '▓▓▓▓▓▓▓▓▓',
                    '▓.......▓',
                    '▓.🔥.🔥.▓',
                    '▓...☠️...▓',
                    '▓.🔥.🔥.▓',
                    '▓.......▓',
                    '▓▓▓>▓▓▓▓▓'
                ];
                chunkManager.caveMaps['tomb_of_alaric'] = arena.map(row => row.split(''));
                
                state.player.x = 4;
                state.player.y = 5;

                // Spawn Alaric!
                const bossTemplate = window.ENEMY_DATA['☠️'];
                if (bossTemplate) {
                    state.instancedEnemies = [{
                        id: `alaric_boss`, x: 4, y: 3, tile: '☠️',
                        name: bossTemplate.name, isBoss: true,
                        health: bossTemplate.maxHealth, maxHealth: bossTemplate.maxHealth,
                        attack: bossTemplate.attack, defense: bossTemplate.defense,
                        xp: bossTemplate.xp, loot: bossTemplate.loot,
                        caster: true, castRange: 6, spellDamage: 12, inflicts: 'madness',
                        madnessTurns: 0, frostbiteTurns: 0, poisonTurns: 0, rootTurns: 0
                    }];
                }

                if (typeof updateRegionDisplay === 'function') updateRegionDisplay();
                state.mapDirty = true;
                if (typeof render === 'function') render();
                if (typeof syncPlayerState === 'function') syncPlayerState();
            } else {
                logMessage("{gray:A voice echoes in your mind: 'ONLY THE TRUE RULER MAY ENTER.'}");
                logMessage("{red:You need the Crown of the First King and his legendary blade to open this door.}");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            }
            return null;
        }
    },
    '⚒️': {
        type: 'anomaly',
        name: 'Master Blacksmith',
        flavor: "A hulking dwarf striking glowing metal on an anvil.",
        onInteract: (state, x, y) => {
            const p = state.player;
            const inv = p.inventory;
            
            // Material checks
            const hasStarMetal = inv.some(i => i.name === 'Star-Metal Ore');
            const hasKrakenInk = inv.some(i => i.name === 'Kraken Ink Sac');

            loreTitle.textContent = "Master Blacksmith Thorne";
            let html = `<p>"Hah! The stuff you make on that wooden workbench is garbage! Bring me real materials, and I'll forge you weapons of legend!"</p><hr class="my-4 border-gray-600">`;

            // Recipe 1: Star-Forged Greatsword
            if (hasStarMetal && p.coins >= 1000) {
                html += `<button id="forgeStar" class="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded mb-2 shadow transition-transform active:scale-95">Forge Star-Metal Blade (1x Ore, 1000g)</button>`;
            } else {
                html += `<button disabled class="w-full bg-gray-700 text-gray-500 font-bold py-2 px-4 rounded mb-2 cursor-not-allowed">Requires: Star-Metal Ore & 1000g</button>`;
            }

            // Recipe 2: Abyssal Cloak
            if (hasKrakenInk && p.coins >= 1500) {
                html += `<button id="forgeAbyss" class="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded mb-2 shadow transition-transform active:scale-95">Weave Abyssal Cloak (1x Kraken Ink, 1500g)</button>`;
            } else {
                html += `<button disabled class="w-full bg-gray-700 text-gray-500 font-bold py-2 px-4 rounded mb-2 cursor-not-allowed">Requires: Kraken Ink Sac & 1500g</button>`;
            }

            loreContent.innerHTML = html;
            loreModal.classList.remove('hidden');

            // Button Binds
            setTimeout(() => {
                const consumeItem = (name) => {
                    const idx = inv.findIndex(i => i.name === name && !i.isEquipped);
                    if (idx > -1) {
                        inv[idx].quantity--;
                        if (inv[idx].quantity <= 0) inv.splice(idx, 1);
                    }
                };

                const starBtn = document.getElementById('forgeStar');
                if (starBtn) starBtn.onclick = () => {
                    if (inv.length >= (window.MAX_INVENTORY_SLOTS || 9)) {
                        logMessage("{red:Inventory Full!}"); 
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                        return;
                    }
                    consumeItem('Star-Metal Ore');
                    p.coins -= 1000;
                    inv.push({
                        templateId: '⚔️star',
                        name: 'Star-Forged Blade', type: 'weapon', tile: '⚔️', quantity: 1,
                        damage: 12, slot: 'weapon', statBonuses: { strength: 3, luck: 3 },
                        description: "{red:+12 Dmg}, {green:+3 Str}, {gold:+3 Luck}. It glows with starlight.",
                        excludeFromLoot: true
                    });
                    logMessage("{gold:Thorne hammers the fallen star into a flawless blade!}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playHit();
                    loreModal.classList.add('hidden');
                    if (typeof renderInventory === 'function') renderInventory();
                    if (typeof renderStats === 'function') renderStats();
                    if (typeof playerRef !== 'undefined') playerRef.update({ coins: p.coins, inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : inv });
                };

                const abyssBtn = document.getElementById('forgeAbyss');
                if (abyssBtn) abyssBtn.onclick = () => {
                    if (inv.length >= (window.MAX_INVENTORY_SLOTS || 9)) {
                        logMessage("{red:Inventory Full!}"); 
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                        return;
                    }
                    consumeItem('Kraken Ink Sac');
                    p.coins -= 1500;
                    inv.push({
                        templateId: '🧥abyss',
                        name: 'Abyssal Cloak', type: 'armor', tile: '🧥', quantity: 1,
                        defense: 6, slot: 'armor', statBonuses: { dexterity: 5, wits: 5 },
                        description: "{blue:+6 Def}, {green:+5 Dex, +5 Wits}. It drinks the surrounding light.",
                        excludeFromLoot: true
                    });
                    logMessage("{purple:Thorne weaves the ink into a cloak of pure shadow!}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playHit();
                    loreModal.classList.add('hidden');
                    if (typeof renderInventory === 'function') renderInventory();
                    if (typeof renderStats === 'function') renderStats();
                    if (typeof playerRef !== 'undefined') playerRef.update({ coins: p.coins, inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : inv });
                };
            }, 0);

            return null;
        }
    },
    '✝️': {
        type: 'anomaly',
        name: 'The Inquisitor',
        flavor: "A stern man in heavy armor. He is hunting the Shadowed Hand.",
        onInteract: (state, x, y) => {
            if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
            
            if (!state.foundLore.has("met_inquisitor")) {
                logMessage("{gold:You meet the Inquisitor. +50 XP}");
                if (typeof grantXp === 'function') grantXp(50);
                state.foundLore.add("met_inquisitor");
                if (typeof playerRef !== 'undefined') playerRef.update({ foundLore: Array.from(state.foundLore) });
            }
            
            loreTitle.textContent = "The Inquisitor";
            loreContent.innerHTML = `
                <p>"The darkness is spreading. I have posted new, high-priority bounties on the board. We need capable hunters to slay the horrors before they reach the village."</p>
                <button id="viewInqBounties" class="mt-4 bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-4 rounded w-full shadow transition-transform active:scale-95">View Bounties</button>
            `;
            loreModal.classList.remove('hidden');

            setTimeout(() => {
                const btn = document.getElementById('viewInqBounties');
                if (btn) btn.onclick = () => {
                    loreModal.classList.add('hidden');
                    if (typeof openBountyBoard === 'function') openBountyBoard();
                };
            }, 0);

            return null;
        }
    },

    // ==========================================
    // --- BASE TILES ---
    // ==========================================
    '⛵': {
        type: 'sailing_ship',
        title: 'Sailing Ship',
        flavor: "A sturdy wooden ship with silk sails."
    },
    '🌋': {
        type: 'dungeon_entrance',
        flavor: "A volcanic island rises from the sea. Heat radiates from the crater.",
        getCaveId: (x, y) => `volcano_${x}_${y}`
    },
    '🛕': {
        type: 'dungeon_entrance',
        flavor: "The spires of an ancient, flooded temple pierce the ocean surface.",
        getCaveId: (x, y) => `sunken_${x}_${y}`
    },
    '🌀': {
        type: 'dungeon_entrance',
        flavor: "A massive, swirling whirlpool! The current drags you down...",
        getCaveId: (x, y) => `sunken_whirlpool_${x}_${y}`
    },
    '❄️': {
        type: 'anomaly',
        name: 'Ice Bridge',
        flavor: "The water has been frozen solid by magic. It won't last forever."
    },
    '🛏️': {
        type: 'anomaly',
        name: 'Cozy Bed',
        flavor: "A surprisingly clean and comfortable bed.",
        onInteract: (state, x, y) => {
            if (typeof AudioSystem !== 'undefined') AudioSystem.playHeal();
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(state.player.x, state.player.y, "ZZZ", "#facc15");

            logMessage("{green:You rest deeply. Your Respawn Point has been set here.}");
            
            state.player.health = state.player.maxHealth;
            state.player.mana = state.player.maxMana;
            state.player.stamina = state.player.maxStamina;
            
            state.player.respawnPoint = { x: state.player.x, y: state.player.y };
            
            if (typeof triggerStatAnimation !== 'undefined') {
                triggerStatAnimation(document.getElementById('healthDisplay'), 'stat-pulse-green');
            }

            return { 
                health: state.player.health, 
                mana: state.player.mana,
                stamina: state.player.stamina,
                respawnPoint: state.player.respawnPoint 
            };
        }
    },
    '🌴': {
        type: 'anomaly',
        name: 'Palm Tree',
        flavor: "A tall tree swaying in the coastal breeze.",
        onInteract: (state, x, y) => {
            const tileId = `${x},${-y}`;
            if (!state.lootedTiles.has(tileId)) {
                logMessage("You shake the palm tree...");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playAttack('heavy'); 
                
                if (state.player.inventory.length < (window.MAX_INVENTORY_SLOTS || 9)) { 
                    state.player.inventory.push({
                        name: 'Coconut', type: 'consumable', quantity: 1, tile: '🥥', effect: window.ITEM_DATA['🥥'].effect
                    });
                    logMessage("{green:A Coconut falls to the ground! You catch it.}");
                    state.lootedTiles.add(tileId);
                    
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(x, y, "🥥", "#fff");
                    if (typeof renderInventory === 'function') renderInventory();
                    
                    return { inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : state.player.inventory };
                } else {
                    logMessage("{red:A Coconut falls, but your inventory is full!}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                    return null;
                }
            } else {
                logMessage("There are no more coconuts on this tree.");
                return null;
            }
        }
    },
    '🏕️': {
        type: 'ambush_camp',
        flavor: "You stumble into a hidden encampment. It's an ambush!"
    },
    '👻k': {
        type: 'spirit_npc',
        name: 'Echo of the King',
        tile: '👻', 
        requiresItem: 'Spirit Lens', 
        invisibleMessage: "You walk through a patch of unnaturally cold air.",
        dialogue: [
            "You... you can see me?",
            "The Five Thrones were a mistake. We divided the power, and it divided the world.",
            "My knights are gone. My kingdom is ash. Only the Void remains.",
            "Seek the Obelisks to the North, East, West, and South. Restore the key."
        ]
    },
    '👻p': {
        type: 'anomaly',
        name: 'Wandering Echo',
        flavor: "A translucent figure wandering aimlessly in the dark.",
        onInteract: (state, x, y) => {
            const loreLines = [
                "We trusted the Mages. They said the Void would obey us...",
                "The King didn't go mad. He just realized the truth of the universe.",
                "I stood at the gates of the Grand Fortress. The sky bled purple.",
                "Find the Shattered Crown. Do not let the Acolytes reforge it.",
                "It is so cold... why is it so cold?",
                "Do not trust the voices in the deep caverns. They lie."
            ];
            const msg = loreLines[Math.floor(Math.random() * loreLines.length)];
            
            loreTitle.textContent = "Echo of a Fallen Soldier";
            loreContent.textContent = `The ghost looks right through you.\n\n"${msg}"`;
            loreModal.classList.remove('hidden');
            
            chunkManager.setWorldTile(x, y, '.');
            state.mapDirty = true;
            
            logMessage("{purple:The spirit whispers its warning and fades away.}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
            if (typeof grantXp === 'function') grantXp(25);
            
            return null; 
        }
    },
    '♣': {
        type: 'mini_dungeon_entrance',
        theme: 'ROOT',
        name: 'Hollow Root',
        flavor: "A tunnel bores into the massive roots of an ancient tree.",
        tile: '♣'
    },
    '🏝️': {
        type: 'mini_dungeon_entrance',
        theme: 'OASIS',
        name: 'Hidden Oasis',
        flavor: "A cool breeze flows from a cave hidden behind the palms.",
        tile: '🏝️'
    },
    '🧊': {
        type: 'mini_dungeon_entrance',
        theme: 'ICE',
        name: 'Glacial Crevasse',
        flavor: "A narrow crack in the ice leads deep into the glacier.",
        tile: '🧊'
    },
    '🔼': {
        type: 'dungeon_exit', 
        tile: '🔼'
    },
    '⬆️': { type: 'obelisk_puzzle', direction: 'north', flavor: "A freezing cold obelisk stands here.", tile: '|' },
    '➡️': { type: 'obelisk_puzzle', direction: 'east', flavor: "Moss grows on the east side of this stone.", tile: '|' },
    '⬅️': { type: 'obelisk_puzzle', direction: 'west', flavor: "The stone is warm, facing the setting sun.", tile: '|' },
    '⬇️': { type: 'obelisk_puzzle', direction: 'south', flavor: "The stone is scorched and hot.", tile: '|' },
    '🚪': { 
        type: 'sealed_door', 
        name: 'The Vault of the Old King',
        flavor: "A massive stone door with no handle. It has a keyhole.",
        tile: '⛩️' 
    },
    '🚢': {
        type: 'loot_container', 
        name: 'Sunken Shipwreck',
        flavor: "You search the rotting hull for salvaged goods...",
        lootTable: ['$', '🐚', '💎b', '⚓', '🐟'] 
    },
    '🛟': {
        type: 'loot_container',
        name: 'Ocean Flotsam',
        flavor: "Debris from a sunken ship bobs in the waves. You haul it aboard.",
        lootTable: ['🪵', '🪵', '🧵', 'ancient_coin', '♥', '⚓', '🐟']
    },
    '🧙‍♂️': {
        type: 'lore_statue', 
        message: [
            "The hermit's ghost whispers: 'The King didn't find the Void. The Void found him.'",
            "A message is carved into the stone: 'Beware the rain in the deadlands.'"
        ]
    },
    '#': {
        type: 'lore',
        message: 'An ancient, weathered stone stands here. The markings are faded.'
    },
    '☗': {
        type: 'lore',
        message: ['"...the king has fallen..."', '"...his castle to the west lies empty..."', '"...but a dark presence still lingers."']
    },
    '⛰': {
        type: 'dungeon_entrance',
        getCaveId: (x, y) => `cave_${x}_${y}`
    },
    '>': {
        type: 'dungeon_exit'
    },
    '🏰': {
        type: 'castle_entrance',
        getCastleId: (x, y) => `castle_${x}_${y}`
    },
    '🕍': {
        type: 'dark_castle_entrance',
        flavor: "An abandoned fortress, overrun by darkness.",
        getCastleId: (x, y) => `darkcastle_${x}_${y}`
    },
    'X': {
        type: 'castle_exit'
    },
    'B': {
        type: 'lore',
        message: 'This is a bounty board, covered in notices.'
    },
    'L': {
        type: 'journal',
        title: 'The King\'s Lament',
        content: `Day 34 since the fall...\n\nThe stones of this castle weep. I hear them every night. The whispers tell of a power that sleeps beneath the mountains, a power we were foolish to awaken.\n\nMy knights are gone. My kingdom is ash. All that remains is this cursed immortality, a silent witness to my failure.`
    },
    'N': {
        type: 'npc',
        title: 'Villager'
    },
    '§': {
        type: 'shop',
        title: 'General Store'
    },
    'H': {
        type: 'npc_healer',
        title: 'Healer'
    },
    'W': {
        type: 'workbench',
        title: 'Crafting Workbench'
    },
    'G': {
        type: 'npc_guard',
        title: 'Castle Guard'
    },
    '🎖️': {
        type: 'npc_captain',
        title: 'Captain of the Guard',
        flavor: "A grizzled veteran missing an eye."
    },
    'O': {
        type: 'npc_sage',
        title: 'Sage'
    },
    'T': {
        type: 'npc_skill_trainer',
        title: 'Skill Trainer'
    },
    'J': {
        type: 'journal',
        title: 'Orc War-Chant',
        content: `Blood and dust. Steel and bone.\n\nThe weak build with stone. The strong build with fear.\n\nWe come from the fire, we return to the ash. The mountain is our mother, the world our feast. Stomp the soft-skins. Take their steel. Raise the tusk-banner.\n\n...the rest is scrawled in a crude, unintelligible script.`
    },
    '📘': {
        type: 'journal',
        title: 'Frozen Journal',
        content: `Day 12: The cold... it seeps into your bones. But the essence in these walls is worth a fortune. I must have more.\n\nDay 15: I saw one of them today. A... walking corpse, encased in ice. It didn't see me. My pickaxe feels heavy.\n\nDay 17: They are the old ones. The first warriors. The cold preserves them. Binds them. They guard the essence.\n\nDay ???: Can't feel my fingers. It's in my pack. I can't... I...`
    },
    'K': {
        type: 'npc_prospector',
        title: 'Lost Prospector'
    },
    'c': {
        type: 'canoe',
        title: 'A small canoe'
    },
    '♛': {
        type: 'landmark_castle',
        getCastleId: (x, y) => `castle_landmark_${x}_${y}`
    },
    'b': { type: 'enemy' },
    'w': { type: 'enemy' },
    'V': {
        type: 'village_entrance',
        getVillageId: (x, y) => `village_${x}_${y}`
    },
    '⛩️': {
        type: 'shrine'
    },
    '🎓': {
        type: 'npc_historian',
        title: 'Royal Historian'
    },
    '|': {
        type: 'obelisk'
    },
    '¥': {
        type: 'trader'
    },
    '📦': {
        type: 'loot_chest'
    },
    '🔥': {
        type: 'cooking_fire',
        flavor: "A crackling fire. Good for cooking."
    },
    'Ω': {
        type: 'void_rift',
        flavor: "The reality tears open here. You hear whispers from the other side."
    },
    '∴': {
        type: 'dig_spot',
        name: 'Loose Soil',
        flavor: "The earth here looks disturbed recently..."
    },
    '⚰️': {
        type: 'loot_container', 
        name: 'Ancient Grave',
        flavor: "You disturb the resting place of a forgotten warrior...",
        lootTable: ['(', '(', '†', '👢', '🛡️w', '💀',' ancient_coin']
    },
    '🗿': {
        type: 'lore_statue',
        message: [
            "The statue's face is worn away, but it still holds a bowl of fresh water.",
            "A statue of a weeping knight. The inscription reads: 'Duty is heavier than a mountain.'",
            "A crude idol made of mud and sticks. It smells of goblin musk.",
            "A statue of a woman holding a lantern. You feel safer standing near it.",
            "A headless statue pointing toward the eastern mountains.",
            "A statue of a dog. Someone has left a Fossilized Bone at its feet."
        ]
    },
    '🏺': {
        type: 'loot_container',
        name: 'Dusty Urn',
        flavor: "You smash the urn open...",
        lootTable: ['$', '$', 'gold_dust', 'ancient_coin', '💍']
    },
    '🕳️': {
        type: 'underworld_entrance', 
        name: 'Deep Chasm',
        flavor: "A gaping abyss stares back at you. Cold air rushes up from the depths."
    },
    '🪜': {
        type: 'underworld_exit',
        name: 'Climbing Rope',
        flavor: "A rope leading back up to the surface world."
    },
    '🍄': {
        type: 'anomaly',
        name: 'Giant Glowing Mushroom',
        flavor: "It pulses with a strange, bioluminescent light."
    },
    '💎c': {
        type: 'obstacle',
        name: 'Crystal Cluster',
        tool: 'Pickaxe',
        flavor: "A dense cluster of sharp, glowing crystals blocks the path."
    },
    '⛺': {
        type: 'campsite_entrance',
        flavor: "A quiet, safe place to rest your head."
    },
    '📋': {
        type: 'anomaly',
        name: 'Camp Ledger',
        flavor: "A logbook tracking your campsite improvements.",
        onInteract: (state, x, y) => {
            const p = state.player;
            if (!p.campsiteUpgrades) p.campsiteUpgrades = [];
            const upg = p.campsiteUpgrades;

            const countMat = (name) => p.inventory.filter(i => i.name === name && !i.isEquipped).reduce((sum, i) => sum + i.quantity, 0);

            const wood = countMat('Wood Log');
            const stone = countMat('Stone');
            const iron = countMat('Iron Ore');
            const dust = countMat('Void Dust');

            loreTitle.textContent = "Campsite Ledger";
            
            let html = `<p class="text-sm text-gray-300 mb-4 border-b border-gray-700 pb-2">Invest materials to expand your campsite. (Current: ${wood} Wood, ${stone} Stone, ${iron} Iron, ${dust} Void Dust)</p>`;

            const addBtn = (id, name, costStr, canAfford) => {
                const btnClass = canAfford ? 'bg-green-600 hover:bg-green-500' : 'bg-gray-700 opacity-50 cursor-not-allowed';
                html += `<button id="btn_${id}" class="mb-2 ${btnClass} text-white font-bold py-2 px-4 rounded w-full flex justify-between" ${canAfford ? '' : 'disabled'}>
                    <span>Build ${name}</span> <span class="text-xs font-normal">${costStr}</span>
                </button>`;
            };

            if (!upg.includes('stash')) addBtn('stash', 'Stash Box', '10 Wood, 5 Stone', wood >= 10 && stone >= 5);
            if (!upg.includes('workbench')) addBtn('workbench', 'Workbench', '15 Wood, 5 Iron', wood >= 15 && iron >= 5);
            if (!upg.includes('tent')) addBtn('tent', 'Large Tent (Aesthetic)', '20 Wood, 10 Wolf Pelt', wood >= 20 && countMat('Wolf Pelt') >= 10);
            if (!upg.includes('waystone')) addBtn('waystone', 'Leyline Waystone', '10 Void Dust, 500 Gold', dust >= 10 && p.coins >= 500);

            if (upg.length >= 4) html += `<p class="text-green-400 font-bold text-center mt-4">Your camp is fully upgraded!</p>`;

            loreContent.innerHTML = html;
            loreModal.classList.remove('hidden');

            setTimeout(() => {
                const consume = (name, qty) => {
                    let needed = qty;
                    for (let i = p.inventory.length - 1; i >= 0; i--) {
                        if (needed <= 0) break;
                        let item = p.inventory[i];
                        if (item.name === name && !item.isEquipped) {
                            let take = Math.min(item.quantity, needed);
                            item.quantity -= take;
                            needed -= take;
                            if (item.quantity <= 0) p.inventory.splice(i, 1);
                        }
                    }
                };

                const bindUpgrade = (id, reqs, action) => {
                    const btn = document.getElementById(`btn_${id}`);
                    if (btn) btn.onclick = () => {
                        reqs();
                        p.campsiteUpgrades.push(id);
                        action();
                        logMessage(`{green:Campsite upgraded: ${id.toUpperCase()}!}`);
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
                        loreModal.classList.add('hidden');
                        
                        chunkManager.generateCampsite();
                        gameState.mapDirty = true;
                        if (typeof render === 'function') render();
                        
                        if (typeof playerRef !== 'undefined') {
                            playerRef.update({ 
                                campsiteUpgrades: p.campsiteUpgrades, 
                                inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : p.inventory,
                                coins: p.coins
                            });
                        }
                        if (typeof renderInventory === 'function') renderInventory();
                    };
                };

                bindUpgrade('stash', () => { consume('Wood Log', 10); consume('Stone', 5); }, () => {});
                bindUpgrade('workbench', () => { consume('Wood Log', 15); consume('Iron Ore', 5); }, () => {});
                bindUpgrade('tent', () => { consume('Wood Log', 20); consume('Wolf Pelt', 10); }, () => {});
                bindUpgrade('waystone', () => { consume('Void Dust', 10); p.coins -= 500; }, () => {});

            }, 0);

            return null;
        }
    },
    '🏛️': {
        type: 'ruin',
        flavor: "The crumbling remains of an ancient library."
    },
    '🌿': {
        type: 'forage',
        item: 'Medicinal Herb'
    },
    '🕸': {
        type: 'obstacle',
        name: 'Spider Web',
        tool: 'Machete',
        spell: 'fireball', 
        flavor: "A thick, sticky web blocks the path."
    },
    '🛢': {
        type: 'barrel',
        name: 'Oil Barrel',
        flavor: "Filled with volatile oil. Highly flammable."
    },
    '🏚': {
        type: 'obstacle',
        name: 'Cracked Wall',
        tool: 'Pickaxe',
        flavor: "The stone looks fractured and weak."
    },
    '🌳': {
        type: 'obstacle',
        name: 'Thicket',
        tool: 'Machete',
        flavor: "A dense wall of thorny vines."
    },
    '🗺️': {
        type: 'anomaly', 
        name: 'Guild Cartographer',
        flavor: "A scholar buried under piles of parchment.",
        onInteract: (state, x, y) => {
            const explored = state.exploredChunks ? state.exploredChunks.size : 0;
            const claimed = state.player.cartographerProgress || 0;
            const pendingRewards = Math.floor(explored / 50) - claimed;
            
            const loreTitle = document.getElementById('loreTitle');
            const loreContent = document.getElementById('loreContent');
            const loreModal = document.getElementById('loreModal');

            if (loreTitle) loreTitle.textContent = "The Cartographer's Guild";
            if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
            
            if (pendingRewards > 0) {
                if (loreContent) loreContent.innerHTML = `
                    <p>"Incredible! You've mapped ${explored} regions! The Guild owes you handsomely for this data."</p>
                    <button id="claimMapReward" class="mt-4 bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded w-full shadow transition-transform active:scale-95">Claim Reward (${pendingRewards} available)</button>`;
                if (loreModal) loreModal.classList.remove('hidden');
                
                setTimeout(() => {
                    document.getElementById('claimMapReward').onclick = () => {
                        state.player.cartographerProgress = (state.player.cartographerProgress || 0) + 1;
                        state.player.coins += 100;
                        if (typeof grantXp === 'function') grantXp(150);
                        
                        logMessage("{gold:The Cartographer pays you 100 gold and shares worldly secrets! (+150 XP)}");
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playCoin();
                        if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(state.player.x, state.player.y, "+100g", "#facc15");
                        
                        if (loreModal) loreModal.classList.add('hidden');
                        
                        if (typeof playerRef !== 'undefined') {
                            playerRef.update({ 
                                cartographerProgress: state.player.cartographerProgress,
                                coins: state.player.coins
                            });
                        }
                        if (typeof renderStats === 'function') renderStats();
                    };
                }, 0);
            } else {
                const nextGoal = (claimed + 1) * 50;
                if (loreContent) loreContent.innerHTML = `
                    <p>"You have mapped ${explored} regions so far. Outstanding work! Return to me when you've mapped ${nextGoal} regions for your next payment."</p>
                    <button id="closeMapReward" class="mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded w-full shadow transition-transform active:scale-95">"I'll keep exploring."</button>`;
                if (loreModal) loreModal.classList.remove('hidden');
                
                setTimeout(() => {
                    document.getElementById('closeMapReward').onclick = () => {
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
                        if (loreModal) loreModal.classList.add('hidden');
                    }
                }, 0);
            }
            return null; 
        }
    },
    '🍄r': {
        name: 'Fairy Ring',
        type: 'anomaly',
        flavor: "A perfect circle of glowing purple mushrooms.",
        onInteract: (state, x, y) => {
            const tileId = `${x},${-y}`;
            if (state.lootedTiles.has(tileId)) {
                logMessage("The mushrooms have lost their glow.");
                return null;
            }

            logMessage("{purple:You step into the ring. Ethereal music fills your mind!}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(x, y, '#a855f7', 15);
            
            // Restore Magic
            state.player.mana = state.player.maxMana;
            state.player.psyche = state.player.maxPsyche;
            
            if (typeof triggerStatAnimation !== 'undefined') {
                triggerStatAnimation(document.getElementById('manaDisplay'), 'stat-pulse-blue');
                triggerStatAnimation(document.getElementById('psycheDisplay'), 'stat-pulse-purple');
            }
            
            // 10% Trickster Teleport
            if (Math.random() < 0.10) {
                logMessage("{red:The Fae play a trick on you! You are swept away through the leylines!}");
                state.player.x += (Math.floor(Math.random() * 100) - 50);
                state.player.y += (Math.floor(Math.random() * 100) - 50);
            }

            state.lootedTiles.add(tileId);
            return { mana: state.player.mana, psyche: state.player.psyche, x: state.player.x, y: state.player.y };
        }
    },
    '🌺': {
        type: 'anomaly',
        name: 'Moonbloom',
        flavor: "A strange, luminescent plant.",
        onInteract: (state, x, y) => {
            const tileId = `${x},${-y}`;
            if (state.lootedTiles.has(tileId)) {
                logMessage("Only the plucked stem of the Moonbloom remains.");
                return null;
            }
            
            const hour = state.time.hour;
            const isNight = hour >= 20 || hour < 5;
            
            if (!isNight) {
                logMessage("The flower's petals are shut tight like stone. It seems to wait for the moon.");
                return null;
            }

            logMessage("{purple:The Moonbloom is open, bathing the area in pale light! You carefully harvest it.}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(x, y, "🌺", "#f472b6");

            if (state.player.inventory.length < (window.MAX_INVENTORY_SLOTS || 9)) { 
                state.player.inventory.push({
                    name: 'Moonbloom Petal', type: 'consumable', quantity: 1, tile: '🌸',
                    effect: window.ITEM_DATA['🌸'] ? window.ITEM_DATA['🌸'].effect : null
                });
                state.lootedTiles.add(tileId);
                if (typeof renderInventory === 'function') renderInventory();
                return { inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : state.player.inventory, lootedTiles: Object.fromEntries(state.lootedTiles) };
            } else {
                logMessage("{red:Your inventory is full!}");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                return null;
            }
        }
    },
    '☄️': {
        type: 'anomaly',
        name: 'Star-Metal Node',
        flavor: "A chunk of fallen star. It is completely inert during the day.",
        onInteract: (state, x, y) => {
            const tileId = `${x},${-y}`;
            if (state.lootedTiles.has(tileId)) {
                logMessage("You've already chipped away the valuable ore.");
                return null;
            }

            const hour = state.time.hour;
            const isNight = hour >= 20 || hour < 5;
            
            if (!isNight) {
                logMessage("The rock is dull and harder than diamond. You can't even scratch it.");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playAttack('heavy'); 
                return null;
            }

            const hasPickaxe = state.player.inventory.some(i => i.name === 'Pickaxe' || i.name === 'Diamond Tipped Pickaxe');
            if (!hasPickaxe) {
                logMessage("The rock is glowing under the starlight! But you need a Pickaxe to mine it.");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                return null;
            }

            logMessage("{cyan:The starlight softens the rock! You mine a chunk of Star-Metal.}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playHit(); 
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(x, y, '#38bdf8', 10);
            
            state.player.stamina = Math.max(0, state.player.stamina - 3);
            if (typeof triggerStatFlash === 'function') triggerStatFlash(document.getElementById('staminaDisplay'), false);

            if (state.player.inventory.length < (window.MAX_INVENTORY_SLOTS || 9)) {
                state.player.inventory.push({
                    name: 'Star-Metal Ore', type: 'junk', quantity: 1, tile: '☄️'
                });
                state.lootedTiles.add(tileId);
                if (typeof grantXp === 'function') grantXp(50);
                if (typeof renderInventory === 'function') renderInventory();
                return { 
                    inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : state.player.inventory, 
                    lootedTiles: Object.fromEntries(state.lootedTiles),
                    stamina: state.player.stamina
                };
            } else {
                logMessage("{red:Your inventory is full!}");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                return null;
            }
        }
    },
    '🌳e': {
        type: 'anomaly',
        name: 'Elder Tree',
        flavor: "A massive tree with silver bark. It hums with life.",
        onInteract: (state, x, y) => {
            const tileId = `${x},${-y}`;
            if (!state.lootedTiles.has(tileId)) {
                logMessage("You touch the Elder Tree. Warmth flows into you.");
                logMessage("{green:Permanent Effect: +2 Max Health.}");
                
                if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createLevelUp(x, y); 

                state.player.bonusMaxHealth = (state.player.bonusMaxHealth || 0) + 2;
                state.player.maxHealth += 2;
                state.player.health = state.player.maxHealth; 

                if (typeof triggerStatAnimation !== 'undefined') {
                    triggerStatAnimation(document.getElementById('healthDisplay'), 'stat-pulse-green');
                }

                state.lootedTiles.add(tileId);
                return { 
                    maxHealth: state.player.maxHealth, 
                    health: state.player.health, 
                    bonusMaxHealth: state.player.bonusMaxHealth, 
                    lootedTiles: Object.fromEntries(state.lootedTiles) 
                };
            } else {
                logMessage("The Elder Tree stands silent and majestic.");
                return null;
            }
        }
    },
    '🗿k': {
        type: 'anomaly',
        name: 'Petrified Giant',
        flavor: "A boulder shaped like a weeping giant. Moss covers its eyes.",
        onInteract: (state, x, y) => {
            const tileId = `${x},${-y}`;
            if (!state.lootedTiles.has(tileId)) {
                logMessage("You clear the moss from the Giant's eyes.");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();

                if (!state.player.talents) state.player.talents = [];
                if (!state.player.talents.includes('iron_skin')) {
                    state.player.talents.push('iron_skin');
                    logMessage("{green:You gained the Iron Skin talent! (+1 Defense)}");
                } else {
                    logMessage("{gold:You feel a kinship with the stone. (+500 XP)}");
                    if (typeof grantXp === 'function') grantXp(500);
                }
                
                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(x, y, "🛡️", "#9ca3af");

                state.lootedTiles.add(tileId);
                return { talents: state.player.talents, lootedTiles: Object.fromEntries(state.lootedTiles) };
            } else {
                logMessage("The Giant sleeps.");
                return null;
            }
        }
    },
    '🦴d': { 
        type: 'anomaly',
        name: 'Dragon Skeleton',
        flavor: "The bleached ribs of a colossal beast rise from the sand.",
        onInteract: (state, x, y) => {
            const tileId = `${x},${-y}`;
            if (!state.lootedTiles.has(tileId)) {
                logMessage("You search the Dragon's ribs...");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playNoise(0.2, 0.1, 800); 

                if (state.player.inventory.length < (window.MAX_INVENTORY_SLOTS || 9)) { 
                    const loot = typeof generateMagicItem === 'function' ? generateMagicItem(4) : { name: 'Dragonbone', type: 'junk', tile: '🦴', quantity: 1 }; 
                    state.player.inventory.push(loot);
                    logMessage(`{purple:You found a ${loot.name} buried in the sand!}`);
                    
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(x, y, "🦴", "#fff");
                    
                    state.lootedTiles.add(tileId);
                    if (typeof renderInventory === 'function') renderInventory();
                    return { inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : state.player.inventory, lootedTiles: Object.fromEntries(state.lootedTiles) };
                } else {
                    logMessage("{red:You found treasure, but your inventory is full!}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                    return null;
                }
            } else {
                logMessage("Only bleached bones remain.");
                return null;
            }
        }
    }
};

window.CASTLE_LAYOUTS = {
    LIBRARY_WING: {
        spawn: { x: 10, y: 10 },
        map: [
            '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓',
            '▓.........B.........▓',
            '▓.▓▓▓.▓▓▓...▓▓▓.▓▓▓.▓',
            '▓.▓L▓.▓L▓.O.▓L▓.▓L▓.▓', 
            '▓.▓▓▓.▓▓▓...▓▓▓.▓▓▓.▓',
            '▓.........🛏️.........▓',
            '▓.▓▓▓.▓▓▓...▓▓▓.▓▓▓.▓',
            '▓.▓L▓.▓L▓.🎓.▓L▓.▓L▓.▓', 
            '▓.▓▓▓.▓▓▓...▓▓▓.▓▓▓.▓',
            '▓.........W.........▓', 
            '▓...................▓',
            '▓...▓▓▓▓▓▓.X.▓▓▓▓▓▓.▓', 
            '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓'
        ]
    },
    COURTYARD: {
        spawn: { x: 35, y: 33 },
        map: [
            '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓',
            '▓F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F▓',
            '▓...................................B.............................▓',
            '▓.F.F.▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓...▓▓...▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓.F.F▓',
            '▓.....▓.....................▓.......▓.....................▓.......▓',
            '▓.F.F.▓.F.F.F.F.F.F.F.F.F.F.▓.......▓.F.F.F.F.F.F.F.F.F.F.▓.F.F.F.▓',
            '▓.....▓.F.F.F.F.F.F.F.F.F.F.▓.......▓.F.F.F.F.F.F.F.F.F.F.▓.......▓',
            '▓.F.F.▓▓▓▓▓▓▓▓▓▓▓=▓▓▓▓▓▓▓▓▓▓▓=======▓▓▓▓▓▓▓▓▓▓▓=▓▓▓▓▓▓▓▓▓▓▓.F.F.F.▓',
            '▓................=..................=..........=..................▓',
            '▓.F.F.F.F.F.F.F..=..F.F.F.F.F.F.F...=...F.F.F..=..F.F.F.F.F.F.F.F.▓',
            '▓.F.F.F.F.F.F.F..=..F.F.F.F.F.F.F...=...F.F.F..=..F.F.F.F.F.F.F.F.▓',
            '▓................=..................=..........=..................▓',
            '▓.F.F.F.F.F.F.F..=..F.F.F.F.F.F.F...=...F.F.F..=..F.F.F.F.F.F.F.F.▓',
            '▓.F.F.F.F.F.F.F..=..F.F.F.F.F.F.F...=...F.F.F..=..F.F.F.F.F.F.F.F.▓',
            '▓................=..................=..........=..................▓',
            '▓.F.F.F.F.F.F.F..=..F.F.F.F.F.F.F...=...F.F.F..=..F.F.F.F.F.F.F.F.▓',
            '▓.F.F.F.F.F.F.F..=..F.F.F.F.F.F.F...=...F.F.F..=..F.F.F.F.F.F.F.F.▓',
            '▓................=..................=..........=..................▓',
            '▓.F.F.F.F.F.F.F..=..F.F.F.F.F.F.F...=...F.F.F..=..F.F.F.F.F.F.F.F.▓',
            '▓.F.F.F.F.F.F.F..=..F.F.F.F.F.F.F...=...F.F.F..=..F.F.F.F.F.F.F.F.▓',
            '▓................=..................=..........=..................▓',
            '▓.F.F.F.F.F.F.F..=..F.F.F.F.F.F.F...=...F.F.F..=..F.F.F.F.F.F.F.F.▓',
            '▓.F.F.F.F.F.F.F..=..F.F.F.F.F.F.F...=...F.F.F..=..F.F.F.F.F.F.F.F.▓',
            '▓................=..................=..........=..................▓',
            '▓.F.F.F.F.F.F.F..=..F.F.F.F.F.F.F...=...F.F.F..=..F.F.F.F.F.F.F.F.▓',
            '▓.F.F.F.F.F.F.F..=..F.F.F.F.F.F.F...=...F.F.F..=..F.F.F.F.F.F.F.F.▓',
            '▓................====================..........=..................▓',
            '▓.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F..=..F.F.F.F.F.F.F.F.▓',
            '▓.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F..=..F.F.F.F.F.F.F.F.▓',
            '▓..............................................=..................▓',
            '▓.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F..=..F.F.F.F.F.F.F.F.▓',
            '▓.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F..=..F.F.F.F.F.F.F.F.▓',
            '▓..............................................=..................▓',
            '▓.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F..=..F.F.F.F.F.F.F.F.▓',
            '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓X▓▓▓▓▓▓▓▓▓▓▓=▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓', 
        ]
    },

    TOWER: {
        spawn: { x: 10, y: 14 }, 
        map: [
            '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓',
            '▓......▓▓▓▓▓▓▓......▓',
            '▓....▓▓▓.....▓▓▓....▓',
            '▓...▓▓....🛏️....▓▓...▓',
            '▓..▓▓...🎓.......▓▓..▓',
            '▓.▓▓......O.......▓▓.▓',
            '▓.▓.......📖.......▓.▓',
            '▓▓▓...T.......L...▓▓▓',
            '▓▓........⛲........▓▓',
            '▓▓▓...............▓▓▓',
            '▓.▓.......W.......▓.▓',
            '▓.▓▓.............▓▓.▓',
            '▓..▓▓...........▓▓..▓',
            '▓...▓▓.........▓▓...▓',
            '▓....▓▓▓.....▓▓▓....▓',
            '▓......▓▓▓▓▓▓▓......▓',
            '▓.........X.........▓',
            '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓'
        ]
    },

    FORTRESS: {
        spawn: { x: 15, y: 38 },
        map: [
            '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓',
            '▓...............................................................................▓',
            '▓...▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓...▓',
            '▓...▓.......................................................................▓...▓',
            '▓...▓...▓▓▓▓▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓...▓...▓...▓',
            '▓...▓...▓..........▓...▓.........................................▓...▓...▓...▓',
            '▓...▓...▓..........▓...▓...▓▓▓▓▓▓▓...▓▓▓▓▓...▓▓▓▓▓▓▓...▓▓▓▓▓...▓...▓...▓...▓',
            '▓...▓...▓..........▓...▓...▓......▓...▓...▓...▓......▓...▓...▓...▓...▓...▓...▓',
            '▓...▓...▓..........▓...▓...▓......▓...▓...▓...▓......▓...▓...▓...▓...▓...▓...▓',
            '▓...▓...▓..........▓...▓...▓▓▓▓▓▓▓...▓▓▓▓▓...▓▓▓▓▓▓▓...▓...▓...▓...▓...▓...▓',
            '▓...▓...▓..........▓...▓.........................................▓...▓...▓...▓',
            '▓...▓...▓..........▓...▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓...▓...▓...▓',
            '▓...▓...▓..........▓...................................................▓...▓...▓',
            '▓...▓...▓..........▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓...▓...▓',
            '▓...▓...▓.......................................................................▓...▓',
            '▓...▓...▓.......................................................................▓...▓',
            '▓...▓...▓.......................................................................▓...▓',
            '▓...▓...▓▓▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓...▓',
            '▓...▓.............▓...▓.........▓...▓.........▓...▓.........▓...▓.........▓...▓',
            '▓...▓.............▓...▓.........▓...▓.........▓...▓.........▓...▓.........▓...▓',
            '▓...▓.............▓...▓.........▓...▓.........▓...▓.........▓...▓.........▓...▓',
            '▓...▓.............▓...▓.........▓...▓.........▓...▓.........▓...▓.........▓...▓',
            '▓...▓.............▓...▓.........▓...▓.........▓...▓.........▓...▓.........▓...▓',
            '▓...▓.............▓...▓.........▓...▓.........▓...▓.........▓...▓.........▓...▓',
            '▓...▓.............▓...▓.........▓...▓.........▓...▓.........▓...▓.........▓...▓',
            '▓...▓.............▓...▓.........▓...▓.........▓...▓.........▓...▓.........▓...▓',
            '▓...▓▓▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓...▓',
            '▓...............................................................................▓',
            '▓...............................................................................▓',
            '▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓',
            '▓...▓.......▓...▓.......▓...▓.......▓...▓.......▓...▓.......▓...▓.......▓...▓',
            '▓...▓...B...▓...▓.......▓...▓.......▓...▓.......▓...▓...$.....▓...▓...$.....▓...▓',
            '▓...▓.......▓...▓.......▓...▓.......▓...▓.......▓...▓.......▓...▓.......▓...▓',
            '▓...▓.......▓...▓.......▓...▓.......▓...▓.......▓...▓.......▓...▓.......▓...▓',
            '▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓',
            '▓...............................................................................▓',
            '▓...............T.....................................................🎖️.........▓',
            '▓▓▓▓...▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓...▓',
            '▓....X..........................................................................▓',
            '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓...▓',
            '▓...............▓$▓...............▓.............................................▓',
            '▓....W..........▓$▓....W..........▓.............................................▓',
            '▓...............▓$▓...............▓.............................................▓',
            '▓...............▓▓▓...............▓.............................................▓',
            '▓.................................▓.............................................▓',
            '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓'
        ]
    },

    GRAND_FORTRESS: {
        spawn: { x: 15, y: 38 },  
        map: [
            '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓',
            '▓...............................................................................▓',
            '▓...▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓...▓',
            '▓...▓.......................................................................▓...▓',
            '▓...▓...▓▓▓▓▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓...▓...▓...▓',
            '▓...▓...▓..........▓...▓.........................................▓...▓...▓...▓',
            '▓...▓...▓..........▓...▓...▓▓▓▓▓▓▓...▓▓▓▓▓...▓▓▓▓▓▓▓...▓▓▓▓▓...▓...▓...▓...▓',
            '▓...▓...▓..........▓...▓...▓......▓...▓...▓...▓......▓...▓...▓...▓...▓...▓...▓',
            '▓...▓...▓..........▓...▓...▓..🧙...▓...▓...▓...▓..O...▓...▓...▓...▓...▓...▓...▓',
            '▓...▓...▓..........▓...▓...▓▓▓..▓▓▓...▓▓▓▓▓...▓▓▓..▓▓▓...▓...▓...▓...▓...▓...▓',
            '▓...▓...▓..........▓...▓........=..................=.............▓...▓...▓...▓',
            '▓...▓...▓..........▓...▓▓▓▓▓▓▓==▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓==▓▓▓▓▓▓▓▓▓▓▓▓▓...▓...▓...▓',
            '▓...▓...▓..........▓..........==...................==................▓...▓...▓',
            '▓...▓...▓..........▓▓▓▓▓▓▓▓▓▓▓==▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓==▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓...▓...▓',
            '▓...▓...▓.....................==...................==...................▓...▓',
            '▓...▓...▓..................▓▓▓==▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓==▓▓▓.................▓...▓',
            '▓...▓...▓..................▓..==.....B.........▓...==..▓.................▓...▓',
            '▓...▓...▓▓▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓.==▓▓▓...▓.........▓..==...▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓...▓',
            '▓...▓.............▓...▓.......==..▓...▓.▓...▓.......▓.......▓...▓.........▓...▓',
            '▓...▓.............▓...▓.......==..▓...▓▓▓...▓.......▓..O....▓...▓.........▓...▓',
            '▓...▓.............▓...▓.......==..▓...▓.▓...▓.......▓.......▓...▓.........▓...▓',
            '▓...▓.............▓...▓.......==..▓...▓.▓...▓...▓▓▓▓▓▓▓▓▓...▓...▓.........▓...▓',
            '▓...▓.............▓...▓.......==..▓...▓.▓...▓...▓.....j.▓...▓...▓.........▓...▓',
            '▓...▓.............▓...▓.......==..▓...▓.▓...▓...▓...💪....▓...▓...▓.........▓...▓',
            '▓...▓.............▓...▓.......==..▓...▓.▓...▓...▓.......▓...▓...▓.........▓...▓',
            '▓...▓.............▓...▓.......==..▓...▓.▓...▓...▓▓▓▓▓▓▓▓▓...▓...▓.........▓...▓',
            '▓...▓▓▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓==▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓...▓',
            '▓...............................==..............................................▓',
            '▓.......................▓▓▓▓▓▓▓▓==▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓...............................▓',
            '▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓...==..$.......▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓...▓',
            '▓...▓.......▓...▓.......▓...▓...==..$...$...▓...▓.......▓...▓.......▓...▓...▓',
            '▓...▓...B...▓...▓.......▓...▓...==..B...$...▓...▓.......▓...▓.......▓...▓...▓',
            '▓...▓.......▓...▓.......▓...▓.......▓...▓.......▓...▓.......▓...▓.......▓...▓',
            '▓...▓.......▓...▓.......▓...▓...==..$.......▓...▓.......▓...▓.......▓...▓...▓',
            '▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓==▓▓▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓...▓',
            '▓...............................==...............🎖️...G..........................▓',
            '▓...............T...............==....................................G.........▓',
            '▓▓▓▓...▓▓▓▓▓▓▓▓▓▓▓▓▓.▓▓▓▓▓▓▓▓▓▓▓==▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓...▓',
            '▓....X..........................==..............................................▓', 
            '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓==▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓...▓',
            '▓...............▓$▓.............==▓.............................................▓',
            '▓....W..........▓$▓....W........==▓.............................................▓',
            '▓...............▓$▓.............==▓.............................................▓',
            '▓...............▓▓▓.............==▓.............................................▓',
            '▓...............................==..............................................▓',
            '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓'
        ]

    },

    SAFE_HAVEN: {
        spawn: { x: 13, y: 11 },
        map: [
            'FFFFFFFFFFFFFFFFFFFFFFFFFFF',
            'FFFFFFFFFFFFFFFFFFFFFFFFFFF',
            'FF🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱FF',
            'FF🧱..🛏️....⛲...⚒️.✝️..🧱FF', 
            'FF🧱.🧱🧱🧱.===.🧱🧱🧱.🧱FF',
            'FF🧱.🧱H+..===..+§🧱.🧱FF',
            'FF🧱.🧱🧱🧱.===.🧱🧱🧱.🧱FF',
            'FF🧱........===......🗺️.🧱FF', 
            'FF🧱.🧱🧱🧱.===.🧱🧱🧱.🧱FF',
            'FF🧱.🧱T+..===..+🎓🧱.🧱FF',
            'FF🧱.🧱🧱🧱.===.🧱🧱🧱.🧱FF',
            'FF🧱........===........🧱FF',
            'FF🧱🧱🧱🧱🧱.X.🧱🧱🧱🧱🧱FF',
            'FFFFFFFFFF...FFFFFFFFFFFFFF',
            'FFFFFFFFFF...FFFFFFFFFFFFFF'
        ]
    },

};

window.CAVE_THEMES = {
    FUNGAL: {
        name: 'The Mycelium Depths',
        wall: '▓', floor: '.', secretWall: '▒',
        colors: { wall: '#4a1d96', floor: '#7e22ce' },
        decorations: ['🍄', '🍄', '🌿', '🏺', 'S'], 
        enemies: ['@', 'l', 's'] 
    },
    GOLDEN: {
        name: 'The Glimmering Vault',
        wall: '🧱', floor: '.', secretWall: '▒',
        colors: { wall: '#ca8a04', floor: '#facc15' },
        decorations: ['$', '$', '🏺', '👑', '📦'], 
        enemies: ['m', 'o', 'C'] 
    },
    CORRUPTED: {
        name: 'The Abyssal Tear',
        wall: '▓', floor: '.', phaseWall: '▒',
        colors: { wall: '#000000', floor: '#1e1b4b' },
        decorations: ['✨', '💀', 'vd', 'Ω'],
        enemies: ['v', '😈d', 'a']
    },
    ROCK: {
        name: 'A Dark Cave',
        wall: '▓', floor: '.', secretWall: '▒',
        colors: { wall: '#422006', floor: '#a16207' },
        decorations: ['♥', '🔮', '$', '📖', 'K', '🏚'],
        enemies: ['g', 's', '@']
    },
    ICE: {
        name: 'A Glacial Cavern',
        wall: '▒', secretWall: '▓', floor: '.',
        colors: { wall: '#99f6e4', floor: '#e0f2fe' },
        enemies: ['s', 'w', 'Z', 'Y']
    },
    FIRE: {
        name: 'A Volcanic Fissure',
        wall: '▓', secretWall: '▒', floor: '.', 
        colors: { wall: '#450a0a', floor: '#ef4444' },
        decorations: ['♥', '$', '🔥', 'J'],
        enemies: ['b', 'C', 'o', 'm', 'f']
    },
    CRYPT: {
        name: 'A Musty Crypt',
        wall: '▓', floor: '.', secretWall: '▒',
        colors: { wall: '#374151', floor: '#4b5563' },
        decorations: ['♥', '$', '(', '†', '🌀', '😱', '💀', '🕸', '⚰️'],
        enemies: ['s', 'Z', 'a']
    },
    CRYSTAL: {
        name: 'A Crystalline Tunnel',
        wall: '▒', secretWall: '▓', floor: '.',
        colors: { wall: '#67e8f9', floor: '#22d3ee' },
        decorations: ['💜', '🔮', '$', 'K'],
        enemies: ['g', '🧌']
    },
    VOID: {
        name: 'The Void Sanctum',
        wall: '▓', floor: '.', phaseWall: '▒',    
        colors: { wall: '#2e0249', floor: '#0f0518' },
        decorations: ['✨', '💀', 'Ω'],
        enemies: ['v', 'a', 'm', 'v', '😈d']
    },
    ABYSS: {
        name: 'The Maw',
        wall: '▓', floor: '.', secretWall: '▒',
        colors: { wall: '#0f0f0f', floor: '#331133' },
        decorations: ['💀', '🕸️', '🔥', 'Ω', '💎', '🕸'],
        enemies: ['o', 'm', 'Z', 'g', '🐺', '🦂', 'a', '👾'] 
    },
    SUNKEN: {
        name: 'The Sunken Temple',
        wall: '🧱', floor: '.', secretWall: '▒',
        colors: { wall: '#0e7490', floor: '#1e3a8a' },
        decorations: ['🐟', '🌿', '🗿'],
        enemies: ['🐸', '🐍', 'l', '🐉h']
    },
    GROTTO: {
        name: 'A Sunken Grotto',
        wall: '▓', floor: '.', secretWall: '▒',
        colors: { wall: '#14532d', floor: '#16a34a' },
        decorations: ['♥', 'S', '🔮', '☣️', '🕸'], 
        enemies: ['g', 'w', '@']
    },
    RUIN: {
        name: 'A Forgotten Ruin',
        wall: '🧱', floor: '.', secretWall: '▒',
        colors: { wall: '#44403c', floor: '#292524' },
        decorations: ['♥', '$', '🏺', '📜l', '🕸'],
        enemies: ['s', 'Z', 'b']
    },
    OVERGROWN: {
        name: 'An Overgrown Passage',
        wall: '▓', floor: 'F', secretWall: '▒',
        colors: { wall: '#14532d', floor: '#166534' },
        decorations: ['🌿', '🍄', '🌳e'],
        enemies: ['@', '🐍', '🐸']
    }
};

window.CAVE_ROOM_TEMPLATES = {
    "The Alchemist's Lab": {
        width: 7, height: 5,
        map: [' WWWWW ', 'W🧪.🧪W', 'W..W..W', 'W.🧪.🧪W', ' WWWWW ']
    },
    "Void Observation Deck": {
        width: 9, height: 5,
        map: [' WWWWWWW ', 'W.......W', 'W..Ω.Ω..W', 'W.......W', ' WWWWWWW ']
    },
    "Goblin Barracks": {
        width: 7, height: 7,
        map: [' WWWWW ', 'W.....W', 'W.g.g.W', 'W..📕..W', 'W.g.g.W', 'W.....W', ' WWWWW ']
    },
    "Skeleton Crypt": {
        width: 9, height: 7,
        map: [' WWWWWWW ', 'WW.....WW', 'W...s...W', 'W..s⚰️s..W', 'W...s...W', 'WW.....WW', ' WWWWWWW ']
    },
    "Orc Stash": {
        width: 5, height: 5,
        map: ['WWWWW', 'W.J.W', 'W.♥o.W', 'W.📗.W', 'WWWWW']
    },
    "Treasure Nook": {
        width: 3, height: 3,
        map: ['W★W', '$ $', 'W☆W']
    },
    "Flooded Grotto": {
        width: 9, height: 7,
        map: [' WWWWWWW ', 'W~~~~~~~W', 'W~W...W~W', 'W~W.S.W~W', 'W~W...W~W', 'W~~~~~~~W', ' WWWWWWW ']
    },
    "Bandit Stash": {
        width: 7, height: 7,
        map: [' WWWWW ', 'W.b.b.W', 'W.<q<.W', 'W..C..W', 'W.$.$.W', 'W.<...W', ' WWWWW ']
    },
    "Abandoned Camp": {
        width: 5, height: 5,
        map: ['WWWWW', 'W...W', 'W.J.W', 'W.+📄.W', 'WWWWW']
    },
    "Acolyte's Nook": {
        width: 5, height: 5,
        map: ['WWWWW', 'W...W', 'W.a.W', 'W.j.W', 'WWWWW']
    },
    "Champion's Crypt": {
        width: 7, height: 7,
        map: [' WWWWW ', 'W.<.<.W', 'W.....W', 'W..s..W', 'W..💪..W', 'W.<.<.W', ' WWWWW ']
    },
    "The Spider's Nest": {
        width: 7, height: 7,
        map: [' WWWWW ', 'W.🕸️.🕸️.W', 'W🕸️.@.🕸️W', 'W..🦴..W', 'W🕸️.@.🕸️W', 'W.🕸️.🕸️.W', ' WWWWW ']
    },
    "Cultist Summoning Circle": {
        width: 9, height: 7,
        map: [' WWWWWWW ', 'W.......W', 'W..c.c..W', 'W.c.Ω.c.W', 'W...z...W', 'W.......W', ' WWWWWWW ']
    },
    "The Dragon's Hoard": {
        width: 9, height: 6,
        map: [' WWWWWWW ', 'W.$$$$.$W', 'W$🐲$$📦$W', 'W.$$$$.$W', 'W.......W', ' WWWWWWW ']
    },
    "Forgotten Armory": {
        width: 7, height: 5,
        map: [' WWWWW ', 'W.....W', 'W.⚔️.🛡️.W', 'W.....W', ' WWWWW ']
    },
    "Torture Chamber": {
        width: 7, height: 7,
        map: [' WWWWW ', 'W.⛓️.⛓️.W', 'W..s..W', 'W.Z.Z.W', 'W..s..W', 'W.⛓️.⛓️.W', ' WWWWW ']
    },
    "Ritual Dais": {
        width: 9, height: 7,
        map: [' WWWWWWW ', 'WW.....WW', 'W..🔥.🔥..W', 'W...a...W', 'W..🔥.🔥..W', 'WW.....WW', ' WWWWWWW ']
    },
    "Mushroom Grotto": {
        width: 7, height: 7,
        map: [' WWWWW ', 'W.🍄.🍄.W', 'W.....W', 'W🍄.🌿.🍄W', 'W.....W', 'W.🍄.🍄.W', ' WWWWW ']
    },
    "The Obelisk Chamber": {
        width: 7, height: 7,
        map: [' WWWWW ', 'W.....W', 'W..|..W', 'W.|#|.W', 'W..|..W', 'W.....W', ' WWWWW ']
    },
    "Miner's Folly": {
        width: 7, height: 5,
        map: [' WWWWW ', 'W⛏️.🦴.W', 'W.....W', 'W.⛺.K.W', ' WWWWW ']
    },
    "Lava Vent": {
        width: 7, height: 7,
        map: [' WWWWW ', 'W..~..W', 'W.~~~.W', 'W~🔥~.W', 'W.~~~.W', 'W..~..W', ' WWWWW ']
    }
};

window.ATMOSPHERE_TEXT = {
    NIGHT: [
        "The stars are uncaringly bright tonight.",
        "A distant wolf howl shivers through the air.",
        "The darkness feels heavy, like a physical weight.",
        "You hear something chittering in the dark.",
        "The moon casts long, twisted shadows.",
        "A sudden drop in temperature makes you shiver.",
        "Something large moves just beyond the edge of your vision."
    ],
    DAWN: [
        "The first light of dawn paints the horizon gold.",
        "Dew glistens on the ground.",
        "The world wakes up. Birds begin to sing.",
        "A cold morning mist clings to the ground.",
        "The shadows retreat as the sun begins its climb."
    ],
    STORM: [
        "Thunder rattles your teeth.",
        "The wind screams like a banshee.",
        "Lightning illuminates the landscape in a stark flash.",
        "The rain is torrential. It's hard to see.",
        "The smell of ozone is thick in the air."
    ],
    FOREST: [
        "The trees seem to lean in as you pass.",
        "You spot scratch marks on a trunk. Too big for a bear.",
        "The smell of pine and rotting leaves is thick.",
        "Was that a face in the bark? No, just a knot.",
        "A sudden rustle in the bushes makes you freeze.",
        "Sunlight filters through the canopy in dusty shafts.",
        "You step on a dry branch. It sounds as loud as a thunderclap."
    ],
    DESERT: [
        "The heat rising from the sand distorts the air.",
        "Your throat feels dry just looking at the dunes.",
        "The wind shifts the sand, erasing your footprints.",
        "Bleached bones poke out from a dune.",
        "You spot a shimmering mirage on the horizon.",
        "The silence of the desert is absolute.",
        "A scuttling sound comes from beneath the sand."
    ],
    MOUNTAIN: [
        "The air is thin and sharp here.",
        "Loose gravel clatters down the cliffside.",
        "You feel vertiginous looking down.",
        "The wind howls through the crags.",
        "You find a massive, three-toed footprint in the snow.",
        "Clouds obscure the peaks above you.",
        "A distant rumble warns of falling rock."
    ],
    SWAMP: [
        "Bubbles rise from the muck with a foul smell.",
        "Insects swarm around your head.",
        "The ground feels spongy and unstable.",
        "You see ripples in the water. Something is moving.",
        "A strange, glowing light bobs over the water nearby.",
        "The trees here are draped in grey, weeping moss.",
        "You pull your boot out of the mud with a loud squelch."
    ],
    RUIN: [
        "The stones here tell a story of violence and forgotten ages.",
        "You hear a faint scratching sound from behind the wall.",
        "The air smells of ancient dust and copper.",
        "A cold draft whistles through the crumbling masonry."
    ]
};
