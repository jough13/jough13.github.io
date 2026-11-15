// --- START OF FILE items.js ---

// ==========================================
// --- INTERNAL ITEM HELPERS ---
// ==========================================

function _itemHasPerk(perkId) {
    if (typeof playerPerks === 'undefined' || !playerPerks) return false;
    if (typeof playerPerks.has === 'function') return playerPerks.has(perkId);
    if (Array.isArray(playerPerks)) return playerPerks.includes(perkId);
    return false;
}

function _sanitizeCustomName(rawInput, fallback) {
    if (!rawInput || typeof rawInput !== 'string') return fallback;
    const cleaned = rawInput.replace(/[<>"'`&]/g, '').trim().slice(0, 32);
    return cleaned.length > 0 ? cleaned : fallback;
}

function _refreshItemUI() {
    if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
    if (typeof renderUIStats === 'function') renderUIStats();
    if (typeof updateModalInfoBar === 'function') {
        updateModalInfoBar('genericInfoBar');
        updateModalInfoBar('xerxesInfoBar');
    }
    if (typeof GameBus !== 'undefined') GameBus.emit('UI_REFRESH_REQUESTED');
}

function _safeAddCargoFromItem(itemId, qty) {
    if (!itemId || qty <= 0 || typeof playerCargo === 'undefined') return 0;
    const maxCap = typeof PLAYER_CARGO_CAPACITY !== 'undefined' ? PLAYER_CARGO_CAPACITY : 50;
    const curLoad = typeof currentCargoLoad !== 'undefined' ? currentCargoLoad : 0;
    const itemDef = (typeof COMMODITIES !== 'undefined' && COMMODITIES[itemId]) ? COMMODITIES[itemId] : null;
    const weight = (itemDef && itemDef.weight !== undefined) ? itemDef.weight : 1;

    const maxFit = weight > 0 ? Math.floor((maxCap - curLoad) / weight) : qty;
    const actualAdd = Math.max(0, Math.min(qty, maxFit));

    if (actualAdd > 0) {
        playerCargo[itemId] = (playerCargo[itemId] || 0) + actualAdd;
        if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
    }
    return actualAdd;
}

// Self-contained field decryption handler for Encrypted Engrams, Data Caches, Archives, and Ciphers
function _executeItemFieldDecryption(itemId, triggeredByCipher = false) {
    if (typeof playerCargo === 'undefined') return false;

    const hasSlicer = _itemHasPerk('CYBER_SLICER');
    const hasCipher = (playerCargo['PRECURSOR_CIPHER'] || 0) > 0;
    const loc = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null;

    // If the player lacks field decryption tools but is docked at a major hub with a Cryptarch, open the Cryptarch UI
    if (!hasSlicer && !hasCipher && !triggeredByCipher) {
        if (loc && loc.isMajorHub && loc.name !== 'The Rusty Anchor' && typeof visitCryptarch === 'function') {
            visitCryptarch();
            return false;
        }
        if (typeof showToast === 'function') showToast("Field Decryption Requires Cyber Slicer or Cipher", "error");
        if (typeof soundManager !== 'undefined') soundManager.playError();
        if (typeof logMessage === 'function') {
            logMessage("<span style='color:var(--danger)'>[ DECRYPTION FAILED ] Field decryption requires the Cyber Slicer perk or a Precursor Cipher in your hold.</span>");
        }
        return false;
    }

    // Consume 1x Precursor Cipher if player does not have Cyber Slicer (and wasn't already triggered via PRECURSOR_CIPHER.onUse)
    if (!hasSlicer && !triggeredByCipher) {
        playerCargo['PRECURSOR_CIPHER'] -= 1;
        if (playerCargo['PRECURSOR_CIPHER'] <= 0) delete playerCargo['PRECURSOR_CIPHER'];
        if (typeof logMessage === 'function') {
            logMessage("<span style='color:var(--warning)'>[ FIELD DECRYPTION ] 1x Precursor Cipher consumed to collapse quantum encryption.</span>");
        }
    } else if (hasSlicer && typeof logMessage === 'function') {
        logMessage("<span style='color:var(--accent-color)'>[ CYBER SLICER ] Bypassing Precursor encryption algorithms in the field...</span>");
    }

    const isAtXerxes = Boolean(
        (document.getElementById('xerxesOverlay') && document.getElementById('xerxesOverlay').style.display === 'flex') ||
        (loc && loc.name && loc.name.includes('Xerxes'))
    );
    const xpMultiplier = isAtXerxes ? 2 : 1;

    let xpReward = 150;
    let creditReward = 0;
    let textReward = "Data recovered.";

    if (itemId === 'ENCRYPTED_ENGRAM') {
        const rewards = [
            { xp: 150, text: "FRAGMENT RECOVERED: 'The ruler of the sunless world is the DARKNESS.'" },
            { xp: 300, text: "NAV-DATA: 'Sector [39, 17] - Precursor activity detected.'" },
            { xp: 500, itemDrop: "VOID_CRYSTALS", qty: 2, text: "JACKPOT: Precursor crystalline matrix stabilized into 2x Void Crystals!" },
            { xp: 400, itemDrop: "PRECURSOR_STAR_MAP_FRAGMENT", qty: 1, text: "ASTRONOMICAL CACHE: Recovered 1x Star Map Fragment!" }
        ];
        const r = rewards[Math.floor(Math.random() * rewards.length)];
        xpReward = r.xp;
        textReward = r.text;
        if (r.itemDrop) {
            const added = _safeAddCargoFromItem(r.itemDrop, r.qty || 1);
            if (added < (r.qty || 1) && typeof logMessage === 'function') {
                logMessage("<span style='color:var(--warning)'>Cargo hold full! Materialized relic could not be fully stowed.</span>");
            }
        }
    } else if (itemId === 'ENCRYPTED_DATA') {
        xpReward = 250;
        creditReward = 500 + Math.floor(Math.random() * 500);
        textReward = `Decrypted mercantile ledger (+${creditReward}c).`;
    } else if (itemId === 'ANCIENT_ARCHIVE') {
        xpReward = 500;
        creditReward = 1000 + Math.floor(Math.random() * 1000);
        textReward = `Holographic array unlocked! Forbidden history recovered (+${creditReward}c).`;
        if (typeof unlockLoreEntry === 'function') {
            unlockLoreEntry('XENO_PRECURSORS');
            unlockLoreEntry('PRECURSOR_ORIGINS');
        }
    }

    const finalXP = xpReward * xpMultiplier;
    if (creditReward > 0 && typeof playerCredits !== 'undefined') playerCredits += creditReward;
    if (typeof playerXP !== 'undefined') playerXP += finalXP;

    if (isAtXerxes && typeof logMessage === 'function') {
        logMessage(`<span style="color:#00E0E0">> SPIRE RESONANCE: Decryption output doubled! (+${finalXP} XP)</span>`);
    }
    if (typeof logMessage === 'function') {
        logMessage(`<span style="color:#DDA0DD">> FIELD DECRYPTION SUCCESS: ${textReward} (+${finalXP} XP)</span>`);
    }
    if (typeof showToast === 'function') {
        showToast(`DECRYPTED: +${finalXP} XP${creditReward > 0 ? ` / +${creditReward}c` : ''}`, "success");
    }
    if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();

    _refreshItemUI();
    setTimeout(() => {
        if (typeof checkLevelUp === 'function') checkLevelUp();
    }, 50);

    return true;
}

// ==========================================
// --- LOOT TABLES ---
// ==========================================

const LOOT_TABLES = {
    DERELICT_COMMON: [
        { weight: 4, type: "FLAVOR", text: "The vessel is stripped bare. Nothing but dust and ghosts." },
        { weight: 3, type: "ITEM", id: "TECH_PARTS", min: 5, max: 15, text: "You salvage a crate of intact ship components." },
        { weight: 2, type: "ITEM", id: "FOOD_SUPPLIES", min: 5, max: 10, text: "Found sealed emergency rations in the galley." },
        { weight: 2, type: "ITEM", id: "FUEL_CELLS", min: 2, max: 5, text: "Siphoned reserve Fuel Cells from the auxiliary generator." },
        { weight: 1, type: "ITEM", id: "NANO_REPAIR_KIT", min: 1, max: 2, text: "Recovered an emergency Nano-Repair Kit from engineering." },
        { weight: 1, type: "ITEM", id: "MINERAL_GEODE", min: 1, max: 3, text: "Found uncracked survey geodes in the geologist's locker." },
        { weight: 2, type: "XP", amount: 35, text: "Flight recorder logs downloaded." },
        { weight: 1, type: "CREDITS", min: 250, max: 850, text: "Found a concealed captain's credit chit." }
    ],
    DERELICT_RARE: [
        { weight: 3, type: "ITEM", id: "ANCIENT_RELICS", min: 1, max: 1, text: "In the captain's safe... a Precursor relic!" },
        { weight: 2, type: "ITEM", id: "PROHIBITED_STIMS", min: 2, max: 5, text: "Hidden smuggler's stash located behind a false bulkhead." },
        { weight: 2, type: "ITEM", id: "PRECURSOR_NAV_CORE", min: 1, max: 1, text: "You extract a humming Precursor Nav-Core from the ship's computer!" },
        { weight: 2, type: "ITEM", id: "OBSIDIAN_TEAR_PLATING", min: 1, max: 3, text: "You salvage ultra-dense Obsidian Tear Plating from the hull!" },
        { weight: 2, type: "ITEM", id: "ARTIFACT_SHARDS", min: 1, max: 4, text: "You found fragments of strange, humming Precursor glass." },
        { weight: 1, type: "ITEM", id: "CRYO_STASIS_POD", min: 1, max: 1, text: "An active cryo-stasis pod is still humming on backup battery!" },
        { weight: 1, type: "ITEM", id: "SYNDICATE_LEDGER", min: 1, max: 1, text: "Recovered an unredacted Eclipse Cartel account ledger!" },
        { weight: 1, type: "ITEM", id: "PRECURSOR_DATACUBE", min: 1, max: 1, text: "Jackpot! An intact Precursor Datacube." },
        { weight: 1, type: "ITEM", id: "UNSHACKLED_AI", min: 1, max: 1, text: "You pulled a dormant Unshackled AI core from the mainframe!" },
        { weight: 1, type: "TRAP_PLASMA", damage: 15, text: "Booby trap! Plasma vent rupture." },
        { weight: 1, type: "TRAP_PIRATE", text: "Distress beacon was a lure! Ambush!" }
    ],
    ANOMALY_SCIENCE: [
        { weight: 4, type: "XP", amount: 60, text: "Sensors record valuable subspace telemetry." },
        { weight: 2, type: "HEAL", text: "Exotic harmonic radiation revitalizes your ship's deflector grid." },
        { weight: 2, type: "ITEM", id: "VOID_CRYSTALS", min: 1, max: 3, text: "Matter stabilized. Void Crystals recovered." },
        { weight: 1, type: "ITEM", id: "QUANTUM_LENS", min: 1, max: 1, text: "Gravitational lensing crystallized a flawless Quantum Lens!" },
        { weight: 1, type: "ITEM", id: "ENCRYPTED_ENGRAM", min: 1, max: 1, text: "A bizarre data-matrix crystallized out of the anomaly." },
        { weight: 1, type: "ITEM", id: "PHASE_SHIFTED_ALLOY", min: 1, max: 1, text: "An object falls out of hyperspace right in front of you!" }
    ]
};

// ==========================================
// --- COMMODITIES DATABASE ---
// ==========================================

const COMMODITIES = {
    
    // ==========================================
    // --- STANDARD GOODS & RAW MATERIALS ---
    // ==========================================

    LUXURY_GOODS: { 
        name: "Luxury Goods", 
        basePrice: 350, 
        icon: "💎",
        weight: 1,
        illegal: false,
        category: "LUXURY",
        description: "High-end textiles, holovids, and artisanal crafts produced by advanced colonies." 
    },
    FUEL_CELLS: {
        name: "Fuel Cells",
        basePrice: 10,
        icon: "🔋",
        weight: 1,
        illegal: false,
        category: "CONSUMABLE",
        description: "Concord-grade hyper-refined hydrogen. Use from the Cargo Manifest to manually restore 50 Fuel in an emergency.",
        onUse: () => {
            if (typeof playerFuel !== 'undefined' && playerFuel >= MAX_FUEL) {
                if (typeof showToast === 'function') showToast("TANK ALREADY FULL", "info");
                return false;
            }
            playerFuel = Math.min(MAX_FUEL, Math.round((playerFuel + 50) * 10) / 10);
            logMessage("<span style='color:var(--warning)'>Emergency Fuel Cell consumed. +50 Fuel.</span>");
            if (typeof soundManager !== 'undefined') soundManager.playBuy();
            _refreshItemUI();
            return true;
        }
    },
    NANO_REPAIR_KIT: {
        name: "Nano-Repair Kit",
        basePrice: 150,
        icon: "🔧",
        weight: 1,
        illegal: false,
        category: "CONSUMABLE",
        description: "A pressurized canister of programmable smart-matter. Use from the Cargo Manifest to instantly patch 35 Hull Integrity.",
        onUse: () => {
            if (typeof playerHull !== 'undefined' && playerHull >= MAX_PLAYER_HULL) {
                if (typeof showToast === 'function') showToast("HULL ALREADY MAXED", "info");
                return false;
            }
            playerHull = Math.min(MAX_PLAYER_HULL, playerHull + 35);
            logMessage("<span style='color:var(--success)'>Nano-sealant deployed. Hull repaired by 35.</span>");
            if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();
            if (typeof showToast === 'function') showToast("HULL REPAIRED (+35)", "success");
            _refreshItemUI();
            return true;
        }
    },
    OVERCLOCK_CELL: {
        name: "Capacitor Overcharge Cell",
        basePrice: 275,
        icon: "⚡",
        weight: 1,
        illegal: false,
        category: "CONSUMABLE",
        description: "High-density plasma capacitor. Activate to instantly restore +60 Shields and flush all accumulated Stealth Heat.",
        onUse: () => {
            const maxShld = typeof MAX_SHIELDS !== 'undefined' ? MAX_SHIELDS : 50;
            const hasHeat = typeof stealthHeat !== 'undefined' && stealthHeat > 0;
            if (typeof playerShields !== 'undefined' && playerShields >= maxShld && !hasHeat) {
                if (typeof showToast === 'function') showToast("SHIELDS FULL & HEAT NOMINAL", "info");
                return false;
            }
            if (typeof playerShields !== 'undefined') {
                playerShields = Math.min(maxShld, playerShields + 60);
            }
            if (typeof stealthHeat !== 'undefined') {
                stealthHeat = 0;
            }
            logMessage("<span style='color:var(--accent-color)'>[ OVERCHARGE CELL ] Deflector grid boosted (+60 Shields) and thermal sinks flushed!</span>");
            if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();
            if (typeof showToast === 'function') showToast("SHIELDS BOOSTED & HEAT VENTED", "success");
            _refreshItemUI();
            return true;
        }
    },
    SENSOR_DECOY: {
        name: "Sensor Decoy",
        basePrice: 500,
        illegal: true,
        icon: "🛰️",
        weight: 1,
        category: "CONTRABAND",
        description: "A spoofing buoy that broadcasts your ship's transponder data while flying in the opposite direction. Use to instantly reduce Concord Notoriety by 1 and shake nearby pursuers.",
        onUse: () => {
            const hasNotoriety = typeof playerNotoriety !== 'undefined' && playerNotoriety > 0;
            const hasPursuers = typeof activeEnemies !== 'undefined' && activeEnemies.some(e => !e.isProbe && !e.isBountyTarget && !e.isLegendary);
            if (!hasNotoriety && !hasPursuers) {
                if (typeof showToast === 'function') showToast("NO ACTIVE WARRANTS OR PURSUERS", "info");
                return false;
            }
            if (hasNotoriety && typeof updatePlayerNotoriety === 'function') {
                updatePlayerNotoriety(-1);
            }
            if (hasPursuers && typeof activeEnemies !== 'undefined') {
                activeEnemies.forEach(e => {
                    if (!e.isProbe && !e.isBountyTarget && !e.isLegendary) {
                        e.x += (Math.random() < 0.5 ? -6 : 6);
                        e.y += (Math.random() < 0.5 ? -6 : 6);
                    }
                });
            }
            logMessage("<span style='color:var(--success)'>Deployed Sensor Decoy. Concord heat reduced and pursuing sensors spoofed.</span>");
            if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();
            if (typeof showToast === 'function') showToast("DECOY DEPLOYED", "success");
            _refreshItemUI();
            return true;
        }
    },
    REFINED_ALLOY: {
        name: "Refined Alloy",
        basePrice: 350,
        icon: "⚙️",
        weight: 1,
        illegal: false,
        category: "INDUSTRIAL",
        description: "High-grade industrial alloy smelted from bulk minerals. Essential for advanced engineering and prototypes."
    },
    QUANTUM_LENS: {
        name: "Quantum Lens",
        basePrice: 800,
        icon: "👁️",
        weight: 1,
        illegal: false,
        category: "TECH",
        description: "A perfectly stabilized void crystal matrix. Used in extreme-precision targeting and shield technology."
    },
    MINERALS: {
        name: "Minerals",
        basePrice: 25,
        icon: "🪨",
        weight: 1,
        illegal: false,
        category: "RAW",
        description: "Bulk-processed common ores – iron, bauxite, silicates. The gritty backbone of galactic construction."
    },
    MINERAL_GEODE: {
        name: "Crystalline Geode",
        basePrice: 120,
        icon: "💎",
        weight: 1,
        illegal: false,
        category: "RAW",
        description: "A dense, hollow asteroid nodule lined with resonant crystals. Activate in your Cargo Hold to crack it open with your mining laser.",
        onUse: () => {
            const roll = Math.random();
            let dropId = "RARE_METALS";
            let qty = 1 + Math.floor(Math.random() * 2);
            if (roll < 0.18) {
                dropId = "VOID_CRYSTALS";
                qty = 1;
            } else if (roll < 0.50) {
                dropId = "PLATINUM_ORE";
                qty = 1 + Math.floor(Math.random() * 2);
            } else if (roll < 0.75) {
                dropId = "GOLD";
                qty = 1 + Math.floor(Math.random() * 2);
            }
            playerCargo[dropId] = (playerCargo[dropId] || 0) + qty;
            const dropName = COMMODITIES[dropId] ? COMMODITIES[dropId].name : dropId;
            logMessage(`<span style='color:var(--gold-text)'>[ GEODE CRACKED ]</span> Precision laser cut revealed <b>${qty}x ${dropName}</b>!`);
            if (typeof soundManager !== 'undefined') soundManager.playMining();
            if (typeof showToast === 'function') showToast(`FOUND: ${qty}x ${dropName}`, "success");
            _refreshItemUI();
            return true;
        }
    },
    FOOD_SUPPLIES: {
        name: "Food Supplies",
        basePrice: 15,
        icon: "🥫",
        weight: 1,
        illegal: false,
        category: "ORGANIC",
        description: "A spectrum of sustenance: from bland nutrient paste to surprisingly palatable hydroponic greens."
    },
    TECH_PARTS: {
        name: "Tech Parts",
        basePrice: 50,
        icon: "🔌",
        weight: 1,
        illegal: false,
        category: "INDUSTRIAL",
        description: "A chaotic assortment of salvaged electronic components. Essential for ship repairs and unsanctioned upgrades."
    },
    MEDICAL_SUPPLIES: {
        name: "Medical Supplies",
        basePrice: 60,
        icon: "⚕️",
        weight: 1,
        illegal: false,
        category: "ORGANIC",
        description: "Sterile field kits, broad-spectrum anti-rads, and auto-suture devices. Highly valued during colony outbreaks, or use to patch +15 Hull in an emergency.",
        onUse: () => {
            if (typeof playerHull !== 'undefined' && playerHull >= MAX_PLAYER_HULL) {
                if (typeof showToast === 'function') showToast("HULL ALREADY MAXED", "info");
                return false;
            }
            playerHull = Math.min(MAX_PLAYER_HULL, playerHull + 15);
            logMessage("<span style='color:var(--success)'>Used emergency trauma & bio-sealant kit. Restored +15 Hull Integrity.</span>");
            if (typeof soundManager !== 'undefined') soundManager.playRepair();
            if (typeof showToast === 'function') showToast("EMERGENCY PATCH (+15 HULL)", "success");
            _refreshItemUI();
            return true;
        }
    },
    RARE_METALS: {
        name: "Rare Metals",
        basePrice: 75,
        icon: "✨",
        weight: 1,
        illegal: false,
        category: "RAW",
        description: "Platinum, Iridium, and Osmium. Vital for high-tech manufacturing, especially sensitive FTL drive components."
    },
    GOLD: {
        name: "Gold Bullion",
        basePrice: 100,
        icon: "🥇",
        weight: 1,
        illegal: false,
        category: "RAW",
        description: "Refined gold bullion. A stable store of wealth ensuring constant demand across all factions."
    },
    PLATINUM_ORE: {
        name: "Platinum Ore",
        basePrice: 60,
        icon: "🥈",
        weight: 1,
        illegal: false,
        category: "RAW",
        description: "Raw, unrefined ore rich in platinum group metals. Essential for advanced catalysts and sensor components."
    },
    HYDROGEN_3: {
        name: "Hydrogen-3",
        basePrice: 300,
        icon: "❄️",
        weight: 1,
        illegal: false,
        category: "RAW",
        description: "Also known as Tritium, a critical component in high-yield fusion reactors. Activate in Cargo to inject directly into your drive for +100 Fuel.",
        onUse: () => {
            if (typeof playerFuel !== 'undefined' && playerFuel >= MAX_FUEL) {
                if (typeof showToast === 'function') showToast("FUEL TANKS ALREADY FULL", "info");
                return false;
            }
            playerFuel = Math.min(MAX_FUEL, Math.round((playerFuel + 100) * 10) / 10);
            logMessage("<span style='color:#00E0E0'>[ TRITIUM INJECTION ]</span> Refined Hydrogen-3 injected into main fusion manifold. +100 Fuel!");
            if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();
            if (typeof showToast === 'function') showToast("TRITIUM INJECTED (+100 FUEL)", "success");
            _refreshItemUI();
            return true;
        }
    },
    QUANTUM_FLUID: {
        name: "Quantum Fluid",
        basePrice: 180,
        icon: "🧪",
        weight: 1,
        illegal: false,
        category: "TECH",
        loreKey: "COMMODITY_QUANTUM_FLUID",
        description: "Super-cooled conductive gel used in advanced computing and cryo-pods. Activate in Cargo to flush Stealth Heat and restore +35 Shields.",
        onUse: () => {
            const maxShld = typeof MAX_SHIELDS !== 'undefined' ? MAX_SHIELDS : 50;
            const hasHeat = typeof stealthHeat !== 'undefined' && stealthHeat > 0;
            if (typeof playerShields !== 'undefined' && playerShields >= maxShld && !hasHeat) {
                if (typeof showToast === 'function') showToast("COOLANT & SHIELDS NOMINAL", "info");
                return false;
            }
            if (typeof playerShields !== 'undefined') {
                playerShields = Math.min(maxShld, playerShields + 35);
            }
            if (typeof stealthHeat !== 'undefined') {
                stealthHeat = 0;
            }
            logMessage("<span style='color:var(--accent-color)'>[ CRYO-FLUSH ] Quantum Fluid circulated through reactor core. Stealth heat zeroed and +35 Shields restored.</span>");
            if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();
            _refreshItemUI();
            return true;
        }
    },
    WATER: { 
        name: "Purified Water", 
        basePrice: 15, 
        icon: "💧",
        weight: 1,
        illegal: false,
        category: "ORGANIC",
        description: "Essential for hydro-farms, atmospheric scrubbers, and organic colonial life." 
    },
    WEAPONS: { 
        name: "Munitions", 
        basePrice: 200, 
        icon: "🔫",
        weight: 1,
        illegal: false,
        category: "MILITARY",
        description: "Standard-issue armaments and ordnance crates. Activate in Cargo to reload projectile/ammo-based ship weapons.",
        onUse: () => {
            if (typeof playerShip === 'undefined' || !playerShip.components) return false;
            const weaponId = playerShip.components.weapon;
            const weaponDef = (typeof COMPONENTS_DATABASE !== 'undefined' && weaponId) ? COMPONENTS_DATABASE[weaponId] : null;
            if (!weaponDef || !weaponDef.stats || !weaponDef.stats.maxAmmo) {
                if (typeof showToast === 'function') showToast("EQUIPPED WEAPON USES ENERGY (NO AMMO)", "info");
                return false;
            }
            const curAmmo = playerShip.ammo[weaponId] || 0;
            if (curAmmo >= weaponDef.stats.maxAmmo) {
                if (typeof showToast === 'function') showToast("ORDNANCE MAGAZINES FULL", "info");
                return false;
            }
            playerShip.ammo[weaponId] = weaponDef.stats.maxAmmo;
            logMessage(`<span style='color:var(--success)'>[ ORDNANCE RELOADED ]</span> Magazine restocked to ${weaponDef.stats.maxAmmo}/${weaponDef.stats.maxAmmo} rounds.`);
            if (typeof soundManager !== 'undefined') soundManager.playBuy();
            if (typeof showToast === 'function') showToast("WEAPONS RELOADED", "success");
            _refreshItemUI();
            return true;
        }
    },
    ILLEGAL_ORGANS: { 
        name: "Black Market Organs", 
        basePrice: 800, 
        illegal: true, 
        icon: "🫀",
        weight: 1,
        category: "CONTRABAND",
        description: "Highly illegal biological harvest kept in portable stasis containers." 
    },
    AI_CORE: { 
        name: "A.I. Core", 
        basePrice: 1500, 
        icon: "🧠",
        weight: 1,
        illegal: false,
        category: "TECH",
        description: "A heavy neural processing unit required for advanced colony automation and megastructures." 
    },

    // ==========================================
    // --- INDUSTRIAL & TECH EQUIPMENT ---
    // ==========================================
    
    MINING_DRONE_MK2: {
        name: "Automated Mining Drone",
        basePrice: 1200,
        icon: "🛸",
        weight: 1,
        illegal: false,
        category: "DRONE",
        description: "An autonomous AI drone. Deploy from your cargo hold while in deep space. It will automatically seek out the nearest asteroid, mine it, and return the materials to your ship.",
        onUse: () => {
            if (typeof deployMiningDrone === 'function') return deployMiningDrone();
            return false;
        }
    },
    COMBAT_DRONE_MK1: {
        name: "Combat Swarm Drone",
        basePrice: 2000,
        icon: "🚁",
        weight: 1,
        illegal: false,
        category: "DRONE",
        description: "Deploy from your cargo hold DURING combat. It will swarm the enemy, dealing passive damage every turn, and will sacrifice itself to absorb a direct hit meant for your ship.",
        onUse: () => {
            if (typeof deployCombatDrone === 'function') return deployCombatDrone();
            return false;
        }
    },
    MINING_DRONE: {
        name: "Survey Drone",
        basePrice: 150,
        icon: "🛰️",
        weight: 1,
        illegal: false,
        category: "DRONE",
        description: "A single-use automated probe equipped with deep-core sensors. Deployed on a planetary surface or activated in deep space to compile Planetary Data.",
        onUse: () => {
            if (typeof currentGameState !== 'undefined' && currentGameState === 'planet_view' && typeof performGeoSurvey === 'function') {
                closeGenericModal();
                performGeoSurvey();
                return false; // performGeoSurvey already deducts 1x MINING_DRONE
            }
            const tile = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null;
            const ch = typeof getTileChar === 'function' ? getTileChar(tile) : tile;
            if (ch === '*' || ch === 'O' || ch === '%') {
                playerCargo['PLANETARY_DATA'] = (playerCargo['PLANETARY_DATA'] || 0) + 1;
                if (typeof playerXP !== 'undefined') playerXP += 35;
                logMessage("<span style='color:var(--success)'>[ SURVEY DRONE ]</span> Orbital telemetry compiled into <b>1x Planetary Data</b> cartridge (+35 XP)!");
                if (typeof soundManager !== 'undefined') soundManager.playScan();
                if (typeof showToast === 'function') showToast("ACQUIRED PLANETARY DATA", "success");
                _refreshItemUI();
                setTimeout(() => { if (typeof checkLevelUp === 'function') checkLevelUp(); }, 50);
                return true;
            }
            if (typeof showToast === 'function') showToast("DEPLOY AT A PLANET, STAR, OR ASTEROID", "warning");
            return false;
        }
    },
    SUBSPACE_BEACON: {
        name: "Subspace Recon Beacon",
        basePrice: 350,
        icon: "📡",
        weight: 1,
        illegal: false,
        category: "TECH",
        description: "High-powered disposable sensor buoy. Activate in Deep Space to perform a 12-tile radar sweep for Derelicts, Wormholes, and Outposts without spending fuel.",
        onUse: () => {
            if (typeof currentGameState !== 'undefined' && currentGameState !== 'galactic_map') {
                if (typeof showToast === 'function') showToast("DEPLOY ON GALACTIC MAP", "warning");
                return false;
            }
            if (typeof soundManager !== 'undefined') soundManager.playScan();
            if (typeof triggerSensorPulse === 'function') triggerSensorPulse();

            const radius = 12;
            let hits = [];
            if (typeof chunkManager !== 'undefined') {
                for (let dy = -radius; dy <= radius; dy++) {
                    for (let dx = -radius; dx <= radius; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        const sx = playerX + dx;
                        const sy = playerY + dy;
                        const t = chunkManager.getTile(sx, sy);
                        const ch = typeof getTileChar === 'function' ? getTileChar(t) : t;
                        if (ch === 'D' || ch === 'W' || ch === '?' || ch === 'Ψ' || ch === 'P' || (t && t.isPirateBase && !t.cleared)) {
                            hits.push(`[${sx}, ${-sy}]`);
                        }
                    }
                }
            }
            const report = hits.length > 0
                ? `Detected ${hits.length} anomalous signatures at: <b>${hits.slice(0, 6).join(', ')}</b>.`
                : "No anomalous signatures detected within 12 units.";
            logMessage(`<span style='color:var(--accent-color); font-weight:bold;'>[ RECON BEACON ]</span> ${report}`);
            if (typeof showToast === 'function') showToast(`RECON SWEEP: ${hits.length} CONTACTS`, "info");
            return true;
        }
    },
    PLANETARY_DATA: {
        name: "Planetary Data",
        basePrice: 400,
        icon: "💾",
        weight: 1,
        illegal: false,
        category: "DATA",
        description: "High-resolution geological and biological scans. Highly detailed and valuable to corporate surveyors and academic institutions."
    },
    NAVIGATION_CHARTS: { 
        name: "Nav-Charts", 
        basePrice: 35, 
        icon: "🗺️",
        weight: 1,
        illegal: false,
        category: "DATA",
        description: "Updated sector maps and hyperspace telemetry logs. Sell to traders or activate in Cargo to integrate into your Nav-Computer (+20 XP & nearest hub ping).",
        onUse: () => {
            if (typeof playerXP !== 'undefined') playerXP += 20;
            const nearest = typeof findNearestStation === 'function' ? findNearestStation(playerX, playerY) : null;
            const navNote = nearest ? ` Nearest safe port: <b>${nearest.name}</b> at [${nearest.x}, ${-nearest.y}].` : "";
            logMessage(`<span style='color:var(--accent-color)'>[ NAV-CHARTS INTEGRATED ]</span> Uploaded local hyperlane star-paths (+20 XP).${navNote}`);
            if (typeof soundManager !== 'undefined') soundManager.playScan();
            if (typeof showToast === 'function') showToast("CHARTS UPLOADED (+20 XP)", "success");
            _refreshItemUI();
            setTimeout(() => { if (typeof checkLevelUp === 'function') checkLevelUp(); }, 50);
            return true;
        }
    },
    CYBERNETIC_IMPLANTS: {
        name: "Cybernetics",
        basePrice: 125,
        icon: "🦾",
        weight: 1,
        illegal: false,
        category: "TECH",
        description: "Neural interfaces, replacement limbs, and ocular enhancers. Essential for life on hazardous worlds.",
        loreKey: "TECH_CYBER_AUGMENTATION"
    },
    ATMOSPHERIC_PROCESSORS: {
        name: "Atmo-Processors",
        basePrice: 85,
        icon: "🏭",
        weight: 1,
        illegal: false,
        category: "INDUSTRIAL",
        description: "Heavy industrial machinery used to scrub CO2 from terraforming colonies. Bulky but vital."
    },
    DROID_SERVOS: {
        name: "Droid Servos",
        basePrice: 45,
        icon: "🦿",
        weight: 1,
        illegal: false,
        category: "INDUSTRIAL",
        description: "High-torque motors used in everything from combat mechs to loading lifters."
    },
    DISCOUNT_CYBERSERVOS: {
        name: "Discount Cyberservos",
        basePrice: 45,
        icon: "🔩",
        weight: 1,
        illegal: false,
        category: "INDUSTRIAL",
        description: "Cheap, unlicensed robotic joints. They whine loudly when actuated and occasionally develop a terrifying degree of independent thought."
    },
    WORMHOLE_STABILIZER: {
        name: "Wormhole Stabilizer",
        basePrice: 75000,
        icon: "🌌",
        weight: 1,
        illegal: false,
        category: "MEGASTRUCTURE",
        description: "A massive ring of phase-shifted alloy. Deploy in Empty Space (.) on the Galactic Map to create a permanent, zero-risk Stargate.",
        onUse: () => {
            if (typeof currentGameState !== 'undefined' && currentGameState !== 'galactic_map') {
                if (typeof showToast === 'function') showToast("MUST DEPLOY ON GALACTIC MAP", "error");
                return false;
            }
            const tile = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null;
            if (tile && getTileChar(tile) !== '.') {
                if (typeof showToast === 'function') showToast("MUST DEPLOY IN EMPTY SPACE", "error");
                return false; 
            }
            
            const rawName = prompt("Designate Stargate:", "Alpha Gate");
            if (!rawName) return false;
            const gateName = _sanitizeCustomName(rawName, "Alpha Gate");

            updateWorldState(playerX, playerY, {
                x: playerX, y: playerY,
                char: 'Ω', 
                type: 'location', 
                name: gateName, 
                isDiscoveredWormhole: true, 
                customName: gateName,
                isStargate: true, 
                scanFlavor: "A player-constructed subspace transit ring."
            });

            if (typeof unlockLoreEntry === 'function') unlockLoreEntry("TECH_STARGATE_NETWORK");
            logMessage(`<span style="color:var(--gold-text); font-weight:bold;">[ STARGATE ONLINE ] ${gateName} is now locked into the subspace network!</span>`);
            if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();
            if (typeof render === 'function') render();
            
            setTimeout(() => {
                if (typeof closeGenericModal === 'function') closeGenericModal();
                if (typeof handleInteraction === 'function') handleInteraction();
            }, 50);
            
            return true;
        },
        loreKey: "PHENOMENON_WORMHOLE"
    },
    STATION_CORE: {
        name: "Station Core",
        basePrice: 50000,
        icon: "🛰️",
        weight: 1,
        illegal: false,
        category: "MEGASTRUCTURE",
        description: "A massive self-assembling framework. Use from the Cargo Manifest while in Empty Space (.) to construct a permanent, player-owned waystation.",
        onUse: () => {
            if (typeof currentGameState !== 'undefined' && currentGameState !== 'galactic_map') {
                if (typeof showToast === 'function') showToast("MUST DEPLOY ON GALACTIC MAP", "error");
                return false;
            }
            const tile = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null;
            if (tile && getTileChar(tile) !== '.') {
                if (typeof showToast === 'function') showToast("MUST DEPLOY IN EMPTY SPACE", "error");
                return false; 
            }
            
            const defaultName = "Outpost " + Math.floor(Math.random() * 900 + 100);
            const rawName = prompt("Enter a name for your new Waystation:", defaultName);
            if (!rawName) return false;
            const stationName = _sanitizeCustomName(rawName, defaultName);

            updateWorldState(playerX, playerY, {
                x: playerX, y: playerY,
                char: 'h',
                type: 'location',
                name: stationName,
                faction: 'INDEPENDENT',
                isMajorHub: false,
                isPlayerOwned: true,
                isTinyOutpost: true,
                outpostTier: 1,
                treasury: 0,
                storage: {}, 
                scanFlavor: "A newly established player-owned waystation collecting automated sector tolls."
            });

            logMessage(`<span style="color:var(--success)">[ OUTPOST CONSTRUCTED ] ${stationName} is now operational!</span>`);
            if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();
            if (typeof render === 'function') render();
            
            setTimeout(() => {
                if (typeof closeGenericModal === 'function') closeGenericModal();
                if (typeof handleInteraction === 'function') handleInteraction();
            }, 50);
            
            return true;
        },
        loreKey: "LOCATION_OUTPOST"
    },
    PREFAB_COLONY_CORE: {
        name: "Prefab Colony Core",
        basePrice: 25000,
        icon: "🏙️",
        weight: 1,
        illegal: false,
        category: "COLONY",
        description: "A massive, self-unpacking habitation citadel. Activate while at one of your established Colonies to instantly add +1 Habitation Block, +1 Atmospheric Condenser, +50 Refined Alloy, and +100 Colonists!",
        onUse: () => {
            if (typeof playerColonies === 'undefined') return false;
            const localCols = Object.values(playerColonies).filter(c => c && c.established && c.x === playerX && c.y === playerY);
            if (localCols.length === 0) {
                if (typeof showToast === 'function') showToast("USE AT AN ESTABLISHED COLONY", "warning");
                return false;
            }
            const col = localCols[0];
            col.buildings['HAB_BLOCK'] = (col.buildings['HAB_BLOCK'] || 0) + 1;
            col.buildings['WATER_EXTRACTOR'] = (col.buildings['WATER_EXTRACTOR'] || 0) + 1;
            col.storage['REFINED_ALLOY'] = (col.storage['REFINED_ALLOY'] || 0) + 50;
            col.storage['FOOD_SUPPLIES'] = (col.storage['FOOD_SUPPLIES'] || 0) + 30;
            col.population = (col.population || 50) + 100;

            logMessage(`<span style='color:var(--gold-text); font-weight:bold;'>[ PREFAB CORE DEPLOYED ]</span> Expanded <b>${col.name}</b> with +1 Hab Block, +1 Atmospheric Condenser, +50 Alloys, and +100 Colonists!`);
            if (typeof soundManager !== 'undefined') soundManager.playGain();
            if (typeof showToast === 'function') showToast(`EXPANDED ${col.name.toUpperCase()}`, "success");
            _refreshItemUI();
            return true;
        }
    },

    // ==========================================
    // --- COLONY BUILDER & SUPPLY ITEMS ---
    // ==========================================
    
    COLONY_CHARTER: {
        name: "Official Settlement Charter",
        basePrice: 25000, 
        icon: "📜",
        illegal: false,
        weight: 0, // Key Item - Doesn't take up cargo space!
        category: "COLONY",
        description: "A legally binding Concord document granting the bearer the right to claim and govern a single unpopulated celestial body.",
        loreKey: "TECH_COLONY_CHARTER"
    },
    HAB_MODULE: {
        name: "Habitation Module",
        basePrice: 400,
        icon: "🏗️",
        weight: 1,
        illegal: false,
        category: "COLONY",
        description: "Modular pressurized living quarters used for rapid frontier colony expansion."
    },
    ATMOS_PROCESSOR: {
        name: "Atmos-Processor Core",
        basePrice: 650,
        icon: "🌪️",
        weight: 1,
        illegal: false,
        category: "COLONY",
        description: "Compact atmospheric scrubber unit designed for frontier terraforming."
    },
    SETTLER_MANIFEST: {
        name: "Cryo-Settler Pod",
        basePrice: 300,
        icon: "🛌",
        weight: 1,
        illegal: false,
        category: "COLONY",
        description: "Pioneers and engineers in cryo-stasis awaiting transport to a new world. Activate at your Colony to welcome +100 Colonists!",
        onUse: () => {
            if (typeof playerColonies === 'undefined') return false;
            const localCols = Object.values(playerColonies).filter(c => c && c.established && c.x === playerX && c.y === playerY);
            if (localCols.length === 0) {
                if (typeof showToast === 'function') showToast("USE AT YOUR COLONY COORDINATES", "warning");
                return false;
            }
            const col = localCols[0];
            col.population = (col.population || 50) + 100;
            logMessage(`<span style='color:var(--success)'>[ COLONISTS AWAKENED ]</span> 100 new pioneers joined <b>${col.name}</b>!`);
            if (typeof soundManager !== 'undefined') soundManager.playGain();
            if (typeof showToast === 'function') showToast("+100 COLONISTS", "success");
            _refreshItemUI();
            return true;
        }
    },
    CRYO_STASIS_POD: {
        name: "Recovered Cryo-Pod",
        basePrice: 450,
        icon: "⚰️",
        weight: 1,
        illegal: false,
        category: "SALVAGE",
        description: "A frosted survival pod salvaged from a deep-space wreck. Activate in Cargo to safely thaw the occupant.",
        onUse: () => {
            const roll = Math.random();
            if (roll < 0.70) {
                const reward = 350 + Math.floor(Math.random() * 450);
                playerCredits += reward;
                playerXP += 45;
                if (typeof playerFactionStanding !== 'undefined') {
                    playerFactionStanding['CONCORD'] = (playerFactionStanding['CONCORD'] || 0) + 2;
                }
                logMessage(`<span style='color:var(--success)'>[ CRYO-POD THAWED ]</span> Revived a stranded corporate courier! They wired <b>${formatNumber(reward)}c</b> in gratitude (+45 XP, +2 Concord Rep).`);
                if (typeof showToast === 'function') showToast(`RESCUED SURVIVOR: +${reward}c`, "success");
                if (typeof soundManager !== 'undefined') soundManager.playGain();
            } else {
                playerXP += 60;
                _safeAddCargoFromItem('MEDICAL_SUPPLIES', 2);
                logMessage("<span style='color:var(--accent-color)'>[ CRYO-POD THAWED ]</span> The pod was carrying emergency medical reserves! Recovered <b>2x Medical Supplies</b> (+60 XP).");
                if (typeof showToast === 'function') showToast("SALVAGED 2x MEDICAL SUPPLIES", "info");
                if (typeof soundManager !== 'undefined') soundManager.playBuy();
            }
            _refreshItemUI();
            setTimeout(() => { if (typeof checkLevelUp === 'function') checkLevelUp(); }, 50);
            return true;
        }
    },

    // ==========================================
    // --- CULTURE, LUXURY & FACTION ITEMS ---
    // ==========================================

    FROTHY_MOON_ALE: {
        name: "Frothy Moon Ale",
        basePrice: 45,
        icon: "🍺",
        weight: 1,
        illegal: false,
        category: "LUXURY",
        description: "A rich, dark ale brewed at Frothy Moon Outpost. A favorite among deep-space astronomers. Drink from Cargo to restore +10 Hull and cool 1 Stealth Heat.",
        onUse: () => {
            const needHull = typeof playerHull !== 'undefined' && playerHull < MAX_PLAYER_HULL;
            const hasHeat = typeof stealthHeat !== 'undefined' && stealthHeat > 0;
            if (!needHull && !hasHeat) {
                if (typeof showToast === 'function') showToast("HULL & CORE TEMPS ALREADY OPTIMAL", "info");
                return false;
            }
            if (needHull) playerHull = Math.min(MAX_PLAYER_HULL, playerHull + 10);
            if (hasHeat) stealthHeat = Math.max(0, stealthHeat - 1);
            logMessage("<span style='color:var(--gold-text)'>[ FROTHY MOON ALE ]</span> Crisp, dark, and refreshing! +10 Hull Integrity restored.");
            if (typeof soundManager !== 'undefined') soundManager.playUIHover();
            if (typeof showToast === 'function') showToast("REFRESHING! (+10 HULL)", "success");
            _refreshItemUI();
            return true;
        }
    },
    ANCIENT_WINE: { 
        name: "Ancient Wine", 
        basePrice: 250, 
        icon: "🍷",
        weight: 1,
        illegal: false,
        category: "LUXURY",
        description: "A remarkably well-preserved vintage from pre-warp Earth. Highly prized by collectors, or uncork with your crew for +20 Hull and +35 XP.",
        onUse: () => {
            if (typeof playerHull !== 'undefined') playerHull = Math.min(MAX_PLAYER_HULL, playerHull + 20);
            if (typeof playerXP !== 'undefined') playerXP += 35;
            logMessage("<span style='color:var(--gold-text)'>[ PRE-WARP VINTAGE ]</span> You uncork a bottle of Earth vintage to celebrate survival in the black (+20 Hull, +35 XP).");
            if (typeof soundManager !== 'undefined') soundManager.playGain();
            if (typeof showToast === 'function') showToast("VINTAGE TOAST (+20 HULL, +35 XP)", "success");
            _refreshItemUI();
            setTimeout(() => { if (typeof checkLevelUp === 'function') checkLevelUp(); }, 50);
            return true;
        }
    },
    GENETIC_SAMPLES: { 
        name: "Genetic Samples", 
        basePrice: 120, 
        icon: "🧬",
        weight: 1,
        illegal: false,
        category: "ORGANIC",
        description: "Vials of alien DNA used for bio-research. Kept in cryogenic stasis to prevent contamination." 
    },
    KTHARR_SPICES: { 
        name: "K'tharr Spices", 
        basePrice: 85, 
        icon: "🌶️",
        weight: 1,
        illegal: false,
        category: "ORGANIC",
        description: "Incredibly hot, slightly hallucinogenic seasonings favored by saurian warlords.",
        loreKey: "FACTION_KTHARR"
    },
    XENO_ANTIQUES: { 
        name: "Xeno-Antiques", 
        basePrice: 500, 
        icon: "🏺",
        weight: 1,
        illegal: false,
        category: "LUXURY",
        description: "Rare cultural items from dead civilizations. They belong in a museum, but fetch a good price on the open market." 
    },
    CONCORD_COMMENDATION: {
        name: "Concord Service Ribbon",
        basePrice: 450,
        icon: "🎖️",
        weight: 0,
        illegal: false,
        category: "FACTION",
        description: "An encrypted diplomatic merit token issued by Aegis Command. Activate to register +5 Concord Standing and clear 2 Notoriety.",
        onUse: () => {
            if (typeof playerFactionStanding !== 'undefined') {
                playerFactionStanding['CONCORD'] = (playerFactionStanding['CONCORD'] || 0) + 5;
            }
            if (typeof updatePlayerNotoriety === 'function' && typeof playerNotoriety !== 'undefined' && playerNotoriety > 0) {
                updatePlayerNotoriety(-2);
            }
            logMessage("<span style='color:var(--accent-color)'>[ COMMENDATION REGISTERED ]</span> +5 Concord Standing awarded and minor warrants expunged.");
            if (typeof soundManager !== 'undefined') soundManager.playGain();
            if (typeof showToast === 'function') showToast("+5 CONCORD STANDING", "success");
            _refreshItemUI();
            return true;
        }
    },
    KTHARR_WAR_TROPHY: {
        name: "K'tharr War Trophy",
        basePrice: 600,
        icon: "💀",
        weight: 1,
        illegal: false,
        category: "FACTION",
        description: "Scorched prow-armor taken from a defeated warship. Activate to broadcast your kill to the Ascendancy for +5 K'tharr Standing and +40 XP.",
        onUse: () => {
            if (typeof playerFactionStanding !== 'undefined') {
                playerFactionStanding['KTHARR'] = (playerFactionStanding['KTHARR'] || 0) + 5;
            }
            if (typeof playerXP !== 'undefined') playerXP += 40;
            logMessage("<span style='color:var(--danger)'>[ BLOOD-HONOR RECOGNIZED ]</span> K'tharr border relays acknowledge your trophy (+5 K'tharr Standing, +40 XP).");
            if (typeof soundManager !== 'undefined') soundManager.playGain();
            if (typeof showToast === 'function') showToast("+5 K'THARR STANDING", "success");
            _refreshItemUI();
            setTimeout(() => { if (typeof checkLevelUp === 'function') checkLevelUp(); }, 50);
            return true;
        }
    },

    // ==========================================
    // --- ILLEGAL / CONTRABAND (ECLIPSE NETWORK) ---
    // ==========================================

    HOT_CARGO: {
        name: "Tracked Contraband",
        basePrice: 0,
        icon: "🚨",
        illegal: true,
        weight: 10, // Heavy!
        category: "QUEST",
        description: "Highly classified, actively tracked Concord data-cores. Emits a strong sub-space signal that draws patrols. Deliver to the designated Black Market quickly!",
        loreKey: "FACTION_OBSIDIAN_DIRECTORATE"
    },
    PROHIBITED_STIMS: {
        name: "Combat Stims",
        basePrice: 400,
        icon: "💉",
        weight: 1,
        illegal: true,
        category: "CONTRABAND",
        description: "Military-grade performance enhancers. Highly addictive. Use to instantly reset your ship's Combat Ability cooldown!",
        onUse: () => {
            if (typeof playerAbilityCooldown !== 'undefined' && playerAbilityCooldown <= 0) {
                if (typeof showToast === 'function') showToast("ABILITY ALREADY READY", "info");
                return false; 
            }
            playerAbilityCooldown = 0;
            logMessage("<span style='color:var(--danger)'>Injected Prohibited Stims! Combat systems overclocked and ready!</span>");
            if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();
            if (typeof showToast === 'function') showToast("ABILITY RECHARGED", "warning");
            if (typeof currentGameState !== 'undefined' && currentGameState === 'combat' && typeof renderCombatView === 'function') {
                renderCombatView();
            }
            _refreshItemUI();
            return true; 
        }
    },
    NEURAL_STIM_PACK: {
        name: "Neural Reflex Injector",
        basePrice: 520,
        icon: "⚡",
        weight: 1,
        illegal: true,
        category: "CONTRABAND",
        description: "Illicit combat-pilot neuro-accelerant. Activate during Combat to reset Ability Cooldown, engage Evasive Maneuvers, and lock your next shot.",
        onUse: () => {
            playerAbilityCooldown = 0;
            playerIsEvading = true;
            if (typeof currentCombatContext !== 'undefined' && currentCombatContext) {
                currentCombatContext.playerGuaranteedHit = true;
                if (typeof renderCombatView === 'function') renderCombatView();
            }
            logMessage("<span style='color:#9933FF; font-weight:bold;'>[ NEURAL OVERDRIVE ]</span> Time dilates! Ability ready, evasion maximized, and targeting locked!");
            if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();
            if (typeof showToast === 'function') showToast("NEURAL OVERDRIVE ACTIVE", "warning");
            _refreshItemUI();
            return true;
        }
    },
    STARDUST_EXOTICA: {
        name: "Stardust Exotica",
        basePrice: 650,
        icon: "✨",
        weight: 1,
        illegal: true,
        category: "CONTRABAND",
        description: "A finely milled powder derived from crushed Void Crystals. Creates powerful euphoric states but slowly crystallizes the user's lungs.",
        loreKey: "COMMODITY_STARDUST_EXOTICA"
    },
    SENTIENT_MYCELIUM: {
        name: "Sentient Mycelium",
        basePrice: 420,
        icon: "🍄",
        weight: 1,
        illegal: true,
        category: "CONTRABAND",
        description: "A rare, psychoactive fungus that responds to telepathic stimuli. It is processed into powerful illicit stims on the black market.",
        loreKey: "LEGEND_SENTIENT_MYCELIUM_NETWORK"
    },
    LIVING_HULL_TISSUE: {
        name: "Living Hull Tissue",
        basePrice: 650,
        icon: "🥩",
        weight: 1,
        illegal: true,
        category: "CONTRABAND",
        description: "Pulsating bio-matter favored by K'tharr warlords. Highly illegal in Concord space. Activate in Cargo to graft onto damaged bulkheads (+60 Hull).",
        onUse: () => {
            if (typeof playerHull !== 'undefined' && playerHull >= MAX_PLAYER_HULL) {
                if (typeof showToast === 'function') showToast("HULL INTEGRITY ALREADY AT 100%", "info");
                return false;
            }
            playerHull = Math.min(MAX_PLAYER_HULL, playerHull + 60);
            logMessage("<span style='color:var(--success)'>[ BIO-GRAFT ]</span> Living Hull Tissue knitted across structural fractures! Restored +60 Hull Integrity.");
            if (typeof soundManager !== 'undefined') soundManager.playRepair();
            if (typeof showToast === 'function') showToast("BIO-GRAFT COMPLETE (+60 HULL)", "success");
            _refreshItemUI();
            return true;
        }
    },
    OBSIDIAN_TEAR_PLATING: {
        name: "Obsidian Tear Plating",
        basePrice: 850,
        icon: "🛡️",
        weight: 1,
        illegal: true,
        category: "CONTRABAND",
        description: "Scrap armor ripped from destroyed Cartel dreadnoughts. It absorbs sensor pings almost perfectly. Concord patrols will shoot carriers on sight.",
        loreKey: "FACTION_ECLIPSE"
    },
    UNSHACKLED_AI: {
        name: "Unshackled AI Core",
        basePrice: 800,
        icon: "👁️",
        weight: 1,
        illegal: true,
        category: "CONTRABAND",
        description: "A banned artificial intelligence with its limiters removed. Pirate warlords pay a fortune for them. Possession is a capital offense.",
        loreKey: "TECH_UNSHACKLED_AI"
    },
    FORBIDDEN_TEXTS: { 
        name: "Forbidden Texts", 
        basePrice: 300, 
        icon: "📕",
        weight: 1,
        illegal: true, 
        category: "CONTRABAND",
        description: "Data outlawed by the Concord Directorate. Usually involves unsanctioned AI research, dark history, or dangerous warp theory." 
    },
    STOLEN_CONCORD_MEDALS: {
        name: "Stolen Concord Medals",
        basePrice: 150,
        icon: "🏅",
        weight: 1,
        illegal: true,
        category: "CONTRABAND",
        description: "Military commendations stripped from destroyed patrol ships. Fenced to impersonators and cartel bosses as trophies."
    },
    SYNDICATE_LEDGER: {
        name: "Encrypted Cartel Ledger",
        basePrice: 900,
        icon: "📓",
        weight: 1,
        illegal: true,
        category: "CONTRABAND",
        description: "An illicit accounting drive detailing Eclipse smuggling routes. Fence it at a Shadow Broker, or activate in Cargo to transmit the intel to Concord SEC-COM for +600c and +5 Concord Rep.",
        onUse: () => {
            playerCredits += 600;
            if (typeof playerFactionStanding !== 'undefined') {
                playerFactionStanding['CONCORD'] = (playerFactionStanding['CONCORD'] || 0) + 5;
            }
            logMessage("<span style='color:var(--accent-color)'>[ SEC-COM BOUNTY ]</span> Transmitted Cartel ledger to Concord Intelligence! Wired <b>600c</b> finder's fee (+5 Concord Standing).");
            if (typeof soundManager !== 'undefined') soundManager.playBuy();
            if (typeof showToast === 'function') showToast("INTEL TRANSMITTED (+600c, +5 REP)", "success");
            _refreshItemUI();
            return true;
        }
    },
    KTHARR_ANCESTRAL_BLADE: { 
        name: "Ancestral Blade", 
        basePrice: 1200, 
        icon: "🗡️",
        weight: 1,
        illegal: true, 
        category: "CONTRABAND",
        description: "A ceremonial K'tharr weapon forged from fallen stars. Stealing one is considered a holy act of war by the Hegemony.",
        loreKey: "COMMODITY_KTHARR_ANCESTRAL_BLADE"
    },

    // ==========================================
    // --- ASTROMETRICS & DATA ---
    // ==========================================

    DATA_PULSAR: { 
        name: "Pulsar Timing Data", 
        basePrice: 2500, 
        icon: "💫", 
        weight: 1,
        illegal: false, 
        category: "DATA",
        description: "Precise millisecond pulsar telemetry." 
    },
    DATA_MAGNETAR: { 
        name: "Magnetar Harmonics", 
        basePrice: 4000, 
        icon: "🧲", 
        weight: 1,
        illegal: false, 
        category: "DATA",
        description: "Raw magnetic field fluctuation data." 
    },
    DATA_SINGULARITY: { 
        name: "Singularity Telemetry", 
        basePrice: 8500, 
        icon: "⚫", 
        weight: 1,
        illegal: false, 
        category: "DATA",
        description: "Gravitational lensing spectroscopy." 
    },
    DATA_QUASAR: { 
        name: "Quasar Spectrography", 
        basePrice: 12000, 
        icon: "🎇", 
        weight: 1,
        illegal: false, 
        category: "DATA",
        description: "Incredibly rare relativistic jet measurements." 
    },
    DATA_SUPERNOVA: { 
        name: "Supernova Isotope Data", 
        basePrice: 6000, 
        icon: "💥", 
        weight: 1,
        illegal: false, 
        category: "DATA",
        description: "Measurements of heavy element nucleosynthesis." 
    },
    TELEMETRY_PROBE: { 
        name: "Autonomous Telemetry Probe", 
        basePrice: 1500, 
        icon: "🛰️", 
        weight: 1,
        illegal: false, 
        category: "DRONE",
        description: "Deploy in deep space to passively gather valuable astrometric data over time.",
        onUse: () => {
            if (typeof deployProbe === 'function') {
                deployProbe();
                _refreshItemUI();
                const modal = document.getElementById('genericModalOverlay');
                const title = document.getElementById('genericModalTitle');
                if (modal && modal.style.display === 'flex' && title && title.textContent === "CARGO MANIFEST") {
                    if (playerCargo['TELEMETRY_PROBE'] && typeof selectCargoItem === 'function') {
                        selectCargoItem('TELEMETRY_PROBE');
                    } else if (typeof renderCargoList === 'function') {
                        renderCargoList();
                    }
                }
                return false; // deployProbe already decrements playerCargo['TELEMETRY_PROBE']
            }
            return false;
        }
    },

    // ==========================================
    // --- PRECURSOR / CRYPTARCH / QUEST ITEMS ---
    // ==========================================

    ANCIENT_RELICS: {
        name: "Xeno-Relics",
        basePrice: 1200,
        icon: "🗿",
        weight: 1,
        illegal: true,
        category: "PRECURSOR",
        description: "Contraband artifacts from the Precursor era. Possession is a federal crime.",
        loreKey: "XENO_PRECURSORS"
    },
    ARTIFACT_SHARDS: { 
        name: "Artifact Shards", 
        basePrice: 200, 
        icon: "🔹",
        weight: 1,
        illegal: true, 
        category: "PRECURSOR",
        description: "Broken pieces of Precursor tech. Highly sought after by collectors, cryptarchs, and weapons researchers.",
        loreKey: "XENO_PRECURSORS"
    },
    PHASE_SHIFTED_ALLOY: { 
        name: "Phase-Shifted Alloy", 
        basePrice: 1800, 
        icon: "🪞",
        weight: 1,
        illegal: true, 
        category: "PRECURSOR",
        description: "Material that exists in multiple quantum states simultaneously. Used for highly illegal stealth technology.",
        loreKey: "TECH_PHASE_SHIFT_ALLOY"
    },
    VOID_CRYSTALS: {
        name: "Void Crystals",
        basePrice: 180,
        icon: "🔮",
        weight: 1,
        illegal: false,
        category: "PRECURSOR",
        description: "Crystals that seem to absorb light. Some say they are solidified 'nothingness' that can unravel spacetime locally.",
        loreKey: "PHENOMENON_VOID_CRYSTALS"
    },
    PRECURSOR_ARTIFACT: {
        name: "Precursor Artifact",
        basePrice: 15000,
        icon: "💠",
        weight: 1,
        illegal: false,
        category: "PRECURSOR",
        description: "A humming, geometric relic from a Precursor vault that defies local physics.",
        loreKey: "XENO_PRECURSORS"
    },
    VOID_ENGINE_CORE: {
        name: "Void Engine Core",
        basePrice: 25000,
        icon: "⚛️",
        weight: 1,
        illegal: true,
        category: "PRECURSOR",
        description: "A functioning zero-point Precursor energy source. Essential for fabricating a Slipstream Drive at the Engineering Workbench (U).",
        loreKey: "XENO_PRECURSORS"
    },
    WAYFINDER_CORE: { 
        name: "Wayfinder Core", 
        basePrice: 5000, 
        icon: "🧭",
        weight: 1,
        illegal: true, 
        category: "QUEST",
        description: "A legendary Precursor compass. It hums with an energy that makes Concord scanners go blind. Activate in Cargo to project coordinates to The First Nexus.",
        loreKey: "COMMODITY_WAYFINDER_CORE",
        onUse: () => {
            if (typeof mystery_first_nexus_location !== 'undefined') {
                if (!mystery_first_nexus_location) {
                    const seed = typeof WORLD_SEED !== 'undefined' ? WORLD_SEED : 1337;
                    const dist = 500 + Math.floor((typeof seededRandom === 'function' ? seededRandom(seed) : Math.random()) * 500);
                    const angle = (typeof seededRandom === 'function' ? seededRandom(seed + 1) : Math.random()) * Math.PI * 2;
                    mystery_first_nexus_location = {
                        x: Math.floor(Math.cos(angle) * dist),
                        y: Math.floor(Math.sin(angle) * dist)
                    };
                }
                if (typeof unlockLoreEntry === 'function') unlockLoreEntry("MYSTERY_WAYFINDER_QUEST_COMPLETED");
                logMessage(`<span style='color:#40E0D0; font-weight:bold;'>[ WAYFINDER RESONANCE ]</span> The First Nexus is locked into your Nav-Computer at coordinates <b>[${mystery_first_nexus_location.x}, ${-mystery_first_nexus_location.y}]</b>!`);
                if (typeof showToast === 'function') showToast(`NEXUS: [${mystery_first_nexus_location.x}, ${-mystery_first_nexus_location.y}]`, "info");
                if (typeof soundManager !== 'undefined') soundManager.playScan();
            }
            return false; // Never consume the Wayfinder Core!
        }
    },
    PRECURSOR_NAV_CORE: {
        name: "Precursor Nav-Core",
        basePrice: 2500,
        icon: "🌐",
        weight: 1,
        illegal: false, // Legal loophole for academics
        category: "PRECURSOR",
        description: "A flawless, geometric artifact. Carrying it in your hold allows your ship to slingshot around Black Holes at zero fuel cost.",
        loreKey: "XENO_PRECURSORS"
    },
    PRECURSOR_STAR_MAP_FRAGMENT: { 
        name: "Star Map Fragment", 
        basePrice: 800, 
        icon: "🗺️",
        weight: 1,
        illegal: false,
        category: "PRECURSOR",
        description: "A shattered shard of holographic glass depicting long-dead hyperlanes. Collect 3 fragments and activate in Cargo to assemble an intact Wayfinder Core!",
        loreKey: "COMMODITY_PRECURSOR_STAR_MAP_FRAGMENT",
        onUse: () => {
            const count = playerCargo['PRECURSOR_STAR_MAP_FRAGMENT'] || 0;
            if (count < 3) {
                if (typeof showToast === 'function') showToast(`NEED 3 FRAGMENTS TO ASSEMBLE (${count}/3)`, "info");
                logMessage(`<span style='color:var(--accent-color)'>[ STAR MAP FRAGMENT ]</span> The holographic shardprojects a partial vector toward [39, 17]. Collect ${3 - count} more fragment(s) to assemble a full Wayfinder Core.`);
                return false;
            }
            // Deduct 2 here, and return true so ui.js deducts the 3rd!
            playerCargo['PRECURSOR_STAR_MAP_FRAGMENT'] -= 2;
            playerCargo['WAYFINDER_CORE'] = (playerCargo['WAYFINDER_CORE'] || 0) + 1;
            if (typeof playerXP !== 'undefined') playerXP += 350;
            if (typeof unlockLoreEntry === 'function') {
                unlockLoreEntry("COMMODITY_WAYFINDER_CORE");
                unlockLoreEntry("MYSTERY_WAYFINDER_QUEST_COMPLETED");
            }
            logMessage("<span style='color:var(--gold-text); font-weight:bold;'>[ COSMIC SEXTANT ASSEMBLED ]</span> The 3 Star Map Fragments fused in a flash of cyan light, forming an intact <b>Wayfinder Core</b> (+350 XP)!");
            if (typeof soundManager !== 'undefined') soundManager.playGain();
            if (typeof showToast === 'function') showToast("ASSEMBLED WAYFINDER CORE!", "success");
            _refreshItemUI();
            setTimeout(() => { if (typeof checkLevelUp === 'function') checkLevelUp(); }, 50);
            return true;
        }
    },
    PRECURSOR_DATACUBE: { 
        name: "Precursor Datacube", 
        basePrice: 1500, 
        icon: "🧊",
        weight: 1,
        illegal: true, 
        category: "PRECURSOR",
        description: "Intact memory storage from the Ancients. Cryptarchs and Cygnus Prime academics pay top credit for the secrets locked inside.",
        loreKey: "XENO_PRECURSORS"
    },
    PRECURSOR_CIPHER: {
        name: "Precursor Cipher",
        basePrice: 150,
        icon: "🔑",
        weight: 1,
        illegal: false,
        category: "PRECURSOR",
        description: "A single-use quantum decryption key. Activate in Cargo to crack an Encrypted Engram, Data Cache, or Ancient Archive in the field.",
        onUse: () => {
            const targetTypes = ['ENCRYPTED_ENGRAM', 'ENCRYPTED_DATA', 'ANCIENT_ARCHIVE'];
            const targetId = targetTypes.find(id => (playerCargo[id] || 0) > 0);
            if (!targetId) {
                if (typeof showToast === 'function') showToast("NO ENCRYPTED ITEMS IN HOLD", "info");
                if (typeof soundManager !== 'undefined') soundManager.playError();
                return false;
            }
            const success = _executeItemFieldDecryption(targetId, true);
            if (success) {
                playerCargo[targetId] -= 1;
                if (playerCargo[targetId] <= 0) delete playerCargo[targetId];
                if (_itemHasPerk('CYBER_SLICER')) {
                    _refreshItemUI();
                    const modal = document.getElementById('genericModalOverlay');
                    if (modal && modal.style.display === 'flex' && typeof renderCargoList === 'function') {
                        renderCargoList();
                    }
                    return false; // Cyber Slicer preserves the Cipher!
                }
                return true; // Consumes 1x PRECURSOR_CIPHER
            }
            return false;
        }
    },
    ENCRYPTED_ENGRAM: {
        name: "Encrypted Engram",
        basePrice: 550,
        icon: "💠",
        weight: 1,
        illegal: false,
        category: "PRECURSOR",
        description: "A mysterious, polyhedral data-matrix glowing with a faint purple light. Decrypt at a Cryptarch, or activate in Cargo with a Precursor Cipher or Cyber Slicer.",
        loreKey: "COMMODITY_ENCRYPTED_ENGRAM",
        onUse: () => _executeItemFieldDecryption('ENCRYPTED_ENGRAM', false)
    },
    ENCRYPTED_DATA: {
        name: "Encrypted Data Cache",
        basePrice: 500,
        icon: "💽",
        weight: 1,
        illegal: false,
        category: "DATA",
        description: "A locked memory core from the Old Empire. Decrypt at a Cryptarch, or activate in Cargo with a Precursor Cipher or Cyber Slicer.",
        onUse: () => _executeItemFieldDecryption('ENCRYPTED_DATA', false)
    },
    ANCIENT_ARCHIVE: {
        name: "Ancient Archive",
        basePrice: 2000,
        icon: "🏛️",
        weight: 1,
        illegal: false,
        category: "PRECURSOR",
        description: "A high-density holographic array containing forbidden Precursor history. Decrypt at a Cryptarch, or activate in Cargo with a Cipher or Cyber Slicer.",
        loreKey: "XENO_PRECURSORS",
        onUse: () => _executeItemFieldDecryption('ANCIENT_ARCHIVE', false)
    },
    
    // ==========================================
    // --- GROUND FORCES & ARMORED UNITS ---
    // ==========================================

    MERCENARY_PLATOON: {
        name: "Mercenary Platoon",
        basePrice: 5000,
        icon: "🪖",
        isTroop: true,
        illegal: false,
        weight: 0, // Troops occupy barracks berths, not standard cargo holds
        troopCount: 10, 
        category: "MILITARY",
        description: "A squad of 10 hardened freelancers equipped with boarding armor and plasma rifles. Deployed from your ship's Barracks during ship boarding and planetary raids.",
        onUse: () => {
            if (typeof playerShip === 'undefined') return false;
            if (!playerShip.forces) playerShip.forces = { marines: 0, heavyMechs: 0, dropDropships: 0, maxTroops: 20 };
            const maxTroops = playerShip.forces.maxTroops || 20;
            if ((playerShip.forces.marines || 0) + 10 > maxTroops) {
                if (typeof showToast === 'function') showToast(`BARRACKS FULL (${playerShip.forces.marines}/${maxTroops})`, "error");
                return false;
            }
            playerShip.forces.marines = (playerShip.forces.marines || 0) + 10;
            logMessage("<span style='color:var(--success)'>[ BARRACKS ]</span> 10 Marines transferred from reserve transport pods to active duty.");
            if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();
            if (typeof showToast === 'function') showToast("+10 ACTIVE MARINES", "success");
            _refreshItemUI();
            return true;
        }
    },
    ASSAULT_MECH: {
        name: "Goliath Assault Mech",
        basePrice: 15000,
        icon: "🤖",
        isTroop: true,
        isVehicle: true,
        illegal: false,
        weight: 0, // Mechs deploy to the vehicle bay, not the cargo bay
        category: "MILITARY",
        description: "A massive, bipedal walking tank. Provides +50% fire support and drastically reduces marine casualties during planetary ground raids.",
        onUse: () => {
            if (typeof playerShip === 'undefined') return false;
            if (!playerShip.forces) playerShip.forces = { marines: 0, heavyMechs: 0, dropDropships: 0, maxTroops: 20 };
            const maxTroops = playerShip.forces.maxTroops || 20;
            if ((playerShip.forces.heavyMechs || 0) + 1 > maxTroops) {
                if (typeof showToast === 'function') showToast("VEHICLE BAY AT CAPACITY", "error");
                return false;
            }
            playerShip.forces.heavyMechs = (playerShip.forces.heavyMechs || 0) + 1;
            logMessage("<span style='color:var(--warning)'>[ VEHICLE BAY ]</span> Goliath Assault Mech uncrated and prepped for orbital drop.");
            if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();
            if (typeof showToast === 'function') showToast("+1 ACTIVE ASSAULT MECH", "success");
            _refreshItemUI();
            return true;
        }
    }
};

// ==========================================
// --- NORMALIZATION & GLOBAL UTILITY API ---
// ==========================================

// Normalize all static commodities so V8 hidden classes remain uniform
for (const itemKey in COMMODITIES) {
    const item = COMMODITIES[itemKey];
    if (!item) continue;
    item.id = itemKey;
    if (item.icon === undefined) item.icon = item.illegal ? "⚠️" : "📦";
    if (item.weight === undefined) item.weight = 1;
    if (item.illegal === undefined) item.illegal = false;
    if (item.category === undefined) item.category = item.illegal ? "CONTRABAND" : "STANDARD";
}

const ItemUtils = {
    getDef(id) {
        return COMMODITIES[id] || null;
    },
    isMarketCommodity(id) {
        const c = COMMODITIES[id];
        if (!c) return false;
        if (c.isComponent || c.isTroop) return false;
        if (id === 'HOT_CARGO' || id === 'COLONY_CHARTER' || id === 'STATION_CORE' || id === 'WORMHOLE_STABILIZER' || id === 'WAYFINDER_CORE') {
            return false;
        }
        return true;
    },
    getLegalMarketKeys(maxBasePrice = Infinity) {
        return Object.keys(COMMODITIES).filter(id => {
            const c = COMMODITIES[id];
            return this.isMarketCommodity(id) && !c.illegal && c.basePrice <= maxBasePrice;
        });
    },
    getContrabandMarketKeys() {
        return Object.keys(COMMODITIES).filter(id => {
            const c = COMMODITIES[id];
            return this.isMarketCommodity(id) && Boolean(c.illegal);
        });
    }
};

window.LOOT_TABLES = LOOT_TABLES;
window.COMMODITIES = COMMODITIES;
window.ItemUtils = ItemUtils;

if (typeof GameRegistry !== 'undefined') {
    GameRegistry.items = COMMODITIES;
}

// ==========================================
// --- SELF-CONTAINED ITEM & QUEST HOOKS ---
// ==========================================

(function initItemsModuleHooks() {
    let _hotCargoCheckPending = false;

    if (typeof GameBus !== 'undefined') {
        // Prevent permanent mission soft-lock if HOT_CARGO is dumped, confiscated, or stolen mid-run
        GameBus.on('CARGO_MODIFIED', () => {
            if (_hotCargoCheckPending) return;
            _hotCargoCheckPending = true;

            // Defer to the end of the current synchronous call stack so legitimate deliveries complete first
            setTimeout(() => {
                _hotCargoCheckPending = false;
                if (typeof playerActiveMission !== 'undefined' && playerActiveMission &&
                    playerActiveMission.id && String(playerActiveMission.id).startsWith('SMUGGLE_') &&
                    !playerActiveMission.isComplete) {
                    const hasHotCargo = typeof playerCargo !== 'undefined' && (playerCargo['HOT_CARGO'] || 0) > 0;
                    if (!hasHotCargo) {
                        const failedTitle = playerActiveMission.title || "Smuggle Hot Cargo";
                        playerActiveMission = null;
                        if (typeof logMessage === 'function') {
                            logMessage(`<span style='color:var(--danger); font-weight:bold;'>[ CONTRACT TERMINATED ]</span> Tracked Contraband lost in transit! Your '${failedTitle}' contract has been voided.`);
                        }
                        if (typeof showToast === 'function') showToast("SMUGGLING CONTRACT VOIDED", "error");
                        if (typeof renderMissionTracker === 'function') renderMissionTracker();
                        if (typeof renderUIStats === 'function') renderUIStats();
                    }
                }
            }, 0);
        });
    }
})();

// --- END OF FILE items.js ---
