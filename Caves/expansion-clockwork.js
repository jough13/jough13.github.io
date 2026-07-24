// --- START OF FILE expansion-clockwork.js ---

window.ExpansionManager.register({
    id: "clockwork_uprising",
    name: "The Clockwork Uprising",
    version: "1.0",
    
    // The data object perfectly mimics your core files
    data: {
        
        items: {
            '⚙️c': { 
                name: 'Clockwork Core', type: 'trade', tile: '⚙️', 
                description: "A faintly glowing, ticking heart from a machine.", value: 150 
            },
            '⚡g': {
                name: 'Galvanic Rifle', type: 'weapon', tags: ['crossbow', 'lightning'], tile: '🔫',
                damage: 8, range: 6, isTwoHanded: true, slot: 'weapon', skillId: 'ranged_attack',
                description: "{red:+8 Dmg}. A highly advanced weapon that fires bolts of pure energy.",
                _rarity: 'epic'
            },
            '📓m': {
                name: 'Manual: Overcharge', type: 'skillbook', skillId: 'overcharge', tile: '📓'
            }
        },

        enemies: {
            '🤖m': {
                name: 'Clockwork Minotaur', tags: ['construct', 'metal', 'giant'], mountable: false,
                maxHealth: 60, attack: 10, defense: 6, xp: 180,
                color: '#f59e0b', loot: '⚙️c',
                flavor: "Steam hisses from its brass nostrils. It was built for war."
            }
        },

        skills: {
            'overcharge': {
                name: "Overcharge",
                description: "Deal massive {yellow:Lightning} damage, but destroys your weapon! Scales with {red:Strength}.",
                flavor: "You push the mechanical core past its limits until it violently detonates.",
                cost: 20, costType: "stamina", requiredLevel: 5, target: "aimed", baseDamageMultiplier: 3.0, cooldown: 10,
                scalingStat: "strength", weaponTags: ['metal', 'construct', 'lightning']
            }
        },

        tiles: {
            '🏭': {
                type: 'dungeon_entrance',
                name: 'Brass Factory',
                flavor: "Smoke pours from the vents of a massive, half-buried machine complex.",
                getCaveId: (x, y) => `clockwork_${x}_${y}`
            }
        },

        caveThemes: {
            'CLOCKWORK_FACTORY': {
                name: 'The Brass Factory',
                wall: '⚙️', floor: '▤', secretWall: '▒',
                colors: { wall: '#b45309', floor: '#292524' },
                decorations: ['🛢', '⛓️', '💡', '⚙️c'], 
                enemies: ['🤖', '🔪', '🤖m', 'g'] 
            }
        },

        shops: {
            trader: [
                { name: 'Galvanic Rifle', price: 1200, stock: 1 },
                { name: 'Manual: Overcharge', price: 800, stock: 1 }
            ]
        }
    },

    // Custom initialization hook for injecting arbitrary code logic!
    init: function() {
        // Example: Add a new Alchemy Recipe dynamically!
        if (typeof window.ALCHEMY_RECIPES !== 'undefined') {
            window.ALCHEMY_RECIPES["Liquid Lightning"] = {
                materials: { "Clockwork Core": 1, "Clean Water": 1, "Empty Bottle": 1 },
                xp: 150, level: 5, yield: 1
            };
        }
    }
});

// --- END OF FILE expansion-clockwork.js ---
