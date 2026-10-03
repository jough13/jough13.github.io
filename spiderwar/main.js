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
import { GodUnitExpansion } from './expansions/Boss.js';

// Core AI & Networks
import { QueenExpansion } from './expansions/Queen.js';
import { CombatAndHarvesterExpansion } from './expansions/CombatAI.js';
import { SilkNetworkExpansion, WebNetworkExpansion } from './expansions/Networks.js';

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
import { ToxicPlagueExpansion } from './expansions/ToxicPlague.js'; // <-- ADDED TOXIC PLAGUE IMPORT
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
    { name: 'ToxicPlague',          module: ToxicPlagueExpansion }, // <-- ADDED TO MANIFEST
    { name: 'Titans',               module: TitansExpansion },
    { name: 'BroodAmbush',          module: BroodAmbushExpansion },
    { name: 'Fortress',             module: FortressExpansion },
    
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
    
    // Developer Lore & Initialization Logs
    console.log("%c🕸️ THE OBSIDIAN BROOD AWAKENS 🕸️", "color: #aa00ff; font-size: 18px; font-weight: bold; text-shadow: 1px 1px 0px #000;");
    console.log("%cSummoning the SpiderWars! Engine v1.0...", "color: #ff9d00; font-family: monospace;");

    const game = new Game();
    
    // EXPANDABILITY: Expose engine to global scope for easy DevTools debugging and external Modding
    window.SpiderWarsEngine = game;

    let loadedCount = 0;

    // EXPANDABILITY: Combine internal manifest with any externally injected mods via script tags
    // Ensure window.SpiderWarsMods is an actual iterable array before spreading
    const externalMods = Array.isArray(window.SpiderWarsMods) ? window.SpiderWarsMods : [];
    const fullManifest = [...expansionManifest, ...externalMods];

    // Robust loading loop
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
            // Engine continues loading other modules gracefully!
        }
    }

    console.log(`%c[Engine] The Web is woven. Loaded ${loadedCount}/${fullManifest.length} Expansions successfully.`, "color: #00ff00; font-family: monospace;");
    
    // EXPANDABILITY: Broadcast a global event so external scripts/mods know the engine is fully ready to accept commands
    window.dispatchEvent(new CustomEvent('SpiderWarsReady', { 
        detail: { 
            game: window.SpiderWarsEngine, 
            loadedCount: loadedCount, 
            total: fullManifest.length 
        } 
    }));
});
