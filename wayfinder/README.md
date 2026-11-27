# Wayfinder: Echoes of the Void

**Version:** `v0.9.7`  
**Engine:** Vanilla HTML5 Canvas, CSS3 & Modular ES6 JavaScript (Zero External Frameworks)

**Wayfinder: Echoes of the Void** is a browser-based, retro-futuristic ASCII space exploration, trading, colony-building, and tactical combat RPG. Pilot a customizable starship across a seeded, infinite procedural galaxy—navigating shifting faction borders, dynamic trade economies, planetary surface operations, deep-space anomalies, and ancient Precursor mysteries.

---

## ▶️ Running Locally

Wayfinder requires no build step, package manager, or backend server:

1. Clone or download the repository folder (preserving the `assets/` directory).
2. Open `index.html` directly in any modern desktop or mobile browser—or serve the folder via a lightweight local static server (e.g., `npx serve .` or `python -m http.server`) for optimal audio/video autoplay handling.
3. Choose a **Captain Name**, **Portrait**, and optional **World Seed** (or roll a curated Lore Seed) to initialize your galaxy.

---

## 📖 Commander's Survival Guide (Quickstart)

Space beyond Sol Sector is unforgiving. Keep these fundamentals in mind on your first flights out of **Starbase Alpha**:

1. **Watch Your Fuel:** Moving across space, evasive maneuvers, orbital bombardments, and wormhole jumps all consume hydrogen. Scoop fuel from **Stars (`*`)** or **Nebulae (`~`)** with **`H`**, skim **Gas/Ice Giants** inside star systems, or press **`N`** (Nav-Computer Ping) to locate the nearest safe harbor. If you run completely dry, press **`Z`** to summon **The Fuel Rats**.
2. **Scan Everything:** Press **`V`** on stars for spectroscopic Deep Scans, **`O`** for the Astrometric Observatory (long-exposure sector plates), and **`P`** for a 5–10 tile Active Sensor Ping. Scanning grants XP, Codex entries, Planetary Data, and occasional **Encrypted Engrams**.
3. **Know the Factions & Customs:** Concord hubs run contraband sweeps when you dock. Use **Silent Running (`Q`)**, **Sensor Decoys**, shielded **Eclipse Cargo Bays**, or **The Forger** to manage Concord Notoriety—and fence foreign contraband at **Shadow Brokers** for up to **300% street value**.
4. **Build Manufacturer Set Synergies:** Equip **3 or more ship components** from the same manufacturer (`CONCORD`, `KTHARR`, `ECLIPSE`, or `FRONTIER`) to activate a permanent **Set Synergy Bonus**.
5. **Respect Stealth Heat & Radiation:** Silent Running (`Q`) hides you from patrols and ambushes, but builds Reactor Heat; exceeding **5 Heat** scorches your own hull. Hot **O/B-Class Stars**, **Radiation Belts**, and **Irradiated Worlds** require a **Radiological Dosimeter** or the **Health Physicist** perk for safe passage.

---

## 🌌 Galactic Factions & Standing Milestones

| Faction | Region / Hubs | Philosophy & Perks |
| :--- | :--- | :--- |
| **Concord Dominion** (Blue) | Sol Core (`Starbase Alpha`, `Aegis Dyson Sphere`, `Cygnus Prime`, `Ceti Alpha Shipyards`, `Kepler Listening Post`, `Helios Refinery`, `Solitude Research Platform`) | Central interstellar government. Enforces customs and bounties.<br>**20+ Rep:** Aegis Armory · **30+ Rep:** Aegis Gunship · **50+ Rep:** Aegis Dreadnought & 15% market discount. |
| **Eclipse Cartel** (Purple) | Western Rim (`Station Umbra`, `Port Erebus`) | Decentralized smuggling syndicate operating the Shadow Network, Identity Forgers, and Mercenary Dens.<br>**15+ Rep:** Eclipse Corsair · **30+ Rep:** Night-Runner · **50+ Rep:** Pirate Truce & 15% discount. |
| **K'tharr Ascendancy** (Green) | Eastern Frontier (`Karak-Tor`, `Fortress Drakon`) | Martial warrior empire centered on volcanic forges and gladiatorial Proving Grounds.<br>**15+ Rep:** Heavy Disruptors · **30+ Rep:** K'tharr Blood-Barge · **50+ Rep:** Living Hull Biotech. |
| **The Fuel Rats Collective** (Amber) | Nomadic / Northern Frontier (`Port Nomad`) | Neutral rescue pilots sworn to aid stranded captains anywhere in the void.<br>**5+ Rep:** Free VIP hull repairs on rescue & rescue gear · **10+ Rep:** Fuel Rats Salvage Tug. |
| **Free Systems** (Gold) | Scattered Frontier (`The Rusty Anchor`, `Planet Xerxes`, `Valkyrie Drift`, `Frothy Moon Outpost`, `The Sunken Compass`, `The Archivist's Vault`) | Independent ports, observatories, salvage bazaars, and lawless outposts operating beyond major-power jurisdiction. |

---

## ⌨️ Flight Controls & Hotkeys

### Navigation (Galactic Map)
* **`W` / `A` / `S` / `D`** or **Arrow Keys**: Move Starship
* **`Spacebar`** or **`.` (Period)**: Hold Position / Wait Turn (cycles time, shields, and incoming rescue tugs)

### Sensors, Mining & Space Operations
* **`E` / `Enter`**: Interact / Dock at Station / Enter Star System / Land on Planet / Board Derelict
* **`H`**: Scoop Hydrogen (at Stars `*` or Nebulae `~`)
* **`M`**: Launch Asteroid Mining Laser Minigame (at Asteroid Fields `%`)
* **`T`**: Access Subspace Routing (at Wormholes `W` or Stabilized Stargates `Ω`)
* **`V`**: Deep Stellar Scan (at Stars `*` — spectroscopy, H-R Diagram, XP & Engram chance)
* **`O`**: Open Deep Space Astrometric Observatory (long-range optical scan & deep-sky plates)
* **`P`**: Active Telemetry Ping (costs 5 Fuel; reveals nearby Derelicts, Wormholes & Cartel Outposts)
* **`N`**: Smart Nav-Computer Ping (prioritizes Rescues → Bounties → Contracts → Nearest Safe Harbor)
* **`Q`**: Toggle Silent Running (Stealth Mode — watch Reactor Heat!)
* **`U`**: Open Shipboard Engineering Workbench (Crafting, Smelting, Prototypes & Permanent Upgrades)
* **`Z`**: Broadcast Fuel Rats Distress Beacon (when critically low on fuel)
* **`X`**: Self-Destruct (Emergency Core Overload)

### Subspace Radio & Audio
* **`R`**: Cycle Subspace Radio Stations (when not repairing a damaged hull while docked)
* **`Shift + R`**: Skip Track (on multi-track music stations)
* **`Alt + R`**: Open Interactive Subspace Radio Receiver & 3-Channel Audio Mixer

### Docked Station Shortcuts
* **`B`**: Open Marketplace (Buy)
* **`S`**: Open Marketplace (Sell)
* **`R`**: Repair Hull & Reload Ordnance
* **`K`**: Open Contracts / Mission Board
* **`Y`**: Open Shipyard (Major Hubs)
* **`V`**: Visit Cantina (Rumors, Pazaak, Drinks & Crew Recruitment)

### Combat Controls
* **`F`**: Fire Equipped Weapon
* **`C`**: Charge Weapon (2.5x damage on next shot)
* **`E`**: Evasive Maneuvers (burns fuel for 75% dodge chance)
* **`R`**: Attempt Escape (boosted by Asteroid Fields +25% and Nebulae +35%)
* **`Z`**: Emergency Distress Signal (jammed in combat)

### System, Menus & Utility
* **`I`**: Open Cargo Manifest (sort, filter, activate items, deploy drones, field-decrypt)
* **`J`**: Open Galactic Codex & Lore Archives (with Category Mastery buffs)
* **`L`** / **`Escape`**: Leave System Map / Return to Orbit / Close Active Modal
* **`F6` / `F7`**: Quick Manual Save / Load Manual Save
* **`` ` `` (Backtick / Tilde)**: Open Developer Debug Console

---

## 🗺️ Deep-Space ASCII Symbol Legend

| Symbol | Object | Interaction |
| :---: | :--- | :--- |
| **`@`** | Player Starship | Dims when Silent Running (`Q`) is active. |
| **`#`** | Major Starbase / Faction Hub | Full concourse, markets, shipyard, outfitting, contracts & faction services. |
| **`H` / `h`** | Frontier Outpost / Player Waystation | Trade, repair, tolls, and Tier 1–3 waystation upgrades. |
| **`§`** | Black Market / Shadow Node | Lawless ports, Shadow Brokers, and illicit goods. |
| **`O`** | Planet / Megastructure | Orbit, scan, orbital extract, land, or manage settlements. |
| **`*`** | Star System | Enter solar system (`E`), Deep Scan (`V`), or Fuel Scoop (`H`). |
| **`%`** | Asteroid Field | Laser phase-alignment mining (`M`) for Minerals, Platinum & Rare Metals. |
| **`~`** | Gas Nebula | Fuel scoop (`H`), slip pursuers, and trigger nebula anomalies. |
| **`B`** | Micro-Singularity (Black Hole) | Lethal gravity well—slingshot safely with a Precursor Nav-Core or Void Diver. |
| **`W` / `Ω`** | Wormhole / Player Stargate | Fast-travel network (`T`). Stargates offer 0% structural risk. |
| **`?`** | Spatial Anomaly | Frequency containment minigame or deep-space astrophysics observation. |
| **`D`** | Derelict Vessel | Scan databanks, salvage Tech Parts, or breach airlock (firefight minigame). |
| **`^`** | Hidden Cartel Outpost | Marine & Mech planetary ground assault—raze for loot or claim as a Shadow Port. |
| **`Ψ`** | Precursor Monolith / Unique Landmark | Harmonic attunement, lore revelations, and rare Precursor artifacts. |
| **`&`** | The First Nexus | Endgame Precursor megastructure located via the **Wayfinder Core**. |
| **`P` `$` `C` `M` `N` `¤` `F` `T` `+` `!` `E`** | Deep-Space POIs | Escape Pod, Wagering Relay, Cargo Cache, Space Mine, Nav-Buoy, Research Sat, Fuel Barge, Time Capsule, Repair Buoy, Dead-Drop, Echo Beacon. |
| **`V` / `☠️` / `⚔️`** | Hostiles / Bosses / Warzones | Roaming patrols/pirates, Legendary Bounties, and multi-phase Sector Warzones. |
| **`✧` / `❄️`** | USS / Cryo-Comet | Unidentified Signal Sources and harvestable interstellar comets. |

---

## 🚀 Core Gameplay Systems

* **Infinite Procedural Universe:** Seeded chunk generation (`chunkManager`) with dynamic macro-sector naming, shifting Faction War Fronts, radiation belts, and memory-safe garbage collection.
* **Dynamic Economy & Smuggling:** Time-gated station restocks, local refinery supply chains, galactic Boom/Surplus market trends, cost-basis profit tracking, bulk legal cargo liquidation, charted Galactic Trade Intel, Shadow Broker smuggling runs, Cryptarch decryption/relic appraisal, and Identity Forger services.
* **Modular Ship Outfitting & R&D:** 15 playable ship classes with unique Chassis Traits and Combat Protocols, 60+ components across 5 slots, 3-piece Manufacturer Set Synergies, procedural `PROC_` module crafting at the R&D Calibration Bench, and hardwired Legendary Boss prototype drops.
* **Tactical Combat, Subsystems & Ground Raids:** Turn-based space combat with enemy intent telegraphing, subsystem targeting (Hull / Weapons / Engines), Combat Swarm Drones, Aegis Escort Wings, close-quarters marine boarding for 3x salvage, multi-turn Sector Warzones, and planetary outpost ground assaults.
* **Planetary Exploration & 23 Biomes:** Multi-planet star systems featuring 23 distinct biomes (from Karst Caverns and Bioluminescent Edens to Irradiated Wastelands, Machine Worlds, Precursor Tomb Worlds, and Archive Spheres), Gas/Ice Giant atmospheric skimming, orbital extraction, and biome-specific surface operations.
* **4-Phase Colony Builder:** Claim habitable worlds with a Pioneer Charter and grow settlements from **Outpost → Settlement → Metropolis → Sector Capital** across 40+ buildings, 9 governor policies, demographic tracking, automated Colony Trade Convoys, and Tier 4 megastructures.
* **Captain Perks & Crew Loyalty:** 35 Level-Up Captain Perks across 7 disciplines (unlocking permanent **Discipline Mastery Doctrines** at 3+ perks per discipline) paired with standard, Legendary, and Eclipse Mercenary crew featuring Loyalty, Shore Leave, Specialist Briefings, and context-aware Intercom banter.
* **Subspace Radio & Terminal Modes:** Procedural Web Audio SFX, faction-adaptive hull drones, 10+ Subspace Radio frequencies (MP3 playlists, procedural Void Synthwave, Pulsar Telemetry, live Concord News, Eclipse Shadow Wire, and Precursor Numbers Station), plus **Deep Void**, **Phosphor Green**, **Amber CRT**, and **Light Mode** display themes.
* **Narrative Mysteries & Codex Mastery:** Crack the 4-layer encryption terminal at **Planet Xerxes**, descend into the **Precursor Vault**, assemble **3 Star Map Fragments** into a **Wayfinder Core** to awaken **The First Nexus**, and complete Codex categories for permanent ship-wide Mastery buffs.

---

## 📂 Project Architecture & Developer Documentation

All scripts load cleanly via `<script>` tags in `index.html` in a strict dependency order: **Configuration & Data → UI & Mechanics Modules → Core Engine → Background Tick & Audio Hooks**.

### 🖥️ Core Engine & Shell
* **`index.html`**: Master entry point, DOM layout, HUD, modals, responsive mobile D-Pad, **Flight Recorder v4.5** (global error/rejection diagnostics with `.txt` crash export), **Command Reference** (Briefing, ASCII Legend, Factions), and **Save Vault** (portable JSON backup/restore).
* **`style.css`**: Complete CSS design system with custom properties, CRT scanline filter, Light Mode, retro palettes (`phosphor-mode`, `amber-mode`), animations, and responsive breakpoints.
* **`config.js`**: Initializes **`GameBus`** (the decoupled pub/sub event bus), global constants, tile symbols, faction definitions, `DEEP_SPACE_POI_TABLE`, `TILE_INTERACTIONS`, Display Palette Manager, **Astrometric Observatory (`O`)**, and `ConfigRegistry`.
* **`script.js`**: Core runtime—`GameState` + `bindState` bridge + `playerCargo` Proxy, `chunkManager`, 2D Canvas renderer, `processGameTick` master clock, input routing, Save/Load/Auto-Login, Xerxes Spire terminal, Precursor Vaults, Shipboard Synthesis (`CRAFTING_RECIPES`), Wormhole/Stargate routing, Player Waystations, Automated Mining Drones, Legendary Bounties, and Dev Console.
* **`mechanics.js`**: Background simulation module—**`EntityManager`** (unified ECS tick loop for USS, Comets, ambient NPCs, Fuel Rats, and Colony Trade Convoys), Modular War Fronts, Crew Payday payroll, Nebula Events, Deep Space Encounters, and `MechanicsUtils`.

### ⚙️ Gameplay & Interface Modules
* **`ui.js`**: Cross-system UI engine (`window.UI`), self-repairing `GenericModal` layout, Modal Info Bar, Toast notifications, scroll-preserving Log Panel, Galactic Codex V3 (search, mastery cards, redacted recovery leads), Vessel Renaming, Commander Datapad (extensible tabs), and Visual Cargo Manifest.
* **`combat.js`**: Space combat loop, enemy AI intent profiles, subsystem targeting, ship ability execution, boarding actions, derelict airlock firefights, planetary outpost ground raids, pirate extortion/truce, Combat Drones, and multi-phase Sector Warzones.
* **`trade.js`**: Marketplace Buy/Sell UI, time-gated restock & refinery buffers, live price breakdown & cost-basis profit telemetry, bulk legal cargo sell, charted Galactic Trade Intel, Shadow Broker (fencing, tactical gear, Smuggling Runs), Cryptarch (decryption & relic appraisal), The Forger, Ship-to-Ship trading, and `TradeUtils`.
* **`missions.js`**: Procedural Contract Board (Bounty, Delivery, Acquire, Survey, Faction-exclusive templates), Bounty Board & target tracking, `MissionUtils`, and `GameBus`/DOM hooks keeping bounty targets alive and synced.
* **`outfitting.js`**: Starbase Shipyard (chassis comparison, trade-in math, prototype preservation), Engineering Bay (slot deltas, Manufacturer Synergy tracker, module unmounting), Experimental R&D Calibration Bench, Repair/Refuel, and centralized `applyPlayerShipStats()`.
* **`stations.js`**: Station Concourse hub UI, persistent Cantina banners & amenities, Concord Customs scans, Aegis Armory, Naval Escort Command, Marine Barracks, K'tharr Proving Grounds & Blood Pits, Rite of Combat Warlord boss, and Eclipse Mercenary Den.
* **`exploration.js`**: Standalone planet orbits, surface mining & bio-scans, Geo-Survey drones, Asteroid Mining Laser Minigame, Deep Stellar Cartography (H-R Diagram & spectral analysis), Anomaly frequency containment minigame, Derelict UI, Autonomous Telemetry Probes, Signal Intercepts, and USS resolution.
* **`crew.js`**: Cantina Recruitment Board, Crew Manifest/Roster, Loyalty & Shore Leave rewards, Specialist Briefings, context-aware Intercom & cross-crew pair banter, severance dismissal, Eclipse Mercenary drawbacks, and Devoted crew passive bonuses.
* **`colonies.js`**: Data-driven Colony Simulation Engine (`COLONY_PHASES`, 40+ `COLONY_BUILDINGS`), Governor's Desk UI (Overview, Logistics, Engineering), demographic census, 9 policies, random colony events, and Stardate resource/production tick processing.
* **`audio.js`**: `SoundManager` (Web Audio API synthesizer, dynamics compressor, white/pink noise buffers, 24-voice polyphony cap, procedural SFX library, faction-adaptive hull drone, multi-station Subspace Radio with MP3s + procedural Synthwave/Pulsar/News/Shadow/Numbers feeds, and interactive Radio Receiver modal).

### 📚 Data Dictionaries & Content Modules
* **`items.js`**: `COMMODITIES`, `LOOT_TABLES`, `ItemUtils`, field decryption logic, and activatable `onUse` handlers for consumables, drones, geodes, relics, megastructures, and quest items.
* **`ships.js`**: `MANUFACTURER_PROFILES`, `SHIP_CLASSES` (15 hulls with Chassis Traits & Abilities), `PIRATE_SHIP_CLASSES` (standard + non-enumerable Bosses), `COMPONENTS_DATABASE` (60+ modules), `generateProceduralModule()`, and `ShipUtils`.
* **`locations.js`**: `LOCATIONS_DATA` (major hubs, outposts, black markets, and unique interactive deep-space landmarks), O(1) chunk-indexed delta persistence, `LocationUtils`, and the **Star Atlas** Commander Datapad tab.
* **`biomes.js`**: `PLANET_BIOMES` (23 planetary classes with astrophysical telemetry, hazards, colony traits, and field notes), `BiomeUtils`, Gas/Ice Giant atmospheric skimming, 12 biome-specific surface operations, data-driven Surface Expeditions, and Machine World Core hacking.
* **`lore.js`**: `LORE_DATABASE` (Galactic Codex archives), `SPIRE_PUZZLES`, `ENCOUNTER_DATABASE`, `LoreUtils`, and automatic `GameBus`/gameplay lore unlock hooks.
* **`perks.js`**: `PERKS_DATABASE` (35 Captain Perks across 7 disciplines), `PERK_MASTERY_DOCTRINES`, `hasPlayerPerk()`, `PerkUtils`, the **Captain Perks** Datapad tab, and self-contained passive/combat/trade/exploration perk wrappers.
* **`rumors.js`**: `RUMORS`, `STATION_RUMORS` (coverage for all static ports), and `RumorManager` (non-repeating shuffled deck, live-state market/bounty/colony/war-front intel, 50+ automatic Codex lore hooks, and Overheard Log history).

---

## 🛠️ Core Engine Architecture & Extension APIs

* **Event Bus (`window.GameBus`):** Decoupled pub/sub (`on`, `once`, `off`, `emit`) coordinating `TICK_PROCESSED`, `CARGO_MODIFIED`, `UI_REFRESH_REQUESTED`, `XP_GAINED`, `HULL_DAMAGED`, and `HULL_REPAIRED`.
* **State Proxy Bridge (`GameState`):** Centralizes player, ship, world, and UI state while binding reactive getters/setters and a `playerCargo` Proxy so mutations automatically keep HUD readouts and quest hooks synchronized.
* **Memory & Persistence:** `chunkManager` dynamically generates and prunes 16×16 world chunks around the player; `worldStateDeltas` stores persistent changes (colonies, waystations, stargates, wormholes, mined nodes, cleared pirate bases) with automatic quota-aware garbage collection and multi-profile `localStorage` saves.
* **Built-In Extension Registries:** Modules expose self-contained registration and query APIs on `window`:
  * `window.ConfigRegistry` — register custom deep-space POIs, tile interactions, time-capsule logs, and CRT palettes.
  * `window.UI` — register custom Commander Datapad tabs (`UI.registerProfileTab`) and query modal/Codex state.
  * `window.ShipUtils` / `window.LocationUtils` / `window.BiomeUtils` / `window.LoreUtils` / `window.MissionUtils` / `window.MechanicsUtils` / `window.TradeUtils` / `window.PerkUtils` / `window.ItemUtils` / `window.RumorManager` — standardized runtime helpers and registration hooks for adding ships, components, ports, encounters, mission templates, lore, rumors, and custom radio stations (`soundManager.registerStation`).
