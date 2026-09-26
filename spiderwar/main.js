// main.js

// 1. Import the core Game engine
import { Game } from './game.js';

// 2. Import all Expansions
import { SplashScreenExpansion } from './expansions/SplashScreen.js';
import { AudioExpansion } from './expansions/Audio.js';
import { TerrainExpansion } from './expansions/Terrain.js';
import { DecorExpansion } from './expansions/Decor.js';
import { ParticleExpansion } from './expansions/Particles.js';
import { AdvancedBaseExpansion } from './expansions/AdvancedBase.js';
import { GodUnitExpansion } from './expansions/Boss.js';
import { QueenExpansion } from './expansions/Queen.js';
import { CombatAndHarvesterExpansion } from './expansions/CombatAI.js';
import { SilkNetworkExpansion, WebNetworkExpansion } from './expansions/Networks.js';
import { SpellExpansion } from './expansions/Spells.js';
import { AdvancedUnitControlExpansion, ConstructionExpansion } from './expansions/Controls.js';
import { MinimapExpansion, ContextUIExpansion, GameLoopExpansion } from './expansions/UI.js';
import { AtmosphereExpansion, FogOfWarExpansion, SaveLoadExpansion } from './expansions/Systems.js';

// 3. Boot the Game
window.onload = () => {
    const game = new Game();
    
    game.expansions.load('SplashScreen', SplashScreenExpansion); 
    game.expansions.load('AudioSynth', AudioExpansion);
    game.expansions.load('TerrainGen', TerrainExpansion); 
    game.expansions.load('DecorSystem', DecorExpansion); 
    game.expansions.load('ParticleEngine', ParticleExpansion);
    game.expansions.load('AdvancedBaseBuilder', AdvancedBaseExpansion); 
    game.expansions.load('CentipedeBoss', GodUnitExpansion);
    game.expansions.load('QueenSystem', QueenExpansion); 
    game.expansions.load('CombatAndHarvesterAI', CombatAndHarvesterExpansion); 
    game.expansions.load('WebNetwork', WebNetworkExpansion); 
    game.expansions.load('SilkNetwork', SilkNetworkExpansion);

    // UI EXPANSIONS
    game.expansions.load('MinimapUI', MinimapExpansion); 
    game.expansions.load('AdvancedUnitControl', AdvancedUnitControlExpansion);
    game.expansions.load('ConstructionLogic', ConstructionExpansion);
    game.expansions.load('ContextUI', ContextUIExpansion);
    game.expansions.load('GameLoop', GameLoopExpansion); 
    game.expansions.load('SaveLoadManager', SaveLoadExpansion); 

    // JUICE & SPELLS
    game.expansions.load('Atmosphere', AtmosphereExpansion); 
    game.expansions.load('CommanderSpells', SpellExpansion); 
    
    // REQUIRED TO LOAD LAST
    game.expansions.load('FogOfWar', FogOfWarExpansion);
};
