const ZONES = [{ 
    // Zone 0
    name: "The Ashen Woods",
    width: 300,
    backgroundChar: ".",
    midgroundChar: "t",
    color: "#ff8c00",
    bgColor: "#5c1f00",
    entryLoreKey: "ASHEN_WOODS_INTRO",
    shrineLoreKey: "ASHEN_SHRINE_1",
    fixedElements: {
        40: [{ lane: 2, char: '§' }],
        70: [{ lane: 2, char: 'E', enemyKey: "ASH_GNAWER" }, { lane: 0, char: 'F' }],
        110: [{ lane: 2, char: 'H' }],
        140: [{ lane: 2, char: 'N', npcType: "LOST_SOUL" }],
        195: [{ lane: 2, char: '¥' }],
        220: [{ lane: 1, char: 'N', npcType: "LOST_SOUL" }]
    },
    spawnDensity: 0.15,
    spawnPool: [
        { char: '.', weight: 40 }, { char: 'T', weight: 15 }, { char: 't', weight: 15 },
        { char: 'M', weight: 10 }, { char: '~', weight: 10 }, { char: 'E', enemyKey: 'ASH_GNAWER', weight: 15 },
        { char: 'L', weight: 5 }, { char: 'A', weight: 2 }, { char: '+', weight: 3 },
        { char: 'P', weight: 2 }, { char: 'd', weight: 2 }, { char: 'B', weight: 4 },
        { char: '?', weight: 3 }, { char: '!', weight: 2 }, { char: '¶', weight: 1 }
    ]
}, { 
    // Zone 1
    name: "The Crimson Depths",
    width: 290,
    backgroundChar: ":",
    midgroundChar: "*",
    color: "#ff007f",
    bgColor: "#3b003b",
    entryLoreKey: "CRIMSON_DEPTHS_INTRO",
    shrineLoreKey: "CRIMSON_SHRINE_1",
    fixedElements: {
        80: [{ lane: 4, char: 'N', npcType: "HERMIT_RUNESMITH" }],
        90: [{ lane: 2, char: 'Φ' }],
        130: [{ lane: 0, char: '✧' }],
        220: [{ lane: 2, char: 'Δ' }],
        230: [{ lane: 3, char: 'H' }]
    },
    spawnDensity: 0.18,
    spawnPool: [
        { char: '.', weight: 30 }, { char: '♦', weight: 15 }, { char: '◊', weight: 15 },
        { char: 'M', weight: 12 }, { char: 'E', enemyKey: 'RUSTED_CONSTRUCT', weight: 10 },
        { char: 'E', enemyKey: 'ASH_GNAWER', weight: 8 }, { char: 'L', weight: 5 },
        { char: '#', weight: 10 }, { char: 'A', weight: 2 }, { char: 'P', weight: 2 },
        { char: 'B', weight: 3 }, { char: '+', weight: 2 }, { char: '?', weight: 2 }
    ]
}, { 
    // Zone 2
    name: "The Volcanic Wastes",
    width: 400,
    backgroundChar: "`",
    midgroundChar: "^",
    color: "#ff4500",
    bgColor: "#2b0f0f",
    entryLoreKey: "VOLCANIC_WASTES_INTRO",
    shrineLoreKey: "VOLCANIC_SHRINE_1",
    fixedElements: {
        100: [{ lane: 2, char: 'N', npcType: "HERMIT_RUNESMITH" }],
        120: [{ lane: 3, char: '§' }],
        170: [{ lane: 2, char: 'H' }],
        250: [{ lane: 2, char: 'Φ' }],
        270: [{ lane: 1, char: 'N', npcType: "ECHO_LUMINA" }],
        360: [{ lane: 2, char: '¤' }]
    },
    spawnDensity: 0.20,
    spawnPool: [
        { char: '.', weight: 25 }, { char: 's', weight: 15 }, { char: '[', weight: 10 },
        { char: ']', weight: 10 }, { char: 'M', weight: 15 }, { char: 'E', enemyKey: 'RUSTED_CONSTRUCT', weight: 12 },
        { char: 'E', enemyKey: 'ASH_GNAWER', weight: 5 }, { char: '#', weight: 10 },
        { char: 'A', weight: 2 }, { char: 'P', weight: 2 }, { char: 'L', weight: 5 },
        { char: '+', weight: 2 }, { char: '¦', weight: 2 }, { char: '¶', weight: 1 }
    ]
}, { 
    // Zone 3
    name: "The Starfall Crater",
    width: 370,
    backgroundChar: "'",
    midgroundChar: "%",
    color: "#9370db",
    bgColor: "#100020",
    entryLoreKey: "STARFALL_CRATER_INTRO",
    shrineLoreKey: "STARFALL_SHRINE_1",
    fixedElements: {
        100: [{ lane: 3, char: 'N', npcType: "ECHO_LUMINA" }],
        170: [{ lane: 2, char: 'H' }],
        250: [{ lane: 1, char: 'N', npcType: "ECHO_LUMINA" }]
    },
    spawnDensity: 0.22,
    spawnPool: [
        { char: '.', weight: 20 }, { char: 'V', weight: 15 }, { char: 'X', weight: 15 },
        { char: 'M', weight: 10 }, { char: 'E', enemyKey: 'VOID_TENDRIL', weight: 20 },
        { char: '#', weight: 10 }, { char: 'A', weight: 3 }, { char: 'L', weight: 5 },
        { char: '+', weight: 3 }, { char: 'P', weight: 1 }, { char: '?', weight: 2 }
    ]
}, { 
    // Zone 4
    name: "The Sunken Archives",
    width: 400,
    backgroundChar: "~",
    midgroundChar: "c",
    color: "#20b2aa",
    bgColor: "#003333",
    entryLoreKey: "SUNKEN_ARCHIVES_INTRO",
    shrineLoreKey: "SUNKEN_ARCHIVES_SHRINE_1",
    fixedElements: {
        70: [{ lane: 0, char: 'N', npcType: "ARCHIVIST_CONSTRUCT" }],
        180: [{ lane: 4, char: 'N', npcType: "ECHO_LUMINA" }],
        210: [{ lane: 2, char: 'H' }],
        310: [{ lane: 2, char: 'N', npcType: "ARCHIVIST_CONSTRUCT" }],
        365: [{ lane: 2, char: 'E', enemyKey: "VOID_SCARRED_SENTINEL" }]
    },
    spawnDensity: 0.25,
    spawnPool: [
        { char: '~', weight: 20 }, { char: '.', weight: 20 }, { char: 'S', weight: 15 },
        { char: 'b', weight: 10 }, { char: 'D', weight: 10 }, { char: 'E', enemyKey: 'VOID_TENDRIL', weight: 10 },
        { char: '#', weight: 10 }, { char: 'L', weight: 8 }, { char: 'A', weight: 3 },
        { char: '+', weight: 2 }, { char: '¶', weight: 1 }, { char: '®', weight: 1 }
    ]
}, { 
    // Zone 5
    name: "The Sky-Temple Aerie",
    width: 420,
    backgroundChar: " ",
    midgroundChar: "C",
    color: "#add8e6",
    bgColor: "#4682b420",
    entryLoreKey: "SKY_TEMPLE_AERIE_INTRO",
    shrineLoreKey: "SKY_TEMPLE_AERIE_SHRINE_1",
    fixedElements: {
        70: [{ lane: 0, char: 'N', npcType: "SKY_SEER_ECHO" }],
        180: [{ lane: 4, char: 'N', npcType: "ECHO_LUMINA" }],
        210: [{ lane: 2, char: 'H' }],
        310: [{ lane: 2, char: 'N', npcType: "SKY_SEER_ECHO" }],
        415: [{ lane: 2, char: 'O' }]
    },
    spawnDensity: 0.20,
    spawnPool: [
        { char: '.', weight: 25 }, { char: '^', weight: 20 }, { char: 'R', weight: 15 },
        { char: 'w', weight: 15 }, { char: 'G', weight: 10 }, { char: 'E', enemyKey: 'CRYSTAL_LURKER', weight: 5 },
        { char: 'L', weight: 6 }, { char: 'A', weight: 3 }, { char: '+', weight: 2 },
        { char: '#', weight: 5 }, { char: '!', weight: 2 }, { char: '®', weight: 1 }
    ]
}, { 
    // Zone 6
    name: "The Glimmering Depths",
    width: 300,
    backgroundChar: "'",
    midgroundChar: "✧",
    color: "#40e0d0",
    bgColor: "#003333",
    entryLoreKey: "GLIMMERING_DEPTHS_INTRO",
    shrineLoreKey: "GLIMMERING_SHRINE_1",
    fixedElements: {
        70: [{ lane: 0, char: 'N', npcType: "ECHO_LUMINA" }],
        210: [{ lane: 2, char: 'H' }]
    },
    spawnDensity: 0.22,
    spawnPool: [
        { char: '.', weight: 25 }, { char: '♦', weight: 20 }, { char: '◊', weight: 20 },
        { char: 'M', weight: 10 }, { char: 'E', enemyKey: 'CRYSTAL_LURKER', weight: 20 },
        { char: '#', weight: 8 }, { char: 'L', weight: 5 }, { char: 'A', weight: 3 },
        { char: 'P', weight: 2 }, { char: '?', weight: 2 }, { char: '®', weight: 1 }
    ]
}, { 
    // Zone 7
    name: "The Drowned City of Lyra",
    width: 450,
    backgroundChar: "≈",
    midgroundChar: "s",
    color: "#1d7874",
    bgColor: "#0b3937",
    entryLoreKey: "DROWNED_CITY_LYRA_INTRO",
    shrineLoreKey: "LYRA_SHRINE_1",
    fixedElements: {
        100: [{ lane: 3, char: 'N', npcType: "ARCHIVIST_CONSTRUCT" }],
        150: [{ lane: 1, char: 'N', npcType: "ECHO_LUMINA" }],
        260: [{ lane: 2, char: 'H' }],
        380: [{ lane: 0, char: 'N', npcType: "ECHO_LUMINA" }]
    },
    spawnDensity: 0.25,
    spawnPool: [
        { char: '~', weight: 20 }, { char: '.', weight: 20 }, { char: 'S', weight: 15 },
        { char: 'R', weight: 15 }, { char: 'D', weight: 10 }, { char: 'E', enemyKey: 'RUSTED_SENTINEL', weight: 15 },
        { char: '#', weight: 10 }, { char: 'L', weight: 5 }, { char: 'A', weight: 3 },
        { char: '+', weight: 2 }, { char: '?', weight: 2 }, { char: '!', weight: 2 }, { char: '¶', weight: 1 },
        { char: '®', weight: 1 }
    ]
}, { 
    // Zone 8
    name: "The Endless Abyss",
    width: 10000,
    backgroundChar: " ",
    midgroundChar: "·",
    color: "#888888",
    bgColor: "#05000a",
    entryLoreKey: "ABYSS_INTRO",
    shrineLoreKey: null,
    fixedElements: {},
    spawnDensity: 0.30,
    spawnPool: [
        { char: '.', weight: 20 }, { char: 'V', weight: 10 }, { char: 'X', weight: 10 },
        { char: '~', weight: 5 }, { char: 'M', weight: 5 }, { char: ']', weight: 5 },
        { char: 'E', enemyKey: 'VOID_TENDRIL', weight: 10 }, 
        { char: 'E', enemyKey: 'RUSTED_SENTINEL', weight: 10 },
        { char: 'E', enemyKey: 'CRYSTAL_LURKER', weight: 10 },
        { char: 'E', enemyKey: 'VOID_SCARRED_SENTINEL', weight: 5 },
        { char: '#', weight: 5 }, { char: 'A', weight: 2 }, { char: 'L', weight: 2 },
        { char: '+', weight: 2 }, { char: '?', weight: 1 }, { char: '!', weight: 1 }, 
        { char: '¶', weight: 1 }, { char: '®', weight: 1 }
    ]
}];
