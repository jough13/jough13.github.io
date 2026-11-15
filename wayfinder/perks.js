// --- START OF FILE perks.js ---

const PERKS_DATABASE = {
    // ==========================================
    // --- INDUSTRIAL ---
    // ==========================================
    DEEP_CORE_MINING: {
        id: "DEEP_CORE_MINING",
        name: "Deep Core Mining",
        description: "Asteroid mining yields +3 additional resources per attempt.",
        icon: "⛏️",
        category: "Industrial"
    },
    EFFICIENT_THRUSTERS: {
        id: "EFFICIENT_THRUSTERS",
        name: "Fusion Injectors",
        description: "Movement fuel cost reduced by 20%.",
        icon: "🚀",
        category: "Industrial"
    },
    DIMENSIONAL_POCKETS: {
        id: "DIMENSIONAL_POCKETS",
        name: "Subspace Cargo Webbing",
        description: "Optimizes structural bulkheads, permanently granting +25 Cargo Capacity and +40 Max Fuel.",
        icon: "🧰",
        category: "Industrial"
    },
    DRONE_COMMANDER: {
        id: "DRONE_COMMANDER",
        name: "Drone Telemetry Link",
        description: "Automated Mining Drones and Combat Swarm Drones have a 50% chance to be recalled to your hold instead of being consumed.",
        icon: "🛸",
        category: "Industrial"
    },
    
    // ==========================================
    // --- COMBAT ---
    // ==========================================
    WEAPON_OVERCLOCK: {
        id: "WEAPON_OVERCLOCK",
        name: "Weapon Overclock",
        description: "All ship weapons deal +15% damage.",
        icon: "⚔️",
        category: "Combat"
    },
    SHIELD_HARMONICS: {
        id: "SHIELD_HARMONICS",
        name: "Shield Harmonics",
        description: "Shields regenerate +50% faster outside of combat and resist Nebula Ion Storms.",
        icon: "🛡️",
        category: "Combat"
    },
    OVERCHARGED_CAPACITORS: {
        id: "OVERCHARGED_CAPACITORS",
        name: "Overcharged Capacitors",
        description: "Redirects auxiliary reactor output to defensive grids, granting +30 Max Shields and +8% Evasion.",
        icon: "⚡",
        category: "Combat"
    },
    TACTICAL_OVERDRIVE: {
        id: "TACTICAL_OVERDRIVE",
        name: "Tactical Overdrive",
        description: "Grants +10% Weapon Accuracy and causes ship special abilities to recharge twice as fast in combat.",
        icon: "🎯",
        category: "Combat"
    },
    ORDNANCE_FABRICATOR: {
        id: "ORDNANCE_FABRICATOR",
        name: "Auto-Munitions Forge",
        description: "Onboard micro-lathes passively fabricate +1 weapon ammunition every 10 movement steps and grant +4 Base Damage.",
        icon: "🧨",
        category: "Combat"
    },
    
    // ==========================================
    // --- TRADE & SOCIAL ---
    // ==========================================
    SILVER_TONGUE: {
        id: "SILVER_TONGUE",
        name: "Silver Tongue",
        description: "Buy items for 10% less, sell for 10% more, and unlock 50% Security Office warrant bribes.",
        icon: "💰",
        category: "Trade"
    },
    SCAVENGER_PROTOCOL: {
        id: "SCAVENGER_PROTOCOL",
        name: "Scavenger Protocol",
        description: "Derelicts, Anomalies, Signal Sources, and Outpost Raids yield double credits and salvage.",
        icon: "📦",
        category: "Trade"
    },
    COLONY_ARCHITECT: {
        id: "COLONY_ARCHITECT",
        name: "Pioneer Architect",
        description: "Doubles colony building construction speed and increases colony tax revenue by +15% per Stardate.",
        icon: "🏛️",
        category: "Trade"
    },
    BLACK_MARKET_BARON: {
        id: "BLACK_MARKET_BARON",
        name: "Syndicate Kingpin",
        description: "Shadow Brokers pay +25% more for contraband and grant +2 Eclipse Cartel reputation whenever you fence illegal goods.",
        icon: "👑",
        category: "Trade"
    },
    SMOOTH_TALKER: {
        id: "SMOOTH_TALKER",
        name: "Smooth Talker",
        description: "You know exactly what to say to Concord Customs. If caught with contraband, your credit fine is reduced by 50%.",
        icon: "🗣️",
        category: "Social"
    },
    SHADOW_TRANSPONDER: {
        id: "SHADOW_TRANSPONDER",
        name: "Ghost Transponder",
        description: "Spoofs your hull registry. Reduces radar signature by 35% during Customs scans and decays Notoriety twice as fast.",
        icon: "🕶️",
        category: "Social"
    },
    SMUGGLERS_LUCK: {
        id: "SMUGGLERS_LUCK",
        name: "Smuggler's Luck",
        description: "Concord Customs scans have a flat 25% chance to 'glitch' and find nothing, even if contraband is exposed.",
        icon: "🎲",
        category: "Social"
    },

    // ==========================================
    // --- EXPLORATION & SCIENCE ---
    // ==========================================
    XENO_BIOLOGIST: {
        id: "XENO_BIOLOGIST",
        name: "Xeno-Biologist",
        description: "Planetary biological scans and bio-world surface expeditions award double XP.",
        icon: "🧬",
        category: "Science"
    },
    LONG_RANGE_SENSORS: {
        id: "LONG_RANGE_SENSORS",
        name: "Telemetry Array",
        description: "80% faster mining/scooping, 10-tile Sensor Pings (P), unlocks NPC Cargo Scans, Tractor Beam combat salvage, and USS alerts.",
        icon: "📡",
        category: "Science"
    },
    ASTROMETRIC_SAVANT: {
        id: "ASTROMETRIC_SAVANT",
        name: "Astrometric Savant",
        description: "Deep-Sky Observatory plates (O) award double XP and have a 50% chance to resolve a bonus Planetary Data cartridge.",
        icon: "🔭",
        category: "Science"
    },
    CYBER_SLICER: {
        id: "CYBER_SLICER",
        name: "Cyber Slicer",
        description: "Decrypt Encrypted Engrams, Data Caches, and Ancient Archives for free at Cryptarchs or directly from your Cargo Hold (I).",
        icon: "💻",
        category: "Exploration"
    },
    VOID_DIVER: {
        id: "VOID_DIVER",
        name: "Void Diver",
        description: "25% Engram chance on Stellar Deep Scans (V), immunity to Black Hole pull (slingshot boost), and safe Warzone crystal harvesting.",
        icon: "🌌",
        category: "Exploration"
    },
    STELLAR_CARTOGRAPHER: {
        id: "STELLAR_CARTOGRAPHER",
        name: "Stellar Cartographer",
        description: "Passively records astrometric telemetry while flying (+2 XP per move) and grants +50 bonus XP when discovering new sectors.",
        icon: "🗺️",
        category: "Exploration"
    },
    HYPER_LANE_MAPPER: {
        id: "HYPER_LANE_MAPPER",
        name: "Hyper-Lane Mapper",
        description: "Wormhole jumps cost 50% less fuel and never cause structural hull damage.",
        icon: "🌀",
        category: "Exploration"
    },
    QUANTUM_NAVIGATOR: {
        id: "QUANTUM_NAVIGATOR",
        name: "Corona Skimmer",
        description: "Fuel scooping yields +25% extra hydrogen and flushes 2 Stealth Heat. Silent Running (Q) generates 30% less heat.",
        icon: "☀️",
        category: "Exploration"
    },

    // ==========================================
    // --- SURVIVAL ---
    // ==========================================
    HEALTH_PHYSICIST: {
        id: "HEALTH_PHYSICIST",
        name: "Health Physicist",
        description: "Your background in radiological affairs allows you to perfectly calibrate your ship's shielding. Zero hull or fuel loss from O/B-class stars, Irradiated Worlds, and Radiation Belts.",
        icon: "☢️",
        category: "Survival"
    },
    SCRAP_WELDER: {
        id: "SCRAP_WELDER",
        name: "Scrap Welder",
        description: "You've learned to efficiently patch your hull using raw ore. Successfully mining an asteroid instantly restores 5 Hull Integrity.",
        icon: "🔧",
        category: "Survival"
    },
    NANO_HULL_WEAVE: {
        id: "NANO_HULL_WEAVE",
        name: "Nano-Reactive Hull",
        description: "Integrates self-healing smart-matter into your bulkhead, granting +35 Max Hull and regenerating 1 Hull every 5 moves.",
        icon: "🩹",
        category: "Survival"
    },
    EMERGENCY_BULKHEADS: {
        id: "EMERGENCY_BULKHEADS",
        name: "Reinforced Bulkheads",
        description: "Internal honeycombed tritanium ribs grant +20 Max Hull and reduce all incoming hull damage by 15%.",
        icon: "🛡️",
        category: "Survival"
    }
};

// --- PERFORMANCE OPTIMIZATION ---
// Freezing the dictionary tells the V8 JavaScript engine that this object will never 
// be modified at runtime, allowing it to optimize memory lookup speeds.
Object.freeze(PERKS_DATABASE);

// Expose globally for safe access across all modules
window.PERKS_DATABASE = PERKS_DATABASE;
if (typeof GameRegistry !== 'undefined') {
    GameRegistry.perks = PERKS_DATABASE;
}

// Universal helper to check if the player owns a perk (safe across Set and Array save formats)
function hasPlayerPerk(perkId) {
    if (typeof playerPerks === 'undefined' || !playerPerks) return false;
    if (typeof playerPerks.has === 'function') return playerPerks.has(perkId);
    if (Array.isArray(playerPerks)) return playerPerks.includes(perkId);
    return false;
}
window.hasPlayerPerk = hasPlayerPerk;

// ==========================================
// --- SELF-CONTAINED PERK & ITEM HOOKS ---
// ==========================================

(function initPerkSystems() {
    // 1. FIELD DECRYPTION FOR ENCRYPTED ITEMS & PRECURSOR CIPHERS
    function executeFieldDecryption(itemId, forcedCipher = false) {
        if (typeof playerCargo === 'undefined') return false;

        const hasSlicer = hasPlayerPerk('CYBER_SLICER');
        const hasCipher = (playerCargo['PRECURSOR_CIPHER'] || 0) > 0;

        if (!hasSlicer && !hasCipher && !forcedCipher) {
            if (typeof showToast === 'function') showToast("Requires Cyber Slicer or Precursor Cipher", "error");
            if (typeof soundManager !== 'undefined') soundManager.playError();
            if (typeof logMessage === 'function') {
                logMessage("<span style='color:var(--danger)'>[ DECRYPTION FAILED ] Field decryption requires the Cyber Slicer perk or a Precursor Cipher in your hold.</span>");
            }
            return false;
        }

        // Consume Cipher if the player doesn't have Cyber Slicer (and wasn't already triggered via PRECURSOR_CIPHER.onUse)
        if (!hasSlicer && !forcedCipher) {
            playerCargo['PRECURSOR_CIPHER'] -= 1;
            if (playerCargo['PRECURSOR_CIPHER'] <= 0) delete playerCargo['PRECURSOR_CIPHER'];
            if (typeof logMessage === 'function') {
                logMessage("<span style='color:var(--warning)'>[ FIELD DECRYPTION ] 1x Precursor Cipher consumed to collapse quantum encryption.</span>");
            }
        } else if (hasSlicer) {
            if (typeof logMessage === 'function') {
                logMessage("<span style='color:var(--accent-color)'>[ CYBER SLICER ] Bypassing Precursor encryption algorithms in the field...</span>");
            }
        }

        // Check if player is at Planet Xerxes for Spire Resonance (2x XP)
        const loc = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null;
        const isAtXerxes = Boolean(
            (document.getElementById('xerxesOverlay') && document.getElementById('xerxesOverlay').style.display === 'flex') ||
            (loc && loc.name && loc.name.includes('Xerxes'))
        );
        const xpMultiplier = isAtXerxes ? 2 : 1;

        // Calculate Rewards (matching Cryptarch payouts)
        let xpReward = 150;
        let creditReward = 0;
        let textReward = "Data recovered.";

        if (itemId === 'ENCRYPTED_ENGRAM') {
            const rewards = [
                { xp: 150, text: "FRAGMENT RECOVERED: 'The ruler of the sunless world is the DARKNESS.'" },
                { xp: 300, text: "NAV-DATA: 'Sector [39, 17] - Precursor activity detected.'" },
                { xp: 500, text: "JACKPOT: Precursor architectural schematics recovered." }
            ];
            const r = rewards[Math.floor(Math.random() * rewards.length)];
            xpReward = r.xp;
            textReward = r.text;
        } else if (itemId === 'ENCRYPTED_DATA') {
            xpReward = 250;
            creditReward = 500 + Math.floor(Math.random() * 500);
            textReward = `Decrypted mercantile ledger (+${creditReward}c).`;
        } else if (itemId === 'ANCIENT_ARCHIVE') {
            xpReward = 500;
            creditReward = 1000 + Math.floor(Math.random() * 1000);
            textReward = `Holographic array unlocked! Forbidden history recovered (+${creditReward}c).`;
            if (typeof unlockLoreEntry === 'function') unlockLoreEntry('XENO_PRECURSORS');
        }

        const finalXP = xpReward * xpMultiplier;

        if (creditReward > 0 && typeof playerCredits !== 'undefined') {
            playerCredits += creditReward;
        }
        if (typeof playerXP !== 'undefined') {
            playerXP += finalXP;
        }

        if (isAtXerxes && typeof logMessage === 'function') {
            logMessage(`<span style="color:#00E0E0">> SPIRE RESONANCE: Decryption output doubled! (+${finalXP} XP)</span>`);
        }
        if (typeof logMessage === 'function') {
            logMessage(`<span style="color:#DDA0DD">> FIELD DECRYPTION SUCCESS: ${textReward} (+${finalXP} XP)</span>`);
        }
        if (typeof showToast === 'function') {
            showToast(`DECRYPTED: +${finalXP} XP${creditReward > 0 ? ` / +${creditReward}c` : ''}`, "success");
        }
        if (typeof soundManager !== 'undefined') {
            soundManager.playAbilityActivate();
        }

        // Defer checkLevelUp slightly so ui.js finishes decrementing the item and refreshing cargo load first
        setTimeout(() => {
            if (typeof checkLevelUp === 'function') checkLevelUp();
        }, 50);

        return true; // Signals ui.js useCargoItem() to consume 1 unit of itemId
    }

    function bindFieldDecryptionHandlers() {
        if (typeof COMMODITIES === 'undefined') return;

        ['ENCRYPTED_ENGRAM', 'ENCRYPTED_DATA', 'ANCIENT_ARCHIVE'].forEach(itemId => {
            if (COMMODITIES[itemId]) {
                COMMODITIES[itemId].onUse = () => {
                    const hasSlicer = hasPlayerPerk('CYBER_SLICER');
                    const hasCipher = (playerCargo['PRECURSOR_CIPHER'] || 0) > 0;
                    const loc = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null;

                    // If player lacks field decryption tools but is docked at a hub with a Cryptarch, open the Cryptarch!
                    if (!hasSlicer && !hasCipher && loc && loc.isMajorHub && loc.name !== 'The Rusty Anchor') {
                        if (typeof visitCryptarch === 'function') {
                            visitCryptarch();
                            return false;
                        }
                    }
                    return executeFieldDecryption(itemId, false);
                };
            }
        });

        if (COMMODITIES['PRECURSOR_CIPHER']) {
            COMMODITIES['PRECURSOR_CIPHER'].onUse = () => {
                const targetTypes = ['ENCRYPTED_ENGRAM', 'ENCRYPTED_DATA', 'ANCIENT_ARCHIVE'];
                const targetId = targetTypes.find(id => (playerCargo[id] || 0) > 0);

                if (!targetId) {
                    if (typeof showToast === 'function') showToast("No Encrypted Items in Hold", "info");
                    if (typeof soundManager !== 'undefined') soundManager.playError();
                    return false;
                }

                const success = executeFieldDecryption(targetId, true);
                if (success) {
                    playerCargo[targetId] -= 1;
                    if (playerCargo[targetId] <= 0) delete playerCargo[targetId];
                    const hasSlicer = hasPlayerPerk('CYBER_SLICER');

                    // BUG FIX: If Cyber Slicer saved the Cipher from being consumed, manually refresh the Cargo UI!
                    if (hasSlicer) {
                        if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
                        if (typeof renderUIStats === 'function') renderUIStats();
                        const modal = document.getElementById('genericModalOverlay');
                        if (modal && modal.style.display === 'flex' && typeof renderCargoList === 'function') {
                            renderCargoList();
                        }
                        return false;
                    }
                    return true;
                }
                return false;
            };
        }
    }

    // Bind immediately for items in items.js
    bindFieldDecryptionHandlers();

    // 2. GAMEBUS TICK & DAMAGE HOOKS FOR PASSIVE PERKS
    let _awardedCartographerSectors = new Set();
    let _lastColonyArchitectTick = {};
    let _ordnanceMoveCounter = 0;

    if (typeof GameBus !== 'undefined') {
        GameBus.on('TICK_PROCESSED', (tick) => {
            if (!tick || tick.interrupt) return;
            const { isMovement } = tick;

            // A. NANO_HULL_WEAVE: +0.2 Hull per move (1 Hull every 5 moves)
            if (isMovement && hasPlayerPerk('NANO_HULL_WEAVE')) {
                if (typeof playerHull !== 'undefined' && typeof MAX_PLAYER_HULL !== 'undefined' && playerHull > 0 && playerHull < MAX_PLAYER_HULL) {
                    playerHull = Math.min(MAX_PLAYER_HULL, Math.round((playerHull + 0.2) * 10) / 10);
                }
            }

            // B. STELLAR_CARTOGRAPHER: +2 XP per move & +50 XP on genuinely new sector discovery
            if (isMovement && typeof playerX !== 'undefined' && typeof playerY !== 'undefined' && typeof SECTOR_SIZE !== 'undefined') {
                const secX = Math.floor(playerX / SECTOR_SIZE);
                const secY = Math.floor(playerY / SECTOR_SIZE);
                const secKey = `${secX},${secY}`;

                // Sync any existing visitedSectors into our tracking Set
                if (typeof visitedSectors !== 'undefined' && visitedSectors.forEach) {
                    visitedSectors.forEach(k => _awardedCartographerSectors.add(k));
                }

                if (hasPlayerPerk('STELLAR_CARTOGRAPHER')) {
                    if (typeof playerXP !== 'undefined') {
                        playerXP += 2;
                    }
                    // Because perks.js loads before script.js, this listener runs right before updateSectorState() adds secKey to visitedSectors
                    if (!_awardedCartographerSectors.has(secKey) && (secX !== 0 || secY !== 0)) {
                        _awardedCartographerSectors.add(secKey);
                        playerXP += 50;
                        if (typeof logMessage === 'function') {
                            logMessage("<span style='color:var(--accent-color)'>[ STELLAR CARTOGRAPHER ] New sector astrometrics cataloged. +50 Bonus XP!</span>");
                        }
                    }
                    if (typeof checkLevelUp === 'function' && typeof xpToNextLevel !== 'undefined' && playerXP >= xpToNextLevel) {
                        checkLevelUp();
                    }
                } else {
                    _awardedCartographerSectors.add(secKey);
                }
            }

            // C. ORDNANCE_FABRICATOR: Synthesize +1 weapon ammo every 10 movement steps
            if (isMovement && hasPlayerPerk('ORDNANCE_FABRICATOR') && typeof playerShip !== 'undefined' && playerShip.components) {
                _ordnanceMoveCounter++;
                if (_ordnanceMoveCounter >= 10) {
                    _ordnanceMoveCounter = 0;
                    const weaponId = playerShip.components.weapon;
                    const weaponDef = (typeof COMPONENTS_DATABASE !== 'undefined' && weaponId) ? COMPONENTS_DATABASE[weaponId] : null;
                    if (weaponDef && weaponDef.stats && weaponDef.stats.maxAmmo) {
                        const curAmmo = playerShip.ammo[weaponId] !== undefined ? playerShip.ammo[weaponId] : weaponDef.stats.maxAmmo;
                        if (curAmmo < weaponDef.stats.maxAmmo) {
                            playerShip.ammo[weaponId] = curAmmo + 1;
                            if (typeof logMessage === 'function') {
                                logMessage(`<span style='color:var(--success)'>[ AUTO-MUNITIONS ] Fabricated +1 ordnance round (${playerShip.ammo[weaponId]}/${weaponDef.stats.maxAmmo}).</span>`);
                            }
                        }
                    }
                }
            }

            // D. QUANTUM_NAVIGATOR: 30% chance to prevent Stealth Heat buildup on movement
            if (isMovement && hasPlayerPerk('QUANTUM_NAVIGATOR') && typeof isSilentRunning !== 'undefined' && isSilentRunning) {
                if (typeof stealthHeat !== 'undefined' && stealthHeat > 0 && Math.random() < 0.30) {
                    stealthHeat = Math.max(0, stealthHeat - 1);
                }
            }

            // E. HEALTH_PHYSICIST: Protect shields & fuel inside galactic map Radiation Belts
            if (hasPlayerPerk('HEALTH_PHYSICIST') && typeof getHazardType === 'function' && typeof playerX !== 'undefined') {
                const hasRadMod = typeof playerShip !== 'undefined' && playerShip.components && playerShip.components.utility === 'UTIL_DOSIMETRY_ARRAY';
                if (!hasRadMod && getHazardType(playerX, playerY) === 'RADIATION_BELT') {
                    // Refund the 5.0 shield or 3.0 fuel drain applied by System 1 in script.js
                    if (typeof playerShields !== 'undefined' && playerShields > 0 && typeof MAX_SHIELDS !== 'undefined') {
                        playerShields = Math.min(MAX_SHIELDS, playerShields + 5.0);
                    } else if (typeof playerFuel !== 'undefined' && typeof MAX_FUEL !== 'undefined') {
                        playerFuel = Math.min(MAX_FUEL, playerFuel + 3.0);
                    }
                }
            }

            // F. SHADOW_TRANSPONDER: Halves Notoriety decay interval (from 15.0 to 7.5 stardates)
            if (hasPlayerPerk('SHADOW_TRANSPONDER') && typeof playerNotoriety !== 'undefined' && playerNotoriety > 0) {
                if (window.lastNotorietyDecayTime && typeof currentGameDate !== 'undefined') {
                    if (currentGameDate - window.lastNotorietyDecayTime >= 7.5) {
                        if (typeof updatePlayerNotoriety === 'function') updatePlayerNotoriety(-1);
                        window.lastNotorietyDecayTime = currentGameDate;
                        if (playerNotoriety === 0 && typeof logMessage === 'function') {
                            logMessage("<span style='color:var(--success)'>[ GHOST TRANSPONDER ] Transponder spoofing complete. Concord warrants purged.</span>");
                        }
                    }
                }
            }

            // G. COLONY_ARCHITECT: +100% construction speed & +15% tax bonus per Stardate
            if (hasPlayerPerk('COLONY_ARCHITECT') && typeof playerColonies !== 'undefined' && typeof currentGameDate !== 'undefined') {
                Object.values(playerColonies).forEach(colony => {
                    if (!colony || !colony.established) return;
                    const colId = colony.id || `${colony.x}_${colony.y}`;
                    if (_lastColonyArchitectTick[colId] === undefined || currentGameDate < _lastColonyArchitectTick[colId]) {
                        _lastColonyArchitectTick[colId] = currentGameDate;
                    }
                    if (currentGameDate - _lastColonyArchitectTick[colId] >= 1.0) {
                        _lastColonyArchitectTick[colId] = currentGameDate;

                        // Extra +1 construction progress per Stardate (doubles build speed)
                        if (colony.activeConstruction) {
                            colony.activeConstruction.progress = Math.min(
                                colony.activeConstruction.total,
                                colony.activeConstruction.progress + 1
                            );
                        }

                        // +15% bonus to positive tax revenue
                        if (colony.population > 0 && colony.morale > 0) {
                            const bonusTax = Math.max(5, Math.floor(colony.population * 0.075 * (colony.morale / 100)));
                            colony.treasury = (colony.treasury || 0) + bonusTax;
                        }
                    }
                });
            }
        });
    }

    // 3. HOOK ENGINE FUNCTIONS ON DOM LOAD (Using document so it runs before script.js auto-login!)
    function attachPerkWrappers() {
        bindFieldDecryptionHandlers();

        // A. Wrap applyPlayerShipStats to inject passive stat perks without clamping current vitals
        if (typeof window.applyPlayerShipStats === 'function' && !window._perksStatsHooked) {
            const originalApplyStats = window.applyPlayerShipStats;
            window.applyPlayerShipStats = function() {
                const prevHull = typeof playerHull !== 'undefined' ? playerHull : 100;
                const prevShields = typeof playerShields !== 'undefined' ? playerShields : 50;
                const prevFuel = typeof playerFuel !== 'undefined' ? playerFuel : 220;

                originalApplyStats.apply(this, arguments);

                if (hasPlayerPerk('NANO_HULL_WEAVE') && typeof MAX_PLAYER_HULL !== 'undefined') {
                    MAX_PLAYER_HULL += 35;
                }
                if (hasPlayerPerk('EMERGENCY_BULKHEADS') && typeof MAX_PLAYER_HULL !== 'undefined') {
                    MAX_PLAYER_HULL += 20;
                }
                if (hasPlayerPerk('OVERCHARGED_CAPACITORS')) {
                    if (typeof MAX_SHIELDS !== 'undefined') MAX_SHIELDS += 30;
                    if (typeof PLAYER_EVASION !== 'undefined') PLAYER_EVASION += 0.08;
                }
                if (hasPlayerPerk('DIMENSIONAL_POCKETS')) {
                    if (typeof PLAYER_CARGO_CAPACITY !== 'undefined') PLAYER_CARGO_CAPACITY += 25;
                    if (typeof MAX_FUEL !== 'undefined') MAX_FUEL += 40;
                }
                if (hasPlayerPerk('TACTICAL_OVERDRIVE') && typeof PLAYER_HIT_CHANCE !== 'undefined') {
                    PLAYER_HIT_CHANCE = Math.min(1.0, PLAYER_HIT_CHANCE + 0.10);
                }
                if (hasPlayerPerk('ORDNANCE_FABRICATOR') && typeof PLAYER_ATTACK_DAMAGE !== 'undefined') {
                    PLAYER_ATTACK_DAMAGE += 4;
                }
                if (hasPlayerPerk('SHADOW_TRANSPONDER')) {
                    window.PLAYER_SIGNATURE = Math.max(0.1, (window.PLAYER_SIGNATURE || 1.0) * 0.65);
                }

                // Restore vitals up to the newly boosted maximums
                if (typeof playerHull !== 'undefined' && typeof MAX_PLAYER_HULL !== 'undefined') {
                    playerHull = Math.min(prevHull, MAX_PLAYER_HULL);
                }
                if (typeof playerShields !== 'undefined' && typeof MAX_SHIELDS !== 'undefined') {
                    playerShields = Math.min(prevShields, MAX_SHIELDS);
                }
                if (typeof playerFuel !== 'undefined' && typeof MAX_FUEL !== 'undefined') {
                    playerFuel = Math.min(prevFuel, MAX_FUEL);
                }
            };
            window._perksStatsHooked = true;

            // Immediately recalculate in case a save was already loaded
            if (typeof playerShip !== 'undefined' && playerShip) {
                window.applyPlayerShipStats();
            }
        }

        // B. Wrap GameBus.emit to apply EMERGENCY_BULKHEADS 15% hull damage reduction before script.js subtracts hull
        if (typeof GameBus !== 'undefined' && typeof GameBus.emit === 'function' && !window._perksBusEmitHooked) {
            const origEmit = GameBus.emit.bind(GameBus);
            GameBus.emit = function(event, data) {
                if (event === 'HULL_DAMAGED' && data && data.amount > 1 && hasPlayerPerk('EMERGENCY_BULKHEADS')) {
                    data.amount = Math.max(1, Math.floor(data.amount * 0.85));
                }
                return origEmit(event, data);
            };
            window._perksBusEmitHooked = true;
        }

        // C. Wrap selectPerk so picking a stat-boosting perk immediately recalculates & tops off the bonus
        if (typeof window.selectPerk === 'function' && !window._perksSelectHooked) {
            const originalSelectPerk = window.selectPerk;
            window.selectPerk = function(perkId) {
                originalSelectPerk.apply(this, arguments);
                if (typeof applyPlayerShipStats === 'function') applyPlayerShipStats();

                if (perkId === 'NANO_HULL_WEAVE' && typeof playerHull !== 'undefined') {
                    playerHull = Math.min(MAX_PLAYER_HULL, playerHull + 35);
                } else if (perkId === 'EMERGENCY_BULKHEADS' && typeof playerHull !== 'undefined') {
                    playerHull = Math.min(MAX_PLAYER_HULL, playerHull + 20);
                } else if (perkId === 'OVERCHARGED_CAPACITORS' && typeof playerShields !== 'undefined') {
                    playerShields = Math.min(MAX_SHIELDS, playerShields + 30);
                } else if (perkId === 'DIMENSIONAL_POCKETS' && typeof playerFuel !== 'undefined') {
                    playerFuel = Math.min(MAX_FUEL, playerFuel + 40);
                }
                if (typeof renderUIStats === 'function') renderUIStats();
            };
            window._perksSelectHooked = true;
        }

        // D. Wrap handleCombatAction so TACTICAL_OVERDRIVE ticks down ability cooldowns twice as fast
        if (typeof window.handleCombatAction === 'function' && !window._perksCombatHooked) {
            const originalHandleCombatAction = window.handleCombatAction;
            window.handleCombatAction = function(action) {
                originalHandleCombatAction.apply(this, arguments);
                if (hasPlayerPerk('TACTICAL_OVERDRIVE')) {
                    if (typeof currentCombatContext !== 'undefined' && currentCombatContext && action !== 'ability') {
                        if (typeof playerAbilityCooldown !== 'undefined' && playerAbilityCooldown > 0) {
                            playerAbilityCooldown = Math.max(0, playerAbilityCooldown - 1);
                            if (typeof renderCombatView === 'function') renderCombatView();
                        }
                    }
                }
            };
            window._perksCombatHooked = true;
        }
        
        // E. Wrap showWormholeDetails AND executeWormholeJump for HYPER_LANE_MAPPER
        if (typeof window.showWormholeDetails === 'function' && !window._perksWormholeUIHooked) {
            const originalShowWormholeDetails = window.showWormholeDetails;
            window.showWormholeDetails = function(targetWh, distance) {
                originalShowWormholeDetails.apply(this, arguments);
                if (hasPlayerPerk('HYPER_LANE_MAPPER') && targetWh) {
                    const baseFuelCost = Math.floor(15 + (distance * 0.05));
                    const mappedFuelCost = Math.floor(baseFuelCost * 0.5);
                    const canAfford = playerFuel >= mappedFuelCost;
                    const detailEl = document.getElementById('genericDetailContent');
                    const actionsEl = document.getElementById('genericModalActions');

                    if (detailEl) {
                        detailEl.innerHTML += `
                            <div style="margin: 0 20px; padding: 8px 12px; background: rgba(0,255,100,0.08); border: 1px solid var(--success); border-radius: 4px; font-size: 11px; color: var(--success); text-align: left;">
                                🌀 <b>HYPER-LANE MAPPER ACTIVE:</b> Jump fuel cost halved to <b>${mappedFuelCost} Units</b> and structural hull risk reduced to <b>0%</b>.
                            </div>
                        `;
                    }
                    if (actionsEl) {
                        if (canAfford) {
                            actionsEl.innerHTML = `
                                <button class="action-button" style="border-color:#FFB800; color:#FFB800; box-shadow: 0 0 15px rgba(255, 184, 0, 0.3);" onclick="executeWormholeJump(${targetWh.x}, ${targetWh.y}, ${mappedFuelCost}, 0)">
                                    INITIATE STABILIZED JUMP (${mappedFuelCost} Fuel)
                                </button>
                                <button class="action-button" onclick="traverseWormhole()">CANCEL</button>
                            `;
                        } else {
                            actionsEl.innerHTML = `
                                <button class="action-button danger-btn" disabled>INSUFFICIENT FUEL (${mappedFuelCost} Required)</button>
                                <button class="action-button" onclick="traverseWormhole()">BACK</button>
                            `;
                        }
                    }
                }
            };
            window._perksWormholeUIHooked = true;
        }

        if (typeof window.executeWormholeJump === 'function' && !window._perksWormholeHooked) {
            const originalExecuteWormholeJump = window.executeWormholeJump;
            window.executeWormholeJump = function(targetX, targetY, fuelCost, damageRisk) {
                if (hasPlayerPerk('HYPER_LANE_MAPPER')) {
                    damageRisk = 0; // Zero risk of hull damage!
                }
                originalExecuteWormholeJump.call(this, targetX, targetY, fuelCost, damageRisk);
            };
            window._perksWormholeHooked = true;
        }
        
        // F. Wrap performCustomsScan to apply SMUGGLERS_LUCK bypass chance
        if (typeof window.performCustomsScan === 'function' && !window._perksCustomsHooked) {
            const originalPerformCustomsScan = window.performCustomsScan;
            window.performCustomsScan = function() {
                if (hasPlayerPerk('SMUGGLERS_LUCK')) {
                    if (Math.random() < 0.25) {
                        if (typeof logMessage === 'function') {
                            logMessage("<span style='color:var(--success); font-weight:bold;'>[ SMUGGLER'S LUCK ] Concord Customs sensor grid experienced a 'random malfunction'. They found nothing.</span>");
                        }
                        return true;
                    }
                }
                return originalPerformCustomsScan.apply(this, arguments);
            };
            window._perksCustomsHooked = true;
        }

        // G. Wrap captureDeepSkyImage (from config.js) for ASTROMETRIC_SAVANT
        if (typeof window.captureDeepSkyImage === 'function' && !window._perksAstroHooked) {
            const originalCaptureDeepSky = window.captureDeepSkyImage;
            window.captureDeepSkyImage = function() {
                const secKey = `ASTRO_PHOTO_${typeof currentSectorX !== 'undefined' ? currentSectorX : 0}_${typeof currentSectorY !== 'undefined' ? currentSectorY : 0}`;
                const alreadyDone = typeof discoveredLocations !== 'undefined' && discoveredLocations.has && discoveredLocations.has(secKey);

                originalCaptureDeepSky.apply(this, arguments);

                if (!alreadyDone && hasPlayerPerk('ASTROMETRIC_SAVANT')) {
                    const isNexStar = typeof playerShip !== 'undefined' && playerShip.components && playerShip.components.scanner === 'SCANNER_NEXSTAR_4SE';
                    const bonusXP = isNexStar ? 120 : 50;
                    playerXP += bonusXP;

                    let extraMsg = `<span style="color:var(--accent-color)">[ ASTROMETRIC SAVANT ]</span> High-resolution interferometry yielded +${bonusXP} bonus XP!`;
                    if (Math.random() < 0.50 && (typeof currentCargoLoad !== 'undefined' ? currentCargoLoad : 0) + 1 <= PLAYER_CARGO_CAPACITY) {
                        playerCargo['PLANETARY_DATA'] = (playerCargo['PLANETARY_DATA'] || 0) + 1;
                        if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
                        extraMsg += ` <span style="color:var(--gold-text)">Resolved +1x bonus Planetary Data cartridge!</span>`;
                    }
                    if (typeof logMessage === 'function') logMessage(extraMsg);
                    if (typeof checkLevelUp === 'function') checkLevelUp();
                }
            };
            window._perksAstroHooked = true;
        }

        // H. Wrap deployMiningDrone & deployCombatDrone for DRONE_COMMANDER (50% chance to preserve drone)
        if (typeof window.deployMiningDrone === 'function' && !window._perksMiningDroneHooked) {
            const origDeployMining = window.deployMiningDrone;
            window.deployMiningDrone = function() {
                const deployed = origDeployMining.apply(this, arguments);
                if (deployed && hasPlayerPerk('DRONE_COMMANDER') && Math.random() < 0.50) {
                    playerCargo['MINING_DRONE_MK2'] = (playerCargo['MINING_DRONE_MK2'] || 0) + 1;
                    if (typeof logMessage === 'function') {
                        logMessage("<span style='color:var(--accent-color)'>[ DRONE TELEMETRY LINK ] Autonomous recovery tether active! Mining Drone will be retained after deployment.</span>");
                    }
                }
                return deployed;
            };
            window._perksMiningDroneHooked = true;
        }

        if (typeof window.deployCombatDrone === 'function' && !window._perksCombatDroneHooked) {
            const origDeployCombat = window.deployCombatDrone;
            window.deployCombatDrone = function() {
                const deployed = origDeployCombat.apply(this, arguments);
                if (deployed && hasPlayerPerk('DRONE_COMMANDER') && Math.random() < 0.50) {
                    playerCargo['COMBAT_DRONE_MK1'] = (playerCargo['COMBAT_DRONE_MK1'] || 0) + 1;
                    if (typeof logMessage === 'function') {
                        logMessage("<span style='color:var(--accent-color)'>[ DRONE TELEMETRY LINK ] Spare drone core synchronized! Combat Drone preserved in bay.</span>");
                    }
                }
                return deployed;
            };
            window._perksCombatDroneHooked = true;
        }

        // I. Wrap scoopHydrogen for QUANTUM_NAVIGATOR (+25% scoop yield & -2 stealth heat)
        if (typeof window.scoopHydrogen === 'function' && !window._perksScoopHooked) {
            const origScoop = window.scoopHydrogen;
            window.scoopHydrogen = function() {
                const prevFuel = typeof playerFuel !== 'undefined' ? playerFuel : 0;
                origScoop.apply(this, arguments);
                const gained = (typeof playerFuel !== 'undefined' ? playerFuel : 0) - prevFuel;
                if (gained > 0 && hasPlayerPerk('QUANTUM_NAVIGATOR')) {
                    const bonusFuel = Math.round(gained * 0.25 * 10) / 10;
                    playerFuel = Math.min(MAX_FUEL, Math.round((playerFuel + bonusFuel) * 10) / 10);
                    if (typeof stealthHeat !== 'undefined' && stealthHeat > 0) {
                        stealthHeat = Math.max(0, stealthHeat - 2);
                    }
                    if (typeof logMessage === 'function') {
                        logMessage(`<span style='color:var(--accent-color)'>[ CORONA SKIMMER ] Magnetic intake scoops condensed +${bonusFuel.toFixed(1)} bonus fuel and flushed heat sinks!</span>`);
                    }
                }
            };
            window._perksScoopHooked = true;
        }

        // J. Wrap Shadow Broker functions for BLACK_MARKET_BARON (+25% payout & +2 Eclipse Rep)
        if (typeof window.getShadowBrokerUnitPrice === 'function' && !window._perksBrokerPriceHooked) {
            const origBrokerPrice = window.getShadowBrokerUnitPrice;
            window.getShadowBrokerUnitPrice = function(itemId) {
                const base = origBrokerPrice.apply(this, arguments);
                const loc = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null;
                const soldLocally = loc && loc.sells && loc.sells.some(s => (s.id === itemId) || (s === itemId));
                // Disable Baron multiplier for local goods to stop infinite arbitrage
                return (hasPlayerPerk('BLACK_MARKET_BARON') && !soldLocally) ? Math.floor(base * 1.25) : base;
            };
            window._perksBrokerPriceHooked = true;
        }

        if (typeof window.processShadowBrokerTrade === 'function' && !window._perksBrokerTradeHooked) {
            const origBrokerTrade = window.processShadowBrokerTrade;
            window.processShadowBrokerTrade = function(itemId) {
                const prevCredits = typeof playerCredits !== 'undefined' ? playerCredits : 0;
                
                const loc = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null;
                const soldLocally = itemId !== 'ALL' && loc && loc.sells && loc.sells.some(s => (s.id === itemId) || (s === itemId));
                
                origBrokerTrade.apply(this, arguments);
                
                // Deny the Eclipse Rep bonus if they are just fencing local store goods
                if (hasPlayerPerk('BLACK_MARKET_BARON') && playerCredits > prevCredits && typeof playerFactionStanding !== 'undefined' && !soldLocally) {
                    playerFactionStanding['ECLIPSE'] = (playerFactionStanding['ECLIPSE'] || 0) + 2;
                    if (typeof logMessage === 'function') {
                        logMessage("<span style='color:#9933FF'>[ SYNDICATE KINGPIN ] +25% Black Market bonus applied (+2 Eclipse Cartel Rep).</span>");
                    }
                }
            };
            window._perksBrokerTradeHooked = true;
        }

        // K. Inject "⭐ Captain Perks" Tab into Commander Datapad (displayCommanderProfile in ui.js)
        if (typeof window.displayCommanderProfile === 'function' && !window._perksProfileHooked) {
            const origDisplayProfile = window.displayCommanderProfile;
            window.displayCommanderProfile = function(tab = 'OVERVIEW') {
                origDisplayProfile.call(this, tab);

                const listEl = document.getElementById('genericModalList');
                const detailEl = document.getElementById('genericDetailContent');
                if (!listEl || !detailEl) return;

                // Append the Captain Perks navigation row
                const row = document.createElement('div');
                row.className = 'trade-item-row';
                row.style.cursor = 'pointer';
                if (tab === 'PERKS') row.style.background = 'rgba(0, 224, 224, 0.1)';
                row.innerHTML = `<span style="color:var(--text-color); font-weight:bold;">⭐ Captain Perks</span>`;
                row.onclick = () => window.displayCommanderProfile('PERKS');
                listEl.appendChild(row);

                if (tab === 'PERKS') {
                    const totalPerks = Object.keys(PERKS_DATABASE).length;
                    const unlockedIds = Object.keys(PERKS_DATABASE).filter(id => hasPlayerPerk(id));

                    let perksHtml = `
                        <div style="padding: 15px;">
                            <div style="display:flex; justify-content:space-between; align-items:flex-end; border-bottom:1px solid #333; padding-bottom:10px; margin-bottom:15px;">
                                <h3 style="color:var(--gold-text); margin:0;">CAPTAIN AUGMENTATIONS</h3>
                                <span style="font-size:10px; color:var(--accent-color); letter-spacing:1px;">${unlockedIds.length} / ${totalPerks} ACQUIRED</span>
                            </div>
                            <div style="display:flex; flex-direction:column; gap:10px; max-height: 380px; overflow-y: auto; padding-right: 5px;">
                    `;

                    if (unlockedIds.length === 0) {
                        perksHtml += `<div style="text-align:center; padding: 30px; color:#666; font-style:italic;">No specialized captain perks unlocked yet. Gain XP and level up to choose augmentations.</div>`;
                    } else {
                        unlockedIds.forEach(id => {
                            const p = PERKS_DATABASE[id];
                            perksHtml += `
                                <div style="background:rgba(0,0,0,0.35); border-left:3px solid var(--gold-text); padding:10px 12px; border-radius:0 4px 4px 0; display:flex; gap:12px; align-items:center;">
                                    <div style="font-size:26px;">${p.icon}</div>
                                    <div style="flex:1;">
                                        <div style="display:flex; justify-content:space-between; align-items:center;">
                                            <span style="color:var(--item-name-color); font-weight:bold; font-size:13px;">${p.name}</span>
                                            <span style="color:var(--accent-color); font-size:9px; text-transform:uppercase; letter-spacing:1px;">${p.category}</span>
                                        </div>
                                        <div style="color:var(--item-desc-color); font-size:11px; margin-top:4px; line-height:1.4;">${p.description}</div>
                                    </div>
                                </div>
                            `;
                        });
                    }

                    perksHtml += `</div></div>`;
                    detailEl.innerHTML = perksHtml;
                }
            };
            window._perksProfileHooked = true;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attachPerkWrappers);
    } else {
        attachPerkWrappers();
    }
})();

// --- END OF FILE perks.js ---
