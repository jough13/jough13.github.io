# Wayfinder: Echoes of the Void

**Wayfinder: Echoes of the Void** is a browser-based, turn-based space exploration and trading RPG. Players pilot a customizable starship through a procedurally generated galaxy, engaging in tactical combat, dynamic economy trading, deep-space anomaly investigation, and narrative-driven encounters.

---

## 📖 Player's Survival Guide (Quickstart)

Welcome to the void, Commander. Space is incredibly dangerous. If you want to survive your first few hours outside of Starbase Alpha, keep these rules in mind:

1. **Watch Your Fuel:** Every tile moved and every evasive maneuver in combat burns Hydrogen-3. If you run out, you will be stranded. Press **`N`** (Nav-Computer Ping) to find the nearest safe harbor, or press **`Z`** to broadcast an emergency distress signal to the Fuel Rats.
2. **Scan Everything:** Press **`V`** when orbiting stars or anomalies to gather data. This data can be sold, but more importantly, it yields massive Experience Points (XP) and occasionally uncovers hidden Precursor Engrams. 
3. **Understand the Factions:** 
   * **Concord (Blue):** Safe, regulated, but heavily policed. Contraband will be confiscated.
   * **Eclipse Cartel (Purple):** The Shadow Network. Highly profitable smuggling, but ruthless pirates.
   * **K'tharr Ascendancy (Green):** Honor-bound warriors. They shoot first unless you earn their respect.
4. **Upgrade Smartly:** Ship components have Manufacturers. Equipping 3 components from the same manufacturer (e.g., 3x Concord or 3x Eclipse) grants a massive **Set Synergy Bonus**. 
5. **Manage Your Heat:** Press **`Q`** to enter Silent Running (Stealth). This hides your radar signature from pirates and customs, but builds Heat. If your heat gauge exceeds 5, your reactor will melt your own hull.

---

## ⌨️ Flight Controls & Hotkeys

**Navigation:**
* **`W` / `A` / `S` / `D`** or **Arrow Keys**: Move Ship
* **`Spacebar`** or **`.`** (Period): Hold position and cycle systems (Advance Time / Wait)

**Sensors & Interactivity (In Space):**
* **`E` / `Enter`**: Interact / Dock / Land / Enter System
* **`Q`**: Toggle Silent Running (Stealth Mode)
* **`P`**: Active Sensor Ping (Locate Derelicts, Outposts, and Wrecks)
* **`V`**: Deep Scan (Scan stars and local phenomena, discover Lore/Engrams)
* **`O`**: Deep Space Astrometric Observatory (Capture Sector Plates)
* **`N`**: Nav-Computer Ping (Locate nearest safe harbor or active mission target)
* **`R` / `Shift+R`**: Cycle Subspace Radio Stations / Skip Track
* **`U`**: Access Shipboard Synthesis (Crafting & R&D Bench)

**Menus (When Docked):**
* **`B`**: Buy Goods
* **`S`**: Sell Goods
* **`O`**: Outfitting (When at a Major Hub)
* **`Y`**: Shipyard (When at a Major Hub)
* **`K`**: Mission Board
* **`R`**: Repair Hull & Reload Ordnance
* **`V`**: Visit Cantina (Rumors & Recruitment)

**System / Meta:**
* **`I`**: Open Cargo Hold (Deploy Drones / Use Items / Crack Engrams)
* **`J`**: Open Galactic Codex & Lore Archives
* **`L`**: View Local Action Log
* **`` ` `` (Tilde)**: Open Developer Debug Console

---

## 🚀 Core Features

* **Procedural Universe:** Infinite grid-based movement with dynamic chunk loading. Explore nebulas, asteroid fields, rogue planets, and ancient precursor megastructures.
* **Dynamic Economy:** Supply and demand dictate market prices. Exploit time-limited Market Booms, smuggle contraband through Eclipse Cartel shadow networks, or trade legally at Concord major hubs.
* **Modular Ship Outfitting:** Upgrade weapons, shields, engines, and utility modules. Craft experimental prototypes in the Engineering Bay or hunt Legendary Bosses for Exotic weapon drops.
* **Tactical Combat & Boarding:** Turn-based ship-to-ship combat with evasion, shield mechanics, and the high-risk/high-reward option to deploy marines to board crippled enemy vessels for close-quarters firefights.
* **Crew Management & Missions:** Hire diverse crew members with unique passive perks at cantinas, and take on procedurally generated bounties, delivery contracts, and astrometric surveys.
* **Deep Narrative & Lore:** Solve cryptographic ciphers at the Xerxes Spire, decrypt ancient engrams with the Cyber Slicer perk, and fill out a massive Codex of alien lore.
* **Colony Management:** Establish Concord-recognized pioneer settlements on habitable planets. Manage their atmospheric processors, taxation policies, demographics, and orbital defenses to build a thriving metropolis.

---

## 📂 Project Architecture & Developer Documentation

The engine is built on Vanilla HTML/CSS/JS and relies on a highly modular architecture. No external frameworks (React, Vue, Canvas engines) are used, ensuring maximum performance and complete control over the render loop.

### 🖥️ Core Engine
* **`index.html`**: The master entry point. Contains the canvas rendering context, UI overlays, and loads all script modules. Features a built-in "Flight Recorder" that hijacks standard console logs to display an in-game Red Screen of Death for flawless debugging.
* **`style.css`**: The design system. Handles the retro-futuristic terminal aesthetic, CSS animations (scanlines, shakes, warps), responsive modals, and the seamless Light/Dark mode toggle.
* **`script.js`**: The brain of the game. Contains the master game loop (`processGameTick`), the event bus (`GameBus`), global input routing (`handleGalacticMapInput`), procedural chunk generation (`chunkManager`), and the Save/Load/Auto-Login state management.

### ⚙️ Game Mechanics Modules
* **`ui.js`**: Manages all cross-system UI components. Contains the `GenericModal` engine (which dynamically generates two-pane interfaces for almost every interaction), Cargo management, Notification Toasts, and the Commander Profile Datapad.
* **`exploration.js`**: Handles planetary landings, biome generation, surface expeditions, anomaly minigames, and the Colony foundation logic.
* **`trade.js`**: Runs the galactic economy. Handles the buy/sell modal, dynamic time-gated restocking, and the Eclipse Cartel contraband fencing logic (The Shadow Broker).
* **`outfitting.js`**: Manages the Starbase Shipyard (buying new chassis) and the Outfitting screen (equipping components, calculating vital stats, applying manufacturer synergies, and synthesizing experimental R&D modules).
* **`combat.js`**: The tactical combat engine. Manages initiative, damage calculation, weapon cooldowns, dynamic warzones (Skirmishes), and the UI for ship-to-ship and close-quarters boarding combat.
* **`stations.js`**: Handles the local concourse logic for major hubs and outposts, including Customs scanning, Black Market routing, Concord Armory clearance, and K'tharr Proving Grounds.
* **`missions.js`**: Procedural mission generator. Creates dynamic bounty hunts, survey directives, and cargo acquisition/delivery tasks scaled to the player's level.
* **`crew.js`**: The Cantina recruitment system. Generates standard and rare "Legendary" crew members, handling their hiring costs, monthly salaries, and passive perks (including Eclipse Mercenary theft drawbacks).
* **`colonies.js`**: The simulation engine for player-owned settlements. Manages population growth, taxation, morale, and resource consumption/production across multiple tiers of planetary buildings.
* **`audio.js`**: The `SoundManager` class. Utilizes the Web Audio API to generate dynamic, synth-based sound effects (lasers, UI blips, alarms), manages procedural drone ambient tracks, and controls the multi-station Subspace Radio MP3 player.

### 📚 Data Dictionaries & Configuration
* **`config.js`**: The master configuration file. Defines global constants, map symbols, faction behavior/territories, baseline player stats, and notoriety titles.
* **`items.js`**: The physical inventory database. Defines commodities, precursor artifacts, modular ship components, and the weighted loot tables for derelict ships and combat drops.
* **`ships.js`**: The chassis database. Contains the stats, unique abilities, and faction requirements for playable ships, as well as the combat profiles for pirate, Concord, and Legendary Boss enemies.
* **`locations.js`**: Hardcoded points of interest. Defines the coordinates, available services, and initial market stocks for major hubs (e.g., Starbase Alpha, Station Umbra, The Archivist's Vault).
* **`biomes.js`**: Planetary generation data. Defines visual assets, descriptive text, environmental hazards, and resource yields for various world types (Terran, Volcanic, Machine Worlds, etc.).
* **`lore.js`**: The primary text database. Contains all Codex entries, ship lore, and the cryptic text-parser riddles for the Xerxes Spire and Precursor Vaults.
* **`perks.js`**: Defines the logic and UI text for all Level-Up Captain Augmentations (e.g., Cyber Slicer, Health Physicist, Smuggler's Luck).
* **`rumors.js`**: The Smart Rumor deck. Contains an array of gossip, warnings, and lore hints that NPCs share when hailed or when visiting the cantina, alongside live-state intel on market booms and bounty locations.

### 🛠️ Core Systems Overview
* **The GameBus**: A custom event-emitter (`GameBus.emit()`, `GameBus.on()`) that allows disparate modules to communicate without tight coupling. Used for triggering UI refreshes, applying hull damage from traps, and broadcasting cargo modifications.
* **Time & Ticks**: Movement and actions cost "Stardates". The `processGameTick(amount)` function drives the universe forward, triggering passive colony production, NPC ambient traffic movement, and random narrative encounters in empty space.
* **Memory Management**: The `chunkManager` ensures the game never slows down by pruning distant map tiles from RAM. `performGarbageCollection()` occasionally sweeps the persistent memory (`worldStateDeltas`) to delete old, unimportant data while preserving player colonies, mapped wormholes, and cleared pirate bases.
