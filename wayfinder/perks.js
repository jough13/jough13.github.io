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
        description: "Shields regenerate +50% faster outside of combat.",
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
        description: "Planetary biological scans award double XP.",
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
        icon: "🗺️",
        category: "Exploration"
    },

    // ==========================================
    // --- SURVIVAL ---
    // ==========================================
    HEALTH_PHYSICIST: {
        id: "HEALTH_PHYSICIST",
        name: "Health Physicist",
        description: "Your background in radiological affairs allows you to perfectly calibrate your ship's shielding. You take zero hull damage when scooping plasma from highly radioactive O and B-class stars.",
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
    }
};

// --- PERFORMANCE OPTIMIZATION ---
// Freezing the array tells the V8 JavaScript engine that this dictionary will never 
// be modified at runtime, allowing it to optimize memory lookup speeds.
Object.freeze(PERKS_DATABASE);

// Expose globally for safe access across all modules
window.PERKS_DATABASE = PERKS_DATABASE;

// ==========================================
// --- SELF-CONTAINED PERK & ITEM HOOKS ---
// ==========================================

(function initPerkSystems() {
    // 1. FIELD DECRYPTION FOR ENCRYPTED ITEMS & PRECURSOR CIPHERS
    function executeFieldDecryption(itemId, forcedCipher = false) {
        if (typeof playerCargo === 'undefined') return false;

        const hasSlicer = typeof playerPerks !== 'undefined' && playerPerks.has && playerPerks.has('CYBER_SLICER');
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

        if (creditReward > 0 && typeof playerCredits !== 'undefined') {
            playerCredits += creditReward;
        }
        if (typeof playerXP !== 'undefined') {
            playerXP += xpReward;
        }

        if (typeof logMessage === 'function') {
            logMessage(`<span style="color:#DDA0DD">> FIELD DECRYPTION SUCCESS: ${textReward} (+${xpReward} XP)</span>`);
        }
        if (typeof showToast === 'function') {
            showToast(`DECRYPTED: +${xpReward} XP${creditReward > 0 ? ` / +${creditReward}c` : ''}`, "success");
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
            if (COMMODITIES[itemId] && !COMMODITIES[itemId].onUse) {
                COMMODITIES[itemId].onUse = () => executeFieldDecryption(itemId, false);
            }
        });

        if (COMMODITIES['PRECURSOR_CIPHER'] && !COMMODITIES['PRECURSOR_CIPHER'].onUse) {
            COMMODITIES['PRECURSOR_CIPHER'].onUse = () => {
                const targetTypes = ['ENCRYPTED_ENGRAM', 'ENCRYPTED_DATA', 'ANCIENT_ARCHIVE'];
                const targetId = targetTypes.find(id => (playerCargo[id] || 0) > 0);

                if (!targetId) {
                    if (typeof showToast === 'function') showToast("No Encrypted Items in Hold", "info");
                    if (typeof soundManager !== 'undefined') soundManager.playError();
                    return false;
                }

                // Decrypt the target item and consume 1 unit of it
                const success = executeFieldDecryption(targetId, true);
                if (success) {
                    playerCargo[targetId] -= 1;
                    if (playerCargo[targetId] <= 0) delete playerCargo[targetId];
                    const hasSlicer = typeof playerPerks !== 'undefined' && playerPerks.has && playerPerks.has('CYBER_SLICER');
                    // If Cyber Slicer is active, don't even consume the cipher!
                    return !hasSlicer;
                }
                return false;
            };
        }
    }

    // Bind immediately for items in items.js, and again on DOMContentLoaded just in case
    bindFieldDecryptionHandlers();

    // 2. GAMEBUS TICK HOOKS FOR PASSIVE PERKS
    let _lastTrackedSectorKey = null;
    let _lastColonyArchitectTick = {};

    if (typeof GameBus !== 'undefined') {
        GameBus.on('TICK_PROCESSED', (tick) => {
            if (!tick || tick.interrupt || typeof playerPerks === 'undefined' || !playerPerks.has) return;
            const { isMovement } = tick;

            // A. NANO_HULL_WEAVE: +0.2 Hull per move (1 Hull every 5 moves)
            if (isMovement && playerPerks.has('NANO_HULL_WEAVE')) {
                if (typeof playerHull !== 'undefined' && typeof MAX_PLAYER_HULL !== 'undefined' && playerHull > 0 && playerHull < MAX_PLAYER_HULL) {
                    playerHull = Math.min(MAX_PLAYER_HULL, Math.round((playerHull + 0.2) * 10) / 10);
                }
            }

            // B. STELLAR_CARTOGRAPHER: +2 XP per move & +50 XP on new sector entry
            if (isMovement && playerPerks.has('STELLAR_CARTOGRAPHER')) {
                if (typeof playerXP !== 'undefined') {
                    playerXP += 2;
                }
                if (typeof currentSectorX !== 'undefined' && typeof currentSectorY !== 'undefined') {
                    const secKey = `${currentSectorX},${currentSectorY}`;
                    if (_lastTrackedSectorKey !== null && _lastTrackedSectorKey !== secKey) {
                        const isNewlyVisited = typeof visitedSectors !== 'undefined' && visitedSectors.has(secKey);
                        if (isNewlyVisited) {
                            playerXP += 50;
                            if (typeof logMessage === 'function') {
                                logMessage("<span style='color:var(--accent-color)'>[ STELLAR CARTOGRAPHER ] Sector astrometrics cataloged. +50 Bonus XP!</span>");
                            }
                        }
                    }
                    _lastTrackedSectorKey = secKey;
                }
                if (typeof checkLevelUp === 'function' && typeof xpToNextLevel !== 'undefined' && playerXP >= xpToNextLevel) {
                    checkLevelUp();
                }
            } else if (typeof currentSectorX !== 'undefined' && typeof currentSectorY !== 'undefined') {
                _lastTrackedSectorKey = `${currentSectorX},${currentSectorY}`;
            }

            // C. SHADOW_TRANSPONDER: Halves Notoriety decay interval (from 15.0 to 7.5 stardates)
            if (playerPerks.has('SHADOW_TRANSPONDER') && typeof playerNotoriety !== 'undefined' && playerNotoriety > 0) {
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

            // D. COLONY_ARCHITECT: +100% construction speed & +15% tax bonus per Stardate
            if (playerPerks.has('COLONY_ARCHITECT') && typeof playerColonies !== 'undefined' && typeof currentGameDate !== 'undefined') {
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

    // 3. HOOK SHIP STATS, COMBAT COOLDOWNS & PERK SELECTION ON DOM LOAD
    window.addEventListener('DOMContentLoaded', () => {
        bindFieldDecryptionHandlers();

        // A. Wrap applyPlayerShipStats to inject passive stat perks without clamping current vitals
        if (typeof window.applyPlayerShipStats === 'function' && !window._perksStatsHooked) {
            const originalApplyStats = window.applyPlayerShipStats;
            window.applyPlayerShipStats = function() {
                const prevHull = typeof playerHull !== 'undefined' ? playerHull : 100;
                const prevShields = typeof playerShields !== 'undefined' ? playerShields : 50;
                const prevFuel = typeof playerFuel !== 'undefined' ? playerFuel : 220;

                originalApplyStats.apply(this, arguments);

                if (typeof playerPerks !== 'undefined' && playerPerks.has) {
                    if (playerPerks.has('NANO_HULL_WEAVE') && typeof MAX_PLAYER_HULL !== 'undefined') {
                        MAX_PLAYER_HULL += 35;
                    }
                    if (playerPerks.has('OVERCHARGED_CAPACITORS')) {
                        if (typeof MAX_SHIELDS !== 'undefined') MAX_SHIELDS += 30;
                        if (typeof PLAYER_EVASION !== 'undefined') PLAYER_EVASION += 0.08;
                    }
                    if (playerPerks.has('DIMENSIONAL_POCKETS')) {
                        if (typeof PLAYER_CARGO_CAPACITY !== 'undefined') PLAYER_CARGO_CAPACITY += 25;
                        if (typeof MAX_FUEL !== 'undefined') MAX_FUEL += 40;
                    }
                    if (playerPerks.has('TACTICAL_OVERDRIVE') && typeof PLAYER_HIT_CHANCE !== 'undefined') {
                        PLAYER_HIT_CHANCE = Math.min(1.0, PLAYER_HIT_CHANCE + 0.10);
                    }
                    if (playerPerks.has('SHADOW_TRANSPONDER')) {
                        window.PLAYER_SIGNATURE = Math.max(0.1, (window.PLAYER_SIGNATURE || 1.0) * 0.65);
                    }
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
        }

        // B. Wrap selectPerk so picking a stat-boosting perk immediately recalculates & tops off the bonus
        if (typeof window.selectPerk === 'function' && !window._perksSelectHooked) {
            const originalSelectPerk = window.selectPerk;
            window.selectPerk = function(perkId) {
                originalSelectPerk.apply(this, arguments);
                if (typeof applyPlayerShipStats === 'function') applyPlayerShipStats();

                if (perkId === 'NANO_HULL_WEAVE' && typeof playerHull !== 'undefined') {
                    playerHull = Math.min(MAX_PLAYER_HULL, playerHull + 35);
                } else if (perkId === 'OVERCHARGED_CAPACITORS' && typeof playerShields !== 'undefined') {
                    playerShields = Math.min(MAX_SHIELDS, playerShields + 30);
                } else if (perkId === 'DIMENSIONAL_POCKETS' && typeof playerFuel !== 'undefined') {
                    playerFuel = Math.min(MAX_FUEL, playerFuel + 40);
                }
                if (typeof renderUIStats === 'function') renderUIStats();
            };
            window._perksSelectHooked = true;
        }

        // C. Wrap handleCombatAction so TACTICAL_OVERDRIVE ticks down ability cooldowns twice as fast
        if (typeof window.handleCombatAction === 'function' && !window._perksCombatHooked) {
            const originalHandleCombatAction = window.handleCombatAction;
            window.handleCombatAction = function(action) {
                originalHandleCombatAction.apply(this, arguments);
                if (typeof playerPerks !== 'undefined' && playerPerks.has && playerPerks.has('TACTICAL_OVERDRIVE')) {
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
        
        // D. Wrap executeWormholeJump to apply the HYPER_LANE_MAPPER fuel & damage reductions
        if (typeof window.executeWormholeJump === 'function' && !window._perksWormholeHooked) {
            const originalExecuteWormholeJump = window.executeWormholeJump;
            window.executeWormholeJump = function(targetX, targetY, fuelCost, damageRisk) {
                if (typeof playerPerks !== 'undefined' && playerPerks.has && playerPerks.has('HYPER_LANE_MAPPER')) {
                    fuelCost = Math.floor(fuelCost * 0.5);
                    damageRisk = 0; // Zero risk of hull damage!
                }
                originalExecuteWormholeJump.call(this, targetX, targetY, fuelCost, damageRisk);
            };
            window._perksWormholeHooked = true;
        }
        
        // E. Wrap performCustomsScan to apply the SMUGGLERS_LUCK bypass chance
        if (typeof window.performCustomsScan === 'function' && !window._perksCustomsHooked) {
            const originalPerformCustomsScan = window.performCustomsScan;
            window.performCustomsScan = function() {
                if (typeof playerPerks !== 'undefined' && playerPerks.has && playerPerks.has('SMUGGLERS_LUCK')) {
                    // 25% chance to flat-out bypass the scan, even if contraband is actively exposed!
                    if (Math.random() < 0.25) {
                        if (typeof logMessage === 'function') {
                            logMessage("<span style='color:var(--success); font-weight:bold;'>[ SMUGGLER'S LUCK ] Concord Customs sensor grid experienced a 'random malfunction'. They found nothing.</span>");
                        }
                        return true; // Bypass successful
                    }
                }
                return originalPerformCustomsScan.apply(this, arguments);
            };
            window._perksCustomsHooked = true;
        }
    });
})();

// --- END OF FILE perks.js ---
