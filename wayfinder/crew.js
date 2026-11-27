// --- START OF FILE crew.js ---

// ==========================================
// --- CREW ENGINE & INTERNAL HELPERS ---
// ==========================================

if (typeof playerCrew === 'undefined') window.playerCrew = [];

function _getCrewList() {
    if (typeof playerCrew !== 'undefined' && Array.isArray(playerCrew)) return playerCrew;
    if (Array.isArray(window.playerCrew)) return window.playerCrew;
    return [];
}

function _crewEscapeHtml(str) {
    return String(str === undefined || str === null ? "" : str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function _crewFormat(num) {
    if (typeof formatNumber === 'function') return formatNumber(num);
    return String(Math.trunc(Number(num) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Global helper for combat/trade engines (safe against lexical let shadowing in script.js)
window.hasCrewPerk = function(perkId) {
    const list = _getCrewList();
    return list.some(crew => crew && crew.perk === perkId);
};

// Perks that stack multiplicatively/additively in outfitting.js vs boolean-checked perks
const STACKING_CREW_PERKS = new Set(['COMBAT_DAMAGE', 'SHIELD_BOOST']);

const CREW_PERK_SUMMARIES = {
    COMBAT_DAMAGE: "+15% Ship Weapon Damage (Stacks)",
    SHIELD_BOOST: "+25% Max Deflector Shields (Stacks)",
    TRADE_BONUS: "10% Better Buy/Sell Market Prices & Security Bribes",
    PASSIVE_REPAIR: "Passively Repairs Hull Integrity During Flight",
    SCOOP_BONUS: "+20% Fuel Scooping Yield at Stars & Nebulae",
    FUEL_EFFICIENCY: "-25% Sublight Movement Fuel Consumption",
    ASTROMETRICS: "Wider Mining Sweet-Spot & Early USS Sensor Alerts",
    SCAVENGER_PROTOCOL: "Double Salvage & Credits on Derelicts, Anomalies & Raids"
};

// Rich lore profiles for all Legendary crew & Eclipse mercenaries (zero new asset paths)
const LEGENDARY_LORE_PROFILES = {
    LEGEND_ELARA: {
        origin: "Station Umbra (Western Rim)",
        trait: "Calculating",
        bio: "Former chief logistics handler for an Eclipse Cartel splinter cell. Walked away from Station Umbra with half a sector's price indexes memorized and enough leverage over Concord dockmasters to talk down any tariff.",
        quotes: [
            "Never pay sticker price in Concord space, Captain. Their quartermasters leave a 12% margin for 'administrative friction.'",
            "I left three forged manifests and two very angry brokers back at Umbra. Let's keep moving.",
            "If you hear anyone asking for 'Ghost' in the cantinas, tell them I took a freighter to the Silentium Expanse.",
            "Every starbase has two ledgers: the one SEC-COM audits, and the one that actually moves freight."
        ]
    },
    LEGEND_KAELEN: {
        origin: "Karak-Tor Proving Grounds",
        trait: "Blood-Sworn",
        isKtharr: true,
        bio: "A scarred veteran of seven K'tharr border campaigns who survived the Karak-Tor arenas before taking an outlander's coin. Respects crisp gunnery, thick armor, and captains who do not flinch when shields fail.",
        quotes: [
            "Your targeting capacitors were aligned like a civilian cargo barge's. I fixed them. You may thank me in fire.",
            "A K'tharr blade does not rust in the black, Captain—only the hand that refuses to draw it.",
            "Give me a pirate gunship or an Aegis cruiser. I grow tired of watching empty stars slide past the viewport.",
            "When shields drop, aim for their weapons array. Break their teeth, then crack the hull."
        ]
    },
    LEGEND_CORTEX: {
        origin: "University of Cygnus Prime",
        trait: "Analytical",
        bio: "A third-generation astrometric logic matrix decommissioned after predicting three 'statistically impossible' subspace shears. Operates under a provisional Concord academic waiver—mostly because nobody can figure out how to wipe its heuristics.",
        quotes: [
            "Telemetry note: Stellar drift in this quadrant deviates by 0.004 arcseconds from Concord charts. Intriguing.",
            "Organic pilots rely heavily on intuition. Remarkably, your survival rate remains 14.2% above my baseline projection.",
            "I have cross-referenced our sensor sweeps with Precursor harmonic models. Something in the deep black is listening.",
            "Reminder: Unidentified Signal Sources decay quickly. Recommend intercepting anomalous emissions when fuel permits."
        ]
    },
    JAX_VANE: {
        origin: "The Rusty Anchor",
        trait: "Trigger-Happy",
        bio: "Spent six years as head turret-chief for a Void Vulture raiding skiff before growing tired of captains who couldn't fly straight or split salvage evenly. Keeps his plasma coils spotless and his dry humor sharper.",
        quotes: [
            "I used to shoot at freighters just like ours. Good news: I know every blind spot in a pirate interceptor's arcs.",
            "Power to weapons is nominal, Captain. Say the word and I'll turn the next raider into free Tech Parts.",
            "Only rule I ever learned at The Rusty Anchor: check your ammo counter before you pick a fight.",
            "Hey, if we run into my old Void Vulture crew, let me take the first shot. They still owe me back-pay."
        ]
    },
    KORG_MAH: {
        origin: "Fortress Drakon Drydocks",
        trait: "Stoic",
        isKtharr: true,
        bio: "An old-caste K'tharr hull-smith who treats starship engineering as sacred metallurgy. Speaks little, welds through radiation storms without complaining, and insists on inspecting every bulkhead seam by hand.",
        quotes: [
            "Micro-fractures along port bulkhead sealed. A ship with weak ribs has no honor.",
            "Your reactor hums cleanly today, Captain. Do not ruin my work by flying straight into a lava plume.",
            "Concord plates are thin and loud. Give me solid Refined Alloy and a plasma torch.",
            "I have patched the hull while we drifted. Keep us in one piece and I will keep the vacuum outside."
        ]
    },
    LEGEND_ELIM: {
        origin: "Sol Sector (Formerly Classified)",
        trait: "Enigmatic",
        bio: "Insists he is nothing more than a humble clothier taking passage to source exotic Frontier silks. Curiously, he recognizes Obsidian Directorate cipher handshakes on sight and knows the private weaknesses of every port authority from Sol to Xerxes.",
        quotes: [
            "My dear Captain, I am merely a simple tailor. That I happen to know the portmaster's gambling debts is purely a happy coincidence.",
            "Truth is usually just an excuse for a lack of imagination—especially when filing Concord customs manifests.",
            "I took the liberty of adjusting your cargo valuation sheets. You'll find the local brokers far more... generous today.",
            "Do be careful near Planet Xerxes, Captain. The Spire has a habit of remembering people who prefer to remain forgotten."
        ]
    },
    LEGEND_MILES: {
        origin: "Ceti Alpha Shipyards",
        trait: "Overworked",
        bio: "Twenty years keeping aging Concord border stations and frontier haulers flying on recycled conduits and sheer stubbornness. Permanently exasperated by non-standard wiring, yet somehow pulls impossible repairs out of thin air.",
        quotes: [
            "Who wired the secondary EPS conduit through the shield inverter?! Give me ten minutes and a spanner, I'll sort it out.",
            "If the starboard plasma coupling blows one more time, I'm welding it shut permanently. Hull's holding at nominal, by the way.",
            "Never trust a ship that doesn't rattle a little at full burn. Silence means something expensive just fell off.",
            "I patched three hairline fractures while you were docking. If you're stopping at Frothy Moon Outpost, I'm owed a pint."
        ]
    },
    T3_SPARK: {
        origin: "Port Nomad Collective",
        trait: "Cheerful",
        bio: "A modified Fuel Rats collector automaton built to compute optimal coronal hydrogen-skimming angles. Chirps enthusiastically during dangerous stellar dives and keeps meticulous tabs on your fuel reserves.",
        quotes: [
            "BEEP-CHIRP! Magnetic intake manifolds calibrated for +20% deuterium capture! Ready for coronal skimming!",
            "Diagnostic reminder: O-Class and B-Class stars yield glorious hydrogen—and lethal ionizing gamma flux! Please pack dosimetry!",
            "Port Nomad taught me the First Axiom of the Void: 'Never fly dry when a yellow dwarf is two clicks port.'",
            "BZZT! Tank pressure nominal! Shall we chase a cryogenic comet today, Captain?"
        ]
    },
    LEGEND_LYRA: {
        origin: "University of Cygnus Prime",
        trait: "Obsessive",
        bio: "Former Senior Fellow expelled from Cygnus Prime after bypassing an Obsidian Directorate seal on a Precursor Archive Sphere. Knows every false bulkhead, dead-drop, and vault seam across the outer rim.",
        quotes: [
            "The Directorate calls Precursor relics 'containment hazards.' I call them the oldest history books in the galaxy.",
            "Never rush an airlock breach, Captain. Salvage twice, shoot once, and check behind the cryo-risers.",
            "If we ever find three intact Star Map Fragments, promise me you'll let me watch them fuse.",
            "They say Silentium Relay Zero out at [280, 240] still repeats the Architects' final warning."
        ]
    },
    LEGEND_CALLAGHAN: {
        origin: "Port Nomad Collective",
        trait: "Generous",
        bio: "Grandson of 'Rusty' Callaghan, who drafted the Fuel Rats Founding Charter in 2341 CE. Can nurse a half-empty deuterium tank across three macro-sectors using pure orbital mechanics and grit.",
        quotes: [
            "My granddad always said: 'Burn smart in the Core so you've got hydrogen left when the stars thin out.'",
            "Trimmed the ion throttle curve by 25%. You'll barely hear the injectors sip fuel now.",
            "Ever stop by Port Nomad up at [15, 210]? Best coffee and cheapest Fuel Cells in the quadrant.",
            "Keep an eye on drifting cryo-pods and fuel barges—out here, everybody needs a hand sooner or later."
        ]
    },
    MERC_VOIDFANG: {
        origin: "Port Erebus Shadow-Docks",
        trait: "Ruthless",
        bio: "Chrome-laced Eclipse Cartel enforcer outfitted with banned reflex optics and fire-control splices. Turns your ship's batteries lethal, though his accounting habits tend to leave your credit chip a little lighter.",
        quotes: [
            "You pay me to put holes in hulls, Captain. Don't ask too many questions about the 'ammunition surcharge.'",
            "Keep my loyalty high and my ledger greased, and I'll keep my hands out of your private accounts. Mostly.",
            "Concord patrols talk too much. One good railgun volley usually ends the conversation.",
            "If we hit a Cartel outpost, remember—I don't have friends, only former employers."
        ]
    },
    MERC_GHOST: {
        origin: "Unknown (Xerxes Spire Rumored)",
        trait: "Elusive",
        bio: "A quiet Eclipse blockade runner who can slip a freighter through an Aegis interdiction web without tripping a single sensor ping. Occasionally 'misplaces' unsecured cargo crates when left unattended.",
        quotes: [
            "...Thrusters trimmed. Keep your vector tight and they'll never lock on.",
            "That missing crate? Probably shifted in the last wormhole jump. Happens all the time.",
            "Treat your pilot right and your manifest stays intact. Simple math.",
            "Silent Running buys you five turns before the core cooks. After that, let me fly."
        ]
    }
};

const PROCEDURAL_ORIGINS = [
    "Ceti Alpha Dockhand",
    "Helios Refinery Shift-Lead",
    "Valkyrie Drift Prospector",
    "Frothy Moon Night-Watch",
    "Port Nomad Auxiliary",
    "Sol Sector Courier",
    "Cygnus Prime Lab Fellow",
    "Kepler Rim Drifter",
    "Rusty Anchor Regular",
    "Independent Free-Trader",
    "Decommissioned Concord Aux",
    "Frontier Salvage Diver"
];

const PROCEDURAL_TRAITS = [
    "Stoic",
    "Sardonic",
    "By-the-Book",
    "Superstitious",
    "Caffeine-Dependent",
    "Void-Touched",
    "Pragmatic",
    "Optimistic",
    "Methodical",
    "Restless"
];

// Cross-banter snippets when specific crew pairs serve together
const CREW_PAIR_BANTER = [
    {
        ids: ["LEGEND_MILES", "T3_SPARK"],
        lines: [
            "T3-Spark tried to 'optimize' my plasma manifold again. One more chirp out of that bucket of bolts and I'm recalibrating it with a wrench.",
            "BEEP! Chief O'Tarek's manual weld tolerances exceed factory spec by 11.4%! He yelled at me when I complimented him!"
        ]
    },
    {
        ids: ["LEGEND_ELIM", "LEGEND_KAELEN"],
        lines: [
            "Our K'tharr friend Kaelen has such a refreshing simplicity of worldview. Point him at a problem and it ceases to be a problem—usually in flames.",
            "The 'tailor' walks like an assassin and talks like a diplomat. I do not trust him, Captain—which means he is useful."
        ]
    },
    {
        ids: ["LEGEND_CORTEX", "T3_SPARK"],
        lines: [
            "T3-Spark and I spent three hours exchanging orbital telemetry harmonics. Its enthusiasm is... statistically unusual, yet efficient.",
            "CHIRP! Unit-04 Cortex knows 4,000 ways to calculate a slingshot orbit! Best bunkmate in the quadrant!"
        ]
    },
    {
        ids: ["LEGEND_ELARA", "LEGEND_ELIM"],
        lines: [
            "Elim claims he's just a simple tailor. Funny—I've seen that exact cipher-stitching on Obsidian Directorate drop-bags.",
            "Miss Vance has an admirable eye for margins, Captain. Do watch your pockets when she starts smiling."
        ]
    },
    {
        ids: ["JAX_VANE", "KORG_MAH"],
        lines: [
            "Korg'Mah reinforced my turret mounts with scrap alloy. Recoil's down to zero. Guy's a wizard with a torch.",
            "Jax shoots too fast, wastes heat. Still—his hits land where it hurts. Acceptable."
        ]
    },
    {
        ids: ["LEGEND_LYRA", "LEGEND_CORTEX"],
        lines: [
            "Cortex still has half the old Cygnus Prime spectroscopy catalog cached in cold storage. We've been arguing about Precursor syntax all shift!",
            "Dr. Korr's archaeological hypotheses exhibit a 68.4% correlation with my anomalous drift models. Most stimulating."
        ]
    },
    {
        ids: ["LEGEND_CALLAGHAN", "T3_SPARK"],
        lines: [
            "Ha! I remember welding the intake cowling on T3-Spark back in Port Nomad Bay 2. Little bot still flies straighter than half the rookies.",
            "CHIRP-SALUTE! Navigator Callaghan aboard! Collective fuel conservation efficiency now exceeding 140%!"
        ]
    },
    {
        ids: ["LEGEND_ELARA", "MERC_GHOST"],
        lines: [
            "You hired The Ghost? Good pilot—just bolt down the luxury crates and keep a biometric lock on the safe.",
            "...Elara still remembers Umbra's docking codes. Keeps things simple when we run dark."
        ]
    },
    {
        ids: ["LEGEND_KAELEN", "KORG_MAH"],
        lines: [
            "Korg'Mah's welds hold like Karak-Tor basalt. With a true smith in engineering, we can ram an Aegis frigate and laugh!",
            "Kaelen seeks glory in fire; I make sure the hull survives to tell the tale. A fair division of labor."
        ]
    }
];

function _getLoyaltyRank(loyalty) {
    const val = Math.max(0, Math.min(100, Number(loyalty) || 50));
    if (val >= 80) return { label: "DEVOTED", color: "var(--gold-text)", desc: "Grants occasional Above & Beyond field bonuses; merc theft halved." };
    if (val >= 60) return { label: "LOYAL", color: "var(--success)", desc: "Steady morale and reliable bridge discipline." };
    if (val >= 35) return { label: "PROFESSIONAL", color: "var(--accent-color)", desc: "Strictly business. Pay salaries on time." };
    return { label: "RESTLESS", color: "var(--danger)", desc: "Low morale. Consider Shore Leave or a bonus." };
}

// Safely hydrates legacy save crew objects with loyalty, origin, trait, bio & tenure
function _hydrateCrewMember(crew) {
    if (!crew) return crew;
    const profile = LEGENDARY_LORE_PROFILES[crew.id];

    if (typeof crew.loyalty !== 'number' || isNaN(crew.loyalty)) {
        crew.loyalty = crew.isMercenary ? 35 : (crew.isLegendary ? 60 : 50);
    }
    crew.loyalty = Math.max(0, Math.min(100, Math.round(crew.loyalty)));

    if (typeof crew.joinedDate !== 'number' || isNaN(crew.joinedDate)) {
        crew.joinedDate = typeof currentGameDate !== 'undefined' ? currentGameDate : 2458.0;
    }
    if (!crew.origin) {
        if (profile) crew.origin = profile.origin;
        else {
            const seed = String(crew.name || crew.id || "A").split('').reduce((a, c) => a + c.charCodeAt(0), 0);
            crew.origin = PROCEDURAL_ORIGINS[seed % PROCEDURAL_ORIGINS.length];
        }
    }
    if (!crew.trait) {
        if (profile) crew.trait = profile.trait;
        else {
            const seed = String(crew.id || crew.name || "B").split('').reduce((a, c) => a + c.charCodeAt(0), 0);
            crew.trait = PROCEDURAL_TRAITS[seed % PROCEDURAL_TRAITS.length];
        }
    }
    if (!crew.bio && profile) {
        crew.bio = profile.bio;
    }
    if (profile && profile.isKtharr) {
        crew.isKtharr = true;
    }
    return crew;
}

// ==========================================
// --- UNIFIED RECRUITMENT UI ---
// ==========================================

function openRecruitmentBoard() {
    openGenericModal("CANTINA RECRUITMENT");

    const crewList = _getCrewList();
    const maxCrew = typeof MAX_CREW !== 'undefined' ? MAX_CREW : 3;

    if (typeof currentStationRecruits === 'undefined' || currentStationRecruits === null) {
        currentStationRecruits = generateStationRecruits();
    }

    const loc = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null;
    const portName = (loc && loc.name) ? loc.name.toUpperCase() : "LOCAL PORT";
    const portFaction = (loc && loc.faction) ? loc.faction : "INDEPENDENT";

    const container = document.getElementById('genericModalContent');
    if (!container) return;
    container.style.cssText = "display: flex; flex-direction: column; height: 100%; overflow: hidden;";

    const headerImageHTML = `
        <div style="width: 100%; height: 180px; border-radius: 4px; border: 1px solid var(--accent-color); margin-bottom: 15px; box-shadow: 0 0 25px rgba(0, 224, 224, 0.2); flex-shrink: 0; overflow: hidden; background: rgba(0,0,0,0.5);">
            <img src="assets/crew_banner.png" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.9;" onerror="if(this.parentElement) this.parentElement.style.display='none';">
        </div>
    `;

    container.innerHTML = `
        ${headerImageHTML}
        <div style="display: flex; gap: 20px; flex: 1; min-height: 0; overflow: hidden;">
            
            <div style="flex: 1.2; display: flex; flex-direction: column; overflow: hidden; border-right: 1px solid var(--border-color); padding-left: 15px; padding-right: 10px;">
                <div class="trade-list-header" style="color:var(--accent-color); font-size:10px; letter-spacing:2px; margin-bottom:10px; border-bottom:1px solid #333; padding-bottom: 5px;">AVAILABLE FREELANCERS // ${_crewEscapeHtml(portName)}</div>
                <div id="genericModalList" style="flex: 1; overflow-y: auto; padding-right: 10px;"></div>
            </div>
            
            <div id="genericModalDetails" style="width: 340px; display: flex; flex-direction: column; overflow: hidden; padding-left: 5px; padding-right: 15px;">
                <div id="genericDetailContent" style="flex: 1; overflow-y: auto; padding-right: 10px;">
                    <div style="text-align:center; padding: 10px 0 20px 0;">
                        <div style="font-size:60px; margin-bottom:15px; filter: drop-shadow(0 0 15px rgba(0,224,224,0.4)); opacity:0.8;">👨‍🚀</div>
                        <h3 style="color:var(--accent-color); margin-top:0; margin-bottom:6px; letter-spacing: 2px;">LOCAL DOSSIERS</h3>
                        <div style="font-size:10px; color:var(--item-desc-color); letter-spacing:1px; margin-bottom:12px;">JURISDICTION: ${_crewEscapeHtml(portFaction)}</div>
                        <p style="color:var(--text-color); font-size:13px; line-height:1.5; font-style:italic; background: rgba(0,0,0,0.3); padding: 10px; border-left: 2px solid var(--accent-color); text-align: left;">
                            "Review the files of spacers looking for a bunk. They charge an upfront signing bonus and draw a salary every 30 Stardates. Build their loyalty to 80%+ to unlock off-shift field bonuses."
                        </p>
                        <div style="margin-top: 16px; font-size: 13px; font-weight: bold; color: var(--gold-text); background: rgba(255,215,0,0.05); border: 1px solid #886600; padding: 10px; border-radius: 4px;">
                            Current Crew Size: ${crewList.length} / ${maxCrew}
                        </div>
                    </div>
                </div>
                <div class="trade-btn-group" id="genericModalActions" style="margin-top: 15px; flex-shrink: 0; padding-bottom: 5px;">
                    <button class="action-button full-width-btn" onclick="visitCantina()" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;">◀ BACK TO CANTINA</button>
                </div>
            </div>
        </div>
    `;

    const listEl = document.getElementById('genericModalList');
    if (!listEl) return;

    if (currentStationRecruits.length === 0) {
        listEl.innerHTML = `<div style="padding:15px; color:#888; font-style:italic;">No capable spacers are looking for work here today. Try another station.</div>`;
    } else {
        currentStationRecruits.forEach((recruit, index) => {
            _hydrateCrewMember(recruit);
            const row = document.createElement('div');
            row.className = 'trade-item-row';
            row.style.cssText = "padding: 12px 10px; border-bottom: 1px solid var(--border-color); cursor: pointer; display:flex; justify-content:space-between; align-items:center;";

            const nameColor = recruit.isLegendary ? 'var(--gold-text)' : 'var(--accent-color)';
            if (recruit.isLegendary) {
                row.style.borderLeft = '3px solid var(--gold-text)';
                row.style.background = 'rgba(255,215,0,0.05)';
            }

            const isDuplicateNonStack = !STACKING_CREW_PERKS.has(recruit.perk) && window.hasCrewPerk(recruit.perk);
            const badgeHtml = isDuplicateNonStack
                ? `<span style="color:var(--warning); font-size:9px; margin-left:4px;">(COVERED)</span>`
                : (recruit.isLegendary ? `<span style="color:var(--gold-text); font-size:9px; margin-left:4px;">★ LEGEND</span>` : '');

            row.innerHTML = `
                <div>
                    <div style="color:${nameColor}; font-weight:bold; font-size: 13px;">${_crewEscapeHtml(recruit.name)} ${badgeHtml}</div>
                    <div style="color:var(--item-desc-color); font-size: 10px; margin-top: 4px;">${_crewEscapeHtml(recruit.role)} · ${_crewEscapeHtml(recruit.origin)}</div>
                </div>
                <div style="text-align:right;">
                    <span style="color:var(--success); font-weight:bold;">${_crewFormat(recruit.cost)}c</span>
                </div>
            `;
            row.onclick = () => showRecruitDetails(index);
            listEl.appendChild(row);
        });
    }
}

function showRecruitDetails(index) {
    if (!currentStationRecruits || !currentStationRecruits[index]) return;
    const recruit = _hydrateCrewMember(currentStationRecruits[index]);
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    if (!detailEl || !actionsEl) return;

    const crewList = _getCrewList();
    const maxCrew = typeof MAX_CREW !== 'undefined' ? MAX_CREW : 3;
    const salaryPerCrew = typeof COST_PER_CREW !== 'undefined' ? COST_PER_CREW : 250;
    const nameColor = recruit.isLegendary ? 'var(--gold-text)' : 'var(--accent-color)';
    const stacks = STACKING_CREW_PERKS.has(recruit.perk);
    const alreadyCovered = !stacks && window.hasCrewPerk(recruit.perk);
    const perkSummary = CREW_PERK_SUMMARIES[recruit.perk] || recruit.perk.replace(/_/g, ' ');

    const bioBlock = recruit.bio
        ? `<div style="font-size:11px; color:var(--item-desc-color); line-height:1.5; text-align:left; background:rgba(0,0,0,0.35); padding:10px; border-radius:4px; margin-bottom:12px;">
               <div style="font-size:9px; color:${nameColor}; letter-spacing:1.5px; font-weight:bold; margin-bottom:4px;">SERVICE DOSSIER</div>
               ${_crewEscapeHtml(recruit.bio)}
           </div>`
        : '';

    const duplicateWarning = alreadyCovered
        ? `<div style="background:rgba(255,170,0,0.12); border:1px solid var(--warning); padding:8px 10px; border-radius:4px; margin-bottom:12px; text-align:left; font-size:11px; color:var(--warning);">
               ⚠️ <b>OVERLAP NOTICE:</b> Another crew member already provides <b>${_crewEscapeHtml(recruit.perk.replace(/_/g, ' '))}</b>. This perk does not stack.
           </div>`
        : '';

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 10px 0;">
            <div style="position: relative; display: inline-block; margin-bottom: 12px;">
                <img src="${recruit.image || 'assets/default_npc.png'}" onerror="this.onerror=null; this.src='assets/default_npc.png';" alt="Portrait" style="width:100px; height:100px; border-radius:4px; border:2px solid ${nameColor}; object-fit:cover; box-shadow: 0 0 15px ${recruit.isLegendary ? 'rgba(255,215,0,0.3)' : 'rgba(0,224,224,0.3)'};">
                ${recruit.isLegendary ? '<div style="position: absolute; top: -10px; right: -10px; font-size: 24px; filter: drop-shadow(0 0 5px var(--gold-text));">⭐</div>' : ''}
            </div>
            
            <h3 style="color:${nameColor}; margin:0 0 5px 0;">${_crewEscapeHtml(recruit.name.toUpperCase())}</h3>
            
            <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); display: inline-block; padding: 4px 8px; border-radius: 2px; font-size: 10px; color: var(--text-color); margin-bottom: 12px; letter-spacing: 1px;">
                ${_crewEscapeHtml(recruit.role.toUpperCase())} · ${_crewEscapeHtml(recruit.trait.toUpperCase())}
            </div>
            
            <p style="font-size:12px; color:var(--text-color); margin:0 0 12px 0; line-height: 1.5; text-align: left; background: rgba(0,0,0,0.2); padding: 10px; border-left: 2px solid ${nameColor};">
                "${_crewEscapeHtml(recruit.desc)}"
            </p>

            ${bioBlock}
            ${duplicateWarning}
            
            <div class="trade-math-area" style="text-align:left;">
                <div class="trade-stat-row"><span>Origin:</span> <span style="color:var(--text-color);">${_crewEscapeHtml(recruit.origin)}</span></div>
                <div class="trade-stat-row"><span>Signing Bonus:</span> <span style="color:var(--gold-text); font-weight:bold;">${_crewFormat(recruit.cost)}c</span></div>
                <div class="trade-stat-row"><span>Ongoing Salary:</span> <span style="color:var(--item-desc-color);">${salaryPerCrew}c / 30 SD (New Total: ${_crewFormat((crewList.length + 1) * salaryPerCrew)}c)</span></div>
                <div class="trade-stat-row" style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--border-color);">
                    <span>Granted Perk:</span> <span style="color:var(--success); font-weight:bold;">${_crewEscapeHtml(recruit.perk.replace(/_/g, ' '))}</span>
                </div>
                <div style="font-size:10px; color:var(--item-desc-color); margin-top:4px; text-align:right;">
                    ${_crewEscapeHtml(perkSummary)}
                </div>
            </div>
        </div>
    `;

    const canAfford = playerCredits >= recruit.cost;
    const hasSpace = crewList.length < maxCrew;

    let btnHtml = "";
    if (!hasSpace) {
        btnHtml = `<button class="action-button danger-btn" style="width: 100%; padding: 10px; font-size: 12px; margin-bottom: 10px;" disabled>CREW QUARTERS FULL (${crewList.length}/${maxCrew})</button>`;
    } else if (!canAfford) {
        btnHtml = `<button class="action-button danger-btn" style="width: 100%; padding: 10px; font-size: 12px; margin-bottom: 10px;" disabled>INSUFFICIENT FUNDS (${_crewFormat(recruit.cost)}c)</button>`;
    } else {
        btnHtml = `
            <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; margin-bottom: 10px; border-color:var(--success); color:var(--success); box-shadow: 0 0 10px rgba(0,255,0,0.2);" onclick="hireRecruit(${index})">
                AUTHORIZE HIRE (${_crewFormat(recruit.cost)}c)
            </button>
        `;
    }

    btnHtml += `<button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="openRecruitmentBoard()">◀ CANCEL</button>`;
    actionsEl.innerHTML = btnHtml;
}

function hireRecruit(index) {
    if (!currentStationRecruits || !currentStationRecruits[index]) return;
    const recruit = _hydrateCrewMember(currentStationRecruits[index]);
    const crewList = _getCrewList();
    const maxCrew = typeof MAX_CREW !== 'undefined' ? MAX_CREW : 3;

    if (playerCredits < recruit.cost || crewList.length >= maxCrew) return;

    playerCredits -= recruit.cost;
    recruit.joinedDate = typeof currentGameDate !== 'undefined' ? currentGameDate : 2458.0;
    recruit.lastBonusTick = recruit.joinedDate;
    crewList.push(recruit);
    currentStationRecruits.splice(index, 1);

    if (typeof soundManager !== 'undefined') soundManager.playBuy();
    logMessage(`<span style="color:var(--success); font-weight:bold;">[ RECRUITMENT ]</span> ${_crewEscapeHtml(recruit.name)} (${_crewEscapeHtml(recruit.role)}) has joined your crew!`);
    if (typeof showToast === 'function') showToast(`CREW HIRED: ${recruit.name}`, "success");

    if (recruit.isLegendary && typeof addMilestone === 'function') {
        addMilestone(`Recruited legendary specialist ${recruit.name} (${recruit.role}).`);
    }

    if (typeof applyPlayerShipStats === 'function') applyPlayerShipStats();
    if (typeof renderUIStats === 'function') renderUIStats();
    if (typeof autoSaveGame === 'function') autoSaveGame();

    openRecruitmentBoard();
}

function generateStationRecruits() {
    const recruits = [];
    const crewList = _getCrewList();
    const count = Math.floor(Math.random() * 3) + 2; // 2 to 4 candidates per port

    const loc = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null;
    const portFaction = (loc && loc.faction) ? loc.faction : "INDEPENDENT";
    const isBlackMarket = Boolean(loc && loc.isBlackMarket);

    const legendaryRecruits = [
        { id: "LEGEND_ELARA", name: "Elara 'Ghost' Vance", role: "Master Infiltrator", perk: "TRADE_BONUS", desc: "Smooth talker with underworld ties. Negotiates 10% better prices at all markets.", baseCost: 5000, image: "assets/legend_elara.png", isLegendary: true, factionBias: "ECLIPSE" },
        { id: "LEGEND_KAELEN", name: "Kaelen the Butcher", role: "K'tharr Warlord", perk: "COMBAT_DAMAGE", desc: "Ruthless combat veteran. Adds +15% to all ship weapon damage.", baseCost: 7500, image: "assets/legend_kaelen.png", isLegendary: true, factionBias: "KTHARR" },
        { id: "LEGEND_CORTEX", name: "Unit-04 'Cortex'", role: "AI Navigator", perk: "ASTROMETRICS", desc: "Improves deep space scanning arrays and reveals hidden anomalies.", baseCost: 10000, image: "assets/legend_cortex.png", isLegendary: true, factionBias: "CONCORD" },
        { id: "JAX_VANE", name: "Jax Vane", role: "Gunner", perk: "COMBAT_DAMAGE", desc: "Ex-pirate with a steady hand. Adds +15% to all ship weapon damage.", baseCost: 1500, image: "assets/gunner.png", isLegendary: true, factionBias: "INDEPENDENT" },
        { id: "KORG_MAH", name: "Korg'Mah", role: "Mechanic", perk: "PASSIVE_REPAIR", desc: "A rugged K'tharr engineer. Passively repairs hull damage while you travel.", baseCost: 1800, image: "assets/engineer.png", isLegendary: true, factionBias: "KTHARR" },
        { id: "LEGEND_ELIM", name: "Elim 'The Tailor' Darok", role: "Simple Tailor", perk: "TRADE_BONUS", desc: "Claims to be a humble clothier, yet possesses extreme bargaining leverage.", baseCost: 8500, image: "assets/legend_elim.png", isLegendary: true, factionBias: "CONCORD" },
        { id: "LEGEND_MILES", name: "Chief Miles O'Tarek", role: "Miracle Worker", perk: "PASSIVE_REPAIR", desc: "A disgruntled but brilliant engineer. Can fix a warp core breach with a spanner and a piece of tape.", baseCost: 6000, image: "assets/legend_miles.png", isLegendary: true, factionBias: "CONCORD" },
        { id: "T3_SPARK", name: "T3-Spark", role: "Science Bot", perk: "SCOOP_BONUS", desc: "Advanced automated logic core. Increases fuel scooping yields by 20%.", baseCost: 2500, image: "assets/legend_spark.png", isLegendary: true, factionBias: "INDEPENDENT" },
        { id: "LEGEND_LYRA", name: "Dr. Lyra Korr", role: "Xeno-Archaeologist", perk: "SCAVENGER_PROTOCOL", desc: "Renegade Cygnus scholar. Doubles salvage and credits from derelicts, anomalies, and raids.", baseCost: 4800, image: "assets/scientist.png", isLegendary: true, factionBias: "CONCORD" },
        { id: "LEGEND_CALLAGHAN", name: "'Rusty' Callaghan Jr.", role: "Fuel Rats Navigator", perk: "FUEL_EFFICIENCY", desc: "Deep-rim Collective pilot. Reduces sublight fuel burn by 25% across every jump.", baseCost: 3200, image: "assets/engineer.png", isLegendary: true, factionBias: "INDEPENDENT" }
    ];

    const standardRoles = [
        { role: "Quartermaster", perk: "TRADE_BONUS", desc: "Negotiates 10% better prices at all stations.", baseCost: 1200, image: "assets/default_npc.png", factionBias: "CONCORD" },
        { role: "Astrogator", perk: "FUEL_EFFICIENCY", desc: "Reduces fuel consumption during sublight travel by 25%.", baseCost: 1000, image: "assets/default_npc.png", factionBias: "CONCORD" },
        { role: "Scientist", perk: "ASTROMETRICS", desc: "Improves deep space scanning arrays and asteroid laser calibration.", baseCost: 1400, image: "assets/scientist.png", factionBias: "CONCORD" },
        { role: "Eclipse Smuggler", perk: "TRADE_BONUS", desc: "Uses shadow network connections to secure 10% better prices.", baseCost: 1700, image: "assets/eclipse_smuggler.png", factionBias: "ECLIPSE" },
        { role: "Marine Veteran", perk: "COMBAT_DAMAGE", desc: "Optimizes weapon convergence, granting a flat +15% to all ship weapon damage.", baseCost: 1600, image: "assets/default_npc.png", factionBias: "KTHARR" },
        { role: "Salvage Scrapper", perk: "SCAVENGER_PROTOCOL", desc: "Yields double credits and loot when stripping derelict wrecks and anomalies.", baseCost: 1300, image: "assets/engineer.png", factionBias: "INDEPENDENT" },
        { role: "Shield Technician", perk: "SHIELD_BOOST", desc: "Overclocks emitters to permanently grant +25% Max Shields.", baseCost: 1500, image: "assets/scientist.png", factionBias: "CONCORD" },
        { role: "Chief Medical Officer", perk: "PASSIVE_REPAIR", desc: "Implements bio-restorative routines. Passively repairs hull damage while you travel.", baseCost: 1800, image: "assets/default_npc.png", factionBias: "CONCORD" },
        { role: "Gunnery Sergeant", perk: "COMBAT_DAMAGE", desc: "Maintains ordnance, adding +15% to all ship weapon damage.", baseCost: 1750, image: "assets/gunner.png", factionBias: "KTHARR" },
        { role: "Cyber-Slicer", perk: "ASTROMETRICS", desc: "Bypasses encrypted networks to reveal deep space anomalies and USS telemetry.", baseCost: 1900, image: "assets/scientist.png", factionBias: "ECLIPSE" },
        { role: "Plasma Condenser", perk: "SCOOP_BONUS", desc: "Specializes in magnetic field manipulation. Increases fuel scooping yields by 20%.", baseCost: 1100, image: "assets/engineer.png", factionBias: "INDEPENDENT" }
    ];

    const firstNames = [
        "Odin", "Nyx", "Garrus", "Sasha", "Vane", "Silas", "Kira", "Rook", "Juno", "Cassian",
        "Maren", "Dax", "Talia", "Corvus", "Vesper", "Bram", "Lyra", "Soren", "Nadia", "Kestrel"
    ];
    const lastNames = [
        "Vance", "Karn", "Trex", "Valerius", "Thorne", "Graves", "Black", "Krykov", "Sol",
        "Voss", "Morrow", "Kestrel", "Vex", "Halcyon", "Drakon", "Reyes", "Kowalski", "Mercer"
    ];

    const usedNames = new Set(crewList.map(c => c && c.name).filter(Boolean));
    const pickUniqueName = () => {
        for (let attempt = 0; attempt < 25; attempt++) {
            const candidate = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
            if (!usedNames.has(candidate)) {
                usedNames.add(candidate);
                return candidate;
            }
        }
        return `Spacer-${Math.floor(Math.random() * 900 + 100)}`;
    };

    const pickRoleForPort = () => {
        if (Math.random() < 0.45) {
            const targetFac = isBlackMarket ? "ECLIPSE" : portFaction;
            const localMatches = standardRoles.filter(r => r.factionBias === targetFac);
            if (localMatches.length > 0) {
                return localMatches[Math.floor(Math.random() * localMatches.length)];
            }
        }
        return standardRoles[Math.floor(Math.random() * standardRoles.length)];
    };

    for (let i = 0; i < count; i++) {
        if (Math.random() < 0.28) {
            const availableLegends = legendaryRecruits.filter(
                l => !crewList.some(c => c.id === l.id) && !recruits.some(r => r.id === l.id)
            );
            if (availableLegends.length > 0) {
                const localLegends = availableLegends.filter(l => l.factionBias === (isBlackMarket ? "ECLIPSE" : portFaction));
                const pool = (localLegends.length > 0 && Math.random() < 0.5) ? localLegends : availableLegends;
                const legend = pool[Math.floor(Math.random() * pool.length)];
                usedNames.add(legend.name);
                recruits.push(_hydrateCrewMember({
                    ...legend,
                    cost: legend.baseCost,
                    loyalty: 60
                }));
                continue;
            }
        }

        const roleData = pickRoleForPort();
        const origin = PROCEDURAL_ORIGINS[Math.floor(Math.random() * PROCEDURAL_ORIGINS.length)];
        const trait = PROCEDURAL_TRAITS[Math.floor(Math.random() * PROCEDURAL_TRAITS.length)];

        recruits.push(_hydrateCrewMember({
            id: `CREW_${Date.now()}_${i}_${Math.floor(Math.random() * 10000)}`,
            name: pickUniqueName(),
            role: roleData.role,
            perk: roleData.perk,
            desc: roleData.desc,
            origin: origin,
            trait: trait,
            cost: roleData.baseCost + Math.floor(Math.random() * 300),
            image: roleData.image,
            isLegendary: false,
            loyalty: 50
        }));
    }
    return recruits;
}

// ==========================================
// --- CREW ROSTER, LOYALTY & DISMISSAL ---
// ==========================================

function displayCrewRoster(selectedIndex = 0) {
    const sysMenu = document.getElementById('systemMenu');
    if (sysMenu) sysMenu.classList.add('hidden');

    const crewList = _getCrewList();
    const maxCrew = typeof MAX_CREW !== 'undefined' ? MAX_CREW : 3;
    const salaryPerCrew = typeof COST_PER_CREW !== 'undefined' ? COST_PER_CREW : 250;

    openGenericModal("CREW MANIFEST");

    const container = document.getElementById('genericModalContent');
    if (!container) return;
    container.style.cssText = "display: flex; flex-direction: column; height: 100%; overflow: hidden;";

    const headerImageHTML = `
        <div style="width: 100%; height: 180px; border-radius: 4px; border: 1px solid var(--success); margin-bottom: 15px; box-shadow: 0 0 25px rgba(0, 170, 170, 0.2); flex-shrink: 0; overflow: hidden; background: rgba(0,0,0,0.5);">
            <img src="assets/roster_banner.jpg" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.9;" onerror="this.onerror=null; this.src='assets/roster_banner.png';">
        </div>
    `;

    let nextPaydayNote = "* Paid automatically every 30 Stardates";
    if (typeof currentGameDate !== 'undefined' && typeof GameState !== 'undefined' && GameState.player && typeof GameState.player.lastPayday === 'number') {
        const interval = typeof PAYDAY_INTERVAL !== 'undefined' ? PAYDAY_INTERVAL : 30.0;
        const remaining = Math.max(0, interval - (currentGameDate - GameState.player.lastPayday));
        nextPaydayNote = `Next Payroll Cycle: ~${remaining.toFixed(1)} Stardates`;
    }

    container.innerHTML = `
        ${headerImageHTML}
        <div style="display: flex; gap: 20px; flex: 1; min-height: 0; overflow: hidden;">
            
            <div style="flex: 1.2; display: flex; flex-direction: column; overflow: hidden; border-right: 1px solid var(--border-color); padding-left: 15px; padding-right: 10px;">
                <div class="trade-list-header" style="color:var(--success); font-size:10px; letter-spacing:2px; margin-bottom:10px; border-bottom:1px solid #333; padding-bottom: 5px;">ACTIVE ROSTER (${crewList.length}/${maxCrew})</div>
                <div id="genericModalList" style="flex: 1; overflow-y: auto; padding-right: 10px;"></div>
                
                <div class="trade-math-area" style="text-align:left; border-color: #555; margin-top: 12px; margin-bottom: 5px;">
                    <div style="font-size:10px; color:#888; letter-spacing:2px; margin-bottom:5px;">PAYROLL / UPKEEP</div>
                    <div class="trade-stat-row"><span>Total Crew:</span> <span style="color:var(--text-color); font-weight:bold;">${crewList.length} / ${maxCrew}</span></div>
                    <div class="trade-stat-row"><span>Salary Cost:</span> <span style="color:var(--warning); font-weight:bold;">-${_crewFormat(crewList.length * salaryPerCrew)}c</span></div>
                    <div class="trade-stat-row" style="margin-top:5px; border-top:1px dashed #333; padding-top:5px;"><span style="font-size:10px; color:var(--item-desc-color);">${nextPaydayNote}</span></div>
                </div>
            </div>
            
            <div id="genericModalDetails" style="width: 340px; display: flex; flex-direction: column; overflow: hidden; padding-left: 5px; padding-right: 15px;">
                <div id="genericDetailContent" style="flex: 1; overflow-y: auto; padding-right: 10px;"></div>
                <div class="trade-btn-group" id="genericModalActions" style="margin-top: 15px; flex-shrink: 0; padding-bottom: 5px;"></div>
            </div>
        </div>
    `;

    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    if (!listEl || !detailEl || !actionsEl) return;

    if (crewList.length === 0) {
        listEl.innerHTML = `<div style="padding:15px; color:#666; font-style:italic;">No crew assigned. Solo flight operation.</div>`;
        detailEl.innerHTML = `
            <div style="text-align:center; padding: 40px 20px;">
                <div style="font-size:50px; opacity:0.3; margin-bottom:15px;">🛌</div>
                <h3 style="color:#666; margin-bottom:10px;">QUARTERS EMPTY</h3>
                <p style="color:var(--item-desc-color); font-size:12px;">Visit a station Cantina or Eclipse Mercenary Den to hire specialists.</p>
            </div>
        `;
        actionsEl.innerHTML = `<button class="action-button full-width-btn" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="closeGenericModal()">CLOSE ROSTER</button>`;
        return;
    }

    const safeSelectIdx = (selectedIndex >= 0 && selectedIndex < crewList.length) ? selectedIndex : 0;

    crewList.forEach((rawCrew, index) => {
        const crew = _hydrateCrewMember(rawCrew);
        const loyRank = _getLoyaltyRank(crew.loyalty);
        const row = document.createElement('div');
        row.className = 'trade-item-row';
        row.dataset.crewIdx = String(index);
        row.style.cssText = "padding: 12px 10px; border-bottom: 1px solid var(--border-color); cursor: pointer; display:flex; justify-content:space-between; align-items:center;";

        const nameColor = crew.isMercenary ? 'var(--danger)' : (crew.isLegendary ? 'var(--gold-text)' : 'var(--text-color)');
        if (crew.isLegendary) row.style.borderLeft = '3px solid var(--gold-text)';
        else if (crew.isMercenary) row.style.borderLeft = '3px solid var(--danger)';

        row.innerHTML = `
            <div>
                <div style="color:${nameColor}; font-weight:bold; font-size: 13px;">${_crewEscapeHtml(crew.name)}</div>
                <div style="color:var(--item-desc-color); font-size: 10px; margin-top: 4px;">${_crewEscapeHtml(crew.role)}</div>
            </div>
            <div style="text-align:right;">
                <div style="color:${loyRank.color}; font-size:10px; font-weight:bold;">${crew.loyalty}%</div>
                <div style="color:var(--item-desc-color); font-size:9px;">${loyRank.label}</div>
            </div>
        `;

        row.onclick = () => _renderCrewDetailPane(index);
        listEl.appendChild(row);
    });

    _renderCrewDetailPane(safeSelectIdx);
}

function _renderCrewDetailPane(index) {
    const crewList = _getCrewList();
    if (!crewList[index]) return;

    const crew = _hydrateCrewMember(crewList[index]);
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    if (!detailEl || !actionsEl) return;

    if (listEl) {
        listEl.querySelectorAll('.trade-item-row').forEach(r => {
            const isSel = Number(r.dataset.crewIdx) === index;
            r.style.background = isSel ? 'rgba(0, 224, 224, 0.12)' : 'transparent';
        });
    }

    const nameColor = crew.isMercenary ? 'var(--danger)' : (crew.isLegendary ? 'var(--gold-text)' : 'var(--success)');
    const loyRank = _getLoyaltyRank(crew.loyalty);
    const tenure = typeof currentGameDate !== 'undefined' ? Math.max(0, currentGameDate - (crew.joinedDate || currentGameDate)) : 0;

    const bonusDisplay = crew.isMercenary
        ? `<div class="trade-stat-row">
               <span style="color:#888;">Operative Bonus:</span>
               <span style="color:var(--danger); font-weight:bold;">${(crew.stats && crew.stats.damageBonus) ? `+${crew.stats.damageBonus} Damage` : `+${Math.round(((crew.stats && crew.stats.evasionBonus) || 0) * 100)}% Evasion`}</span>
           </div>`
        : `<div class="trade-stat-row">
               <span style="color:#888;">Active Perk:</span>
               <span style="color:var(--success); font-weight:bold;">${_crewEscapeHtml((crew.perk || 'SPECIALIST').replace(/_/g, ' '))}</span>
           </div>
           <div style="font-size:10px; color:var(--item-desc-color); text-align:right; margin-top:3px;">
               ${_crewEscapeHtml(CREW_PERK_SUMMARIES[crew.perk] || '')}
           </div>`;

    const bioHtml = crew.bio
        ? `<div style="font-size:11px; color:var(--item-desc-color); line-height:1.5; text-align:left; background:rgba(0,0,0,0.3); padding:10px; border-radius:4px; margin-bottom:12px;">
               <div style="font-size:9px; color:${nameColor}; letter-spacing:1.5px; font-weight:bold; margin-bottom:4px;">BACKGROUND DOSSIER</div>
               ${_crewEscapeHtml(crew.bio)}
           </div>`
        : '';

    const mercWarningHtml = crew.drawback
        ? `<div style="background: rgba(255,0,0,0.1); border: 1px solid var(--danger); padding: 10px; border-radius: 4px; margin-top: 12px; text-align: left;">
               <div style="color:var(--danger); font-size:10px; font-weight:bold; letter-spacing:1px; margin-bottom:4px;">⚠️ SECURITY WARNING</div>
               <div style="font-size:11px; color:var(--text-color);">
                   Known to occasionally siphon ${_crewEscapeHtml(crew.drawback.type.replace('STEAL_', '').toLowerCase())}.
                   ${crew.loyalty >= 75 ? '<br><span style="color:var(--success);">✓ High Loyalty active: Theft risk cut in half!</span>' : '<br><span style="color:var(--item-desc-color);">Raise Loyalty to 75%+ to halve theft risk.</span>'}
               </div>
           </div>`
        : '';

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 10px 0;">
            <img src="${crew.image || 'assets/default_npc.png'}" onerror="this.onerror=null; this.src='assets/default_npc.png';" style="width:96px; height:96px; object-fit: cover; border-radius:4px; margin-bottom:12px; border: 2px solid ${nameColor}; box-shadow: 0 0 15px ${crew.isLegendary ? 'rgba(255,215,0,0.2)' : 'rgba(0,170,170,0.2)'};">
            <h3 style="color:${nameColor}; margin:0 0 5px 0;">${_crewEscapeHtml(crew.name.toUpperCase())}</h3>
            
            <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); display: inline-block; padding: 4px 8px; border-radius: 2px; font-size: 10px; color: ${nameColor}; margin-bottom: 12px; letter-spacing: 1px;">
                ${_crewEscapeHtml(crew.role.toUpperCase())} · ${_crewEscapeHtml(crew.trait.toUpperCase())}
            </div>
            
            <p style="font-size:12px; color:var(--text-color); line-height:1.5; text-align: left; background: rgba(0,0,0,0.2); padding: 10px; border-left: 2px solid ${nameColor}; margin:0 0 12px 0;">
                "${_crewEscapeHtml(crew.desc)}"
            </p>

            ${bioHtml}
            
            <div class="trade-math-area" style="text-align:left; border-color: ${crew.isMercenary ? 'var(--danger)' : 'var(--success)'};">
                <div class="trade-stat-row"><span>Origin:</span> <span style="color:var(--text-color);">${_crewEscapeHtml(crew.origin)}</span></div>
                <div class="trade-stat-row"><span>Tenure:</span> <span style="color:var(--item-desc-color);">${tenure.toFixed(1)} Stardates</span></div>
                <div class="trade-stat-row"><span>Loyalty:</span> <span style="color:${loyRank.color}; font-weight:bold;">${crew.loyalty}% (${loyRank.label})</span></div>
                <div style="height:5px; background:#222; border-radius:3px; overflow:hidden; margin:4px 0 8px 0;">
                    <div style="height:100%; width:${crew.loyalty}%; background:${loyRank.color}; transition:width 0.3s;"></div>
                </div>
                <div style="font-size:10px; color:var(--item-desc-color); margin-bottom:8px;">${loyRank.desc}</div>
                ${bonusDisplay}
            </div>

            ${mercWarningHtml}
        </div>
    `;

    // Check Shore Leave / Cargo Treat options
    const hasSpices = crew.isKtharr && typeof playerCargo !== 'undefined' && (playerCargo['KTHARR_SPICES'] || 0) > 0;
    const hasAle = typeof playerCargo !== 'undefined' && (playerCargo['FROTHY_MOON_ALE'] || 0) > 0;
    const hasWine = typeof playerCargo !== 'undefined' && (playerCargo['ANCIENT_WINE'] || 0) > 0;
    const isMaxLoyalty = crew.loyalty >= 100;

    let treatBtnHtml = '';
    if (!isMaxLoyalty) {
        if (hasSpices) {
            treatBtnHtml = `<button class="action-button" style="width:100%; padding:8px; font-size:11px; margin-bottom:8px; border-color:var(--danger); color:var(--danger);" onclick="rewardCrewMember(${index}, 'SPICES')">🌶️ SHARE K'THARR SPICES (+20 Loyalty)</button>`;
        } else if (hasWine) {
            treatBtnHtml = `<button class="action-button" style="width:100%; padding:8px; font-size:11px; margin-bottom:8px; border-color:var(--gold-text); color:var(--gold-text);" onclick="rewardCrewMember(${index}, 'WINE')">🍷 SHARE ANCIENT WINE (+25 Loyalty)</button>`;
        } else if (hasAle) {
            treatBtnHtml = `<button class="action-button" style="width:100%; padding:8px; font-size:11px; margin-bottom:8px; border-color:var(--gold-text); color:var(--gold-text);" onclick="rewardCrewMember(${index}, 'ALE')">🍺 SHARE FROTHY MOON ALE (+15 Loyalty)</button>`;
        } else {
            const canAffordBonus = typeof playerCredits !== 'undefined' && playerCredits >= 150;
            treatBtnHtml = `<button class="action-button" ${canAffordBonus ? '' : 'disabled'} style="width:100%; padding:8px; font-size:11px; margin-bottom:8px; border-color:var(--gold-text); color:var(--gold-text);" onclick="rewardCrewMember(${index}, 'CREDITS')">💰 SHORE LEAVE BONUS (150c, +15 Loyalty)</button>`;
        }
    }

    actionsEl.innerHTML = `
        <div style="display:flex; gap:8px; margin-bottom:8px;">
            <button class="action-button" style="flex:1; padding:9px 6px; font-size:11px; margin:0; border-color:var(--success); color:var(--success);" onclick="openCrewComm(${index})">🎙️ INTERCOM</button>
            <button class="action-button" style="flex:1; padding:9px 6px; font-size:11px; margin:0; border-color:var(--accent-color); color:var(--accent-color);" onclick="requestCrewAdvice(${index})">📋 BRIEFING</button>
        </div>
        ${treatBtnHtml}
        <button class="action-button danger-btn" style="width: 100%; padding: 9px; font-size: 11px; margin-bottom: 8px;" onclick="fireCrew(${index})">DISMISS FROM SERVICE</button>
        <button class="action-button full-width-btn" style="width: 100%; padding: 9px; font-size: 11px; border-color: #888; color: #888;" onclick="closeGenericModal()">CLOSE ROSTER</button>
    `;
}

// ==========================================
// --- LOYALTY REWARDS & SHORE LEAVE ---
// ==========================================

function rewardCrewMember(index, mode = 'CREDITS') {
    const crewList = _getCrewList();
    if (!crewList[index]) return;
    const crew = _hydrateCrewMember(crewList[index]);

    if (crew.loyalty >= 100) {
        if (typeof showToast === 'function') showToast(`${crew.name} IS ALREADY DEVOTED`, "info");
        return;
    }

    const nowDate = typeof currentGameDate !== 'undefined' ? currentGameDate : 0;
    if (mode === 'CREDITS' && crew.lastGiftDate !== undefined && (nowDate - crew.lastGiftDate) < 1.0) {
        if (typeof showToast === 'function') showToast("ALREADY REWARDED THIS CYCLE", "warning");
        if (typeof soundManager !== 'undefined') soundManager.playError();
        return;
    }

    let gain = 15;
    let flavor = "";

    if (mode === 'SPICES') {
        if (typeof playerCargo === 'undefined' || (playerCargo['KTHARR_SPICES'] || 0) < 1) return;
        playerCargo['KTHARR_SPICES'] -= 1;
        if (playerCargo['KTHARR_SPICES'] <= 0) {
            delete playerCargo['KTHARR_SPICES'];
            if (window.playerCargoCostBasis) delete window.playerCargoCostBasis['KTHARR_SPICES'];
        }
        if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
        gain = 20;
        flavor = `${_crewEscapeHtml(crew.name)} inhales the fiery K'tharr spices with a deep warrior's nod of respect!`;
    } else if (mode === 'WINE') {
        if (typeof playerCargo === 'undefined' || (playerCargo['ANCIENT_WINE'] || 0) < 1) return;
        playerCargo['ANCIENT_WINE'] -= 1;
        if (playerCargo['ANCIENT_WINE'] <= 0) {
            delete playerCargo['ANCIENT_WINE'];
            if (window.playerCargoCostBasis) delete window.playerCargoCostBasis['ANCIENT_WINE'];
        }
        if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
        gain = 25;
        flavor = `You uncork a pre-warp vintage with ${_crewEscapeHtml(crew.name)} in the mess hall. Morale soars!`;
    } else if (mode === 'ALE') {
        if (typeof playerCargo === 'undefined' || (playerCargo['FROTHY_MOON_ALE'] || 0) < 1) return;
        playerCargo['FROTHY_MOON_ALE'] -= 1;
        if (playerCargo['FROTHY_MOON_ALE'] <= 0) {
            delete playerCargo['FROTHY_MOON_ALE'];
            if (window.playerCargoCostBasis) delete window.playerCargoCostBasis['FROTHY_MOON_ALE'];
        }
        if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
        gain = 15;
        flavor = `You split a cold mug of Frothy Moon Ale with ${_crewEscapeHtml(crew.name)}.`;
    } else {
        if (playerCredits < 150) {
            if (typeof showToast === 'function') showToast("INSUFFICIENT CREDITS (150c)", "error");
            return;
        }
        playerCredits -= 150;
        crew.lastGiftDate = nowDate;
        gain = 15;
        flavor = `Transferred a 150c shore-leave stipend to ${_crewEscapeHtml(crew.name)}.`;
    }

    crew.loyalty = Math.min(100, crew.loyalty + gain);

    if (typeof soundManager !== 'undefined') soundManager.playGain();
    if (typeof showToast === 'function') showToast(`${crew.name}: +${gain}% LOYALTY`, "success");
    logMessage(`<span style="color:var(--gold-text)">[ CREW MORALE ]</span> ${flavor} (Loyalty: ${crew.loyalty}%)`);

    if (typeof renderUIStats === 'function') renderUIStats();
    if (typeof updateModalInfoBar === 'function') updateModalInfoBar('genericInfoBar');
    if (typeof autoSaveGame === 'function') autoSaveGame();

    displayCrewRoster(index);
}

// ==========================================
// --- CREW SPECIALIST BRIEFINGS ---
// ==========================================

function requestCrewAdvice(index) {
    const crewList = _getCrewList();
    if (!crewList[index]) return;
    const crew = _hydrateCrewMember(crewList[index]);

    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    if (!detailEl || !actionsEl) return;

    const nameColor = crew.isMercenary ? 'var(--danger)' : (crew.isLegendary ? 'var(--gold-text)' : 'var(--accent-color)');
    const briefingLines = [];

    // 1. Trade / Smuggler Intel
    if (crew.perk === 'TRADE_BONUS' || crew.isMercenary) {
        const trendValid = typeof activeMarketTrend !== 'undefined' && activeMarketTrend &&
            (typeof currentGameDate === 'undefined' || currentGameDate < activeMarketTrend.expiry);
        if (trendValid && typeof COMMODITIES !== 'undefined') {
            const itemName = COMMODITIES[activeMarketTrend.item] ? COMMODITIES[activeMarketTrend.item].name : activeMarketTrend.item;
            const status = activeMarketTrend.isBoom ? "CRITICAL SHORTAGE (250% payout)" : "MARKET SURPLUS (40% buy-in)";
            briefingLines.push(`Subspace trade wires show a <b>${status}</b> on <b>${_crewEscapeHtml(itemName)}</b> at <b>${_crewEscapeHtml(activeMarketTrend.station)}</b>.`);
        } else {
            briefingLines.push("Markets look flat right now. Hauling raw Minerals to Starbase Alpha, Ale to Valkyrie Drift, or Refined Alloy to Karak-Tor is always reliable coin.");
        }
        if (typeof playerCargo !== 'undefined') {
            const contrabandCount = Object.keys(playerCargo).filter(id => playerCargo[id] > 0 && typeof COMMODITIES !== 'undefined' && COMMODITIES[id] && COMMODITIES[id].illegal).length;
            if (contrabandCount > 0) {
                briefingLines.push(`We're carrying <b>${contrabandCount} type(s) of contraband</b>. Fence foreign stock at a Shadow Broker or engage Silent Running (Q) around Concord hubs.`);
            }
        }
    }
    // 2. Navigation / Fuel / Science Intel
    else if (crew.perk === 'ASTROMETRICS' || crew.perk === 'FUEL_EFFICIENCY' || crew.perk === 'SCOOP_BONUS') {
        if (typeof findNearestStation === 'function' && typeof playerX !== 'undefined' && typeof playerY !== 'undefined') {
            const nearest = findNearestStation(playerX, playerY);
            if (nearest) {
                const dist = Math.floor(Math.sqrt(Math.pow(nearest.x - playerX, 2) + Math.pow(nearest.y - playerY, 2)));
                briefingLines.push(`Nearest safe harbor is <b>${_crewEscapeHtml(nearest.name)}</b> at [${nearest.x}, ${-nearest.y}], roughly <b>${dist} units</b> away.`);
            }
        }
        if (typeof playerFuel !== 'undefined' && typeof MAX_FUEL !== 'undefined') {
            const pct = Math.round((playerFuel / Math.max(1, MAX_FUEL)) * 100);
            briefingLines.push(`Deuterium tanks sit at <b>${pct}%</b>. Remember that F/G/K stars are safe to scoop, while O/B supergiants require dosimetry shielding.`);
        }
    }
    // 3. Engineering / Repair / Salvage Intel
    else if (crew.perk === 'PASSIVE_REPAIR' || crew.perk === 'SCAVENGER_PROTOCOL' || crew.perk === 'SHIELD_BOOST') {
        if (typeof playerHull !== 'undefined' && typeof MAX_PLAYER_HULL !== 'undefined') {
            const hullPct = Math.round((playerHull / Math.max(1, MAX_PLAYER_HULL)) * 100);
            briefingLines.push(`Structural hull integrity reads <b>${hullPct}%</b> (${Math.floor(playerHull)}/${MAX_PLAYER_HULL}).`);
        }
        if (typeof activeSynergy !== 'undefined' && activeSynergy) {
            briefingLines.push(`Manufacturer Set Synergy <b>${_crewEscapeHtml(activeSynergy.name)}</b> is humming nicely (${_crewEscapeHtml(activeSynergy.desc)}).`);
        } else {
            briefingLines.push("No 3-piece Manufacturer Set Synergy online yet. Matching three Concord, K'tharr, Eclipse, or Frontier modules unlocks a free passive boost.");
        }
    }
    // 4. Combat / Tactical Intel
    else {
        const dmg = typeof PLAYER_ATTACK_DAMAGE !== 'undefined' ? PLAYER_ATTACK_DAMAGE : 8;
        const hit = typeof PLAYER_HIT_CHANCE !== 'undefined' ? Math.round(PLAYER_HIT_CHANCE * 100) : 70;
        briefingLines.push(`Main batteries calibrated for <b>${dmg} base damage</b> at <b>${hit}% accuracy</b>.`);
        if (typeof playerActiveBounty !== 'undefined' && playerActiveBounty) {
            briefingLines.push(`Active bounty <b>${_crewEscapeHtml(playerActiveBounty.targetName)}</b> last tracked near [${playerActiveBounty.x}, ${-playerActiveBounty.y}].`);
        } else {
            briefingLines.push("Drop hostile shields first, then target Weapons to cut their output in half—or board with Marines for 3x salvage.");
        }
    }

    // 5. Cross-cutting Colony / Contract Reminders
    if (typeof playerColonies !== 'undefined' && playerColonies) {
        const starvingCol = Object.values(playerColonies).find(c => c && c.established && (!c.storage || (c.storage['FOOD_SUPPLIES'] || 0) <= 0));
        if (starvingCol) {
            briefingLines.push(`<span style="color:var(--danger);"><b>COLONY ALERT:</b> ${_crewEscapeHtml(starvingCol.name)} [${starvingCol.x}, ${-starvingCol.y}] is out of Food Supplies!</span>`);
        }
    }
    if (typeof playerActiveMission !== 'undefined' && playerActiveMission && playerActiveMission.isComplete) {
        briefingLines.push(`<span style="color:var(--success);">Contract <b>${_crewEscapeHtml(playerActiveMission.title)}</b> is ready for turn-in at <b>${_crewEscapeHtml(playerActiveMission.giver)}</b>.</span>`);
    }

    if (typeof soundManager !== 'undefined' && typeof soundManager.playScan === 'function') {
        soundManager.playScan();
    }

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 15px 10px; animation: fadeIn 0.25s;">
            <div style="font-size:40px; margin-bottom:10px; filter: drop-shadow(0 0 12px ${nameColor});">📋</div>
            <div style="font-size:10px; color:#888; letter-spacing:2px; margin-bottom:6px;">SPECIALIST FIELD BRIEFING</div>
            <h3 style="color:${nameColor}; margin:0 0 15px 0;">${_crewEscapeHtml(crew.name.toUpperCase())}</h3>

            <div style="background: rgba(0,0,0,0.45); border: 1px solid var(--border-color); border-left: 3px solid ${nameColor}; padding: 15px; border-radius: 4px; text-align:left; font-size:12px; line-height:1.6; color:var(--text-color);">
                ${briefingLines.map(line => `<div style="margin-bottom:10px;">• ${line}</div>`).join('')}
            </div>
        </div>
    `;

    actionsEl.innerHTML = `
        <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: ${nameColor}; color: ${nameColor};" onclick="openCrewComm(${index})">🎙️ SWITCH TO INTERCOM</button>
        <button class="action-button full-width-btn" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="_renderCrewDetailPane(${index})">◀ BACK TO DOSSIER</button>
    `;
}

// ==========================================
// --- CREW INTERCOM (CONTEXT-AWARE BANTER) ---
// ==========================================

function _buildCrewQuotes(crew, crewList) {
    const quotes = [];
    const profile = LEGENDARY_LORE_PROFILES[crew.id];

    if (profile && Array.isArray(profile.quotes)) {
        quotes.push(...profile.quotes);
    }

    if (typeof playerHull !== 'undefined' && typeof MAX_PLAYER_HULL !== 'undefined' && playerHull < MAX_PLAYER_HULL * 0.4) {
        quotes.push("Captain, the bulkheads are groaning and sparks are coming out of Deck 2. Please find a repair bay soon.");
        quotes.push("Hull integrity is critical! One stray micrometeoroid and we're breathing vacuum.");
    }
    if (typeof playerFuel !== 'undefined' && typeof MAX_FUEL !== 'undefined' && playerFuel < MAX_FUEL * 0.25) {
        quotes.push("Deuterium gauges are nearly in the red. Let's scoop a star or ping [N] for the nearest port before we call the Fuel Rats.");
    }
    if (typeof isSilentRunning !== 'undefined' && isSilentRunning) {
        quotes.push("Running dark, huh? It's getting sweltering in here—keep an eye on the reactor heat gauge.");
    }
    if (typeof playerNotoriety !== 'undefined' && playerNotoriety >= 15) {
        quotes.push("Half of Concord SEC-COM has our transponder on their watch-board. Might want to visit a Security Office or The Forger.");
    }
    if (typeof playerCargo !== 'undefined' && (playerCargo['WAYFINDER_CORE'] || 0) > 0) {
        quotes.push("Whatever that Precursor compass in the cargo hold is, it's making the bridge lights hum in rhythm with my pulse.");
    }
    if (typeof getFactionAt === 'function' && typeof playerX !== 'undefined' && typeof playerY !== 'undefined') {
        const fac = getFactionAt(playerX, playerY);
        if (fac === 'KTHARR') quotes.push("K'tharr space. Keep shields charged and don't show weakness on the comms.");
        else if (fac === 'ECLIPSE') quotes.push("Eclipse Cartel territory. Good profits if you've got nerve—bad place to fly slow.");
        else if (fac === 'CONCORD') quotes.push("Concord Core space. Clean lanes, strict customs scans, and plenty of contracts.");
    }

    if (crewList.length > 1) {
        for (let i = 0; i < CREW_PAIR_BANTER.length; i++) {
            const pair = CREW_PAIR_BANTER[i];
            if (pair.ids.includes(crew.id)) {
                const partnerId = pair.ids.find(id => id !== crew.id);
                if (crewList.some(c => c && c.id === partnerId)) {
                    const lineIdx = pair.ids.indexOf(crew.id);
                    if (pair.lines[lineIdx]) quotes.push(pair.lines[lineIdx]);
                }
            }
        }
    }

    const role = (crew.role || "").toLowerCase();
    if (role.includes('engineer') || role.includes('mechanic') || role.includes('worker') || role.includes('scrapper') || role.includes('condenser')) {
        quotes.push(
            "I can only patch these conduits so many times before we need a drydock.",
            "If you push the engines any harder, I'm not responsible for what happens.",
            "I bypassed the secondary coupling. We should get slightly cleaner flow now."
        );
    } else if (role.includes('scientist') || role.includes('medical') || role.includes('trauma') || role.includes('bot') || role.includes('navigator') || role.includes('archaeologist')) {
        quotes.push(
            "The background radiation in this sector is fascinating.",
            "Please remember to check your dosimetry badges before scooping hot blue stars.",
            "I'm running a spectroscopic sweep on the last batch of planetary samples we brought aboard."
        );
    } else if (role.includes('gunner') || role.includes('marine') || role.includes('warlord') || role.includes('enforcer')) {
        quotes.push(
            "Weapons are hot and ready. Just give the word.",
            "When do we get to shoot something?",
            "I've recalibrated the targeting sensors. We won't miss."
        );
    } else if (role.includes('smuggler') || crew.isMercenary || role.includes('tailor') || role.includes('slicer') || role.includes('infiltrator')) {
        quotes.push(
            "I didn't see anything. I wasn't even there.",
            "If Concord scans us, I'm hiding in the maintenance shaft.",
            "Don't ask where I got those market leads. Just know they pay."
        );
    } else {
        quotes.push(
            "Everything looks green on my board, Captain.",
            "Just waiting for the next jump.",
            "I need a coffee. Do we have any coffee left in the galley?",
            "Ship's running smooth. For now."
        );
    }

    return quotes;
}

function openCrewComm(index) {
    const crewList = _getCrewList();
    if (!crewList[index]) return;
    const crew = _hydrateCrewMember(crewList[index]);

    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    if (!detailEl || !actionsEl) return;

    const quotes = _buildCrewQuotes(crew, crewList);
    const filtered = quotes.length > 1 ? quotes.filter(q => q !== crew._lastQuote) : quotes;
    const randomQuote = filtered[Math.floor(Math.random() * filtered.length)] || quotes[0];
    crew._lastQuote = randomQuote;

    const nameColor = crew.isMercenary ? 'var(--danger)' : (crew.isLegendary ? 'var(--gold-text)' : 'var(--success)');

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 18px 10px; animation: fadeIn 0.3s;">
            <div style="font-size:40px; margin-bottom:12px; filter: drop-shadow(0 0 15px ${nameColor}); animation: pulse 2s infinite;">🎙️</div>
            <div style="font-size:10px; color:#888; letter-spacing:2px; margin-bottom:8px;">SECURE CHANNEL OPEN</div>
            <h3 style="color:${nameColor}; margin:0 0 15px 0;">${_crewEscapeHtml(crew.name.toUpperCase())}</h3>
            
            <div style="background: rgba(0,0,0,0.5); border: 1px solid var(--border-color); padding: 18px; border-radius: 4px; border-left: 4px solid ${nameColor}; text-align: left; position: relative;">
                <div style="font-size:13px; color:var(--text-color); font-style:italic; line-height:1.6;">
                    "${_crewEscapeHtml(randomQuote)}"
                </div>
            </div>
            
            <div style="margin-top: 16px; font-size:11px; color:var(--item-desc-color);">
                Signal Strength: 100% (Ship Intranet) · Loyalty: ${crew.loyalty}%
            </div>
        </div>
    `;

    if (typeof soundManager !== 'undefined' && typeof soundManager.playUIHover === 'function') {
        soundManager.playUIHover();
    }

    actionsEl.innerHTML = `
        <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; margin-bottom: 8px; border-color: ${nameColor}; color: ${nameColor};" onclick="openCrewComm(${index})">💬 KEEP TALKING</button>
        <button class="action-button full-width-btn" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="_renderCrewDetailPane(${index})">◀ CLOSE COMM LINK</button>
    `;
}

// ==========================================
// --- CREW DISMISSAL (SAFE SEVERANCE) ---
// ==========================================

function fireCrew(index) {
    const crewList = _getCrewList();
    if (!crewList[index]) return;
    const crew = _hydrateCrewMember(crewList[index]);

    const severanceFee = Math.floor((crew.cost || 1000) * 0.10);
    const canPaySeverance = typeof playerCredits !== 'undefined' && playerCredits >= severanceFee;

    const confirmText = canPaySeverance
        ? `Dismiss ${crew.name} (${crew.role}) from service? Standard 10% severance pay of ${_crewFormat(severanceFee)}c will be deducted.`
        : `You lack the ${_crewFormat(severanceFee)}c severance pay for ${crew.name}. Discharge them without severance? (They won't be pleased.)`;

    if (typeof showConfirmationModal === 'function') {
        showConfirmationModal(confirmText, () => executeCrewDismissal(index, !canPaySeverance));
    } else {
        executeCrewDismissal(index, !canPaySeverance);
    }
}

function executeCrewDismissal(index, unpaid = false) {
    const crewList = _getCrewList();
    if (!crewList[index]) return;
    const crew = crewList[index];
    const severanceFee = Math.floor((crew.cost || 1000) * 0.10);

    if (!unpaid && playerCredits >= severanceFee) {
        playerCredits -= severanceFee;
        logMessage(`You dismissed <span style="color:var(--warning);">${_crewEscapeHtml(crew.name)}</span> with ${_crewFormat(severanceFee)}c in severance pay.`);
    } else {
        logMessage(`<span style="color:var(--danger)">[ UNPAID DISCHARGE ]</span> You cut <span style="color:var(--warning);">${_crewEscapeHtml(crew.name)}</span> loose without severance. Word of your stinginess spreads through the docks.`);
        if ((crew.isLegendary || crew.isMercenary) && typeof updatePlayerNotoriety === 'function') {
            updatePlayerNotoriety(1);
        }
    }

    crewList.splice(index, 1);

    window.hasEclipseMerc = crewList.some(c => c && c.isMercenary);

    if (typeof applyPlayerShipStats === 'function') applyPlayerShipStats();
    if (typeof showToast === 'function') showToast("CREW DISMISSED", "info");
    if (typeof renderUIStats === 'function') renderUIStats();
    if (typeof autoSaveGame === 'function') autoSaveGame();

    displayCrewRoster(Math.max(0, index - 1));
}

// ==========================================
// --- ECLIPSE SHADOW MERCENARIES ---
// ==========================================

function hireMercenary(mercId) {
    if (typeof ECLIPSE_MERCENARIES === 'undefined') return;

    const merc = ECLIPSE_MERCENARIES.find(m => m.id === mercId);
    if (!merc) return;

    const crewList = _getCrewList();
    const maxCrew = typeof MAX_CREW !== 'undefined' ? MAX_CREW : 3;

    if (crewList.some(c => c && c.id === mercId)) {
        if (typeof showToast === 'function') showToast("OPERATIVE ALREADY HIRED", "error");
        return;
    }
    if (playerCredits < merc.cost) {
        if (typeof showToast === 'function') showToast("INSUFFICIENT FUNDS", "error");
        return;
    }
    if (crewList.length >= maxCrew) {
        if (typeof showToast === 'function') showToast("CREW QUARTERS FULL", "error");
        return;
    }

    playerCredits -= merc.cost;
    window.hasEclipseMerc = true;

    const nowDate = typeof currentGameDate !== 'undefined' ? currentGameDate : 2458.0;
    const newMerc = _hydrateCrewMember({
        id: merc.id,
        name: merc.name,
        role: merc.role,
        desc: merc.desc,
        cost: merc.cost,
        isMercenary: true,
        stats: merc.stats,
        drawback: merc.drawback,
        image: merc.image || 'assets/eclipse_smuggler.png',
        isLegendary: false,
        loyalty: 35,
        joinedDate: nowDate,
        lastBonusTick: nowDate,
        perk: merc.role.toUpperCase().replace(/ /g, '_')
    });

    crewList.push(newMerc);

    if (typeof applyPlayerShipStats === 'function') applyPlayerShipStats();
    if (typeof soundManager !== 'undefined') soundManager.playBuy();
    if (typeof showToast === 'function') showToast("CONTRACT SIGNED", "success");

    logMessage(`<span style="color:#9C27B0; font-weight:bold;">[ SHADOW NETWORK ]</span> ${_crewEscapeHtml(merc.name)} has joined your crew. Keep an eye on your valuables—or earn their loyalty.`);

    if (typeof addMilestone === 'function') {
        addMilestone(`Signed an Eclipse Shadow Network contract with ${merc.name}.`);
    }
    if (typeof openMercenaryDen === 'function') openMercenaryDen();
    if (typeof renderUIStats === 'function') renderUIStats();
    if (typeof autoSaveGame === 'function') autoSaveGame();
}

// Protected cargo IDs that mercenaries must NEVER steal (prevents quest/megastructure soft-locks)
const MERC_PROTECTED_ITEMS = new Set([
    'HOT_CARGO',
    'WAYFINDER_CORE',
    'COLONY_CHARTER',
    'STATION_CORE',
    'WORMHOLE_STABILIZER',
    'PREFAB_COLONY_CORE',
    'PRECURSOR_NAV_CORE',
    'PRECURSOR_STAR_MAP_FRAGMENT'
]);

function processMercenaryDrawbacks() {
    const crewList = _getCrewList();
    if (crewList.length === 0) return;

    const activeMissionItem = (typeof playerActiveMission !== 'undefined' && playerActiveMission && !playerActiveMission.isComplete &&
        playerActiveMission.objectives && playerActiveMission.objectives[0] && playerActiveMission.objectives[0].itemID)
        ? playerActiveMission.objectives[0].itemID
        : null;

    crewList.forEach(rawMember => {
        const crewMember = _hydrateCrewMember(rawMember);
        if (!crewMember.isMercenary || !crewMember.drawback) return;

        let effectiveChance = crewMember.drawback.chance;
        if (crewMember.loyalty >= 75) effectiveChance *= 0.5;
        else if (crewMember.loyalty < 25) effectiveChance *= 1.25;

        if (Math.random() >= effectiveChance) return;

        if (crewMember.drawback.type === "STEAL_CARGO") {
            if (typeof playerCargo !== 'undefined') {
                const cargoIds = Object.keys(playerCargo).filter(id => {
                    if (playerCargo[id] <= 0 || MERC_PROTECTED_ITEMS.has(id) || id === activeMissionItem) return false;
                    const def = typeof COMMODITIES !== 'undefined' ? COMMODITIES[id] : null;
                    if (def && (def.weight === 0 || def.isComponent || def.isTroop || def.category === 'QUEST')) return false;
                    return true;
                });

                if (cargoIds.length > 0) {
                    const stolenId = cargoIds[Math.floor(Math.random() * cargoIds.length)];
                    const stealAmount = Math.min(crewMember.drawback.amount, playerCargo[stolenId]);
                    playerCargo[stolenId] -= stealAmount;
                    if (playerCargo[stolenId] <= 0) {
                        delete playerCargo[stolenId];
                        if (window.playerCargoCostBasis) delete window.playerCargoCostBasis[stolenId];
                    }

                    const itemName = (typeof COMMODITIES !== 'undefined' && COMMODITIES[stolenId]) ? COMMODITIES[stolenId].name : "Cargo";
                    if (typeof showToast === 'function') showToast(`MISSING: ${itemName}`, "warning");
                    logMessage(`<span style="color:var(--warning); font-weight:bold;">[ THEFT ]</span> Inventory discrepancy. ${stealAmount}x ${_crewEscapeHtml(itemName)} missing from hold. ${_crewEscapeHtml(crewMember.name)} looks suspiciously innocent.`);

                    if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
                }
            }
        } else if (crewMember.drawback.type === "STEAL_CREDITS") {
            if (playerCredits >= crewMember.drawback.amount) {
                playerCredits -= crewMember.drawback.amount;
                if (typeof showToast === 'function') showToast(`SKIMMED: -${crewMember.drawback.amount}c`, "warning");
                logMessage(`<span style="color:var(--warning); font-weight:bold;">[ THEFT ]</span> Unauthorized transfer detected. ${crewMember.drawback.amount}c siphoned from account by ${_crewEscapeHtml(crewMember.name)}.`);
                if (typeof GameBus !== 'undefined') GameBus.emit('UI_REFRESH_REQUESTED');
            }
        } else if (crewMember.drawback.type === "STEAL_FUEL") {
            if (typeof playerFuel !== 'undefined' && playerFuel > crewMember.drawback.amount) {
                playerFuel -= crewMember.drawback.amount;
                if (typeof showToast === 'function') showToast(`VENTED: -${crewMember.drawback.amount} Fuel`, "warning");
                logMessage(`<span style="color:var(--warning); font-weight:bold;">[ THEFT ]</span> Unscheduled fuel venting detected. ${_crewEscapeHtml(crewMember.name)} claims it was a 'cascade failure override.'`);
                if (typeof GameBus !== 'undefined') GameBus.emit('UI_REFRESH_REQUESTED');
            }
        }
    });
}

// ==========================================
// --- PASSIVE CREW LOYALTY & DEVOTED PERKS ---
// ==========================================

if (typeof GameBus !== 'undefined' && !window._crewTickRegistered) {
    window._crewTickRegistered = true;

    GameBus.on('TICK_PROCESSED', (tick) => {
        if (!tick || tick.interrupt || !tick.isMovement) return;
        const crewList = _getCrewList();
        if (crewList.length === 0) return;

        const nowDate = typeof currentGameDate !== 'undefined' ? currentGameDate : 0;

        crewList.forEach(rawCrew => {
            const crew = _hydrateCrewMember(rawCrew);

            // 1. Gradual tenure loyalty growth (+1 every 15 Stardates of steady service)
            if (crew.lastTenureLoyaltyDate === undefined || nowDate < crew.lastTenureLoyaltyDate) {
                crew.lastTenureLoyaltyDate = nowDate;
            }
            if (nowDate - crew.lastTenureLoyaltyDate >= 15.0) {
                crew.lastTenureLoyaltyDate = nowDate;
                if (crew.loyalty < 100) {
                    crew.loyalty = Math.min(100, crew.loyalty + 1);
                }
            }

            // 2. Devoted Crew (80+ Loyalty) "Above & Beyond" micro-bonuses (rare, cooldown-gated)
            if (crew.loyalty < 80) return;
            if (crew.lastBonusTick !== undefined && nowDate >= crew.lastBonusTick && (nowDate - crew.lastBonusTick) < 12.0) {
                return;
            }
            if (Math.random() >= 0.005) return;

            let triggered = false;

            if (crew.perk === 'PASSIVE_REPAIR' && typeof playerHull !== 'undefined' && typeof MAX_PLAYER_HULL !== 'undefined' && playerHull < MAX_PLAYER_HULL) {
                playerHull = Math.min(MAX_PLAYER_HULL, playerHull + 4);
                logMessage(`<span style="color:var(--gold-text)">[ DEVOTED CREW ]</span> ${_crewEscapeHtml(crew.name)} reinforced a cracked bulkhead plate during off-shift (+4 Hull).`);
                triggered = true;
            } else if ((crew.perk === 'FUEL_EFFICIENCY' || crew.perk === 'SCOOP_BONUS') && typeof playerFuel !== 'undefined' && typeof MAX_FUEL !== 'undefined' && playerFuel < MAX_FUEL) {
                playerFuel = Math.min(MAX_FUEL, Math.round((playerFuel + 5) * 10) / 10);
                logMessage(`<span style="color:var(--gold-text)">[ DEVOTED CREW ]</span> ${_crewEscapeHtml(crew.name)} trimmed the fusion injectors and recaptured +5 Fuel.`);
                triggered = true;
            } else if (crew.perk === 'SHIELD_BOOST' && typeof playerShields !== 'undefined' && typeof MAX_SHIELDS !== 'undefined' && playerShields < MAX_SHIELDS) {
                playerShields = Math.min(MAX_SHIELDS, playerShields + 8);
                logMessage(`<span style="color:var(--gold-text)">[ DEVOTED CREW ]</span> ${_crewEscapeHtml(crew.name)} balanced the deflector array (+8 Shields).`);
                triggered = true;
            } else if (crew.perk === 'TRADE_BONUS' && typeof playerCredits !== 'undefined') {
                const rebate = 60 + Math.floor(Math.random() * 60);
                playerCredits += rebate;
                logMessage(`<span style="color:var(--gold-text)">[ DEVOTED CREW ]</span> ${_crewEscapeHtml(crew.name)} cleared an old port-fee rebate into your ledger (+${rebate}c).`);
                triggered = true;
            } else if (crew.perk === 'ASTROMETRICS' || crew.perk === 'SCAVENGER_PROTOCOL') {
                if (typeof playerXP !== 'undefined') {
                    playerXP += 15;
                    logMessage(`<span style="color:var(--gold-text)">[ DEVOTED CREW ]</span> ${_crewEscapeHtml(crew.name)} logged clean deep-space telemetry (+15 XP).`);
                    if (typeof checkLevelUp === 'function') checkLevelUp();
                    triggered = true;
                }
            } else if (crew.perk === 'COMBAT_DAMAGE' || crew.isMercenary) {
                let rearmed = false;
                if (typeof playerShip !== 'undefined' && playerShip.components && typeof COMPONENTS_DATABASE !== 'undefined') {
                    const wepId = playerShip.components.weapon;
                    const wepDef = wepId ? COMPONENTS_DATABASE[wepId] : null;
                    if (wepDef && wepDef.stats && wepDef.stats.maxAmmo) {
                        if (!playerShip.ammo) playerShip.ammo = {};
                        const cur = playerShip.ammo[wepId] !== undefined ? playerShip.ammo[wepId] : wepDef.stats.maxAmmo;
                        if (cur < wepDef.stats.maxAmmo) {
                            playerShip.ammo[wepId] = cur + 1;
                            logMessage(`<span style="color:var(--gold-text)">[ DEVOTED CREW ]</span> ${_crewEscapeHtml(crew.name)} hand-loaded +1 ordnance round during off-shift (${playerShip.ammo[wepId]}/${wepDef.stats.maxAmmo}).`);
                            rearmed = true;
                            triggered = true;
                        }
                    }
                }
                if (!rearmed && typeof playerXP !== 'undefined') {
                    playerXP += 15;
                    if (typeof playerShields !== 'undefined' && typeof MAX_SHIELDS !== 'undefined') {
                        playerShields = Math.min(MAX_SHIELDS, playerShields + 6);
                    }
                    logMessage(`<span style="color:var(--gold-text)">[ DEVOTED CREW ]</span> ${_crewEscapeHtml(crew.name)} ran live fire-control calibration drills (+15 XP, +6 Shields).`);
                    if (typeof checkLevelUp === 'function') checkLevelUp();
                    triggered = true;
                }
            }

            if (triggered) {
                crew.lastBonusTick = nowDate;
                GameBus.emit('UI_REFRESH_REQUESTED');
            }
        });
    });
}

// ==========================================
// --- PUBLIC CREW UTILITY API ---
// ==========================================

window.CrewUtils = {
    getRoster: () => _getCrewList().map(c => _hydrateCrewMember(c)),
    getPayrollCost: () => _getCrewList().length * (typeof COST_PER_CREW !== 'undefined' ? COST_PER_CREW : 250),
    getAverageLoyalty() {
        const list = _getCrewList();
        if (list.length === 0) return 0;
        const sum = list.reduce((acc, c) => acc + (_hydrateCrewMember(c).loyalty || 50), 0);
        return Math.round(sum / list.length);
    },
    getActivePerks() {
        return Array.from(new Set(_getCrewList().map(c => c && c.perk).filter(Boolean)));
    },
    getLoyaltyRank: _getLoyaltyRank
};

// --- END OF FILE crew.js ---
