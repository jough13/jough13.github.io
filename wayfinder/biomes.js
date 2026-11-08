// --- START OF FILE biomes.js ---

// ==========================================
// --- PLANET BIOMES DATABASE ---
// ==========================================

const PLANET_BIOMES = {
    BARREN_ROCK: {
        id: "BARREN_ROCK",
        name: "Barren Rock",
        landable: true,
        weight: 100, // Very Common
        hazard: "NONE",
        description: "A lifeless, crater-scarred rock rich in common silicate and iron ores.",
        resources: ['MINERALS'],
        image: 'assets/barren_rock.png',
        expeditionFlavor: "Your rover traverses miles of silent, dust-choked craters and exposed basalt ridges."
    },
    GAS_GIANT: {
        id: "GAS_GIANT",
        name: "Gas Giant",
        landable: false,
        weight: 60, // Common
        hazard: "CRUSHING GRAVITY",
        description: "A swirling colossus of metallic hydrogen and helium bands.",
        resources: ['HYDROGEN_3'],
        image: 'assets/gas_giant.png'
    },
    ICE_GIANT: {
        id: "ICE_GIANT",
        name: "Ice Giant",
        landable: false,
        weight: 50, // Common
        hazard: "CRYO-STORMS",
        description: "A colossal world of supercritical water, ammonia, and frozen methane clouds.",
        resources: ['HYDROGEN_3', 'WATER'],
        image: 'assets/ice_giant.png'
    },
    DESERT: {
        id: "DESERT",
        name: "Arid Dune World",
        landable: true,
        weight: 30, // Common-Uncommon
        hazard: "SILICA STORMS",
        description: "Endless seas of wind-carved quartz dunes hiding ancient dry seabeds and spice-rich fissures.",
        resources: ['MINERALS', 'GOLD', 'KTHARR_SPICES'],
        image: 'assets/barren_rock.png',
        expeditionFlavor: "Fighting through a howling electrostatic sandstorm, your team locates a sheltered canyon vein."
    },
    GLACIAL: {
        id: "GLACIAL",
        name: "Cryo-Glacial World",
        landable: true,
        weight: 25, // Uncommon
        hazard: "EXTREME COLD",
        description: "A frozen world locked in a permanent ice age. Sub-glacial pockets hold ultra-pure water and super-cooled fluids.",
        resources: ['WATER', 'MINERALS', 'QUANTUM_FLUID'],
        image: 'assets/ice_giant.png',
        expeditionFlavor: "Descending into a glowing blue glacial crevasse, you tap into a pressurized sub-surface thermal vent."
    },
    VOLCANIC: {
        id: "VOLCANIC",
        name: "Volcanic World",
        landable: true,
        weight: 20, // Uncommon
        hazard: "EXTREME HEAT",
        description: "A molten hellscape of tectonic rivers and ash clouds, rich in heavy platinum-group metals.",
        resources: ['RARE_METALS', 'PLATINUM_ORE', 'MINERALS'],
        image: 'assets/volcanic_world.png',
        expeditionFlavor: "Heat shields straining against the magma plumes, your survey team extracts samples from a cooling lava tube."
    },
    TOXIC: {
        id: "TOXIC",
        name: "Toxic Jungle",
        landable: true,
        weight: 15, // Uncommon
        hazard: "CORROSIVE SPORES",
        description: "A sweltering greenhouse world teeming with aggressive, hyper-evolved alien flora.",
        resources: ['GENETIC_SAMPLES', 'KTHARR_SPICES', 'SENTIENT_MYCELIUM'],
        image: 'assets/toxic_jungle.png',
        expeditionFlavor: "Hacking through bioluminescent vines and acid-spitting flora, you catalog a pristine xeno-botanical grove."
    },
    OCEANIC: {
        id: "OCEANIC",
        name: "Oceanic World",
        landable: true,
        weight: 10, // Rare
        hazard: "TIDAL SURGES",
        description: "A pelagic world covered in deep, turbulent oceans dotted with volcanic archipelagos and kelp forests.",
        resources: ['WATER', 'FOOD_SUPPLIES', 'GENETIC_SAMPLES', 'HYDROGEN_3'],
        image: 'assets/ocean_world.png',
        expeditionFlavor: "Touching down on a narrow basalt atoll, you deploy submersible drones into a thriving abyssal trench."
    },
    SHATTERED_CORE: {
        id: "SHATTERED_CORE",
        name: "Tectonic Core World",
        landable: true,
        weight: 8, // Rare
        hazard: "GRAVIMETRIC SHEAR",
        description: "A planet partially ripped open by an ancient orbital impact, exposing its dense metallic planetary core.",
        resources: ['PLATINUM_ORE', 'RARE_METALS', 'REFINED_ALLOY'],
        image: 'assets/volcanic_world.png',
        expeditionFlavor: "Navigating zero-G debris ribbons hovering above the exposed planetary mantle, you cut free slabs of pure core alloy."
    },
    MYCELIAL: {
        id: "MYCELIAL",
        name: "Mycelial Spore World",
        landable: true,
        weight: 6, // Very Rare
        hazard: "PSYCHOTROPIC FOG",
        description: "A twilight world carpeted in towering fungal spires linked by a planet-spanning neural root network.",
        resources: ['SENTIENT_MYCELIUM', 'GENETIC_SAMPLES', 'MEDICAL_SUPPLIES'],
        image: 'assets/toxic_jungle.png',
        expeditionFlavor: "The fungal canopy pulses in mathematical rhythm with your ship's engine as you harvest psychoactive spore clusters."
    },
    TERRAN: {
        id: "TERRAN",
        name: "Terran World",
        landable: true,
        weight: 5, // Very Rare (Earth-like)
        hazard: "NONE",
        description: "A garden world with liquid oceans, nitrogen-oxygen atmosphere, and thriving continental ecosystems.",
        resources: ['FOOD_SUPPLIES', 'WATER', 'MINERALS', 'GENETIC_SAMPLES'],
        image: 'assets/terran_world.png',
        expeditionFlavor: "Cruising over temperate river valleys and lush forests, your team maps an ideal site for human habitation."
    },
    IRRADIATED: {
        id: "IRRADIATED",
        name: "Irradiated Wasteland",
        landable: true,
        weight: 4, // Very Rare
        hazard: "SEVERE RADIATION",
        description: "A dangerously radioactive rock. Surface gamma spectrometry readings are off the charts, indicating high concentrations of unstable Uranium isotopes.",
        resources: ['RARE_METALS', 'VOID_CRYSTALS', 'PLATINUM_ORE'],
        image: 'assets/wasteland.png',
        expeditionFlavor: "Dosimeters clicking frantically, you brave the glassed craters of an ancient nuclear bombardment."
    },
    TOMB_WORLD: {
        id: "TOMB_WORLD",
        name: "Precursor Tomb World",
        landable: true,
        weight: 3, // Ultra Rare
        hazard: "AUTOMATED SENTINELS",
        description: "A dead world covered in the weathered obsidian geometry of a vanished Precursor civilization.",
        resources: ['ARTIFACT_SHARDS', 'TECH_PARTS', 'ANCIENT_RELICS'],
        image: 'assets/wasteland.png',
        expeditionFlavor: "Beneath a collapsed monolith, your scanners pinpoint a sealed Precursor subterranean archive."
    },
    CRYSTAL: {
        id: "CRYSTAL",
        name: "Crystalline Anomaly",
        landable: true,
        weight: 2, // Ultra Rare
        hazard: "RESONANCE HARMONICS",
        description: "A rare world composed entirely of exotic, resonant silicon-void crystal lattices.",
        resources: ['VOID_CRYSTALS', 'PHASE_SHIFTED_ALLOY', 'QUANTUM_LENS'],
        image: 'assets/crystal_anomaly.png',
        expeditionFlavor: "Laser cutters hum in harmonic sympathy with towering violet crystal spires that refract starlight into impossible angles."
    },
    MACHINE_WORLD: {
        id: "MACHINE_WORLD",
        name: "Machine World",
        landable: true,
        weight: 1, // Legendary
        hazard: "ROGUE ICE-WALLS",
        description: "A planet entirely encased in metallic structures, humming data-conduits, and sprawling orbital rings. No biological life detected.",
        resources: ['TECH_PARTS', 'CYBERNETIC_IMPLANTS', 'AI_CORE'],
        image: 'assets/machine_world.png',
        expeditionFlavor: "Descending into a canyon-sized server trench, you tap directly into an ancient planetary data-conduit."
    }
};

window.PLANET_BIOMES = PLANET_BIOMES;

// ==========================================
// --- SELF-CONTAINED PLANETARY PATCHES ---
// ==========================================

(function initBiomeMechanics() {
    window.addEventListener('DOMContentLoaded', () => {

        // 1. PERSIST ORBITAL MINING DEPLETION
        if (typeof window.startOrbitalMining === 'function' && !window._biomeOrbitalPatched) {
            const origOrbitalMining = window.startOrbitalMining;
            window.startOrbitalMining = function() {
                origOrbitalMining.apply(this, arguments);
                const location = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null;
                if (location && location.miningDepleted && typeof updateWorldState === 'function') {
                    updateWorldState(playerX, playerY, {
                        miningDepleted: true,
                        lastInteraction: typeof currentGameDate !== 'undefined' ? currentGameDate : 0
                    });
                }
            };
            window._biomeOrbitalPatched = true;
        }

        // 2. PREVENT INFINITE BIO-SCAN EXPLOIT & PERSIST DELTAS
        if (typeof window.scanPlanetForLife === 'function' && !window._biomeBioScanPatched) {
            const origScanLife = window.scanPlanetForLife;
            window.scanPlanetForLife = function() {
                if (typeof currentGameState !== 'undefined' && currentGameState !== GAME_STATES.PLANET_VIEW) return;
                if (!currentSystemData || !currentSystemData.planets) return;

                const planet = currentSystemData.planets[selectedPlanetIndex];
                if (!planet) return;

                const sysKey = `${currentSystemData.x},${currentSystemData.y}_p${selectedPlanetIndex}`;
                if (typeof worldStateDeltas !== 'undefined' && worldStateDeltas[sysKey] && worldStateDeltas[sysKey].scanned) {
                    planet.scannedThisVisit = true;
                }

                if (planet.scannedThisVisit) {
                    if (typeof logMessage === 'function') logMessage("Biological signatures in this landing zone have already been sampled.");
                    if (typeof showToast === 'function') showToast("BIO-SCAN ALREADY COMPLETE", "info");
                    if (typeof renderPlanetView === 'function') renderPlanetView();
                    return;
                }

                origScanLife.apply(this, arguments);

                if (planet.scannedThisVisit) {
                    if (typeof soundManager !== 'undefined') soundManager.playScan();
                    if (typeof showToast === 'function') showToast("BIO-SAMPLES COLLECTED", "success");
                    if (typeof worldStateDeltas !== 'undefined') {
                        if (!worldStateDeltas[sysKey]) worldStateDeltas[sysKey] = {};
                        worldStateDeltas[sysKey].scanned = true;
                        worldStateDeltas[sysKey].lastInteraction = typeof currentGameDate !== 'undefined' ? currentGameDate : 0;
                    }
                    if (typeof renderPlanetView === 'function') renderPlanetView();
                }
            };
            window._biomeBioScanPatched = true;
        }

        // 3. REFRESH PLANET VIEW AFTER SURFACE MINING
        if (typeof window.minePlanet === 'function' && !window._biomeMinePlanetPatched) {
            const origMinePlanet = window.minePlanet;
            window.minePlanet = function() {
                origMinePlanet.apply(this, arguments);
                if (typeof currentGameState !== 'undefined' && currentGameState === GAME_STATES.PLANET_VIEW && typeof renderPlanetView === 'function') {
                    renderPlanetView();
                }
            };
            window._biomeMinePlanetPatched = true;
        }

        // 4. ENHANCE renderPlanetView (Header Info, Depleted Buttons & Colony ID Fix)
        if (typeof window.renderPlanetView === 'function' && !window._biomeRenderPlanetPatched) {
            const origRenderPlanet = window.renderPlanetView;
            window.renderPlanetView = function() {
                if (currentSystemData && currentSystemData.planets && currentSystemData.planets[selectedPlanetIndex]) {
                    const planet = currentSystemData.planets[selectedPlanetIndex];
                    const sysKey = `${currentSystemData.x},${currentSystemData.y}_p${selectedPlanetIndex}`;
                    const savedState = (typeof worldStateDeltas !== 'undefined' && worldStateDeltas[sysKey]) ? worldStateDeltas[sysKey] : {};

                    if (savedState.mined) planet.minedThisVisit = true;
                    if (savedState.scanned) planet.scannedThisVisit = true;
                    if (savedState.explored) planet.exploredThisVisit = true;
                    if (savedState.hacked) planet.hackedThisVisit = true;
                }

                origRenderPlanet.apply(this, arguments);

                const planetView = document.getElementById('planetView');
                if (!planetView || !currentSystemData || !currentSystemData.planets) return;
                const planet = currentSystemData.planets[selectedPlanetIndex];
                if (!planet) return;

                // A. Inject Planet Header Banner above the action grid if missing
                const contentBox = planetView.querySelector('.planet-view-content');
                if (contentBox && !contentBox.querySelector('.planet-header')) {
                    const hazardText = planet.biome.hazard && planet.biome.hazard !== 'NONE'
                        ? `<span style="color:var(--danger); font-weight:bold;">⚠️ HAZARD: ${planet.biome.hazard}</span>`
                        : `<span style="color:var(--success);">ENVIRONMENT: STABLE</span>`;

                    const headerDiv = document.createElement('div');
                    headerDiv.className = 'planet-header';
                    headerDiv.innerHTML = `
                        <img src="${planet.biome.image}" alt="${planet.biome.name}" class="planet-large-img" onerror="this.onerror=null; this.src='assets/barren_rock.png';">
                        <h2 class="planet-title">${currentSystemData.name.toUpperCase()} : ${planet.name.toUpperCase()}</h2>
                        <div style="font-size:11px; letter-spacing:2px; margin-bottom:10px; color:var(--accent-color);">
                            CLASS: ${planet.biome.name.toUpperCase()} &nbsp;|&nbsp; ${hazardText}
                        </div>
                        <p class="planet-desc">"${planet.biome.description}"</p>
                    `;
                    contentBox.insertBefore(headerDiv, contentBox.firstChild);
                }

                // B. Update Mine & Scan Buttons if already depleted this visit
                const buttons = planetView.querySelectorAll('button.action-button');
                buttons.forEach(btn => {
                    const onClickAttr = btn.getAttribute('onclick') || '';
                    if (onClickAttr.includes('minePlanet()') && planet.minedThisVisit) {
                        btn.disabled = true;
                        btn.textContent = 'Minerals Depleted';
                    }
                    if (onClickAttr.includes('scanPlanetForLife()') && planet.scannedThisVisit) {
                        btn.disabled = true;
                        btn.textContent = 'Bio-Scan Complete';
                    }
                    // C. Fix Colony ID lookup mismatch between exploration.js and colonies.js
                    if (onClickAttr.includes('surveyForColony') || btn.textContent.includes('Establish Colony') || onClickAttr.includes('openColonyManagement')) {
                        const actualColId = `${currentSystemData.x}_${currentSystemData.y}_p${selectedPlanetIndex}`;
                        const colonyHere = typeof playerColonies !== 'undefined' ? playerColonies[actualColId] : null;
                        if (colonyHere && colonyHere.established) {
                            btn.disabled = false;
                            btn.style.cssText = 'border-color: var(--success); color: var(--success); box-shadow: 0 0 10px rgba(0, 255, 0, 0.2);';
                            btn.innerHTML = '🏢 MANAGE COLONY';
                            btn.setAttribute('onclick', `openColonyManagement('${actualColId}')`);
                        } else if ((playerCargo['COLONY_CHARTER'] || 0) > 0 && planet.biome.landable) {
                            const biomeKey = planet.biome.id || Object.keys(PLANET_BIOMES).find(k => PLANET_BIOMES[k].name === planet.biome.name) || 'BARREN_ROCK';
                            btn.disabled = false;
                            btn.style.cssText = 'border-color: var(--gold-text); color: var(--gold-text);';
                            btn.innerHTML = '🚩 ESTABLISH COLONY';
                            btn.setAttribute('onclick', `surveyForColony('${planet.name}', '${biomeKey}', ${currentSystemData.x}, ${currentSystemData.y})`);
                        }
                    }
                });
            };
            window._biomeRenderPlanetPatched = true;
        }

        // 5. FULL SURFACE EXPEDITION ENGINE (Replaces v1.1 Stub)
        window.startSurfaceExpedition = function() {
            if (!currentSystemData || !currentSystemData.planets) return;
            const planet = currentSystemData.planets[selectedPlanetIndex];
            if (!planet || planet.exploredThisVisit) return;

            const sysKey = `${currentSystemData.x},${currentSystemData.y}_p${selectedPlanetIndex}`;
            planet.exploredThisVisit = true;
            if (typeof worldStateDeltas !== 'undefined') {
                if (!worldStateDeltas[sysKey]) worldStateDeltas[sysKey] = {};
                worldStateDeltas[sysKey].explored = true;
                worldStateDeltas[sysKey].lastInteraction = typeof currentGameDate !== 'undefined' ? currentGameDate : 0;
            }

            if (typeof advanceGameTime === 'function') advanceGameTime(0.25);
            if (typeof soundManager !== 'undefined') soundManager.playScan();

            const biome = planet.biome || PLANET_BIOMES.BARREN_ROCK;
            const flavor = biome.expeditionFlavor || "Your away team conducts a thorough overland traverse of the landing zone.";

            // Calculate Multipliers from Perks & Crew
            const hasScavenger = (typeof playerPerks !== 'undefined' && playerPerks.has && playerPerks.has('SCAVENGER_PROTOCOL')) ||
                                 (typeof hasCrewPerk === 'function' && hasCrewPerk('SCAVENGER_PROTOCOL'));
            const hasBio = typeof playerPerks !== 'undefined' && playerPerks.has && playerPerks.has('XENO_BIOLOGIST');
            const hasHealthPhysicist = (typeof playerPerks !== 'undefined' && playerPerks.has && playerPerks.has('HEALTH_PHYSICIST')) ||
                                       (typeof playerShip !== 'undefined' && playerShip.components && playerShip.components.utility === 'UTIL_DOSIMETRY_ARRAY');

            let xpGain = 80 + Math.floor(Math.random() * 60);
            if (hasBio) xpGain *= 2;

            let creditFind = 0;
            let lootItems = [];
            let hazardMsg = "";

            // Biome-specific outcomes & Lore Unlocks
            if (biome.id === 'TOMB_WORLD' || biome.name.includes('Tomb')) {
                if (typeof unlockLoreEntry === 'function') unlockLoreEntry('XENO_PRECURSORS');
                lootItems.push({ id: 'ANCIENT_RELICS', qty: 1 * (hasScavenger ? 2 : 1) });
                lootItems.push({ id: 'ARTIFACT_SHARDS', qty: (2 + Math.floor(Math.random() * 3)) * (hasScavenger ? 2 : 1) });
                xpGain += 100;
            } else if (biome.id === 'IRRADIATED' || biome.name.includes('Irradiated')) {
                if (typeof unlockLoreEntry === 'function') unlockLoreEntry('PHENOMENON_IRRADIATED');
                lootItems.push({ id: 'VOID_CRYSTALS', qty: (1 + Math.floor(Math.random() * 2)) * (hasScavenger ? 2 : 1) });
                if (!hasHealthPhysicist && Math.random() < 0.45) {
                    const radDmg = 15;
                    if (typeof GameBus !== 'undefined') GameBus.emit('HULL_DAMAGED', { amount: radDmg, reason: "Planetary Gamma Radiation" });
                    hazardMsg = `<br><br><span style="color:var(--danger)">⚠️ RADIATION HAZARD: Surface gamma flux penetrated shielding (-${radDmg} Hull).</span>`;
                } else if (hasHealthPhysicist) {
                    hazardMsg = `<br><br><span style="color:var(--success)">☢️ DOSIMETRY SHIELDING: Zero radiation damage taken during surface EVA.</span>`;
                }
            } else if (biome.id === 'MYCELIAL' || biome.id === 'TOXIC') {
                if (typeof unlockLoreEntry === 'function') unlockLoreEntry('LEGEND_SENTIENT_MYCELIUM_NETWORK');
                lootItems.push({ id: 'SENTIENT_MYCELIUM', qty: (2 + Math.floor(Math.random() * 3)) * (hasScavenger ? 2 : 1) });
                lootItems.push({ id: 'GENETIC_SAMPLES', qty: 2 * (hasScavenger ? 2 : 1) });
            } else if (biome.id === 'CRYSTAL') {
                if (typeof unlockLoreEntry === 'function') unlockLoreEntry('PHENOMENON_VOID_CRYSTALS');
                lootItems.push({ id: 'VOID_CRYSTALS', qty: 2 * (hasScavenger ? 2 : 1) });
                if (Math.random() < 0.5) lootItems.push({ id: 'QUANTUM_LENS', qty: 1 });
            } else {
                // Standard resource cache from the planet's biome pool
                const pool = biome.resources && biome.resources.length > 0 ? biome.resources : ['MINERALS'];
                const pickedId = pool[Math.floor(Math.random() * pool.length)];
                const baseQty = 4 + Math.floor(Math.random() * 6);
                lootItems.push({ id: pickedId, qty: baseQty * (hasScavenger ? 2 : 1) });
                creditFind = (150 + Math.floor(Math.random() * 250)) * (hasScavenger ? 2 : 1);
            }

            // Award Loot & Credits
            let rewardSummary = [];
            if (creditFind > 0) {
                playerCredits += creditFind;
                rewardSummary.push(`<span style="color:var(--gold-text)">+${formatNumber(creditFind)}c Salvage Cache</span>`);
            }

            lootItems.forEach(item => {
                if (typeof COMMODITIES !== 'undefined' && COMMODITIES[item.id]) {
                    const weight = COMMODITIES[item.id].weight !== undefined ? COMMODITIES[item.id].weight : 1;
                    const spaceLeft = Math.floor((PLAYER_CARGO_CAPACITY - currentCargoLoad) / Math.max(1, weight));
                    const actualQty = Math.min(item.qty, Math.max(0, spaceLeft));
                    if (actualQty > 0) {
                        playerCargo[item.id] = (playerCargo[item.id] || 0) + actualQty;
                        if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
                        rewardSummary.push(`<span style="color:var(--accent-color)">+${actualQty}x ${COMMODITIES[item.id].name}</span>`);
                    } else {
                        rewardSummary.push(`<span style="color:var(--danger)">${COMMODITIES[item.id].name} (Hold Full)</span>`);
                    }
                }
            });

            playerXP += xpGain;
            rewardSummary.push(`<span style="color:var(--success)">+${formatNumber(xpGain)} XP</span>`);

            if (typeof logMessage === 'function') {
                logMessage(`<span style="color:#DDA0DD">[ SURFACE EXPEDITION ]</span> ${flavor} Recovered: ${rewardSummary.join(', ')}.`);
            }
            if (typeof showToast === 'function') showToast("EXPEDITION COMPLETE", "success");

            if (typeof renderPlanetView === 'function') renderPlanetView();
            if (typeof checkLevelUp === 'function') checkLevelUp();
            if (typeof autoSaveGame === 'function') autoSaveGame();
        };

        // 6. MACHINE WORLD CORE INTERFACE (Replaces v1.1 Stub)
        window.hackMachineWorld = function() {
            if (!currentSystemData || !currentSystemData.planets) return;
            const planet = currentSystemData.planets[selectedPlanetIndex];
            if (!planet || planet.hackedThisVisit) return;

            const sysKey = `${currentSystemData.x},${currentSystemData.y}_p${selectedPlanetIndex}`;
            planet.hackedThisVisit = true;
            if (typeof worldStateDeltas !== 'undefined') {
                if (!worldStateDeltas[sysKey]) worldStateDeltas[sysKey] = {};
                worldStateDeltas[sysKey].hacked = true;
                worldStateDeltas[sysKey].lastInteraction = typeof currentGameDate !== 'undefined' ? currentGameDate : 0;
            }

            if (typeof unlockLoreEntry === 'function') unlockLoreEntry('XENO_MACHINE_WORLD');
            if (typeof advanceGameTime === 'function') advanceGameTime(0.20);

            const hasSlicer = (typeof playerPerks !== 'undefined' && playerPerks.has && playerPerks.has('CYBER_SLICER')) ||
                              (typeof hasCrewPerk === 'function' && hasCrewPerk('ASTROMETRICS'));

            const successChance = hasSlicer ? 0.90 : 0.60;

            if (Math.random() < successChance) {
                const credits = 1500 + Math.floor(Math.random() * 1500);
                const xp = 250;
                playerCredits += credits;
                playerXP += xp;

                let lootMsg = "";
                if (currentCargoLoad + 1 <= PLAYER_CARGO_CAPACITY) {
                    const dropId = Math.random() < 0.5 ? 'AI_CORE' : 'ENCRYPTED_DATA';
                    playerCargo[dropId] = (playerCargo[dropId] || 0) + 1;
                    if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
                    if (typeof COMMODITIES !== 'undefined' && COMMODITIES[dropId]) {
                        lootMsg = ` Extracted <span style="color:var(--gold-text)">1x ${COMMODITIES[dropId].name}</span>!`;
                    }
                }

                if (typeof soundManager !== 'undefined') soundManager.playGain();
                if (typeof showToast === 'function') showToast("CORE BREACH SUCCESSFUL", "success");
                if (typeof logMessage === 'function') {
                    logMessage(`<span style="color:#00E0E0; font-weight:bold;">[ CORE NETWORK BREACHED ]</span> Siphoned ${formatNumber(credits)}c and +${xp} XP from the planetary nexus.${lootMsg}`);
                }
            } else {
                const dmg = 25;
                if (typeof logMessage === 'function') {
                    logMessage(`<span style="color:var(--danger); font-weight:bold;">[ BLACK-ICE COUNTERMEASURE ]</span> Planetary firewall feedback surged through your umbilical! Hull took ${dmg} damage.`);
                }
                if (typeof showToast === 'function') showToast("FIREWALL FEEDBACK", "error");
                if (typeof GameBus !== 'undefined') {
                    GameBus.emit('HULL_DAMAGED', { amount: dmg, reason: "Machine World Black-ICE Feedback" });
                }
            }

            if (typeof renderPlanetView === 'function') renderPlanetView();
            if (typeof checkLevelUp === 'function') checkLevelUp();
            if (typeof autoSaveGame === 'function') autoSaveGame();
        };
    });
})();

// --- END OF FILE biomes.js ---
