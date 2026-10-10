// main.js

// ==========================================
// 1. IMPORT CORE ENGINE
// ==========================================
import { Game } from './game.js';

// ==========================================
// 2. IMPORT ALL EXPANSIONS
// ==========================================
// Base & Environment
import { SplashScreenExpansion } from './expansions/SplashScreen.js';
import { AudioExpansion } from './expansions/Audio.js';
import { TerrainExpansion } from './expansions/Terrain.js';
import { DecorExpansion } from './expansions/Decor.js';
import { ParticleExpansion } from './expansions/Particles.js';
import { AdvancedBaseExpansion } from './expansions/AdvancedBase.js';
import { AIDirectorExpansion } from './expansions/AIDirector.js'; 
import { TraitManagerExpansion } from './expansions/TraitManager.js'; 
import { GodUnitExpansion } from './expansions/Boss.js';

// Core AI & Networks
import { QueenExpansion } from './expansions/Queen.js';
import { CombatAndHarvesterExpansion } from './expansions/CombatAI.js';
import { SilkNetworkExpansion, WebNetworkExpansion } from './expansions/Networks.js';
import { SwarmDynamicsExpansion } from './expansions/SwarmDynamics.js';

// Mechanics & Units
import { SpellExpansion } from './expansions/Spells.js';
import { SpecialUnitsExpansion } from './expansions/SpecialUnits.js';
import { HazardsExpansion } from './expansions/Hazards.js';
import { DayNightExpansion } from './expansions/DayNight.js';
import { ControlPointsExpansion } from './expansions/ControlPoints.js';
import { NecromancyExpansion } from './expansions/Necromancy.js'; 
import { DarkRitualsExpansion } from './expansions/DarkRituals.js';
import { SpectralSwarmExpansion } from './expansions/SpectralSwarm.js'; 
import { CursedRelicsExpansion } from './expansions/CursedRelics.js'; 
import { ToxicPlagueExpansion } from './expansions/ToxicPlague.js'; 
import { VoidWhispersExpansion } from './expansions/VoidWhispers.js'; 
import { TitansExpansion } from './expansions/Titans.js'; 
import { BroodAmbushExpansion } from './expansions/BroodAmbush.js'; 
import { FortressExpansion } from './expansions/Fortress.js';

// Controls, UI, & Systems
import { AdvancedUnitControlExpansion, ConstructionExpansion } from './expansions/Controls.js';
import { MinimapExpansion, ContextUIExpansion, GameLoopExpansion } from './expansions/UI.js';
import { AtmosphereExpansion, FogOfWarExpansion, SaveLoadExpansion } from './expansions/Systems.js';

// ==========================================
// 3. EXPANSION MANIFEST (STRICT LOAD ORDER)
// ==========================================
// This array defines the exact load order of the vanilla game.
// Dependencies (like the TraitManager) must load before units that use them.
const expansionManifest = [
    { name: 'SplashScreen',         module: SplashScreenExpansion },
    { name: 'AudioSynth',           module: AudioExpansion },
    { name: 'TerrainGen',           module: TerrainExpansion },
    { name: 'DecorSystem',          module: DecorExpansion },
    { name: 'ParticleEngine',       module: ParticleExpansion },
    
    { name: 'AdvancedBaseBuilder',  module: AdvancedBaseExpansion },
    { name: 'AIDirector',           module: AIDirectorExpansion }, 
    { name: 'TraitManager',         module: TraitManagerExpansion }, 
    { name: 'CentipedeBoss',        module: GodUnitExpansion },
    { name: 'QueenSystem',          module: QueenExpansion },
    { name: 'CombatAndHarvesterAI', module: CombatAndHarvesterExpansion },
    
    { name: 'WebNetwork',           module: WebNetworkExpansion },
    { name: 'SilkNetwork',          module: SilkNetworkExpansion },
    
    { name: 'SpecialUnits',         module: SpecialUnitsExpansion },
    { name: 'Hazards',              module: HazardsExpansion },
    { name: 'DayNight',             module: DayNightExpansion },
    { name: 'ControlPoints',        module: ControlPointsExpansion },
    { name: 'CommanderSpells',      module: SpellExpansion },
    { name: 'Necromancy',           module: NecromancyExpansion },
    { name: 'DarkRituals',          module: DarkRitualsExpansion },
    { name: 'SpectralSwarm',        module: SpectralSwarmExpansion }, 
    { name: 'CursedRelics',         module: CursedRelicsExpansion }, 
    { name: 'ToxicPlague',          module: ToxicPlagueExpansion }, 
    { name: 'VoidWhispers',         module: VoidWhispersExpansion }, 
    { name: 'Titans',               module: TitansExpansion },
    { name: 'BroodAmbush',          module: BroodAmbushExpansion },
    { name: 'Fortress',             module: FortressExpansion },
    
    { name: 'SwarmDynamics',        module: SwarmDynamicsExpansion },
    { name: 'MinimapUI',            module: MinimapExpansion },
    { name: 'AdvancedUnitControl',  module: AdvancedUnitControlExpansion },
    { name: 'ConstructionLogic',    module: ConstructionExpansion },
    { name: 'ContextUI',            module: ContextUIExpansion },
    { name: 'GameLoop',             module: GameLoopExpansion },
    { name: 'SaveLoadManager',      module: SaveLoadExpansion },
    
    { name: 'Atmosphere',           module: AtmosphereExpansion },
    { name: 'FogOfWar',             module: FogOfWarExpansion } // MUST LOAD LAST!
];

// ==========================================
// 4. BULLETPROOF BOOT SEQUENCE
// ==========================================
const bootEngine = () => {
    // 1. PERFORMANCE TRACKING
    const bootStartTime = performance.now();

    // 2. GLOBAL CONFIGURATION
    window.SpiderWarsConfig = window.SpiderWarsConfig || {
        version: '1.2.0',
        debugMode: false,
        cheatsEnabled: false
    };
    
    // 🧃 3. DEVTOOLS JUICE (ASCII ART)
    const spiderASCII = `
%c
   / _ \\
 \\_\\(_)/_/
  _//o\\\\_
   /   \\
🕸️ THE OBSIDIAN BROOD AWAKENS 🕸️
SpiderWars! Engine v${window.SpiderWarsConfig.version}
    `;
    console.log(spiderASCII, "color: #aa00ff; font-weight: bold; text-shadow: 1px 1px 0px #000;");

    // Initialize core state
    const game = new Game();
    window.SpiderWarsEngine = game; // Expose to global scope for DevTools & Mods

    // 4. MODDING API (Expandability Win)
    // We use a Map to allow external mods to easily overwrite core modules by matching the name!
    const activeManifest = new Map();
    expansionManifest.forEach(exp => activeManifest.set(exp.name, exp));
    
    if (Array.isArray(window.SpiderWarsMods)) {
        window.SpiderWarsMods.forEach(mod => {
            if (!mod.name || !mod.module) {
                console.error(`%c[Mod API] Invalid mod structure detected. Skipping.`, "color: #ff0000;");
                return;
            }
            if (activeManifest.has(mod.name)) {
                console.warn(`%c[Mod API] External mod is overriding core expansion: ${mod.name}`, "color: #ffaa00; font-weight: bold;");
            }
            activeManifest.set(mod.name, mod);
        });
    }

    // Convert back to an ordered array for the loading sequence
    const fullManifest = Array.from(activeManifest.values());

    let loadedCount = 0;
    let failedCount = 0;

    console.groupCollapsed(`%c📦 Weaving ${fullManifest.length} Expansions...`, "color: #00aaff; font-weight: bold;");

    // 5. ROBUST LOADING LOOP
    for (const exp of fullManifest) {
        try {
            if (!exp || !exp.module) {
                throw new Error(`Module '${exp?.name || 'Unknown'}' is undefined. Check import paths!`);
            }
            game.expansions.load(exp.name, exp.module);
            loadedCount++;
        } catch (error) {
            console.error(`%c[Engine Error] Failed to weave expansion into the web: ${exp?.name || 'Unknown'}`, "color: #ff0000; font-weight: bold;");
            console.error(error);
            failedCount++; // Engine skips bad module and continues loading safely
        }
    }
    
    console.groupEnd(); // Close the console group folder

    const bootTime = (performance.now() - bootStartTime).toFixed(2);

    if (failedCount > 0) {
        console.warn(`%c[Engine Warning] The Web is torn. ${failedCount} expansions failed to load.`, "color: #ffaa00; font-family: monospace;");
    } else {
        console.log(`%c[Engine] The Web is perfectly woven. Loaded ${loadedCount} Expansions in ${bootTime}ms.`, "color: #00ff00; font-family: monospace;");
    }
    
    // 🔌 6. HOT-PLUGGABLE MOD API
    // Allows devs (or Chrome Extensions) to inject scripts while the game is actively running!
    window.SpiderWarsAPI = {
        getEngine: () => window.SpiderWarsEngine,
        emit: (event, data) => window.SpiderWarsEngine?.bus.emit(event, data),
        on: (event, callback) => window.SpiderWarsEngine?.bus.on(event, callback),
        loadMod: (modName, modModule) => {
            try {
                game.expansions.load(modName, modModule);
                console.log(`%c[Mod API] Late-loaded mod successfully: ${modName}`, "color: #00ff00; font-weight: bold;");
            } catch (e) {
                console.error(`[Mod API] Failed to late-load ${modName}`, e);
            }
        }
    };

    // 7. EVENT BROADCAST (UI Ready Signal)
    window.dispatchEvent(new CustomEvent('SpiderWarsReady', { 
        detail: { 
            game: window.SpiderWarsEngine, 
            config: window.SpiderWarsConfig,
            loadedCount: loadedCount, 
            failedCount: failedCount,
            bootTimeMs: bootTime
        } 
    }));
};

// ==========================================
// 5. GLOBAL CATASTROPHE HANDLER
// ==========================================
// 🛡️ [FIX] Prevents silent failures by catching unhandled exceptions and styling them beautifully
window.addEventListener('error', (e) => {
    console.error(`%c🕸️ [CATASTROPHE] The Web has snapped! \nFatal Error: ${e.message}`, "color: #ff0000; font-size: 14px; font-weight: bold; border: 1px solid #ff0000; padding: 5px; background: rgba(50,0,0,0.5);");
});
window.addEventListener('unhandledrejection', (e) => {
    console.error(`%c🕸️ [VOID WHISPERS] Unhandled Promise Rejection! \nReason: ${e.reason}`, "color: #aa00ff; font-size: 14px; font-weight: bold; border: 1px solid #aa00ff; padding: 5px; background: rgba(20,0,50,0.5);");
});

// ==========================================
// 6. SAFELY EXECUTE BOOT
// ==========================================
// Handles the race condition where DOMContentLoaded already fired before this script executed
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootEngine);
} else {
    bootEngine(); // Document is already ready, boot immediately!
}
