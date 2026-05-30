// --- START OF FILE utils.js ---

let TILE_SIZE = 20; // Fixed tile size (prevent them from getting huge)
let VIEWPORT_WIDTH = 40; // Will update on resize
let VIEWPORT_HEIGHT = 25; // Will update on resize

const WORLD_WIDTH = 500;
const WORLD_HEIGHT = 500;
const WORLD_SEED = 'caves-and-castles-v1';

// --- EXPANDABILITY: Universal Math & RPG Toolkit ---
// Centralizing these prevents rewriting Math.sqrt and Math.random everywhere.
window.MathUtils = {
    // Distance squared is much faster to compute than true distance (no Math.sqrt)
    distSq: (x1, y1, x2, y2) => (x2 - x1) ** 2 + (y2 - y1) ** 2,
    
    // True distance
    dist: (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2),
    
    // Keeps a value within a specified range
    clamp: (val, min, max) => Math.max(min, Math.min(max, val)),
    
    // Smooth linear interpolation for cameras and entity gliding
    lerp: (start, end, amt) => (1 - amt) * start + amt * end,
    
    // Returns a random integer between min and max (inclusive)
    randomInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    
    // Standard RPG Dice Roller (e.g., rollDice(6, 2) rolls 2d6)
    rollDice: (sides, count = 1) => {
        let total = 0;
        for (let i = 0; i < count; i++) {
            total += Math.floor(Math.random() * sides) + 1;
        }
        return total;
    },

    // Formats large numbers for UI (e.g., 1000000 -> "1,000,000")
    formatNum: (num) => new Intl.NumberFormat().format(num),

    // Formats milliseconds into readable time (e.g., "2h 15m" or "45s")
    formatTime: (ms) => {
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
        
        let str = "";
        if (hours > 0) str += `${hours}h `;
        if (minutes > 0) str += `${minutes}m `;
        if (seconds > 0 || str === "") str += `${seconds}s`;
        return str.trim();
    },

    // Fast array shuffler (Fisher-Yates)
    shuffle: (array) => {
        let currentIndex = array.length, randomIndex;
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
    },

    // Weighted Random Picker (Takes an object of { item: weight })
    // Example: { "Sword": 10, "Shield": 50, "Gold": 40 }
    weightedRandom: (choices) => {
        const keys = Object.keys(choices);
        let sum = 0;
        for (let i = 0; i < keys.length; i++) sum += choices[keys[i]];
        
        let rand = Math.random() * sum;
        for (let i = 0; i < keys.length; i++) {
            rand -= choices[keys[i]];
            if (rand <= 0) return keys[i];
        }
        return keys[keys.length - 1]; // Fallback
    }
};

// IMPORTANT: Do NOT alter the math in this function! 
// Altering it will change the world seed hash and shift everyone's map!
// ROBUSTNESS WIN: Upgraded to a 53-bit safe hash to prevent overflow on massive map coordinates.
function stringToSeed(str) {
    let h1 = 0xdeadbeef ^ 0, h2 = 0x41c6ce57 ^ 0;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

// Alea PRNG - Predictable random numbers for procedural generation
function Alea(seed) {
    let s0 = 0,
        s1 = 0,
        s2 = 0,
        c = 1;
    if (seed == null) {
        seed = +new Date;
    }
    s0 = (seed >>> 0) * 0x9e3779b9;
    s1 = (seed >>> 0) * 0x9e3779b9;
    s2 = (seed >>> 0) * 0x9e3779b9;
    for (let i = 0; i < 4; i++) {
        s0 = Math.sin(s0) * 1e9;
        s1 = Math.sin(s1) * 1e9;
        s2 = Math.sin(s2) * 1e9;
    }
    return function () {
        const t = (s0 * 0x9e3779b9 + c * 0x2b759141) | 0;
        c = t < 0 ? 1 : 0;
        s0 = s1;
        s1 = s2;
        s2 = t;
        return (s2 >>> 0) / 0x100000000;
    };
}

const Perlin = {
    p: [],
    init: function (seed) {
        const random = Alea(stringToSeed(seed));
        this.p = new Array(512);
        const p = [];
        for (let i = 0; i < 256; i++) p[i] = i;
        for (let i = 255; i > 0; i--) {
            const n = Math.floor((i + 1) * random());
            const t = p[i];
            p[i] = p[n];
            p[n] = t;
        }
        for (let i = 0; i < 256; i++) {
            this.p[i] = this.p[i + 256] = p[i];
        }
    },
    noise: function (x, y, z = 0) {
        const floor = Math.floor;
        const X = floor(x) & 255,
            Y = floor(y) & 255,
            Z = floor(z) & 255;
        x -= floor(x);
        y -= floor(y);
        z -= floor(z);
        const u = this.fade(x),
            v = this.fade(y),
            w = this.fade(z);
        const A = this.p[X] + Y,
            AA = this.p[A] + Z,
            AB = this.p[A + 1] + Z,
            B = this.p[X + 1] + Y,
            BA = this.p[B] + Z,
            BB = this.p[B + 1] + Z;
        return this.scale(this.lerp(w, this.lerp(v, this.lerp(u, this.grad(this.p[AA], x, y, z), this.grad(this.p[BA], x - 1, y, z)), this.lerp(u, this.grad(this.p[AB], x, y - 1, z), this.grad(this.p[BB], x - 1, y - 1, z))), this.lerp(v, this.lerp(u, this.grad(this.p[AA + 1], x, y, z - 1), this.grad(this.p[BA + 1], x - 1, y, z - 1)), this.lerp(u, this.grad(this.p[AB + 1], x, y - 1, z - 1), this.grad(this.p[BB + 1], x - 1, y - 1, z - 1)))));
    },
    fade: t => t * t * t * (t * (t * 6 - 15) + 10),
    lerp: (t, a, b) => a + t * (b - a),
    grad: (hash, x, y, z) => {
        const h = hash & 15;
        const u = h < 8 ? x : y,
            v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    },
    scale: n => (1 + n) / 2
};

// --- OPTIMIZATION: Cache Emoji Checks ---
const charWidthCache = {};

// PERFORMANCE WIN: Expanded cache from 255 to 2047! 
// This covers Latin Extended, Greek, Cyrillic, and Arabic blocks.
// This ensures the notoriously slow Regex check is NEVER called for standard chat/UI text.
for (let i = 0; i <= 2047; i++) {
    const char = String.fromCharCode(i);
    charWidthCache[char] = false;
}

const isWideChar = (char) => {
    if (charWidthCache[char] !== undefined) return charWidthCache[char];
    
    // ROBUSTNESS: Enhanced Emoji Regex to catch multi-part emojis (e.g., flags, skin tones)
    const isWide = /[\p{Extended_Pictographic}\p{Emoji}\p{Emoji_Component}]/u.test(char); 
    charWidthCache[char] = isWide;
    return isWide;
};

const entityMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

function escapeHtml(string) {
  if (!string) return "";
  return String(string).replace(/[&<>"'`=\/]/g, function (s) {
    return entityMap[s];
  });
}

function getOrdinalSuffix(day) {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
        case 1:  return "st";
        case 2:  return "nd";
        case 3:  return "rd";
        default: return "th";
    }
}

/**
 * Converts a direction object {x, y} into a readable string.
 * @param {object} dir - An object with x and y properties (-1, 0, or 1)
 * @returns {string} A compass direction, e.g., "north-west".
 */
function getDirectionString(dir) {
    if (!dir) return 'nearby';

    const { x, y } = dir;

    if (y === -1) {
        if (x === -1) return 'north-west';
        if (x === 0)  return 'north';
        if (x === 1)  return 'north-east';
    } else if (y === 0) {
        if (x === -1) return 'west';
        if (x === 1)  return 'east';
    } else if (y === 1) {
        if (x === -1) return 'south-west';
        if (x === 0)  return 'south';
        if (x === 1)  return 'south-east';
    }
    return 'nearby'; // Fallback
}

const elevationNoise = Object.create(Perlin);
elevationNoise.init(WORLD_SEED + ':elevation');
const moistureNoise = Object.create(Perlin);
moistureNoise.init(WORLD_SEED + ':moisture');

// Hardware-Accelerated UUIDs
function generateUUID() {
    // Use native cryptography if available (10x faster and cryptographically secure)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
