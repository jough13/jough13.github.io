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
// 3. EXPANSION MANIFEST
// ==========================================
// This array defines the exact load order. 
// Easy to toggle mechanics on/off for debugging or expansions!
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
    
    // MUST LOAD LAST: Renders over the top of all other entities
    { name: 'FogOfWar',             module: FogOfWarExpansion }
];

// ==========================================
// 4. BOOT SEQUENCE
// ==========================================
// Use DOMContentLoaded instead of window.onload so the engine boots 
// instantly without waiting for heavy video/image assets to finish downloading.
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. PERFORMANCE TRACKING
    const bootStartTime = performance.now();

    // 2. GLOBAL CONFIGURATION (For future settings, options, and mods)
    window.SpiderWarsConfig = window.SpiderWarsConfig || {
        version: '1.1.0',
        debugMode: false,
        cheatsEnabled: false
    };
    
    // 3. DEVELOPER LORE & INIT LOGS
    console.log("%c🕸️ THE OBSIDIAN BROOD AWAKENS 🕸️", "color: #aa00ff; font-size: 18px; font-weight: bold; text-shadow: 1px 1px 0px #000;");
    console.log(`%cSummoning the SpiderWars! Engine v${window.SpiderWarsConfig.version}...`, "color: #ff9d00; font-family: monospace;");

    const game = new Game();
    
    // EXPANDABILITY: Expose engine to global scope for easy DevTools debugging and external Modding
    window.SpiderWarsEngine = game;

    let loadedCount = 0;
    let failedCount = 0;

    // EXPANDABILITY: Combine internal manifest with any externally injected mods via script tags
    // Ensure window.SpiderWarsMods is an actual iterable array before spreading
    const externalMods = Array.isArray(window.SpiderWarsMods) ? window.SpiderWarsMods : [];
    const fullManifest = [...expansionManifest, ...externalMods];

    // UI POLISH: Group console logs so the DevTools aren't spammed with dozens of lines!
    console.groupCollapsed(`%c📦 Weaving ${fullManifest.length} Expansions...`, "color: #00aaff; font-weight: bold;");

    // 4. ROBUST LOADING LOOP
    for (const exp of fullManifest) {
        try {
            // SAFETY FIX: Prevent the engine from crashing blindly if a module import failed/typo'd
            if (!exp || !exp.module) {
                throw new Error(`Module '${exp?.name || 'Unknown'}' is undefined. Check your import paths at the top of main.js!`);
            }
            game.expansions.load(exp.name, exp.module);
            loadedCount++;
        } catch (error) {
            console.error(`%c[Engine Error] Failed to weave expansion into the web: ${exp?.name || 'Unknown'}`, "color: #ff0000; font-weight: bold;");
            console.error(error);
            failedCount++;
            // Engine continues loading other modules gracefully!
        }
    }
    
    console.groupEnd(); // Close the console group folder

    const bootTime = (performance.now() - bootStartTime).toFixed(2);

    if (failedCount > 0) {
        console.warn(`%c[Engine Warning] The Web is torn. ${failedCount} expansions failed to load.`, "color: #ffaa00; font-family: monospace;");
    } else {
        console.log(`%c[Engine] The Web is perfectly woven. Loaded ${loadedCount} Expansions in ${bootTime}ms.`, "color: #00ff00; font-family: monospace;");
    }
    
    // 5. EVENT BROADCAST: Tell external scripts/mods the engine is fully ready to accept commands
    window.dispatchEvent(new CustomEvent('SpiderWarsReady', { 
        detail: { 
            game: window.SpiderWarsEngine, 
            config: window.SpiderWarsConfig,
            loadedCount: loadedCount, 
            failedCount: failedCount,
            bootTimeMs: bootTime
        } 
    }));
});
