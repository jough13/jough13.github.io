// --- START OF FILE perks.js ---

// ==========================================
// --- CAPTAIN PERKS DATABASE (35 PERKS) ---
// --- 5 PERKS ACROSS EACH OF 7 DISCIPLINES ---
// ==========================================

const PERKS_DATABASE = {
    // ==========================================
    // --- INDUSTRIAL (5) ---
    // ==========================================
    DEEP_CORE_MINING: {
        id: "DEEP_CORE_MINING",
        name: "Deep Core Mining",
        description: "Asteroid mining yields +3 additional resources per attempt.",
        lore: "Learned from Valkyrie Drift roughnecks: pulse the cutting beam on the second harmonic and the iron seams split like glass.",
        icon: "⛏️",
        category: "Industrial"
    },
    EFFICIENT_THRUSTERS: {
        id: "EFFICIENT_THRUSTERS",
        name: "Fusion Injectors",
        description: "Movement fuel cost reduced by 20%.",
        lore: "Precision magnetic pinch-valves adapted from Port Nomad long-haul tugs squeeze extra delta-v out of every gram of deuterium.",
        icon: "🚀",
        category: "Industrial"
    },
    DIMENSIONAL_POCKETS: {
        id: "DIMENSIONAL_POCKETS",
        name: "Subspace Cargo Webbing",
        description: "Optimizes structural bulkheads, permanently granting +25 Cargo Capacity and +40 Max Fuel.",
        lore: "By stripping redundant Concord inspection baffles and nesting conformal fuel bladders, a smart captain finds room where shipwrights saw dead metal.",
        icon: "🧰",
        category: "Industrial"
    },
    DRONE_COMMANDER: {
        id: "DRONE_COMMANDER",
        name: "Drone Telemetry Link",
        description: "Automated Mining Drones and Combat Swarm Drones have a 50% chance to be recalled to your hold instead of being consumed.",
        lore: "Short-range optical recovery tethers let expendable hulls dock back into the launch tube instead of burning out in the black.",
        icon: "🛸",
        category: "Industrial"
    },
    REFINERY_EFFICIENCY: {
        id: "REFINERY_EFFICIENCY",
        name: "Molecular Recycler",
        description: "Station hull repairs cost 20% less (rebated), and Workbench synthesis (U) has a 25% chance to recover 1 raw ingredient.",
        lore: "Helios Refinery shift-leads swear that a quarter of every weld puddle is wasted slag—unless you run a closed-loop vapor trap.",
        icon: "♻️",
        category: "Industrial"
    },

    // ==========================================
    // --- COMBAT (5) ---
    // ==========================================
    WEAPON_OVERCLOCK: {
        id: "WEAPON_OVERCLOCK",
        name: "Weapon Overclock",
        description: "All ship weapons deal +15% damage.",
        lore: "Bypassing the Concord civilian thermal limiter voids every factory warranty in Sol Sector, but it doubles the punch of a laser capacitor.",
        icon: "⚔️",
        category: "Combat"
    },
    SHIELD_HARMONICS: {
        id: "SHIELD_HARMONICS",
        name: "Shield Harmonics",
        description: "Shields regenerate +50% faster outside of combat and resist Nebula Ion Storms.",
        lore: "Phase-matched deflector grids ride electrostatic surges instead of shorting out, keeping your emitters humming inside dense nebulae.",
        icon: "🛡️",
        category: "Combat"
    },
    OVERCHARGED_CAPACITORS: {
        id: "OVERCHARGED_CAPACITORS",
        name: "Overcharged Capacitors",
        description: "Redirects auxiliary reactor output to defensive grids, granting +30 Max Shields and +8% Evasion.",
        lore: "Diverting galley and gravity-plate reserve power directly to the RCS thrusters and shield bus makes a freighter dance like a courier.",
        icon: "⚡",
        category: "Combat"
    },
    TACTICAL_OVERDRIVE: {
        id: "TACTICAL_OVERDRIVE",
        name: "Tactical Overdrive",
        description: "Grants +10% Weapon Accuracy and causes ship special abilities to recharge twice as fast in combat.",
        lore: "Predictive fire-control loops borrowed from Aegis gunship doctrine keep special maneuvers cycled before the enemy finishes reloading.",
        icon: "🎯",
        category: "Combat"
    },
    ORDNANCE_FABRICATOR: {
        id: "ORDNANCE_FABRICATOR",
        name: "Auto-Munitions Forge",
        description: "Onboard micro-lathes passively fabricate +1 weapon ammunition every 10 movement steps and grant +4 Base Damage.",
        lore: "A compact rail-slug press bolted into the aft corridor turns stray scrap stock into fresh ordnance while you supercruise.",
        icon: "🧨",
        category: "Combat"
    },

    // ==========================================
    // --- TRADE (5) ---
    // ==========================================
    SILVER_TONGUE: {
        id: "SILVER_TONGUE",
        name: "Silver Tongue",
        description: "Buy items for 10% less, sell for 10% more, and unlock 50% Security Office warrant bribes.",
        lore: "Every Concord quartermaster has a quota, a secret vice, and a price. Knowing which ledger to quote turns thin margins into fortunes.",
        icon: "💰",
        category: "Trade"
    },
    SCAVENGER_PROTOCOL: {
        id: "SCAVENGER_PROTOCOL",
        name: "Scavenger Protocol",
        description: "Derelicts, Anomalies, Signal Sources, and Outpost Raids yield double credits and salvage.",
        lore: "Rookies strip the bridge and run; veterans know the real credit chits and undamaged alloy plates are hidden behind the life-support risers.",
        icon: "📦",
        category: "Trade"
    },
    COLONY_ARCHITECT: {
        id: "COLONY_ARCHITECT",
        name: "Pioneer Architect",
        description: "Doubles colony building construction speed and increases colony tax revenue by +15% per Stardate.",
        lore: "Modular prefab zoning plans developed for outer-rim charters shave cycles off every hab-block and keep colonial tariffs flowing.",
        icon: "🏛️",
        category: "Trade"
    },
    BLACK_MARKET_BARON: {
        id: "BLACK_MARKET_BARON",
        name: "Syndicate Kingpin",
        description: "Shadow Brokers pay +25% more for foreign contraband and grant +2 Eclipse Cartel reputation whenever you fence illegal goods.",
        lore: "Once Station Umbra knows your callsign moves clean merchandise across customs lines, brokers stop quoting street rates and open the real vault.",
        icon: "👑",
        category: "Trade"
    },
    CONTRACT_NEGOTIATOR: {
        id: "CONTRACT_NEGOTIATOR",
        name: "Broker's Retainer",
        description: "Completed Station Contracts and Bounty Hunts pay +20% bonus credits, and Contracts award +2 additional faction reputation.",
        lore: "Never sign a standard Concord courier voucher without adding a hazard-escalation rider and a priority-berth retainer clause.",
        icon: "📑",
        category: "Trade"
    },

    // ==========================================
    // --- SOCIAL (5) ---
    // ==========================================
    SMOOTH_TALKER: {
        id: "SMOOTH_TALKER",
        name: "Smooth Talker",
        description: "You know exactly what to say to Concord Customs. If caught with contraband, your credit fine is reduced by 50%.",
        lore: "Citing Maritime Salvage Sub-clause 19-B with calm confidence can turn a felony smuggling seizure into a 'clerical misfiling.'",
        icon: "🗣️",
        category: "Social"
    },
    SHADOW_TRANSPONDER: {
        id: "SHADOW_TRANSPONDER",
        name: "Ghost Transponder",
        description: "Spoofs your hull registry. Reduces radar signature by 35% during Customs scans and decays Notoriety twice as fast.",
        lore: "A rotating transponder key sourced from Port Erebus rotates your hull registration faster than SEC-COM relays can correlate warrants.",
        icon: "🕶️",
        category: "Social"
    },
    SMUGGLERS_LUCK: {
        id: "SMUGGLERS_LUCK",
        name: "Smuggler's Luck",
        description: "Concord Customs scans have a flat 25% chance to 'glitch' and find nothing, even if contraband is exposed.",
        lore: "Between solar interference, aging scan-buoys, and sleepy shift officers, the void occasionally looks the other way for captains with nerve.",
        icon: "🎲",
        category: "Social"
    },
    CHARISMATIC_CAPTAIN: {
        id: "CHARISMATIC_CAPTAIN",
        name: "Officer's Bearing",
        description: "Contracts award +20% bonus XP, crew Shore Leave & cargo treats grant +5 extra Loyalty, and crew severance fees are halved.",
        lore: "Spacers will fly into a K'tharr warzone for a captain who splits the salvage fairly and remembers everyone's callsign.",
        icon: "🎖️",
        category: "Social"
    },
    CANTINA_FIXER: {
        id: "CANTINA_FIXER",
        name: "Cantina Regular",
        description: "Cantina drinks are on the house (+10 bonus Hull), Pazaak wins pay +50% bonus credits, and first-visit rumor eavesdropping yields +15 bonus XP.",
        lore: "From The Rusty Anchor to Frothy Moon Outpost, bartenders pour heavier and talk looser when they recognize a regular.",
        icon: "🍻",
        category: "Social"
    },

    // ==========================================
    // --- SCIENCE (5) ---
    // ==========================================
    XENO_BIOLOGIST: {
        id: "XENO_BIOLOGIST",
        name: "Xeno-Biologist",
        description: "Planetary biological scans and bio-world surface expeditions award double XP.",
        lore: "Trained in exobiological taxonomy, you know how to isolate live extremophile mats and mycelial nodes without denaturing the sample.",
        icon: "🧬",
        category: "Science"
    },
    LONG_RANGE_SENSORS: {
        id: "LONG_RANGE_SENSORS",
        name: "Telemetry Array",
        description: "80% faster mining/scooping, 10-tile Sensor Pings (P), unlocks NPC Cargo Scans, Tractor Beam combat salvage, and USS alerts.",
        lore: "Synthetic-aperture LIDAR processing turns a standard civilian dish into a deep-rim reconnaissance suite.",
        icon: "📡",
        category: "Science"
    },
    ASTROMETRIC_SAVANT: {
        id: "ASTROMETRIC_SAVANT",
        name: "Astrometric Savant",
        description: "Deep-Sky Observatory plates (O) award double XP and have a 50% chance to resolve a bonus Planetary Data cartridge.",
        lore: "Stacking narrowband H-alpha and O-III exposures reveals faint protoplanetary disks and exoplanet transits invisible to standard nav-optics.",
        icon: "🔭",
        category: "Science"
    },
    XENO_ARCHAEOLOGIST: {
        id: "XENO_ARCHAEOLOGIST",
        name: "Precursor Scholar",
        description: "Decrypting Encrypted Engrams, Data Caches, and Ancient Archives yields +35% bonus XP, and Cryptarch relic appraisals pay +25% more.",
        lore: "Familiarity with the geometric grammar of the First Chord lets you reconstruct lost Precursor telemetry blocks that baffle standard Cryptarchs.",
        icon: "🏺",
        category: "Science"
    },
    SPECTRAL_ANALYST: {
        id: "SPECTRAL_ANALYST",
        name: "Astrophysics Fellow",
        description: "First-time Stellar Deep Scans (V) award double XP (+50 XP) and harmonize your deflectors for +15% Shield restoration.",
        lore: "Reading absorption troughs across the Morgan-Keenan spectrum lets you harvest clean coronal harmonics before other vessels even resolve the photosphere.",
        icon: "🌟",
        category: "Science"
    },

    // ==========================================
    // --- EXPLORATION (5) ---
    // ==========================================
    CYBER_SLICER: {
        id: "CYBER_SLICER",
        name: "Cyber Slicer",
        description: "Decrypt Encrypted Engrams, Data Caches, and Ancient Archives for free at Cryptarchs or directly from your Cargo Hold (I), and defuse Space Mines.",
        lore: "Armed with a custom quantum brute-force deck, you treat Concord ICE-walls, syndicate dead-drops, and Terran War fuses like open doors.",
        icon: "💻",
        category: "Exploration"
    },
    VOID_DIVER: {
        id: "VOID_DIVER",
        name: "Void Diver",
        description: "25% Engram chance on Stellar Deep Scans (V), immunity to Black Hole pull (slingshot boost), and safe Warzone crystal harvesting.",
        lore: "Most pilots freeze when spacetime bends around an event horizon; you treat the ergosphere like a free gravitational catapult.",
        icon: "🌌",
        category: "Exploration"
    },
    STELLAR_CARTOGRAPHER: {
        id: "STELLAR_CARTOGRAPHER",
        name: "Stellar Cartographer",
        description: "Passively records astrometric telemetry while flying (+2 XP per move) and grants +50 bonus XP when discovering new sectors.",
        lore: "Your nav-computer continuously logs pulsar parallax and drift baselines, turning every routine transit into publishable star-charts.",
        icon: "🗺️",
        category: "Exploration"
    },
    HYPER_LANE_MAPPER: {
        id: "HYPER_LANE_MAPPER",
        name: "Hyper-Lane Mapper",
        description: "Wormhole jumps cost 50% less fuel and never cause structural hull damage.",
        lore: "By plotting gravimetric shear vectors before entering a fracture, you slip cleanly along the Precursor throat without buckling a single hull plate.",
        icon: "🌀",
        category: "Exploration"
    },
    QUANTUM_NAVIGATOR: {
        id: "QUANTUM_NAVIGATOR",
        name: "Corona Skimmer",
        description: "Fuel scooping yields +25% extra hydrogen and flushes 2 Stealth Heat. Silent Running (Q) generates 30% less heat.",
        lore: "Skimming the upper chromosphere at grazing incidence packs dense ionized deuterium into your manifolds while venting excess reactor heat.",
        icon: "☀️",
        category: "Exploration"
    },

    // ==========================================
    // --- SURVIVAL (5) ---
    // ==========================================
    HEALTH_PHYSICIST: {
        id: "HEALTH_PHYSICIST",
        name: "Health Physicist",
        description: "Your background in radiological affairs allows you to perfectly calibrate your ship's shielding. Zero hull or fuel loss from O/B-class stars, Irradiated Worlds, and Radiation Belts.",
        lore: "Time, distance, and shielding—applied at relativistic scales. While other ships fry in gamma flux, your dosimeters never even leave the green.",
        icon: "☢️",
        category: "Survival"
    },
    SCRAP_WELDER: {
        id: "SCRAP_WELDER",
        name: "Scrap Welder",
        description: "You've learned to efficiently patch your hull using raw ore. Successfully mining an asteroid instantly restores 5 Hull Integrity.",
        lore: "A little slag iron, a steady plasma torch, and zero concern for cosmetic paint can keep a battered hull airtight halfway to the Silentium Expanse.",
        icon: "🔧",
        category: "Survival"
    },
    NANO_HULL_WEAVE: {
        id: "NANO_HULL_WEAVE",
        name: "Nano-Reactive Hull",
        description: "Integrates self-healing smart-matter into your bulkhead, granting +35 Max Hull and regenerating 1 Hull every 5 moves.",
        lore: "Microscopic repair polymers threaded through the outer ribs flow toward pressure drops and seal micro-fractures automatically in flight.",
        icon: "🩹",
        category: "Survival"
    },
    EMERGENCY_BULKHEADS: {
        id: "EMERGENCY_BULKHEADS",
        name: "Reinforced Bulkheads",
        description: "Internal honeycombed tritanium ribs grant +20 Max Hull and reduce all incoming hull damage by 15%.",
        lore: "Borrowed from K'tharr siege hulls: compartmentalized cross-bracing absorbs shockwaves that would fold a standard freighter in half.",
        icon: "🛡️",
        category: "Survival"
    },
    RESERVE_CAPACITORS: {
        id: "RESERVE_CAPACITORS",
        name: "Emergency Reserve Core",
        description: "Once per combat, if an incoming hull hit would drop you below 25% Hull, emergency capacitors absorb 15 damage and surge +30 Shields.",
        lore: "A dead-man's supercapacitor wired behind the captain's chair—silent until the red hull alarms scream, then it buys you one more turn to live.",
        icon: "🔋",
        category: "Survival"
    }
};

// ==========================================
// --- DISCIPLINE MASTERY DOCTRINES (3+ PERKS) ---
// ==========================================

const PERK_MASTERY_DOCTRINES = {
    Industrial: {
        category: "Industrial",
        req: 3,
        title: "Forge Master",
        icon: "⚙️",
        color: "var(--warning)",
        summary: "+15 Cargo Capacity & +15 Max Fuel"
    },
    Combat: {
        category: "Combat",
        req: 3,
        title: "Tactical Ace",
        icon: "⚔️",
        color: "var(--danger)",
        summary: "+6 Base Weapon Damage & +5% Weapon Accuracy"
    },
    Trade: {
        category: "Trade",
        req: 3,
        title: "Guild Magnate",
        icon: "💰",
        color: "var(--gold-text)",
        summary: "+10% Bonus Credits on Completed Contracts"
    },
    Social: {
        category: "Social",
        req: 3,
        title: "Shadow Diplomat",
        icon: "🕶️",
        color: "#DDA0DD",
        summary: "-15% Radar Signature & +5% Ship Evasion"
    },
    Science: {
        category: "Science",
        req: 3,
        title: "Senior Fellow",
        icon: "🔬",
        color: "var(--accent-color)",
        summary: "+15% Bonus XP from Stellar & Deep-Sky Scans"
    },
    Exploration: {
        category: "Exploration",
        req: 3,
        title: "Void Wayfinder",
        icon: "🧭",
        color: "#40E0D0",
        summary: "+35 Max Fuel & +5% Ship Evasion"
    },
    Survival: {
        category: "Survival",
        req: 3,
        title: "Ironclad Spacer",
        icon: "☢️",
        color: "var(--success)",
        summary: "+25 Max Hull & +15 Max Shields"
    }
};

// Freeze perk records and dictionaries for V8 lookup optimization
for (const pKey in PERKS_DATABASE) {
    Object.freeze(PERKS_DATABASE[pKey]);
}
Object.freeze(PERKS_DATABASE);
for (const mKey in PERK_MASTERY_DOCTRINES) {
    Object.freeze(PERK_MASTERY_DOCTRINES[mKey]);
}
Object.freeze(PERK_MASTERY_DOCTRINES);

window.PERKS_DATABASE = PERKS_DATABASE;
window.PERK_MASTERY_DOCTRINES = PERK_MASTERY_DOCTRINES;
if (typeof GameRegistry !== 'undefined') {
    GameRegistry.perks = PERKS_DATABASE;
}

// ==========================================
// --- PUBLIC PERK QUERY & MASTERY UTILITIES ---
// ==========================================

function hasPlayerPerk(perkId) {
    if (typeof playerPerks === 'undefined' || !playerPerks) return false;
    if (typeof playerPerks.has === 'function') return playerPerks.has(perkId);
    if (Array.isArray(playerPerks)) return playerPerks.includes(perkId);
    return false;
}
window.hasPlayerPerk = hasPlayerPerk;

const PerkUtils = {
    getPerk(perkId) {
        return PERKS_DATABASE[perkId] || null;
    },
    getAcquiredPerks() {
        return Object.keys(PERKS_DATABASE).filter(id => hasPlayerPerk(id));
    },
    getCategoryCounts() {
        const counts = {
            Industrial: 0, Combat: 0, Trade: 0,
            Social: 0, Science: 0, Exploration: 0, Survival: 0
        };
        for (const id in PERKS_DATABASE) {
            if (hasPlayerPerk(id)) {
                const cat = PERKS_DATABASE[id].category;
                if (counts[cat] !== undefined) counts[cat]++;
            }
        }
        return counts;
    },
    hasDisciplineMastery(category) {
        const doc = PERK_MASTERY_DOCTRINES[category];
        if (!doc) return false;
        const counts = this.getCategoryCounts();
        return (counts[category] || 0) >= doc.req;
    },
    getActiveMasteries() {
        const counts = this.getCategoryCounts();
        return Object.values(PERK_MASTERY_DOCTRINES).filter(doc => (counts[doc.category] || 0) >= doc.req);
    }
};
window.PerkUtils = PerkUtils;

// ==========================================
// --- SELF-CONTAINED PERK & MASTERY HOOKS ---
// ==========================================

(function initPerkSystems() {
    let _lastColonyArchitectTick = {};
    let _ordnanceMoveCounter = 0;
    let _reserveCapacitorUsedThisFight = false;

    function _escapeHtml(str) {
        return String(str === undefined || str === null ? "" : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Build HTML for the Commander Datapad "Captain Perks" Tab (Zero Assets)
    window._perksDatapadFilter = window._perksDatapadFilter || 'ACQUIRED';

    window.setPerksDatapadFilter = function(filterKey) {
        window._perksDatapadFilter = filterKey || 'ACQUIRED';
        if (typeof soundManager !== 'undefined' && typeof soundManager.playUIHover === 'function') {
            soundManager.playUIHover();
        }
        if (typeof window.displayCommanderProfile === 'function') {
            window.displayCommanderProfile('PERKS');
        }
    };

    function renderCaptainPerksTabHtml() {
        const totalPerks = Object.keys(PERKS_DATABASE).length;
        const unlockedIds = PerkUtils.getAcquiredPerks();
        const catCounts = PerkUtils.getCategoryCounts();
        const activeMasteries = PerkUtils.getActiveMasteries();
        const activeFilter = window._perksDatapadFilter || 'ACQUIRED';

        const filterKeys = ['ACQUIRED', 'ALL', 'Combat', 'Industrial', 'Trade', 'Social', 'Science', 'Exploration', 'Survival'];
        const filterRowHtml = `
            <div style="display:flex; flex-wrap:wrap; gap:5px; margin-bottom:12px;">
                ${filterKeys.map(fk => {
                    const selected = activeFilter === fk;
                    const label = fk === 'ACQUIRED' ? `OWNED (${unlockedIds.length})` : fk.toUpperCase();
                    return `<button type="button" onclick="setPerksDatapadFilter('${fk}')" style="padding:4px 7px; font-size:9px; font-family:var(--title-font); cursor:pointer; border-radius:3px; font-weight:bold; background:${selected ? 'rgba(0,224,224,0.16)' : 'rgba(0,0,0,0.35)'}; border:1px solid ${selected ? 'var(--accent-color)' : '#444'}; color:${selected ? 'var(--accent-color)' : 'var(--item-desc-color)'};">${label}</button>`;
                }).join('')}
            </div>
        `;

        // Mastery Doctrine Summary Strip
        const masterySummaryHtml = activeMasteries.length > 0
            ? `<div style="background:rgba(255,215,0,0.06); border:1px solid var(--gold-text); padding:8px 10px; border-radius:4px; margin-bottom:12px;">
                   <div style="font-size:9px; color:var(--gold-text); letter-spacing:1.5px; font-weight:bold; margin-bottom:6px;">★ ACTIVE DISCIPLINE MASTERIES (${activeMasteries.length})</div>
                   ${activeMasteries.map(m => `
                       <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:3px;">
                           <span style="color:${m.color}; font-weight:bold;">${m.icon} ${m.title} (${m.category})</span>
                           <span style="color:var(--text-color);">${m.summary}</span>
                       </div>
                   `).join('')}
               </div>`
            : `<div style="background:rgba(0,0,0,0.28); border:1px dashed var(--border-color); padding:8px 10px; border-radius:4px; margin-bottom:12px; font-size:11px; color:var(--item-desc-color);">
                   Acquire <b>3 perks</b> in any discipline to unlock a permanent <b>Mastery Doctrine</b> bonus.
               </div>`;

        // Filter perk cards
        let displayIds = Object.keys(PERKS_DATABASE);
        if (activeFilter === 'ACQUIRED') {
            displayIds = unlockedIds;
        } else if (activeFilter !== 'ALL') {
            displayIds = displayIds.filter(id => PERKS_DATABASE[id].category === activeFilter);
        }

        // Category mastery indicator if viewing a specific category
        let catMasteryBanner = '';
        if (PERK_MASTERY_DOCTRINES[activeFilter]) {
            const doc = PERK_MASTERY_DOCTRINES[activeFilter];
            const ownedInCat = catCounts[activeFilter] || 0;
            const achieved = ownedInCat >= doc.req;
            catMasteryBanner = `
                <div style="background:rgba(0,0,0,0.35); border-left:3px solid ${doc.color}; padding:8px 10px; margin-bottom:10px; border-radius:0 4px 4px 0; font-size:11px;">
                    <div style="display:flex; justify-content:space-between; font-weight:bold; color:${doc.color};">
                        <span>${doc.icon} ${activeFilter.toUpperCase()} MASTERY: ${doc.title.toUpperCase()}</span>
                        <span>${Math.min(doc.req, ownedInCat)}/${doc.req} ${achieved ? '✓ ACTIVE' : ''}</span>
                    </div>
                    <div style="color:var(--item-desc-color); margin-top:3px;">Doctrine Bonus: ${doc.summary}</div>
                </div>
            `;
        }

        let cardsHtml = '';
        if (displayIds.length === 0) {
            cardsHtml = `<div style="text-align:center; padding: 28px 15px; color:#666; font-style:italic; font-size:12px;">No specialized captain perks acquired yet. Gain XP and level up to install neural augmentations—or switch filter to <b>ALL</b> to preview the 35-perk catalog.</div>`;
        } else {
            // Sort acquired perks first when browsing ALL or a specific category
            const sortedIds = displayIds.slice().sort((a, b) => {
                const aOwned = hasPlayerPerk(a) ? 1 : 0;
                const bOwned = hasPlayerPerk(b) ? 1 : 0;
                if (aOwned !== bOwned) return bOwned - aOwned;
                return PERKS_DATABASE[a].name.localeCompare(PERKS_DATABASE[b].name);
            });

            cardsHtml = sortedIds.map(id => {
                const p = PERKS_DATABASE[id];
                const owned = hasPlayerPerk(id);
                const borderCol = owned ? 'var(--gold-text)' : '#444';
                const opacity = owned ? '1' : '0.6';
                return `
                    <div style="background:rgba(0,0,0,0.35); border-left:3px solid ${borderCol}; padding:10px 12px; border-radius:0 4px 4px 0; display:flex; gap:12px; align-items:flex-start; opacity:${opacity};">
                        <div style="font-size:24px; line-height:1.1;">${p.icon}</div>
                        <div style="flex:1;">
                            <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
                                <span style="color:${owned ? 'var(--item-name-color)' : 'var(--item-desc-color)'}; font-weight:bold; font-size:13px;">${owned ? '' : '🔒 '}${_escapeHtml(p.name)}</span>
                                <span style="color:${owned ? 'var(--gold-text)' : 'var(--accent-color)'}; font-size:9px; text-transform:uppercase; letter-spacing:1px;">${_escapeHtml(p.category)}</span>
                            </div>
                            <div style="color:var(--text-color); font-size:11px; margin-top:4px; line-height:1.4;">${_escapeHtml(p.description)}</div>
                            ${p.lore ? `<div style="color:var(--item-desc-color); font-size:10px; font-style:italic; margin-top:5px; line-height:1.4;">"${_escapeHtml(p.lore)}"</div>` : ''}
                        </div>
                    </div>
                `;
            }).join('');
        }

        return `
            <div style="padding: 4px 0;">
                <div style="display:flex; justify-content:space-between; align-items:flex-end; border-bottom:1px solid #333; padding-bottom:10px; margin-bottom:12px;">
                    <h3 style="color:var(--gold-text); margin:0;">CAPTAIN AUGMENTATIONS</h3>
                    <span style="font-size:10px; color:var(--accent-color); letter-spacing:1px;">${unlockedIds.length} / ${totalPerks} ACQUIRED</span>
                </div>
                ${masterySummaryHtml}
                ${filterRowHtml}
                ${catMasteryBanner}
                <div style="display:flex; flex-direction:column; gap:9px; max-height: 310px; overflow-y: auto; padding-right: 4px;">
                    ${cardsHtml}
                </div>
            </div>
        `;
    }

    // 1. GAMEBUS TICK HOOKS FOR PASSIVE PERKS
    if (typeof GameBus !== 'undefined' && !window._perksTickRegistered) {
        window._perksTickRegistered = true;

        GameBus.on('TICK_PROCESSED', (tick) => {
            if (!tick || tick.interrupt) return;
            const { isMovement } = tick;

            // A. NANO_HULL_WEAVE: +0.2 Hull per move (1 Hull every 5 moves)
            if (isMovement && hasPlayerPerk('NANO_HULL_WEAVE')) {
                if (typeof playerHull !== 'undefined' && typeof MAX_PLAYER_HULL !== 'undefined' && playerHull > 0 && playerHull < MAX_PLAYER_HULL) {
                    playerHull = Math.min(MAX_PLAYER_HULL, Math.round((playerHull + 0.2) * 10) / 10);
                }
            }

            // B. STELLAR_CARTOGRAPHER: +2 XP per move (Sector discovery +50 XP handled via updateSectorState wrapper)
            if (isMovement && hasPlayerPerk('STELLAR_CARTOGRAPHER')) {
                if (typeof playerXP !== 'undefined') {
                    playerXP += 2;
                    if (typeof checkLevelUp === 'function' && typeof xpToNextLevel !== 'undefined' && playerXP >= xpToNextLevel) {
                        checkLevelUp();
                    }
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
                        if (!playerShip.ammo) playerShip.ammo = {};
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

            // E. SHADOW_TRANSPONDER: Halves Notoriety decay interval (from 15.0 to 7.5 stardates)
            if (hasPlayerPerk('SHADOW_TRANSPONDER') && typeof playerNotoriety !== 'undefined' && playerNotoriety > 0 && typeof currentGameDate !== 'undefined') {
                const stateDecay = (typeof GameState !== 'undefined' && GameState.player) ? GameState.player.lastNotorietyDecayTime : 0;
                let lastDecay = window.lastNotorietyDecayTime || stateDecay || 0;

                if (!lastDecay || currentGameDate < lastDecay) {
                    lastDecay = currentGameDate;
                    window.lastNotorietyDecayTime = lastDecay;
                    if (typeof GameState !== 'undefined' && GameState.player) GameState.player.lastNotorietyDecayTime = lastDecay;
                }

                if (currentGameDate - lastDecay >= 7.5) {
                    if (typeof updatePlayerNotoriety === 'function') updatePlayerNotoriety(-1);
                    window.lastNotorietyDecayTime = currentGameDate;
                    if (typeof GameState !== 'undefined' && GameState.player) GameState.player.lastNotorietyDecayTime = currentGameDate;

                    if (playerNotoriety === 0 && typeof logMessage === 'function') {
                        logMessage("<span style='color:var(--success)'>[ GHOST TRANSPONDER ] Transponder spoofing complete. Concord warrants purged.</span>");
                    }
                }
            }

            // F. COLONY_ARCHITECT: +100% construction speed & +15% tax bonus per Stardate
            if (hasPlayerPerk('COLONY_ARCHITECT') && typeof playerColonies !== 'undefined' && typeof currentGameDate !== 'undefined') {
                Object.values(playerColonies).forEach(colony => {
                    if (!colony || !colony.established) return;
                    const colId = colony.id || `${colony.x}_${colony.y}`;
                    if (_lastColonyArchitectTick[colId] === undefined || currentGameDate < _lastColonyArchitectTick[colId]) {
                        _lastColonyArchitectTick[colId] = currentGameDate;
                    }
                    if (currentGameDate - _lastColonyArchitectTick[colId] >= 1.0) {
                        _lastColonyArchitectTick[colId] = currentGameDate;

                        if (colony.activeConstruction) {
                            colony.activeConstruction.progress = Math.min(
                                colony.activeConstruction.total,
                                colony.activeConstruction.progress + 1
                            );
                        }

                        if (colony.population > 0 && colony.morale > 0) {
                            const bonusTax = Math.max(5, Math.floor(colony.population * 0.075 * (colony.morale / 100)));
                            colony.treasury = (colony.treasury || 0) + bonusTax;
                        }
                    }
                });
            }
        });
    }

    // 2. HOOK ENGINE FUNCTIONS ON DOM LOAD
    function attachPerkWrappers() {

        // A. Wrap applyPlayerShipStats to inject passive perks & Discipline Masteries without clamping current vitals
        if (typeof window.applyPlayerShipStats === 'function' && !window._perksStatsHooked) {
            const originalApplyStats = window.applyPlayerShipStats;
            window.applyPlayerShipStats = function() {
                const prevHull = typeof playerHull !== 'undefined' ? playerHull : 100;
                const prevShields = typeof playerShields !== 'undefined' ? playerShields : 50;
                const prevFuel = typeof playerFuel !== 'undefined' ? playerFuel : 220;

                originalApplyStats.apply(this, arguments);

                // Individual Stat Perks
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

                // Discipline Mastery Doctrine Bonuses (3+ perks in a category)
                if (PerkUtils.hasDisciplineMastery('Industrial')) {
                    if (typeof PLAYER_CARGO_CAPACITY !== 'undefined') PLAYER_CARGO_CAPACITY += 15;
                    if (typeof MAX_FUEL !== 'undefined') MAX_FUEL += 15;
                }
                if (PerkUtils.hasDisciplineMastery('Combat')) {
                    if (typeof PLAYER_ATTACK_DAMAGE !== 'undefined') PLAYER_ATTACK_DAMAGE += 6;
                    if (typeof PLAYER_HIT_CHANCE !== 'undefined') PLAYER_HIT_CHANCE = Math.min(1.0, PLAYER_HIT_CHANCE + 0.05);
                }
                if (PerkUtils.hasDisciplineMastery('Social')) {
                    window.PLAYER_SIGNATURE = Math.max(0.1, (window.PLAYER_SIGNATURE || 1.0) * 0.85);
                    if (typeof PLAYER_EVASION !== 'undefined') PLAYER_EVASION += 0.05;
                }
                if (PerkUtils.hasDisciplineMastery('Exploration')) {
                    if (typeof MAX_FUEL !== 'undefined') MAX_FUEL += 35;
                    if (typeof PLAYER_EVASION !== 'undefined') PLAYER_EVASION += 0.05;
                }
                if (PerkUtils.hasDisciplineMastery('Survival')) {
                    if (typeof MAX_PLAYER_HULL !== 'undefined') MAX_PLAYER_HULL += 25;
                    if (typeof MAX_SHIELDS !== 'undefined') MAX_SHIELDS += 15;
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

            if (typeof playerShip !== 'undefined' && playerShip) {
                window.applyPlayerShipStats();
            }
        }

        // B. Wrap GameBus.emit for EMERGENCY_BULKHEADS (15% reduction) & RESERVE_CAPACITORS (emergency save)
        if (typeof GameBus !== 'undefined' && typeof GameBus.emit === 'function' && !window._perksBusEmitHooked) {
            const origEmit = GameBus.emit.bind(GameBus);
            GameBus.emit = function(event, data) {
                if (event === 'HULL_DAMAGED' && data && data.amount > 0) {
                    if (data.amount > 1 && hasPlayerPerk('EMERGENCY_BULKHEADS')) {
                        data.amount = Math.max(1, Math.floor(data.amount * 0.85));
                    }

                    // RESERVE_CAPACITORS: Once per combat, triggers if hit would leave hull below 25%
                    const inCombat = typeof currentGameState !== 'undefined' && currentGameState === 'combat';
                    if (inCombat && !_reserveCapacitorUsedThisFight && hasPlayerPerk('RESERVE_CAPACITORS')) {
                        if (typeof playerHull !== 'undefined' && typeof MAX_PLAYER_HULL !== 'undefined' && playerHull > 0) {
                            if ((playerHull - data.amount) < (MAX_PLAYER_HULL * 0.25)) {
                                _reserveCapacitorUsedThisFight = true;
                                const absorbed = Math.min(data.amount, 15);
                                data.amount -= absorbed;
                                const extraHeal = 15 - absorbed;
                                if (extraHeal > 0) {
                                    playerHull = Math.min(MAX_PLAYER_HULL, playerHull + extraHeal);
                                }
                                if (typeof playerShields !== 'undefined' && typeof MAX_SHIELDS !== 'undefined') {
                                    playerShields = Math.min(MAX_SHIELDS, playerShields + 30);
                                }
                                if (typeof soundManager !== 'undefined' && typeof soundManager.playAbilityActivate === 'function') {
                                    soundManager.playAbilityActivate();
                                }
                                if (typeof showToast === 'function') showToast("RESERVE CORE SURGED!", "success");
                                if (typeof logMessage === 'function') {
                                    logMessage("<span style='color:var(--success); font-weight:bold;'>[ EMERGENCY RESERVE CORE ]</span> Dead-man capacitors fired! Absorbed 15 hull damage and surged +30 Shields!");
                                }
                            }
                        }
                    }
                }
                return origEmit(event, data);
            };
            window._perksBusEmitHooked = true;
        }

        // B.5 Reset per-combat RESERVE_CAPACITORS flag when combat starts
        if (typeof window.startCombat === 'function' && !window._perksStartCombatHooked) {
            const origStartCombat = window.startCombat;
            window.startCombat = function() {
                _reserveCapacitorUsedThisFight = false;
                return origStartCombat.apply(this, arguments);
            };
            window._perksStartCombatHooked = true;
        }

        // C. Wrap selectPerk so picking a stat-boosting perk or unlocking a Discipline Mastery tops off & persists
        if (typeof window.selectPerk === 'function' && !window._perksSelectHooked) {
            const originalSelectPerk = window.selectPerk;
            window.selectPerk = function(perkId) {
                const prevMasteries = new Set(PerkUtils.getActiveMasteries().map(m => m.category));

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

                // Check if this perk just unlocked a new Discipline Mastery Doctrine
                const newlyUnlocked = PerkUtils.getActiveMasteries().filter(m => !prevMasteries.has(m.category));
                newlyUnlocked.forEach(doc => {
                    if (doc.category === 'Survival') {
                        if (typeof playerHull !== 'undefined') playerHull = Math.min(MAX_PLAYER_HULL, playerHull + 25);
                        if (typeof playerShields !== 'undefined') playerShields = Math.min(MAX_SHIELDS, playerShields + 15);
                    } else if (doc.category === 'Exploration' && typeof playerFuel !== 'undefined') {
                        playerFuel = Math.min(MAX_FUEL, playerFuel + 35);
                    } else if (doc.category === 'Industrial' && typeof playerFuel !== 'undefined') {
                        playerFuel = Math.min(MAX_FUEL, playerFuel + 15);
                    }
                    if (typeof logMessage === 'function') {
                        logMessage(`<span style="color:var(--gold-text); font-weight:bold;">★ DISCIPLINE MASTERY UNLOCKED: ${doc.title.toUpperCase()} (${doc.category}) ★</span> — ${doc.summary}`);
                    }
                    if (typeof showToast === 'function') showToast(`MASTERY: ${doc.title.toUpperCase()}`, "success");
                    if (typeof addMilestone === 'function') {
                        addMilestone(`Attained ${doc.category} Discipline Mastery: ${doc.title}.`);
                    }
                });

                if (typeof renderUIStats === 'function') renderUIStats();
                if (typeof autoSaveGame === 'function') autoSaveGame();
            };
            window._perksSelectHooked = true;
        }

        // C.5 Enhance renderLevelUpScreen cards with Discipline Mastery progress & lore excerpt
        if (typeof window.renderLevelUpScreen === 'function' && !window._perksLevelUpUIHooked) {
            const origRenderLevelUp = window.renderLevelUpScreen;
            window.renderLevelUpScreen = function() {
                origRenderLevelUp.apply(this, arguments);
                const container = document.getElementById('perkCardsContainer');
                if (!container) return;

                const catCounts = PerkUtils.getCategoryCounts();
                const cards = container.querySelectorAll('.perk-card');
                cards.forEach(card => {
                    const titleEl = card.querySelector('.perk-title');
                    const catEl = card.querySelector('.perk-category');
                    if (!titleEl) return;
                    const perk = Object.values(PERKS_DATABASE).find(p => p.name === titleEl.textContent.trim());
                    if (!perk) return;

                    const doc = PERK_MASTERY_DOCTRINES[perk.category];
                    const ownedInCat = catCounts[perk.category] || 0;

                    if (perk.lore) {
                        const loreDiv = document.createElement('div');
                        loreDiv.style.cssText = 'font-size:10px; color:var(--item-desc-color); font-style:italic; margin-top:8px; padding-top:8px; border-top:1px dashed #333; line-height:1.35;';
                        loreDiv.textContent = `"${perk.lore}"`;
                        if (catEl) card.insertBefore(loreDiv, catEl);
                        else card.appendChild(loreDiv);
                    }

                    if (catEl && doc) {
                        const progressText = ownedInCat >= doc.req
                            ? `${perk.category} · ★ Mastery Active`
                            : `${perk.category} · ${ownedInCat}/${doc.req} to ${doc.title}`;
                        catEl.textContent = progressText;
                    }
                });
            };
            window._perksLevelUpUIHooked = true;
        }

        // D. Wrap handleCombatAction so TACTICAL_OVERDRIVE ticks down ability cooldowns twice as fast
        if (typeof window.handleCombatAction === 'function' && !window._perksCombatHooked) {
            const originalHandleCombatAction = window.handleCombatAction;
            window.handleCombatAction = function(action) {
                const prevCooldown = typeof playerAbilityCooldown !== 'undefined' ? playerAbilityCooldown : 0;

                originalHandleCombatAction.apply(this, arguments);

                if (hasPlayerPerk('TACTICAL_OVERDRIVE')) {
                    if (typeof currentCombatContext !== 'undefined' && currentCombatContext && action !== 'ability') {
                        if (typeof playerAbilityCooldown !== 'undefined' && playerAbilityCooldown < prevCooldown && playerAbilityCooldown > 0) {
                            playerAbilityCooldown = Math.max(0, playerAbilityCooldown - 1);
                            if (typeof renderCombatView === 'function') renderCombatView();
                        }
                    }
                }
            };
            window._perksCombatHooked = true;
        }

        // D.5 Wrap updateSectorState so STELLAR_CARTOGRAPHER awards +50 XP cleanly on genuinely new sectors
        if (typeof window.updateSectorState === 'function' && !window._perksSectorHooked) {
            const origUpdateSector = window.updateSectorState;
            window.updateSectorState = function() {
                const prevCount = (typeof visitedSectors !== 'undefined' && visitedSectors.size !== undefined) ? visitedSectors.size : 0;
                origUpdateSector.apply(this, arguments);
                const newCount = (typeof visitedSectors !== 'undefined' && visitedSectors.size !== undefined) ? visitedSectors.size : 0;

                if (newCount > prevCount && hasPlayerPerk('STELLAR_CARTOGRAPHER') && typeof playerXP !== 'undefined') {
                    playerXP += 50;
                    if (typeof logMessage === 'function') {
                        logMessage("<span style='color:var(--accent-color)'>[ STELLAR CARTOGRAPHER ] New sector astrometrics cataloged. +50 Bonus XP!</span>");
                    }
                    if (typeof checkLevelUp === 'function') checkLevelUp();
                }
            };
            window._perksSectorHooked = true;
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
                    damageRisk = 0;
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

        // G. Wrap captureDeepSkyImage (config.js) for ASTROMETRIC_SAVANT & Science Mastery
        if (typeof window.captureDeepSkyImage === 'function' && !window._perksAstroHooked) {
            const originalCaptureDeepSky = window.captureDeepSkyImage;
            window.captureDeepSkyImage = function() {
                const secKey = `ASTRO_PHOTO_${typeof currentSectorX !== 'undefined' ? currentSectorX : 0}_${typeof currentSectorY !== 'undefined' ? currentSectorY : 0}`;
                const alreadyDone = typeof discoveredLocations !== 'undefined' && discoveredLocations.has && discoveredLocations.has(secKey);

                originalCaptureDeepSky.apply(this, arguments);

                if (!alreadyDone) {
                    const isNexStar = typeof playerShip !== 'undefined' && playerShip.components && playerShip.components.scanner === 'SCANNER_NEXSTAR_4SE';
                    const baseXP = isNexStar ? 120 : 50;
                    let extraXP = 0;

                    if (hasPlayerPerk('ASTROMETRIC_SAVANT')) {
                        extraXP += baseXP;
                        let extraMsg = `<span style="color:var(--accent-color)">[ ASTROMETRIC SAVANT ]</span> High-resolution interferometry yielded +${baseXP} bonus XP!`;
                        if (Math.random() < 0.50 && (typeof currentCargoLoad !== 'undefined' ? currentCargoLoad : 0) + 1 <= PLAYER_CARGO_CAPACITY) {
                            playerCargo['PLANETARY_DATA'] = (playerCargo['PLANETARY_DATA'] || 0) + 1;
                            if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
                            extraMsg += ` <span style="color:var(--gold-text)">Resolved +1x bonus Planetary Data cartridge!</span>`;
                        }
                        if (typeof logMessage === 'function') logMessage(extraMsg);
                    }

                    if (PerkUtils.hasDisciplineMastery('Science')) {
                        const sciBonus = Math.floor((baseXP + extraXP) * 0.15);
                        extraXP += sciBonus;
                    }

                    if (extraXP > 0 && typeof playerXP !== 'undefined') {
                        playerXP += extraXP;
                        if (typeof checkLevelUp === 'function') checkLevelUp();
                    }
                }
            };
            window._perksAstroHooked = true;
        }

        // G.5 Wrap evaluateStar (exploration.js) for SPECTRAL_ANALYST & Science Mastery
        if (typeof window.evaluateStar === 'function' && !window._perksSpectralHooked) {
            const origEvalStar = window.evaluateStar;
            window.evaluateStar = function(starData, starId) {
                const prevXP = typeof playerXP !== 'undefined' ? playerXP : 0;
                origEvalStar.apply(this, arguments);
                const gained = (typeof playerXP !== 'undefined' ? playerXP : 0) - prevXP;

                if (gained > 0) {
                    let bonusXP = 0;
                    if (hasPlayerPerk('SPECTRAL_ANALYST')) {
                        bonusXP += gained;
                        if (typeof playerShields !== 'undefined' && typeof MAX_SHIELDS !== 'undefined') {
                            const shldBoost = Math.max(5, Math.floor(MAX_SHIELDS * 0.15));
                            playerShields = Math.min(MAX_SHIELDS, playerShields + shldBoost);
                        }
                        if (typeof logMessage === 'function') {
                            logMessage(`<span style="color:var(--accent-color)">[ ASTROPHYSICS FELLOW ]</span> Precision spectral analysis yielded +${gained} bonus XP and harmonized deflector shields (+15%)!`);
                        }
                    }
                    if (PerkUtils.hasDisciplineMastery('Science')) {
                        bonusXP += Math.max(4, Math.floor((gained + bonusXP) * 0.15));
                    }
                    if (bonusXP > 0 && typeof playerXP !== 'undefined') {
                        playerXP += bonusXP;
                        if (typeof checkLevelUp === 'function') checkLevelUp();
                        if (typeof renderUIStats === 'function') renderUIStats();
                    }
                }
            };
            window._perksSpectralHooked = true;
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
                return (hasPlayerPerk('BLACK_MARKET_BARON') && !soldLocally) ? Math.floor(base * 1.25) : base;
            };
            window._perksBrokerPriceHooked = true;
        }

        if (typeof window.processShadowBrokerTrade === 'function' && !window._perksBrokerTradeHooked) {
            const origBrokerTrade = window.processShadowBrokerTrade;
            window.processShadowBrokerTrade = function(itemId) {
                const prevCredits = typeof playerCredits !== 'undefined' ? playerCredits : 0;
                const loc = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null;

                let fencingForeignGoods = false;
                if (itemId === 'ALL') {
                    for (const id in playerCargo) {
                        if (id === 'HOT_CARGO') continue;
                        if (playerCargo[id] > 0 && COMMODITIES[id] && COMMODITIES[id].illegal) {
                            const soldLocally = loc && loc.sells && loc.sells.some(s => (s.id === id) || (s === id));
                            if (!soldLocally) { fencingForeignGoods = true; break; }
                        }
                    }
                } else {
                    const soldLocally = loc && loc.sells && loc.sells.some(s => (s.id === itemId) || (s === itemId));
                    fencingForeignGoods = !soldLocally;
                }

                origBrokerTrade.apply(this, arguments);

                if (hasPlayerPerk('BLACK_MARKET_BARON') && playerCredits > prevCredits && typeof playerFactionStanding !== 'undefined' && fencingForeignGoods) {
                    playerFactionStanding['ECLIPSE'] = (playerFactionStanding['ECLIPSE'] || 0) + 2;
                    if (typeof logMessage === 'function') {
                        logMessage("<span style='color:#9933FF'>[ SYNDICATE KINGPIN ] +25% Black Market bonus applied (+2 Eclipse Cartel Rep).</span>");
                    }
                }
            };
            window._perksBrokerTradeHooked = true;
        }

        // K. Wrap repairShip & executeCrafting for REFINERY_EFFICIENCY (Molecular Recycler)
        if (typeof window.repairShip === 'function' && !window._perksRepairHooked) {
            const origRepairShip = window.repairShip;
            window.repairShip = function() {
                const prevCredits = typeof playerCredits !== 'undefined' ? playerCredits : 0;
                origRepairShip.apply(this, arguments);
                const spent = prevCredits - (typeof playerCredits !== 'undefined' ? playerCredits : 0);

                if (spent > 0 && hasPlayerPerk('REFINERY_EFFICIENCY')) {
                    const rebate = Math.max(1, Math.floor(spent * 0.20));
                    playerCredits += rebate;
                    if (typeof logMessage === 'function') {
                        logMessage(`<span style='color:var(--success)'>[ MOLECULAR RECYCLER ] Salvaged scrap plating offset hull overhaul cost (+${formatNumber(rebate)}c rebated).</span>`);
                    }
                    if (typeof renderUIStats === 'function') renderUIStats();
                }
            };
            window._perksRepairHooked = true;
        }

        if (typeof window.executeCrafting === 'function' && !window._perksCraftingHooked) {
            const origExecCraft = window.executeCrafting;
            window.executeCrafting = function(tab, idx) {
                const rec = (typeof CRAFTING_RECIPES !== 'undefined' && CRAFTING_RECIPES[tab]) ? CRAFTING_RECIPES[tab][idx] : null;
                const reqKeys = rec && rec.req ? Object.keys(rec.req) : [];
                const beforeCounts = {};
                reqKeys.forEach(k => { beforeCounts[k] = (typeof playerCargo !== 'undefined' && playerCargo[k]) ? playerCargo[k] : 0; });

                origExecCraft.apply(this, arguments);

                if (rec && reqKeys.length > 0 && hasPlayerPerk('REFINERY_EFFICIENCY')) {
                    const consumedSomething = reqKeys.some(k => ((playerCargo[k] || 0) < beforeCounts[k]));
                    if (consumedSomething && Math.random() < 0.25) {
                        const refundKey = reqKeys[Math.floor(Math.random() * reqKeys.length)];
                        const itemDef = typeof COMMODITIES !== 'undefined' ? COMMODITIES[refundKey] : null;
                        const weight = (itemDef && itemDef.weight !== undefined) ? itemDef.weight : 1;
                        if ((typeof currentCargoLoad !== 'undefined' ? currentCargoLoad : 0) + weight <= PLAYER_CARGO_CAPACITY) {
                            playerCargo[refundKey] = (playerCargo[refundKey] || 0) + 1;
                            if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
                            if (typeof logMessage === 'function') {
                                logMessage(`<span style='color:var(--success)'>[ MOLECULAR RECYCLER ] Closed-loop trap recovered 1x ${itemDef ? itemDef.name : refundKey}!</span>`);
                            }
                        }
                    }
                }
            };
            window._perksCraftingHooked = true;
        }

        // L. Wrap grantMissionRewards & processBountyVictory for CONTRACT_NEGOTIATOR, CHARISMATIC_CAPTAIN & Trade Mastery
        if (typeof window.grantMissionRewards === 'function' && !window._perksMissionRewardHooked) {
            const origGrantMission = window.grantMissionRewards;
            window.grantMissionRewards = function() {
                const missionSnapshot = (typeof playerActiveMission !== 'undefined' && playerActiveMission) ? {
                    rewards: playerActiveMission.rewards ? { ...playerActiveMission.rewards } : {},
                    faction: playerActiveMission.faction
                } : null;

                origGrantMission.apply(this, arguments);

                if (missionSnapshot && (typeof playerActiveMission === 'undefined' || playerActiveMission === null)) {
                    let bonusCredits = 0;
                    if (hasPlayerPerk('CONTRACT_NEGOTIATOR') && missionSnapshot.rewards.credits) {
                        const negBonus = Math.floor(missionSnapshot.rewards.credits * 0.20);
                        bonusCredits += negBonus;
                        if (missionSnapshot.faction && missionSnapshot.faction !== 'INDEPENDENT' && typeof playerFactionStanding !== 'undefined') {
                            playerFactionStanding[missionSnapshot.faction] = (playerFactionStanding[missionSnapshot.faction] || 0) + 2;
                        }
                        if (typeof logMessage === 'function') {
                            logMessage(`<span style='color:var(--gold-text)'>[ BROKER'S RETAINER ] Rider clause triggered: +${formatNumber(negBonus)}c${missionSnapshot.faction && missionSnapshot.faction !== 'INDEPENDENT' ? ` & +2 ${missionSnapshot.faction} Rep` : ''}!</span>`);
                        }
                    }

                    if (PerkUtils.hasDisciplineMastery('Trade') && missionSnapshot.rewards.credits) {
                        const masteryBonus = Math.floor(missionSnapshot.rewards.credits * 0.10);
                        bonusCredits += masteryBonus;
                    }

                    if (bonusCredits > 0 && typeof playerCredits !== 'undefined') {
                        playerCredits += bonusCredits;
                    }

                    if (hasPlayerPerk('CHARISMATIC_CAPTAIN') && missionSnapshot.rewards.xp && typeof playerXP !== 'undefined') {
                        const xpBonus = Math.max(5, Math.floor(missionSnapshot.rewards.xp * 0.20));
                        playerXP += xpBonus;
                        if (typeof logMessage === 'function') {
                            logMessage(`<span style='color:var(--accent-color)'>[ OFFICER'S BEARING ] Exemplary contract debriefing awarded +${xpBonus} bonus XP.</span>`);
                        }
                        if (typeof checkLevelUp === 'function') checkLevelUp();
                    }

                    if (typeof renderUIStats === 'function') renderUIStats();
                }
            };
            window._perksMissionRewardHooked = true;
        }

        if (typeof window.processBountyVictory === 'function' && !window._perksBountyRewardHooked) {
            const origBountyWin = window.processBountyVictory;
            window.processBountyVictory = function(defeatedEnemy) {
                const prevCredits = typeof playerCredits !== 'undefined' ? playerCredits : 0;
                const hadBounty = typeof playerActiveBounty !== 'undefined' && playerActiveBounty !== null;
                origBountyWin.apply(this, arguments);

                if (hadBounty && !playerActiveBounty && hasPlayerPerk('CONTRACT_NEGOTIATOR')) {
                    const earned = (typeof playerCredits !== 'undefined' ? playerCredits : 0) - prevCredits;
                    if (earned > 0) {
                        const bonus = Math.floor(earned * 0.20);
                        playerCredits += bonus;
                        if (typeof logMessage === 'function') {
                            logMessage(`<span style='color:var(--gold-text)'>[ BROKER'S RETAINER ] Collected +${formatNumber(bonus)}c hazard bounty surcharge!</span>`);
                        }
                        if (typeof renderUIStats === 'function') renderUIStats();
                    }
                }
            };
            window._perksBountyRewardHooked = true;
        }

        // M. Wrap rewardCrewMember & executeCrewDismissal for CHARISMATIC_CAPTAIN
        if (typeof window.rewardCrewMember === 'function' && !window._perksCrewRewardHooked) {
            const origRewardCrew = window.rewardCrewMember;
            window.rewardCrewMember = function(index, mode) {
                const crewObj = (typeof playerCrew !== 'undefined' && playerCrew[index]) ? playerCrew[index] : null;
                const prevLoyalty = crewObj ? (crewObj.loyalty || 0) : 0;
                origRewardCrew.apply(this, arguments);

                if (crewObj && hasPlayerPerk('CHARISMATIC_CAPTAIN') && (crewObj.loyalty || 0) > prevLoyalty && crewObj.loyalty < 100) {
                    crewObj.loyalty = Math.min(100, crewObj.loyalty + 5);
                    if (typeof displayCrewRoster === 'function') displayCrewRoster(index);
                }
            };
            window._perksCrewRewardHooked = true;
        }

        if (typeof window.executeCrewDismissal === 'function' && !window._perksCrewFireHooked) {
            const origDismiss = window.executeCrewDismissal;
            window.executeCrewDismissal = function(index, unpaid) {
                const prevCredits = typeof playerCredits !== 'undefined' ? playerCredits : 0;
                origDismiss.apply(this, arguments);
                const paid = prevCredits - (typeof playerCredits !== 'undefined' ? playerCredits : 0);

                if (!unpaid && paid > 0 && hasPlayerPerk('CHARISMATIC_CAPTAIN')) {
                    const saved = Math.floor(paid * 0.5);
                    playerCredits += saved;
                    if (typeof logMessage === 'function') {
                        logMessage(`<span style='color:var(--success)'>[ OFFICER'S BEARING ] Amicable parting saved ${formatNumber(saved)}c in severance pay.</span>`);
                    }
                    if (typeof renderUIStats === 'function') renderUIStats();
                }
            };
            window._perksCrewFireHooked = true;
        }

        // N. Wrap cantinaAction & listenToRumors for CANTINA_FIXER
        if (typeof window.cantinaAction === 'function' && !window._perksCantinaHooked) {
            const origCantinaAction = window.cantinaAction;
            window.cantinaAction = function(action) {
                if (action === 'DRINK' && hasPlayerPerk('CANTINA_FIXER')) {
                    if (typeof playerHull !== 'undefined' && typeof MAX_PLAYER_HULL !== 'undefined') {
                        if (playerHull >= MAX_PLAYER_HULL) {
                            if (typeof showToast === 'function') showToast("Hull integrity already maxed.", "info");
                            return;
                        }
                        playerHull = Math.min(MAX_PLAYER_HULL, playerHull + 20);
                        if (typeof soundManager !== 'undefined') soundManager.playUIHover();
                        if (typeof logMessage === 'function') {
                            logMessage("<span style='color:var(--success)'>[ CANTINA REGULAR ] Bartender slides a top-shelf Synth-Ale on the house! +20 Hull restored.</span>");
                        }
                        if (typeof showToast === 'function') showToast("ON THE HOUSE! (+20 HULL)", "success");
                        if (typeof renderUIStats === 'function') renderUIStats();
                        return;
                    }
                }

                const prevCredits = typeof playerCredits !== 'undefined' ? playerCredits : 0;
                origCantinaAction.apply(this, arguments);

                if (action === 'GAMBLE' && hasPlayerPerk('CANTINA_FIXER') && (typeof playerCredits !== 'undefined' && playerCredits > prevCredits)) {
                    playerCredits += 100;
                    if (typeof logMessage === 'function') {
                        logMessage("<span style='color:var(--gold-text)'>[ CANTINA REGULAR ] Side-bets paid off! +100c extra Pazaak bonus!</span>");
                    }
                    if (typeof renderUIStats === 'function') renderUIStats();
                }
            };
            window._perksCantinaHooked = true;
        }

        if (typeof window.listenToRumors === 'function' && !window._perksRumorsHooked) {
            const origListenRumors = window.listenToRumors;
            window.listenToRumors = function() {
                const prevXP = typeof playerXP !== 'undefined' ? playerXP : 0;
                origListenRumors.apply(this, arguments);
                const gained = (typeof playerXP !== 'undefined' ? playerXP : 0) - prevXP;

                if (gained > 0 && hasPlayerPerk('CANTINA_FIXER') && typeof playerXP !== 'undefined') {
                    playerXP += 15;
                    if (typeof logMessage === 'function') {
                        logMessage("<span style='color:var(--gold-text)'>[ CANTINA REGULAR ] Locals shared deeper backroom intel (+15 bonus XP).</span>");
                    }
                    if (typeof checkLevelUp === 'function') checkLevelUp();
                    if (typeof renderUIStats === 'function') renderUIStats();
                }
            };
            window._perksRumorsHooked = true;
        }

        // O. Wrap Cryptarch & Field Decryption for XENO_ARCHAEOLOGIST
        if (typeof window.processDecryption === 'function' && !window._perksDecryptHooked) {
            const origDecrypt = window.processDecryption;
            window.processDecryption = function() {
                const prevXP = typeof playerXP !== 'undefined' ? playerXP : 0;
                origDecrypt.apply(this, arguments);
                const gained = (typeof playerXP !== 'undefined' ? playerXP : 0) - prevXP;

                if (gained > 0 && hasPlayerPerk('XENO_ARCHAEOLOGIST') && typeof playerXP !== 'undefined') {
                    const bonusXP = Math.floor(gained * 0.35);
                    playerXP += bonusXP;
                    if (typeof logMessage === 'function') {
                        logMessage(`<span style='color:#DDA0DD'>[ PRECURSOR SCHOLAR ] Translated embedded sub-glyphs (+${bonusXP} bonus XP)!</span>`);
                    }
                    if (typeof checkLevelUp === 'function') checkLevelUp();
                }
            };
            window._perksDecryptHooked = true;
        }

        if (typeof window.donateRelicToCryptarch === 'function' && !window._perksRelicHooked) {
            const origRelic = window.donateRelicToCryptarch;
            window.donateRelicToCryptarch = function() {
                const prevCredits = typeof playerCredits !== 'undefined' ? playerCredits : 0;
                origRelic.apply(this, arguments);
                const earned = (typeof playerCredits !== 'undefined' ? playerCredits : 0) - prevCredits;

                if (earned > 0 && hasPlayerPerk('XENO_ARCHAEOLOGIST') && typeof playerCredits !== 'undefined') {
                    const bonus = Math.floor(earned * 0.25);
                    playerCredits += bonus;
                    if (typeof logMessage === 'function') {
                        logMessage(`<span style='color:var(--gold-text)'>[ PRECURSOR SCHOLAR ] Academic provenance documentation earned +${formatNumber(bonus)}c extra endowment!</span>`);
                    }
                    if (typeof renderUIStats === 'function') renderUIStats();
                }
            };
            window._perksRelicHooked = true;
        }

        if (typeof window.useCargoItem === 'function' && !window._perksCargoUseHooked) {
            const origUseCargo = window.useCargoItem;
            const decryptItems = new Set(['ENCRYPTED_ENGRAM', 'ENCRYPTED_DATA', 'ANCIENT_ARCHIVE', 'PRECURSOR_CIPHER']);
            window.useCargoItem = function(key) {
                const prevXP = typeof playerXP !== 'undefined' ? playerXP : 0;
                origUseCargo.apply(this, arguments);
                if (decryptItems.has(key) && hasPlayerPerk('XENO_ARCHAEOLOGIST')) {
                    const gained = (typeof playerXP !== 'undefined' ? playerXP : 0) - prevXP;
                    if (gained > 0 && typeof playerXP !== 'undefined') {
                        const bonusXP = Math.floor(gained * 0.35);
                        playerXP += bonusXP;
                        if (typeof logMessage === 'function') {
                            logMessage(`<span style='color:#DDA0DD'>[ PRECURSOR SCHOLAR ] Field translation unlocked +${bonusXP} bonus XP!</span>`);
                        }
                        if (typeof checkLevelUp === 'function') checkLevelUp();
                    }
                }
            };
            window._perksCargoUseHooked = true;
        }

        // P. Register "⭐ Captain Perks" Tab into Commander Datapad cleanly via UI.registerProfileTab
        if (typeof window.UI !== 'undefined' && typeof window.UI.registerProfileTab === 'function' && !window._perksProfileHooked) {
            window.UI.registerProfileTab({
                id: 'PERKS',
                name: 'Captain Perks',
                icon: '⭐',
                render: renderCaptainPerksTabHtml
            });
            window._perksProfileHooked = true;
        } else if (typeof window.displayCommanderProfile === 'function' && !window._perksProfileHooked) {
            const origDisplayProfile = window.displayCommanderProfile;
            window.displayCommanderProfile = function(tab = 'OVERVIEW') {
                origDisplayProfile.call(this, tab);
                const listEl = document.getElementById('genericModalList');
                const detailEl = document.getElementById('genericDetailContent');
                if (!listEl || !detailEl) return;

                const row = document.createElement('div');
                row.className = 'trade-item-row';
                row.style.cursor = 'pointer';
                if (tab === 'PERKS') {
                    row.style.background = 'rgba(0, 224, 224, 0.12)';
                    row.style.borderLeft = '3px solid var(--accent-color)';
                }
                row.innerHTML = `<span style="color:var(--text-color); font-weight:bold;">⭐ Captain Perks</span>`;
                row.onclick = () => window.displayCommanderProfile('PERKS');
                listEl.appendChild(row);

                if (tab === 'PERKS') {
                    detailEl.innerHTML = `<div style="padding:12px 15px;">${renderCaptainPerksTabHtml()}</div>`;
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
