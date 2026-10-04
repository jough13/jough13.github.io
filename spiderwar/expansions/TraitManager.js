// expansions/TraitManager.js
import { Spider, Structure } from '../game.js';

// ==========================================
// THE TRAIT MANAGER (Entity-Component System)
// ==========================================
export const TraitManagerExpansion = {
    init: (game) => {
        console.log("%c[Engine] Trait Manager Online. Modular ECS active.", "color: #00ffcc; font-weight: bold;");

        // 1. The Central Registry
        game.traitRegistry = {};

        // 2. The Global Registration API
        game.registerTrait = function(traitName, traitLogic) {
            this.traitRegistry[traitName] = traitLogic;
            console.log(`Registered Trait: [${traitName}]`);
        };

        // ==========================================
        // 3. FREE EXAMPLE TRAITS! 
        // (You can assign these to ANY unit or building in the data dictionaries!)
        // ==========================================

        // Trait 1: Regenerator (Passive Healing)
        game.registerTrait('regenerator', {
            update: (entity, gameObj) => {
                if (entity.hp < entity.maxHp && gameObj.tick % 60 === 0) {
                    entity.hp = Math.min(entity.maxHp, entity.hp + 5);
                    gameObj.bus.emit('particles', {x: entity.x, y: entity.y, color: '#00ff00', count: 2});
                }
                return false; // Return false so the unit continues its normal movement AI!
            }
        });

        // Trait 2: Thorns (Damage Attackers)
        // (This would require a slight hook into the damage pipeline later, but for now it's a great placeholder)
        game.registerTrait('burning_aura', {
            update: (entity, gameObj) => {
                if (gameObj.tick % 30 === 0) { // Every 1 second
                    let burned = false;
                    for (let i = 0; i < gameObj.entities.length; i++) {
                        let e = gameObj.entities[i];
                        if (e.team && e.team !== entity.team && e.hp > 0) {
                            // Fast 50px radius check
                            if (Math.abs(entity.x - e.x) < 50 && Math.abs(entity.y - e.y) < 50) {
                                e.hp -= 2; // Burn damage
                                burned = true;
                            }
                        }
                    }
                    if (burned) gameObj.bus.emit('particles', {x: entity.x, y: entity.y, color: '#ff5500', count: 3});
                }
                return false; 
            }
        });
    },

    patch: (game) => {
        // ==========================================
        // 4. THE UNIVERSAL TRAIT EXECUTION LOOP
        // ==========================================

        // We patch Spider and Structure exactly ONCE here. 
        // From now on, the engine automatically loops through a unit's traits and runs them!

        const processTraits = function(entity, gameObj, originalUpdate) {
            let skipDefaultAI = false;

            // Does this entity have traits?
            if (entity.traits && entity.traits.length > 0) {
                for (let i = 0; i < entity.traits.length; i++) {
                    const traitName = entity.traits[i];
                    const traitLogic = gameObj.traitRegistry[traitName];
                    
                    // If the trait exists in the registry, run it!
                    if (traitLogic && traitLogic.update) {
                        // If the trait returns TRUE, it means "I handled the AI this frame, skip the default behavior."
                        // (Useful for Kamikaze units or Voidweavers that override standard combat movement)
                        if (traitLogic.update(entity, gameObj)) {
                            skipDefaultAI = true;
                        }
                    }
                }
            }

            // Run standard movement/combat AI if a trait didn't override it
            if (!skipDefaultAI) {
                original.call(entity, gameObj);
            }
        };

        // Apply to Spiders
        game.expansions.patchClass(Spider, 'update', function(original, gameObj) {
            processTraits(this, gameObj, original);
        });

        // Apply to Structures (Buildings can now have traits like 'regenerator'!)
        game.expansions.patchClass(Structure, 'update', function(original, gameObj) {
            // Safety check: Structures don't have a traits array by default in game.js, so we initialize it if missing
            if (!this.traits) {
                const stats = gameObj.constructor.STRUCTURE_DATA ? gameObj.constructor.STRUCTURE_DATA[this.type] : null;
                this.traits = stats && stats.traits ? [...stats.traits] : [];
            }
            processTraits(this, gameObj, original);
        });
    }
};
