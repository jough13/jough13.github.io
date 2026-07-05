// --- START OF FILE utils.js ---

// ==========================================
// NETWORK & ASYNC UTILITIES
// ==========================================

window.withTimeout = function(promise, ms = 3000) {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("Network Timeout")), ms);
    });
    // Finally block ensures the timer is destroyed the millisecond the network responds
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};

// Generic Debounce & Throttle
// Essential for limiting API calls, window resizing, or rapid UI button mashing
window.debounce = function(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
};

window.throttle = function(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// ==========================================
// GLOBAL CONFIGURATION
// ==========================================

let TILE_SIZE = 20; // Fixed tile size (prevent them from getting huge)
let VIEWPORT_WIDTH = 40; // Will update on resize
let VIEWPORT_HEIGHT = 25; // Will update on resize

const WORLD_WIDTH = 500;
const WORLD_HEIGHT = 500;
const WORLD_SEED = 'caves-and-castles-v1';

// ==========================================
// UNIVERSAL MATH & RPG TOOLKIT
// ==========================================

// Cached Regex for the dice parser
const DICE_REGEX = /^(\d+)d(\d+)(?:([+-])(\d+))?$/i;

window.MathUtils = {
    // Distance squared is much faster to compute than true distance (no Math.sqrt)
    distSq: (x1, y1, x2, y2) => (x2 - x1) ** 2 + (y2 - y1) ** 2,
    
    // True Euclidean distance
    dist: (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2),
    
    // Manhattan distance (Extremely fast, perfect for grid-based AI pathfinding bounds)
    manhattanDist: (x1, y1, x2, y2) => Math.abs(x1 - x2) + Math.abs(y1 - y2),

    // Returns angle in radians between two points (Essential for particle/projectile rotation)
    angleBetween: (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1),
    
    // Keeps a value within a specified range
    clamp: (val, min, max) => Math.max(min, Math.min(max, val)),
    
    // Smooth linear interpolation for cameras and entity gliding
    lerp: (start, end, amt) => (1 - amt) * start + amt * end,

    // PERFORMANCE & UX WIN: Safely interpolate between two angles (in radians) without doing a 360 spin
    lerpAngle: (start, end, amt) => {
        let diff = end - start;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        return start + diff * amt;
    },

    // Axis-Aligned Bounding Box (AABB)
    // The absolute fastest way to check if a point is within an area of effect!
    inBounds: (x, y, rectX, rectY, rectW, rectH) => {
        return x >= rectX && x <= rectX + rectW && y >= rectY && y <= rectY + rectH;
    },

    // Global Oscillation Helper
    // Returns a smoothly waving value between min and max based on the current time. 
    // Perfect for pulsing lights, hovering items, and breathing UI elements!
    oscillate: (min, max, speed = 1, offset = 0) => {
        const time = (performance.now() / 1000) * speed + offset;
        const range = (max - min) / 2;
        return min + range + Math.sin(time) * range;
    },

    // Animation Easing Curves for UI & Cameras
    smoothstep: (min, max, value) => {
        let x = Math.max(0, Math.min(1, (value - min) / (max - min)));
        return x * x * (3 - 2 * x);
    },
    easeInQuad: (x) => x * x,
    easeOutQuad: (x) => 1 - (1 - x) * (1 - x),
    easeInOutQuad: (x) => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2,
    easeOutCubic: (x) => 1 - Math.pow(1 - x, 3),
    easeOutElastic: (x) => {
        const c4 = (2 * Math.PI) / 3;
        return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
    },
    bounceOut: (x) => {
        const n1 = 7.5625;
        const d1 = 2.75;
        if (x < 1 / d1) { return n1 * x * x; } 
        else if (x < 2 / d1) { return n1 * (x -= 1.5 / d1) * x + 0.75; } 
        else if (x < 2.5 / d1) { return n1 * (x -= 2.25 / d1) * x + 0.9375; } 
        else { return n1 * (x -= 2.625 / d1) * x + 0.984375; }
    },
    
    // Returns a random integer between min and max (inclusive)
    randomInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    
    // QoL WIN: Instantly grab a random item from an array
    randomChoice: (arr) => arr[Math.floor(Math.random() * arr.length)],

    // Non-recursive Gaussian Random
    // Uses the Box-Muller transform but removes the recursive fallback that could theoretically 
    // cause a stack overflow on extreme outliers. Clamps values safely instead!
    randomGaussian: (min, max) => {
        let u = 0, v = 0;
        while(u === 0) u = Math.random(); 
        while(v === 0) v = Math.random();
        let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        num = num / 10.0 + 0.5; // Translate to 0 -> 1
        num = Math.max(0, Math.min(1, num)); // Clamp safely to bounds
        return Math.floor(num * (max - min + 1)) + min;
    },
    
    // Standard RPG Dice Roller (e.g., rollDice(6, 2) rolls 2d6)
    rollDice: (sides, count = 1) => {
        let total = 0;
        for (let i = 0; i < count; i++) {
            total += Math.floor(Math.random() * sides) + 1;
        }
        return total;
    },

    // Parses standard TTRPG strings like "2d6+4"
    rollDiceString: (notation) => {
        const match = notation.match(DICE_REGEX);
        if (!match) return 0;
        
        const count = parseInt(match[1], 10);
        const sides = parseInt(match[2], 10);
        const modifierSign = match[3];
        // BUG FIX: Ensure modifierVal doesn't inject NaNs into combat math
        const modifierVal = parseInt(match[4], 10) || 0;

        let total = window.MathUtils.rollDice(sides, count);
        if (modifierSign === '+') total += modifierVal;
        else if (modifierSign === '-') total -= modifierVal;

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

// ==========================================
// COLOR UTILITIES (For Visual Juice)
// ==========================================

// PERFORMANCE WIN: Cached Regex for V8 speed
const HEX_RGB_REGEX = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;

window.ColorUtils = {
    // BUG FIX & ROBUSTNESS: Handles both 6-char (#FF0000) and 3-char (#F00) hex codes safely
    hexToRgb: (hex) => {
        let h = hex.replace(/^#/, '');
        if (h.length === 3) h = h.split('').map(c => c + c).join(''); // Expand #000 to #000000
        const result = HEX_RGB_REGEX.exec(h);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : {r: 255, g: 255, b: 255};
    },
    
    // Smoothly blends two hex colors based on an amount (0.0 to 1.0)
    lerpHex: (hex1, hex2, amt) => {
        const c1 = window.ColorUtils.hexToRgb(hex1);
        const c2 = window.ColorUtils.hexToRgb(hex2);
        
        const r = Math.round(window.MathUtils.lerp(c1.r, c2.r, amt));
        const g = Math.round(window.MathUtils.lerp(c1.g, c2.g, amt));
        const b = Math.round(window.MathUtils.lerp(c1.b, c2.b, amt));
        
        return `rgb(${r}, ${g}, ${b})`;
    },

    // Takes a hex code and a percentage (-1.0 to 1.0) to lighten or darken it natively
    adjustBrightness: (hex, percent) => {
        let {r, g, b} = window.ColorUtils.hexToRgb(hex);
        
        r = Math.max(0, Math.min(255, Math.floor(r * (1 + percent))));
        g = Math.max(0, Math.min(255, Math.floor(g * (1 + percent))));
        b = Math.max(0, Math.min(255, Math.floor(b * (1 + percent))));
        
        return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
    },

    // Generates an rgba string from a hex code and alpha value
    rgba: (hex, alpha) => {
        const {r, g, b} = window.ColorUtils.hexToRgb(hex);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    },

    // Instantly invert a hex color (Great for "Corrupted" void monsters!)
    invertColor: (hex) => {
        const {r, g, b} = window.ColorUtils.hexToRgb(hex);
        return `#${(1 << 24 | (255 - r) << 16 | (255 - g) << 8 | (255 - b)).toString(16).slice(1)}`;
    },
    
    // Calculate best contrasting text color (black or white) over a dynamic background
    getContrastYIQ: (hex) => {
        const {r, g, b} = window.ColorUtils.hexToRgb(hex);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? '#000000' : '#ffffff';
    }
};

// ==========================================
// CORE PRNG & NOISE LOGIC (DO NOT ALTER MATH)
// ==========================================

// IMPORTANT: Do NOT alter the math in this function! 
// Altering it will change the world seed hash and shift everyone's map!
// Upgraded to a 53-bit safe hash to prevent overflow on massive map coordinates.
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
    let s0 = 0, s1 = 0, s2 = 0, c = 1;
    if (seed == null) seed = +new Date;
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
    p: null,
    init: function (seed) {
        const random = Alea(stringToSeed(seed));
        // PERFORMANCE WIN: TypedArray (Uint8Array) is vastly more memory-efficient 
        // and CPU cache-friendly than a standard JS Array, accelerating map rendering!
        this.p = new Uint8Array(512);
        const p = new Uint8Array(256);
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
        const X = floor(x) & 255, Y = floor(y) & 255, Z = floor(z) & 255;
        x -= floor(x); y -= floor(y); z -= floor(z);
        const u = this.fade(x), v = this.fade(y), w = this.fade(z);
        const A = this.p[X] + Y, AA = this.p[A] + Z, AB = this.p[A + 1] + Z,
              B = this.p[X + 1] + Y, BA = this.p[B] + Z, BB = this.p[B + 1] + Z;
        return this.scale(this.lerp(w, this.lerp(v, this.lerp(u, this.grad(this.p[AA], x, y, z), this.grad(this.p[BA], x - 1, y, z)), this.lerp(u, this.grad(this.p[AB], x, y - 1, z), this.grad(this.p[BB], x - 1, y - 1, z))), this.lerp(v, this.lerp(u, this.grad(this.p[AA + 1], x, y, z - 1), this.grad(this.p[BA + 1], x - 1, y, z - 1)), this.lerp(u, this.grad(this.p[AB + 1], x, y - 1, z - 1), this.grad(this.p[BB + 1], x - 1, y - 1, z - 1)))));
    },
    // Fractional Brownian Motion (fBm)
    // Layers multiple passes of noise to create highly organic, rugged terrain values
    fBm: function(x, y, z = 0, octaves = 4, persistence = 0.5, lacunarity = 2) {
        let total = 0;
        let frequency = 1;
        let amplitude = 1;
        let maxValue = 0; 
        for(let i=0; i < octaves; i++) {
            total += this.noise(x * frequency, y * frequency, z * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= persistence;
            frequency *= lacunarity;
        }
        return total / maxValue;
    },
    fade: t => t * t * t * (t * (t * 6 - 15) + 10),
    lerp: (t, a, b) => a + t * (b - a),
    grad: (hash, x, y, z) => {
        const h = hash & 15;
        const u = h < 8 ? x : y, v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    },
    scale: n => (1 + n) / 2
};

// --- OPTIMIZATION: Cache Emoji Checks ---
const charWidthCache = {};

// Pre-warm the cache using the actual game data dictionaries!
// This ensures the expensive Regex is only run ONCE at startup, not during the render loop.
function preWarmCharCache() {
    const regex = /[\p{Extended_Pictographic}\p{Emoji}\p{Emoji_Component}]/u;
    const charsToCache = new Set();

    // 1. Add standard map ASCII tiles
    const standardTiles = ['.', 'F', 'd', 'D', '^', '~', '≈', '▓', '▒', '🧱', '=', '+', '/', '<', '>', ' ', '•', '▲', '🪜'];
    standardTiles.forEach(c => charsToCache.add(c));

    // 2. Dynamically add all entity/tile keys from data files
    if (typeof window.TILE_DATA !== 'undefined') Object.keys(window.TILE_DATA).forEach(c => charsToCache.add(c));
    if (typeof window.ENEMY_DATA !== 'undefined') Object.keys(window.ENEMY_DATA).forEach(c => charsToCache.add(c));
    if (typeof window.ITEM_DATA !== 'undefined') {
        Object.values(window.ITEM_DATA).forEach(item => {
            if (item.tile) charsToCache.add(item.tile);
            // Also cache the object key just in case the tile property falls back to it
            const key = Object.keys(window.ITEM_DATA).find(k => window.ITEM_DATA[k].name === item.name);
            if (key) charsToCache.add(key);
        });
    }

    // 3. Evaluate and cache them permanently
    charsToCache.forEach(char => {
        if (!char) return;
        
        // Fast rejection for standard ASCII
        if (char.codePointAt(0) < 255) {
            charWidthCache[char] = false;
        } else {
            // Expensive check runs here, exactly once per unique character
            charWidthCache[char] = regex.test(char);
        }
    });
    
    console.log(`%c[AKASHIC ENGINE] Pre-warmed ${Object.keys(charWidthCache).length} map characters.`, "color: #a855f7; font-weight: bold;");
}

// Run the pre-warmer immediately (using a tiny timeout ensures data files are loaded first)
setTimeout(preWarmCharCache, 50);

// The ASCII Fast-Path
// Uses codePointAt to safely handle multi-byte emojis without splitting them
const isWideChar = (char) => {
    if (!char) return false;
    // 1. Instant rejection for standard characters (e.g., '.', '#', 'a', 'W')
    if (char.codePointAt(0) < 255) return false; 
    
    // 2. Cache Lookup
    if (charWidthCache[char] !== undefined) return charWidthCache[char];
    
    // 3. Regex Fallback for un-cached Emojis/Unicode
    const isWide = /[\p{Extended_Pictographic}\p{Emoji}\p{Emoji_Component}]/u.test(char); 
    charWidthCache[char] = isWide;
    return isWide;
};

// ==========================================
// TEXT FORMATTING & SANITIZATION
// ==========================================

const entityMap = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;',
  '"': '&quot;', "'": '&#39;', '/': '&#x2F;',
  '`': '&#x60;', '=': '&#x3D;'
};

function escapeHtml(string) {
  if (string === null || string === undefined) return "";
  // Strip invisible control characters (except space/tab) before escaping HTML
  const noControlChars = String(string).replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  return noControlChars.replace(/[&<>"'`=\/]/g, function (s) {
    return entityMap[s];
  });
}

// Instantly strips {color:text} syntax for clean native browser tooltips
function stripColorTags(str) {
    if (!str) return "";
    return str.replace(/\{[a-z]+:(.*?)\}/ig, '$1');
}

function capitalizeWords(str) {
    if (!str) return "";
    return str.replace(/\b\w/g, char => char.toUpperCase());
}

// Simple singular/plural converter (e.g., pluralize(5, "Arrow") -> "5 Arrows")
window.pluralize = function(count, noun, suffix = 's') {
    return `${count} ${noun}${count !== 1 ? suffix : ''}`;
};

// Oxford Comma list formatter (e.g., ['A', 'B', 'C'] -> "A, B, and C")
window.formatList = function(arr) {
    if (!arr || arr.length === 0) return "";
    if (arr.length === 1) return arr[0];
    if (arr.length === 2) return `${arr[0]} and ${arr[1]}`;
    return `${arr.slice(0, -1).join(', ')}, and ${arr[arr.length - 1]}`;
};

function getOrdinalSuffix(day) {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
        case 1:  return "st";
        case 2:  return "nd";
        case 3:  return "rd";
        default: return "th";
    }
}

// LORE WIN: Convert raw engine time into a beautiful in-universe date string
window.formatWorldTime = function(timeData) {
    if (!timeData) return "Unknown Era";
    
    // Arrays must match the ones defined in script.js constants!
    const DAYS_OF_WEEK = ["Sunsday", "Moonsday", "Kingsday", "Earthday", "Watersday", "Windsday", "Firesday"];
    const MONTHS_OF_YEAR = ["First Seed", "Rains Hand", "Second Seed", "Suns Height", "Last Seed", "Hearthfire", "Frostfall", "Suns Dusk", "Evening Star", "Morning Star", "Suns Dawn", "Deep Winter"];
    const DAYS_IN_MONTH = 30;

    const dayOfWeek = DAYS_OF_WEEK[(timeData.day - 1) % DAYS_OF_WEEK.length];
    const month = MONTHS_OF_YEAR[Math.floor((timeData.day - 1) / DAYS_IN_MONTH) % MONTHS_OF_YEAR.length];
    const dayOfMonth = ((timeData.day - 1) % DAYS_IN_MONTH) + 1;
    const daySuffix = getOrdinalSuffix(dayOfMonth);
    const hour12 = timeData.hour % 12 === 0 ? 12 : timeData.hour % 12;
    const ampm = timeData.hour < 12 ? 'AM' : 'PM';
    const minutePadded = String(timeData.minute).padStart(2, '0');
    
    return `${dayOfWeek}, the ${dayOfMonth}${daySuffix} of ${month}, Year ${timeData.year} ${timeData.era} | ${hour12}:${minutePadded} ${ampm}`;
};

// LORE WIN: Translates clinical 24h time into atmospheric "Times of Day"
window.getLoreTimeOfDay = function(hour) {
    if (hour === 0) return "The Dead of Night";
    if (hour < 3) return "The Deep Dark";
    if (hour === 3) return "The Witching Hour";
    if (hour === 4) return "The False Dawn";
    if (hour === 5) return "The First Light";
    if (hour < 8) return "The Early Morning";
    if (hour < 12) return "The Morning Ascent";
    if (hour === 12) return "High Noon";
    if (hour < 16) return "The Long Afternoon";
    if (hour === 16) return "The Golden Hour";
    if (hour < 19) return "The Deepening Shadows";
    if (hour === 19) return "The Crimson Dusk";
    if (hour < 21) return "The Twilight Hour";
    return "The Star-lit Night";
};

// LORE & UI WIN: Expanded Dictionary for Auto-Tagging
const LORE_KEYWORDS = {
    // Entities & Factions
    'Void': 'void', 'Void Rift': 'void', 'Shadowed Hand': 'purple',
    'Old King': 'gold', 'First King': 'gold', 'Alaric': 'gold',
    'Leviathan': 'blue', 'Kraken': 'red', 'Drake': 'orange',
    'Ogre': 'orange', 'Dire Wolf': 'gray', 'Draugr': 'cyan', 
    'Void Demon': 'void', 'Efreet': 'orange', 'Vampire Lord': 'red',
    
    // Magic & Leylines
    'Leylines': 'blue', 'Waystone': 'blue', 'Akashic': 'blue',
    'Fae': 'green', 'Fairy': 'green', 'Elder Tree': 'green',
    'Arcane Dust': 'purple', 'Enchanting Altar': 'purple',
    'Memory Shard': 'purple', 'Paradox Anomaly': 'gold',
    'Star-Metal': 'cyan', 'Mithril': 'cyan', 'Obsidian': 'gray',
    
    // Mechanics & Tools
    'Dimensional Vault': 'blue', 'Stash Box': 'yellow', 'Fishing Rod': 'cyan',
    'Pickaxe': 'gray', 'Machete': 'gray', 'Heavy Crossbow': 'red',
    
    // Landmarks & Events
    'Grand Fortress': 'red', 'Blood Moon': 'red',
    'Colosseum': 'red', 'Master Blacksmith': 'yellow',
    'Cartographer': 'blue', 'Safe Haven': 'green',
    
    // Special Materials & Valuables
    'Black Pearl': 'purple', 'Dragon Scale': 'red', 'Elemental Core': 'orange'
};

// 🚨 V8 PERFORMANCE WIN: Pre-compile Regexes once at boot instead of on every log message!
const _COMPILED_LORE_REGEXES = Object.entries(LORE_KEYWORDS).map(([keyword, color]) => ({
    rx: new RegExp(`\\b(${keyword}s?)\\b`, 'gi'),
    color
}));

/**
 * LORE WIN: The Auto-Lore Tagger
 * Scans raw text and automatically wraps crucial lore keywords in their appropriate {color:text} syntax.
 * Upgraded to safely support plural words and compile at O(1) speed.
 */
window.autoFormatLore = function(text) {
    if (!text) return "";
    let formatted = text;
    for (let i = 0; i < _COMPILED_LORE_REGEXES.length; i++) {
        const { rx, color } = _COMPILED_LORE_REGEXES[i];
        formatted = formatted.replace(rx, (match, p1, offset, string) => {
            const lookBehind = string.substring(Math.max(0, offset - 10), offset);
            // If it is ALREADY inside a tag (e.g. {red:Kraken}), do not double-wrap it!
            if (lookBehind.includes('{')) return match; 
            return `{${color}:${match}}`;
        });
    }
    return formatted;
};

/**
 * Converts a direction object {x, y} into a readable string.
 * @param {object} dir - An object with x and y properties (-1, 0, or 1)
 * @param {boolean} atmospheric - If true, adds lore-friendly flavor to the cardinal direction
 * @returns {string} A compass direction, e.g., "north-west".
 */
window.getDirectionString = function(dir, atmospheric = false) {
    if (!dir) return 'nearby';

    const { x, y } = dir;
    let baseDir = '';

    if (y === -1) {
        if (x === -1) baseDir = 'north-west';
        else if (x === 0)  baseDir = 'north';
        else if (x === 1)  baseDir = 'north-east';
    } else if (y === 0) {
        if (x === -1) baseDir = 'west';
        else if (x === 1)  baseDir = 'east';
    } else if (y === 1) {
        if (x === -1) baseDir = 'south-west';
        else if (x === 0)  baseDir = 'south';
        else if (x === 1)  baseDir = 'south-east';
    } else {
        return 'nearby';
    }

    // LORE WIN: Atmospheric Directions
    if (atmospheric) {
        if (baseDir.includes('north')) return `the Frozen ${capitalizeWords(baseDir)}`;
        if (baseDir.includes('south')) return `the Scorched ${capitalizeWords(baseDir)}`;
        if (baseDir.includes('east')) return `the Shattered ${capitalizeWords(baseDir)}`;
        if (baseDir.includes('west')) return `the Endless ${capitalizeWords(baseDir)}`;
    }

    return baseDir;
};

/**
 * Calculates relative distance and direction for flavor text.
 * e.g. "a few steps to the North" or "far off to the South-West"
 */
window.getRelativePositionText = function(dx, dy, atmospheric = false) {
    const dist = Math.sqrt(dx * dx + dy * dy);
    let distStr = "nearby";
    if (dist > 15) distStr = "far off towards";
    else if (dist > 5) distStr = "some distance towards";
    else distStr = "a few steps towards";

    const dir = window.getDirectionString({ x: Math.sign(dx), y: Math.sign(dy) }, atmospheric);
    if (dir === 'nearby') return 'right on top of you';
    
    return `${distStr} ${atmospheric ? dir : capitalizeWords(dir)}`;
};

// ==========================================
// DEEP OBJECT MANAGEMENT
// ==========================================

// PERFORMANCE & BUG FIX WIN: High-speed recursive clone. 
// Completely replaces JSON.parse(JSON.stringify()) with a V8-optimized deep copy.
// Uses Object.keys() and pre-allocated Arrays to bypass all prototype chain overhead!
// Now safely supports cloning `Set` and `Map` and `TypedArray` objects without corrupting them!
window.fastClone = function(obj, seen = new WeakMap()) {
    // Base case: null, undefined, strings, numbers, booleans
    if (obj === null || typeof obj !== 'object') return obj;
    
    // Explicit Date support (Prevents dates becoming empty objects)
    if (obj instanceof Date) return new Date(obj.getTime());
    
    // 🔥 DATA CORRUPTION FIX: Explicit TypedArray support 
    // Prevents turning Perlin noise grids or audio buffers into slow, broken dictionaries!
    if (ArrayBuffer.isView(obj)) {
        return new obj.constructor(obj.buffer.slice(0), obj.byteOffset, obj.length);
    }
    
    // ROBUSTNESS WIN: Never attempt to clone DOM Elements or functions that might have snuck into state
    if (typeof HTMLElement !== 'undefined' && obj instanceof HTMLElement) return obj;
    if (typeof obj === 'function') return obj;
    
    // ROBUSTNESS WIN: Circular Reference Protection!
    if (seen.has(obj)) return seen.get(obj);
    
    // Explicit Map and Set support
    if (obj instanceof Set) {
        const clonedSet = new Set();
        seen.set(obj, clonedSet);
        obj.forEach(x => clonedSet.add(window.fastClone(x, seen)));
        return clonedSet;
    }
    if (obj instanceof Map) {
        const clonedMap = new Map();
        seen.set(obj, clonedMap);
        obj.forEach((v, k) => clonedMap.set(k, window.fastClone(v, seen)));
        return clonedMap;
    }
    
    // Fast-path for Arrays
    if (Array.isArray(obj)) {
        const arr = new Array(obj.length);
        seen.set(obj, arr);
        for(let i = 0; i < obj.length; i++) {
            arr[i] = window.fastClone(obj[i], seen);
        }
        return arr;
    }
    
    // Fast-path for standard Objects
    const cloned = {};
    seen.set(obj, cloned);
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        cloned[key] = window.fastClone(obj[key], seen);
    }
    return cloned;
};

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

// Initialize Global Noise Instances
const elevationNoise = Object.create(Perlin);
elevationNoise.init(WORLD_SEED + ':elevation');
const moistureNoise = Object.create(Perlin);
moistureNoise.init(WORLD_SEED + ':moisture');

// --- END OF FILE utils.js ---
