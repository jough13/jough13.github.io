/* Ensures the browser canvas is dark by default to prevent white flashes */
html {
    background-color: #050510; 
}

:root {
    --bg-color: #050510;
    --panel-bg: #070714; /* Slightly deeper navy-blue tint */
    --border-color: #2a2a45;
    --accent-color: #00E0E0; /* Your existing bright cyan */
    --text-color: #a0a0c0;
    
    /* CHANGED: Replaced standard green with a deep Sci-Fi Teal/Aqua */
    --success: #00AAAA; 
    
    --danger: #FF4444;
    --warning: #FFAA00;
    --item-name-color: #FFFFFF;
    --item-desc-color: #888888;
    --gold-text: #FFD700;
    
    /* --- FONTS --- */
    --main-font: 'Roboto Mono', monospace;  /* Data, Logs, Body */
    --title-font: 'Orbitron', sans-serif;   /* Headers, Titles, HUD labels */

    --z-base: 1;
    --z-ui: 10;
    --z-overlay: 100;
    --z-modal: 500;
    --z-header: 1000;
}

/* ==========================================
   --- HARDCODED COLOR OVERRIDES (Aqua Theme) ---
   ========================================== */

/* Intercepts inline neon-green text from JS and forces it to Aqua */

span[style*="#00FF00"], 
span[style*="#00DD00"],
div[style*="color:#00FF00"],
div[style*="color: #00FF00"] {
    color: var(--accent-color) !important;
}

/* Intercepts inline green backgrounds (like the XP or Cargo bar) */
div[style*="background-color:#00FF00"],
div[style*="background:#00FF00"],
div[style*="background-color: #00FF00"] {
    background-color: var(--accent-color) !important;
    box-shadow: 0 0 5px rgba(0, 224, 224, 0.4) !important;
}

/* Explicitly catch the XP and Cargo bars if they use standard classes */
.bar-fill.xp, 
.bar-fill.cargo { 
    background: var(--accent-color) !important; 
}

/* --- GLOBAL LAYOUT FIXES (No Scrollbars) --- */
html, body {
    margin: 0; padding: 0;
    width: 100%; 
    height: 100%; 
    overflow: hidden; /* FORCE KILL MAIN SCROLLBAR */
    background-color: var(--bg-color);
    font-family: var(--main-font);
}

/* --- WHISPY SIDE BORDERS (Dynamic Positioning) --- */
.side-border {
    position: fixed; /* Changed from absolute to fixed so they ignore container clipping */
    top: 50px;       /* Starts below the Header */
    bottom: 150px;   /* Ends above the Footer */
    width: 2px;
    z-index: 50; 
    pointer-events: none; 
    transition: left 0.5s ease-out, right 0.5s ease-out;
}

/* LEFT BORDER */
.side-border.left {
    /* Calculate the gap: (Screen Width - Game Width) / 4 */
    /* This places the border exactly in the middle of the empty space on the left */
    left: calc((100vw - var(--canvas-width, 100vw)) / 4);
    
    background: linear-gradient(to bottom, 
        transparent 0%, 
        var(--accent-color) 20%, 
        var(--accent-color) 80%, 
        transparent 100%
    );
    opacity: 0.6;
    box-shadow: -2px 0 10px var(--accent-color);
}

/* RIGHT BORDER */
.side-border.right {
    /* Same math, but for the right side */
    right: calc((100vw - var(--canvas-width, 100vw)) / 4);
    
    background: linear-gradient(to bottom, 
        transparent 0%, 
        var(--accent-color) 20%, 
        var(--accent-color) 80%, 
        transparent 100%
    );
    opacity: 0.6;
    box-shadow: 2px 0 10px var(--accent-color);
}

/* Force inputs and buttons to inherit the cool fonts */
button, input, select, textarea {
    font-family: inherit;
}

/* --- TYPOGRAPHY --- */
h1, h2, h3, .game-title, .sector-title, .sys-header, .planet-title, .label {
    font-family: var(--title-font);
    text-transform: uppercase;
    letter-spacing: 2px;
}

/* --- LAYOUT GRID --- */
#app-container {
    display: grid;
    grid-template-rows: 50px 1fr 150px; /* Header | Map | Footer */
    height: 100%; /* Changed from 100vh */
    width: 100%;  /* Changed from 100vw to prevent horizontal overflow */
    overflow: hidden;
}

/* --- TOP HUD --- */
#top-hud {
    background-color: var(--panel-bg);
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    position: relative;
    align-items: center;
    padding: 0 15px;
    z-index: 150;
}

.hud-group { display: flex; align-items: center; gap: 15px; }

.hud-stat { display: flex; flex-direction: column; width: 80px; }
.hud-stat.compact { width: auto; text-align: right; }

.label { 
    font-size: 11px; 
    color: #777; 
    font-weight: bold; 
    letter-spacing: 1px;
}

.value-text { 
    font-size: 14px; 
    color: var(--accent-color); 
    font-weight: bold;
}

.gold { color: #FFD700; }

.bar-container {
    height: 6px;
    background: #222;
    border: 1px solid #444;
    width: 100%;
    margin-top: 2px;
}
.bar-fill { 
    height: 100%; 
    /* Cubic Bezier for satisfying, weighty bar movement */
    transition: width 0.4s cubic-bezier(0.25, 1, 0.5, 1); 
}
.bar-fill.hull { background: var(--danger); }
.bar-fill.shield { background: var(--accent-color); }
.bar-fill.fuel { background: var(--warning); }

.sector-title { 
    font-size: 20px; 
    font-weight: bold; 
    color: #FFF; 
    text-shadow: 0 0 5px var(--accent-color); 
}
.coords { 
    font-size: 14px; 
    color: #888; 
    margin-left: 10px; 
    font-family: var(--main-font);
}

.icon-btn {
    background: transparent; border: 1px solid var(--border-color);
    color: var(--accent-color); padding: 5px 10px; cursor: pointer;
    font-size: 12px;
}
.icon-btn:hover { background: var(--accent-color); color: #000; }

/* --- SYSTEM MENU --- */
/* Style the Stats block to obey themes */
#sys-stats-display {
    font-size: 13px;
    /* !important overrides the inline HTML style 'color: #88a' */
    color: var(--text-color) !important; 
    margin-bottom: 10px; 
    padding-bottom: 10px; 
    /* !important overrides the inline HTML style 'border-bottom: ...' */
    border-bottom: 1px solid var(--border-color) !important; 
}

/* Style the Version Info at the bottom */
#versionInfo {
    margin-top: 15px;
    padding-top: 10px;
    border-top: 1px solid var(--border-color);
    font-size: 10px;
    text-align: center;
    /* Use accent color so it pops, or text-color for subtle */
    color: var(--accent-color); 
    opacity: 0.8;
    font-family: var(--title-font);
}
#systemMenu {
    position: absolute; top: 50px; right: 0;
    background: var(--panel-bg); border: 1px solid var(--border-color);
    padding: 10px; display: flex; flex-direction: column; gap: 5px;
    z-index: 9999;
    width: 200px;
    box-shadow: -5px 5px 20px rgba(0,0,0,0.5); /* Add shadow to separate from map */
}

#systemMenu.hidden { display: none; }

/* --- SYSTEM MAP GRID FIX --- */
.system-planet-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    justify-content: center;
    align-items: stretch;
    
    /* CRITICAL FIX: Constrain width to match the Game Canvas */
    width: 100%;
    max-width: var(--canvas-width, 1024px); 
    
    /* Center the grid horizontally */
    margin: 0 auto; 
    
    /* Add breathing room so it doesn't touch the exact edge of the borders */
    padding: 0 10px; 
    box-sizing: border-box;
}

.sys-header {
    font-size: 12px; 
    /* Use variables so it swaps between Light/Dark mode automatically */
    color: var(--accent-color); 
    border-bottom: 1px solid var(--border-color); 
    
    margin-bottom: 5px; 
    padding-bottom: 5px;
    font-weight: bold;
    letter-spacing: 1px;
}

.sys-btn { 
    background: #222; color: #888; border: none; 
    padding: 12px; cursor: pointer; font-size: 14px; 
    font-family: var(--title-font);
}
.sys-btn:hover { background: #333; color: #FFF; }

/* --- MAIN VIEWPORT --- */
#main-view {
    position: relative;
    background: #000;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
}

#gameCanvas {
    max-width: 100%; max-height: 100%;
    object-fit: contain;
    image-rendering: pixelated;
    box-shadow: 0 0 20px rgba(0,0,0,0.5);
}

.view-panel {
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    background: var(--panel-bg);
    padding: 20px;
    display: none; /* Toggled by JS */
    overflow-y: auto;
}

/* --- BOTTOM DECK --- */
#bottom-deck {
    background-color: var(--panel-bg);
    border-top: 1px solid var(--border-color);
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    padding: 10px;
}

/* Log Panel - Terminal Style */
.log-panel {
    background: #000;
    border: 1px solid #333;
    padding: 10px;
    font-size: 15px;
    line-height: 1.6;
    font-family: var(--main-font);
    
    /* CHANGED: Replaced #00FF00 green with your Aqua accent color */
    color: var(--accent-color); 
    text-shadow: 0 0 2px rgba(0, 224, 224, 0.4); /* Subtle terminal screen glow */
    
    overflow-y: auto;
    height: 100%;
    opacity: 0.95;
}

#context-panel {
    display: flex; flex-direction: column; gap: 5px;
}

.mission-box {
    border: 1px solid var(--border-color);
    padding: 5px;
    display: flex; justify-content: space-between;
}
#mission-tracker .value { font-size: 14px; }

.action-row {
    display: flex; flex-wrap: wrap; gap: 5px;
}

.control-button {
    flex: 1;
    background: #222; border: 1px solid var(--border-color);
    color: var(--accent-color); padding: 12px;
    font-size: 14px; cursor: pointer;
    font-family: var(--title-font);
    font-weight: bold;
}
.control-button:hover { background: var(--accent-color); color: #000; }

/* --- COMBAT VIEW --- */
.combatants-wrapper { display: flex; justify-content: space-around; padding-top: 20px; }
.combatant-panel { width: 40%; text-align: center; }
.combat-actions { 
    display: grid; grid-template-columns: 1fr 1fr; gap: 10px; 
    margin-top: 20px; padding: 20px; padding-bottom: 50px;
}
.combat-action-btn { 
    padding: 15px; font-size: 14px; 
    background: #330000; border: 1px solid #FF5555; color: #FF5555; 
    cursor: pointer; font-family: var(--title-font);
}
.combat-action-btn:hover { background: #FF5555; color: #000; }

/* --- NEXUS / ANIMATIONS --- */
@keyframes pulse-cyan { 
    0% { opacity: 1; text-shadow: 0 0 8px #40E0D0, 0 0 15px #20C0B0; transform: scale(1); } 
    50% { opacity: 0.8; text-shadow: 0 0 20px #40E0D0, 0 0 30px #FFFFFF; transform: scale(1.1); } 
    100% { opacity: 1; text-shadow: 0 0 8px #40E0D0, 0 0 15px #20C0B0; transform: scale(1); } 
}

.nexus-char { 
    color: #40E0D0; 
    font-weight: bold; 
    animation: pulse-cyan 2s infinite ease-in-out; 
    position: relative; 
    z-index: 5; 
}

/* --- CRT Scanline Effect (Subtle Modern Version) --- */
.crt::before {
    content: " "; display: block; position: absolute;
    top: 0; left: 0; bottom: 0; right: 0;
    /* Opacity reduced to 0.025 (2.5%) for barely-there texture */
    background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.015) 50%), 
                linear-gradient(90deg, rgba(255, 0, 0, 0.01), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.01));
    z-index: 999; background-size: 100% 2px, 3px 100%; pointer-events: none;
}

/* --- TITLE SCREEN --- */
#titleOverlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: var(--bg-color); z-index: 2000;
    display: flex; justify-content: center; align-items: center;
}
#titleContainer { text-align: center; width: 400px; }

.game-title { 
    font-family: var(--title-font);
    font-weight: 900; 
    font-size: 48px;  
    color: var(--accent-color); 
    margin: 0; 
    text-shadow: 0 0 15px var(--accent-color), 0 0 30px rgba(0, 224, 224, 0.4);
}
.subtitle { color: #666; margin-bottom: 30px; letter-spacing: 3px; }
.seed-input { width: 100%; padding: 10px; margin: 10px 0; background: #000; border: 1px solid #444; color: #FFF; text-align: center; }
.title-button { width: 100%; padding: 15px; background: var(--accent-color); border: none; font-weight: bold; cursor: pointer; margin-top: 10px; font-family: var(--title-font); }
.title-button:hover { background: #FFF; }
.player-customization { margin-bottom: 20px; }
.pfp-selector { display: flex; justify-content: center; align-items: center; gap: 10px; margin-bottom: 10px; }
#pfpImage { width: 64px; height: 64px; border-radius: 50%; border: 2px solid var(--accent-color); }
.pfp-arrow-btn { background: none; border: none; color: #FFF; font-size: 20px; cursor: pointer; }

/* --- SCI-FI BUTTONS & PLANET VIEW --- */
.action-button {
    background: rgba(0, 20, 20, 0.9);
    border: 1px solid var(--accent-color);
    color: var(--accent-color);
    padding: 12px 20px;
    font-family: var(--title-font);
    font-size: 14px;
    font-weight: bold;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 100%; 
    margin-bottom: 10px;
    box-shadow: 0 0 5px rgba(0, 224, 224, 0.2);
    display: flex; justify-content: center; align-items: center;
}
.action-button:hover:not(:disabled) {
    background: var(--accent-color);
    color: #000;
    box-shadow: 0 0 15px var(--accent-color);
}
.action-button:disabled {
    border-color: #444;
    color: #666;
    background: rgba(10, 10, 10, 0.8);
    cursor: not-allowed;
    box-shadow: none;
}

/* Planet View Container */
.planet-view-content {
    max-width: 600px;
    margin: 40px auto;
    padding: 30px;
    background: rgba(11, 11, 24, 0.95);
    border: 1px solid var(--border-color);
    border-left: 4px solid var(--accent-color);
    box-shadow: 0 0 30px rgba(0,0,0,0.8);
    display: flex; flex-direction: column; align-items: center; text-align: center;
}

.planet-header {
    margin-bottom: 30px;
    border-bottom: 1px solid #333;
    padding-bottom: 20px;
    width: 100%;
}

/* Large Planet Image (Detail View) */
.planet-large-img {
    width: 128px; height: 128px;
    image-rendering: pixelated;
    border: 2px solid #333; border-radius: 50%;
    margin-bottom: 15px; background: #000;
}

.planet-title {
    font-size: 24px;
    color: #FFF;
    text-shadow: 0 0 10px var(--accent-color);
    margin: 0 0 10px 0;
}

.planet-desc {
    color: #aaa;
    font-size: 16px; 
    line-height: 1.6;
    max-width: 500px;
    margin: 0 auto;
}

/* Action Grid */
.planet-actions-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    width: 100%;
    margin-top: 20px;
}

.full-width-btn {
    grid-column: span 2;
    margin-top: 10px;
    border-color: #FFaa00;
    color: #FFaa00;
}
.full-width-btn:hover {
    background: #FFaa00;
    color: #000;
    box-shadow: 0 0 15px #FFaa00;
}

/* --- SYSTEM MAP ICONS --- */
/* Fixes skewed planet images in the grid */
.planet-icon-img {
    width: 80px;            
    height: 80px;           
    object-fit: contain;    
    image-rendering: pixelated; 
    margin: 10px auto;      
    display: block;         
    background-color: #000; 
    border: 1px solid #333; 
    border-radius: 4px;     
}

/* --- CODEX --- */
#codexOverlay {
    position: absolute; top: 20px; bottom: 20px; left: 20px; right: 20px;
    background: rgba(10, 15, 20, 0.95);
    border: 1px solid var(--accent-color);
    display: none; flex-direction: column;
    z-index: 500;
}
.codex-header {
    background: #002222; color: var(--accent-color);
    padding: 10px; display: flex; justify-content: space-between; font-weight: bold;
}
#codexContent { display: flex; flex: 1; overflow: hidden; }
#codexCategories { width: 200px; border-right: 1px solid #333; overflow-y: auto; padding: 10px; }
#codexEntries { width: 250px; border-right: 1px solid #333; overflow-y: auto; padding: 10px; }
#codexEntryText { 
    flex: 1; padding: 20px; overflow-y: auto; 
    line-height: 1.6; font-size: 15px; 
}
.codex-list-item { padding: 8px; cursor: pointer; color: #888; }
.codex-list-item:hover { color: #FFF; background: #222; }
.codex-list-item.active { color: var(--accent-color); background: #111; border-left: 2px solid var(--accent-color); }

/* --- ULTRA-MINIMAL SCROLLBARS (For inner panels only) --- */
::-webkit-scrollbar { 
    width: 4px; /* Very thin */
    height: 4px; /* Thin for horizontal too */
} 

::-webkit-scrollbar-track { 
    background: transparent; /* Invisible track */
}

::-webkit-scrollbar-thumb { 
    background: rgba(0, 224, 224, 0.2); /* Almost invisible normally */
    border-radius: 2px;
}

::-webkit-scrollbar-thumb:hover { 
    background: var(--accent-color); /* Lights up when you grab it */
    box-shadow: 0 0 5px var(--accent-color);
}

/* --- TRADE MODAL STYLES (Responsive Fix) --- */

#tradeOverlay, #cargoOverlay, #stationOverlay, #genericModalOverlay, #derelictOverlay, #xerxesOverlay {

    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.85); 
    z-index: 2000; 
    display: flex; justify-content: center; align-items: center;
    padding: 10px;
}

.trade-window {
    width: 95%; max-width: 700px; /* Responsive width */
    height: auto; max-height: 90vh; /* Never taller than 90% of screen */
    background: var(--panel-bg);
    border: 1px solid var(--accent-color);
    box-shadow: 0 0 20px rgba(0, 224, 224, 0.2);
    display: flex; flex-direction: column;
}

.trade-header {
    background: rgba(0, 20, 20, 0.9);
    padding: 15px;
    border-bottom: 1px solid var(--border-color);
    display: flex; justify-content: space-between; align-items: center;
    font-family: var(--title-font); font-size: 16px; color: #FFF;
    flex-shrink: 0; /* Header never shrinks */
}

.trade-body {
    display: flex; 
    flex: 1; 
    overflow: hidden; /* Contains the scroll areas */
    min-height: 0; /* Critical for Flexbox scrolling */
}

/* Left List */
.trade-list-container {
    width: 50%;
    border-right: 1px solid var(--border-color);
    overflow-y: auto; /* Scrolls independently */
    padding: 10px;
}

.trade-item-row {
    padding: 12px;
    border-bottom: 1px solid #333;
    cursor: pointer;
    display: flex; justify-content: space-between;
    font-size: 13px; /* Slightly smaller for compact screens */
    transition: background 0.2s;
}
.trade-item-row:hover { background: rgba(255, 255, 255, 0.05); }
.trade-item-row.selected {
    background: rgba(0, 224, 224, 0.15);
    border-left: 3px solid var(--accent-color);
    color: #FFF;
}

/* Right Panel */
.trade-panel-right {
    width: 50%;
    padding: 15px;
    display: flex; flex-direction: column;
    overflow-y: auto; /* Allow right side to scroll if screen is very short */
}

#tradeItemName {
    color: var(--accent-color);
    font-size: 18px; margin-bottom: 5px;
    text-transform: uppercase;
}

.trade-math-area {
    margin: 10px 0;
    padding: 10px;
    background: #000;
    border: 1px solid #333;
}

.trade-stat-row {
    display: flex; justify-content: space-between;
    margin-bottom: 5px; font-size: 13px; color: #888;
}

/* Controls */
.qty-control-row {
    display: flex; gap: 5px; margin-bottom: 15px;
    justify-content: center;
}

#tradeQtyInput {
    background: #000; border: 1px solid var(--accent-color);
    color: #FFF; width: 50px; text-align: center;
    font-size: 16px; font-weight: bold;
}

.qty-btn {
    background: #222; border: 1px solid #444; color: #FFF;
    width: 30px; cursor: pointer; font-weight: bold;
}
.qty-btn:hover { background: var(--accent-color); color: #000; }
.max-btn { width: auto; padding: 0 10px; font-size: 12px; }

.total-cost-display {
    font-size: 16px; text-align: right; margin-bottom: 15px;
    color: #FFF; font-weight: bold; border-top: 1px solid #444; padding-top: 10px;
}

/* Button Group at bottom of modal */
.trade-btn-group {
    display: flex; flex-direction: column; gap: 10px;
    margin-top: auto; /* Push to bottom */
}

/* --- SAVE GAME SELECTION STYLES --- */
.save-list-header {
    color: var(--accent-color);
    font-family: var(--title-font);
    font-size: 14px;
    margin-bottom: 10px;
    letter-spacing: 2px;
    text-align: left;
    border-bottom: 1px solid #333;
    padding-bottom: 5px;
}

.save-slot-card {
    background: #111;
    border: 1px solid #333;
    padding: 15px;
    margin-bottom: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    transition: all 0.2s;
}

.save-slot-card:hover {
    border-color: var(--accent-color);
    background: #151520;
}

.save-info {
    text-align: left;
}

.save-name {
    color: #FFF;
    font-weight: bold;
    font-size: 16px;
    font-family: var(--title-font);
}

.save-meta {
    color: #888;
    font-size: 12px;
    margin-top: 4px;
}

.save-type-badge {
    font-size: 10px;
    background: #222;
    padding: 2px 6px;
    border-radius: 4px;
    color: #AAA;
    margin-left: 8px;
    text-transform: uppercase;
}

.auto-badge { color: #FFaa00; border: 1px solid #553300; }

.small-btn {
    padding: 10px;
    font-size: 12px;
    width: auto;
    display: inline-block;
    margin-right: 10px;
}

.title-controls {
    margin-top: 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

/* --- CUSTOM CHECKBOX --- */
.checkbox-container {
    display: block;
    position: relative;
    padding-left: 30px;
    margin-bottom: 12px;
    cursor: pointer;
    font-size: 14px;
    color: #888;
    user-select: none;
}

.checkbox-container input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;
}

.checkmark {
    position: absolute;
    top: 0;
    left: 0;
    height: 20px;
    width: 20px;
    background-color: #111;
    border: 1px solid #444;
}

.checkbox-container:hover input ~ .checkmark {
    background-color: #222;
    border-color: var(--accent-color);
}

.checkbox-container input:checked ~ .checkmark {
    background-color: var(--accent-color);
}

.checkmark:after {
    content: "";
    position: absolute;
    display: none;
}

.checkbox-container input:checked ~ .checkmark:after {
    display: block;
}

.checkbox-container .checkmark:after {
    left: 6px;
    top: 2px;
    width: 5px;
    height: 10px;
    border: solid #000;
    border-width: 0 3px 3px 0;
    transform: rotate(45deg);
}

/* --- SAVE GAME PFP UPDATES --- */

.save-slot-card {
    /* Update existing .save-slot-card to this: */
    background: #111;
    border: 1px solid #333;
    padding: 10px; /* Slightly less padding to fit image */
    margin-bottom: 10px;
    display: flex;
    align-items: center; /* Vertically center everything */
    gap: 15px; /* Space between Image, Text, and Arrow */
    cursor: pointer;
    transition: all 0.2s;
}

.save-pfp-icon {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: 2px solid var(--accent-color);
    background: #000;
    object-fit: cover;
    image-rendering: pixelated;
    flex-shrink: 0; /* Don't shrink if text is long */
}

.save-info {
    text-align: left;
    flex-grow: 1; /* This pushes the arrow to the far right */
}

.save-arrow {
    font-size: 20px; 
    color: #555;
    padding-right: 10px;
}

#closeTradeBtn, #closeCargoBtn {
    z-index: 10;
    position: relative;
    cursor: pointer;
}

/* --- COMBAT VIEW UPDATES --- */

/* Fixes the giant image issue */
.combatant-icon {
    width: 100px;           /* Constrain width */
    height: 100px;          /* Constrain height */
    object-fit: cover;      /* Crop to fit square without squishing */
    border: 2px solid var(--accent-color);
    border-radius: 8px;     /* Rounded corners */
    background: #000;
    display: block;         /* Force it to own line */
    margin: 0 auto 10px auto; /* Center it */
    image-rendering: pixelated; /* Keep pixel art crisp */
}

/* Fix alignment of the Name Text (e.g. "Captain") */
.combatant-panel h3 {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    margin-top: 0;
}

/* Style the Ship Class text (e.g. "Light Freighter") */
.ship-class-label {
    color: #666;
    font-size: 12px;
    margin-bottom: 15px;
    text-transform: uppercase;
    letter-spacing: 1px;
}

/* Better spacing for the health bars */
.stat-bar-label {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: #888;
    margin-top: 8px;
    margin-bottom: 2px;
}

/* Ensure the combat header is scary enough */
.combat-header {
    text-align: center;
    color: var(--danger);
    font-size: 24px;
    font-weight: 900;
    margin-bottom: 20px;
    text-shadow: 0 0 10px rgba(255, 68, 68, 0.4);
    font-family: var(--title-font);
    border-bottom: 1px solid #442222;
    padding-bottom: 10px;
}

/* Add specific colors for Pirate/Enemy bars */
.pirate-hull-bar-fill {
    background-color: var(--danger); /* Red for enemies */
    height: 100%;
}

/* --- DELETE SAVE BUTTON STYLES --- */

/* Update the card layout to handle the new button */
.save-slot-card {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    /* Ensure the card doesn't accidentally trigger load when clicking delete */
    cursor: default; 
}

/* The clickable area for loading the game */
.save-card-content {
    flex-grow: 1;
    display: flex;
    align-items: center;
    gap: 15px;
    cursor: pointer;
    padding: 5px;
    border-radius: 4px;
    transition: background 0.2s;
}

.save-card-content:hover {
    background: rgba(0, 224, 224, 0.1);
}

/* The Delete Button */
.save-delete-btn {
    background: transparent;
    border: 1px solid #FF4444; /* Danger Red */
    color: #FF4444;
    width: 32px;
    height: 32px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    font-family: var(--main-font);
    z-index: 10;
}

.save-delete-btn:hover {
    background: #FF4444;
    color: #000;
    box-shadow: 0 0 10px #FF4444;
}

/* --- CUSTOM CONFIRMATION MODAL --- */
#confirmationOverlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.9); /* Darker backdrop */
    z-index: 3000; /* Topmost layer */
    display: flex;
    justify-content: center;
    align-items: center;
}

.confirm-window {
    width: 400px;
    background: #0b0b18;
    border: 2px solid var(--danger); /* Red border for danger */
    box-shadow: 0 0 30px rgba(255, 68, 68, 0.3);
    font-family: var(--main-font);
}

.confirm-header {
    background: var(--danger);
    color: #000;
    font-weight: 900;
    padding: 15px;
    text-align: center;
    font-family: var(--title-font);
    letter-spacing: 2px;
}

.confirm-body {
    padding: 20px;
    text-align: center;
    color: #FFF;
}

.confirm-body p {
    margin-bottom: 25px;
    font-size: 16px;
    line-height: 1.5;
}

.confirm-actions {
    display: flex;
    gap: 15px;
    justify-content: center;
}

/* Special Danger Button Style */
.danger-btn {
    border-color: var(--danger);
    color: var(--danger);
}

.danger-btn:hover {
    background: var(--danger);
    color: #000;
    box-shadow: 0 0 15px var(--danger);
}

/* --- TOAST NOTIFICATIONS --- */
#toastContainer {
    position: fixed;
    top: 80px; /* Below the top HUD */
    right: 20px;
    z-index: 4000; /* Above everything */
    display: flex;
    flex-direction: column;
    gap: 10px;
    pointer-events: none; /* Let mouse clicks pass through the container */
}

.toast {
    background: rgba(10, 15, 20, 0.95);
    border: 1px solid var(--accent-color);
    border-left: 5px solid var(--accent-color);
    color: #fff;
    padding: 15px 20px;
    min-width: 300px;
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.8);
    font-family: var(--title-font);
    font-size: 14px;
    
    /* Animation Start State */
    opacity: 0;
    transform: translateX(50px);
    transition: all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55); /* Bouncy sci-fi effect */
    pointer-events: auto; 
}

.toast.show {
    opacity: 1;
    transform: translateX(0);
}

.toast.success { 
    border-color: var(--success); 
    border-left-color: var(--success);
    color: var(--success);
    box-shadow: 0 0 10px rgba(0, 255, 0, 0.2);
}

.toast.error { 
    border-color: var(--danger); 
    border-left-color: var(--danger);
    color: var(--danger);
    box-shadow: 0 0 10px rgba(255, 68, 68, 0.2);
}

/* --- CANTINA / RUMOR STYLES --- */
.rumor-text {
    color: #e0aaff; /* Light purple for gossip */
    font-style: italic;
    border-left: 2px solid #e0aaff;
    padding-left: 10px;
    margin: 5px 0;
    display: block;
    background: rgba(224, 170, 255, 0.05);
}

.cantina-header {
    color: #ffaa00; /* Amber for the bar feel */
    font-weight: bold;
}

/* --- MOBILE CONTROLS & RESPONSIVENESS --- */

/* 1. Virtual D-Pad (Hidden on Desktop) */
#mobileControls {
    display: none; /* Hide by default */
    position: absolute;
    bottom: 20px;
    left: 20px;
    z-index: 50;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    opacity: 0.8;
}

.dpad-row { display: flex; gap: 5px; }

.dpad-btn {
    width: 50px;
    height: 50px;
    background: rgba(0, 20, 20, 0.9);
    border: 1px solid var(--accent-color);
    color: var(--accent-color);
    border-radius: 8px;
    font-size: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    user-select: none; /* Prevent text highlighting */
    touch-action: manipulation; /* Improve touch response */
}

.dpad-btn:active {
    background: var(--accent-color);
    color: #000;
}
/* --- UNIFIED MOBILE OPTIMIZATIONS --- */
@media (max-width: 768px) {
    /* 1. Dynamic Viewport Fix */
    /* Uses 'dvh' instead of 'vh' so the browser's URL bar doesn't cover your buttons */
    #app-container {
        display: flex;
        flex-direction: column;
        height: 100dvh; 
        width: 100%;
        overflow: hidden;
    }

    /* 2. Map Area takes remaining space */
    #main-view {
        flex-grow: 1;
        align-items: center; 
        padding: 0;
        background: #050510;
    }

    #gameCanvas {
        width: 98vw;
        height: auto;
        max-height: 50dvh; /* Prevent the map from crushing the UI below it */
    }

    /* 3. Footer Layout Fix (Actions ABOVE Log) */
    #bottom-deck {
        display: flex;
        flex-direction: column;
        padding: 5px 10px;
        gap: 5px;
        flex-shrink: 0;
    }

    #context-panel {
        order: -1; /* MAGIC TRICK: This forces the Action Buttons to render ABOVE the text log! */
    }

    .log-panel {
        height: 80px; 
        font-size: 11px;
        padding: 5px;
    }

/* 4. Tame the D-Pad */
    #mobileControls {
        display: flex !important;
        bottom: 20px; /* Moved up slightly to avoid bottom bezel */
        left: 20px;
        right: auto; 
        transform: scale(1.0); /* Made slightly larger for thumbs */
        transform-origin: bottom left;
        opacity: 0.8; 
    }

    /* 5. Header squish fixes */
    #top-hud { padding: 0 5px; font-size: 10px; }
    .hud-group { gap: 5px; }
    .label { display: none; } /* Hide words like 'HULL' to save horizontal space */
    .bar-container { width: 35px; }
    .sector-title { font-size: 12px; }
    .coords { font-size: 10px; margin-left: 5px; }
    
    /* 6. Modals Full Width */
    .trade-window, .confirm-window { width: 95%; max-height: 90dvh; }
    .combatants-wrapper { gap: 5px; }
    .combatant-icon { width: 60px; height: 60px; }

    /* 7. Trade & Inventory Windows (Fix the 50/50 Squish) */
    .trade-body {
        flex-direction: column; /* Stack the list on top of the details */
    }
    .trade-list-container {
        width: 100%;
        height: 50%; /* Top half is the scrolling list */
        border-right: none;
        border-bottom: 2px solid var(--border-color);
    }
    .trade-panel-right {
        width: 100%;
        height: 50%; /* Bottom half is the buy/sell controls */
        overflow-y: auto;
    }

    /* 8. Planet Action Grid Stack */
    .planet-actions-grid {
        grid-template-columns: 1fr; /* Stack buttons full-width on phones */
    }
    .full-width-btn {
        grid-column: span 1; /* Reset span so it doesn't break the 1-column grid */
    }

    /* 9. Fat-Finger Touch Target Fixes */
    .trade-item-row, .codex-list-item {
        padding: 16px 12px; /* Boosted vertical padding for easier screen-tapping */
        font-size: 14px; 
    }

    /* 10. System Header Text Wrap */
    .sys-meta-row {
        flex-wrap: wrap; /* Prevents coordinates/stats from running off the right edge */
        gap: 10px;
    }
}

/* --- CRITICAL STATUS OVERLAYS --- */
.status-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    pointer-events: none; z-index: 1000;
    opacity: 0; transition: opacity 0.5s;
}

.critical-fuel {
    box-shadow: inset 0 0 50px rgba(255, 165, 0, 0.6); /* Orange Glow */
    animation: pulse-warning 2s infinite;
}

.critical-hull {
    box-shadow: inset 0 0 50px rgba(255, 0, 0, 0.6); /* Red Glow */
    animation: pulse-warning 1s infinite;
}

@keyframes pulse-warning {
    0% { opacity: 0.3; }
    50% { opacity: 0.8; }
    100% { opacity: 0.3; }
}

/* --- LIGHT MODE OVERRIDES (Pure White Paper Theme) --- */
body.light-mode {
    /* The Palette - Absolute White */
    --bg-color: #FFFFFF;      
    --panel-bg: #FFFFFF;      
    --border-color: #E0E0E0;  
    --accent-color: #007777;  
    --text-color: #111111;    
    
    /* Status Colors */
    --success: #008800;
    --danger: #CC0000;
    --warning: #D35400;
    
    --item-name-color: #111111; /* Pure Black */
    --item-desc-color: #555555; /* Dark Grey */
    --gold-text: #B35900;       /* Dark Amber (High Contrast) */
}

body.light-mode #app-container,
body.light-mode #main-view,
body.light-mode footer,
body.light-mode .panel {
    background-color: #FFFFFF !important;
    color: #111111 !important;
    border-color: #E0E0E0 !important;
}

body.light-mode #game-log {
    background-color: #F9F9F9; /* Very slight off-white for the log */
    color: #111111;
}

/* 1. Main Backgrounds */
body.light-mode #main-view {
    background-color: #FFFFFF !important; /* Force Pure White */
    border: none; /* Remove any potential border shadows */
}
body.light-mode #titleOverlay, 
body.light-mode .trade-window,
body.light-mode .confirm-window,
body.light-mode #codexOverlay {
    background-color: #FFFFFF; /* No more grey! */
}

/* 2. The Log Panel */
body.light-mode .log-panel {
    background: #FFFFFF;
    color: #000000;
    border-color: #EEE;
    box-shadow: none; /* Flatten the look */
}

/* --- TEXT READABILITY FIXES (The "Blue Text" Fix) --- */
/* This forces any Light Blue or Cyan text in the logs to match the Dark Teal scrollbar */
body.light-mode .log-panel span[style*="#A2D2FF"],
body.light-mode .log-panel span[style*="#a2d2ff"], 
body.light-mode .log-panel span[style*="#00E0E0"],
body.light-mode .log-panel span[style*="#00e0e0"],
body.light-mode .log-panel span[style*="#88CCFF"],
body.light-mode .log-panel span[style*="#40E0D0"] {
    color: var(--accent-color) !important; 
    font-weight: 800; /* Extra bold for readability */
}

/* Fix "Yellow/Gold" text to be readable Orange/Brown */
body.light-mode .log-panel span[style*="#FFFF00"],
body.light-mode .log-panel span[style*="#FFD700"] {
    color: #B35900 !important;
}

/* Fix "Bright Green" text to be Forest Green */
body.light-mode .log-panel span[style*="#00FF00"],
body.light-mode .log-panel span[style*="#00DD00"] {
    color: #007700 !important;
}

/* 3. Buttons */
body.light-mode .action-button, 
body.light-mode .sys-btn, 
body.light-mode .control-button,
body.light-mode .title-button {
    background: #FFFFFF; 
    color: #333;      
    border: 1px solid #CCC;
    box-shadow: 0 2px 0 #EEE;
}

body.light-mode .action-button:hover:not(:disabled) {
    background: #F9F9F9;
    border-color: var(--accent-color);
    color: var(--accent-color);
}

/* 4. Save Slots (Clean White Cards) */
body.light-mode .save-slot-card {
    background: #FFFFFF;
    border: 1px solid #DDD;
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}
body.light-mode .save-name { color: #000; }
body.light-mode .save-meta { color: #555; }

/* 5. Inputs */
body.light-mode .seed-input {
    background: #FFF;
    color: #000;
    border: 1px solid #CCC;
}

/* 6. Scrollbars */
body.light-mode ::-webkit-scrollbar-track {
    background: #FFFFFF;
}

/* --- LIGHT MODE: TITLE SCREEN & SAVE MENU FIXES --- */

/* 1. Ensure the overlay background matches the theme */
body.light-mode #titleOverlay {
    background: #F4F4F4; /* Clean light grey */
}

/* 2. The Save Slot Card (The "Black Box" fix) */
body.light-mode .save-slot-card {
    background: #FFFFFF;
    border: 1px solid #CCC;
    box-shadow: 0 4px 6px rgba(0,0,0,0.05); /* Soft paper shadow */
}

body.light-mode .save-slot-card:hover {
    background: #FAFAFA;
    border-color: var(--accent-color);
    box-shadow: 0 6px 12px rgba(0, 119, 119, 0.15);
}

/* 3. Save Text Colors */
body.light-mode .save-name {
    color: #111;
}

body.light-mode .save-meta {
    color: #666;
}

/* 4. Badges (Auto/Manual) */
body.light-mode .save-type-badge {
    background: #EEE;
    color: #555;
    border: 1px solid #DDD;
}

body.light-mode .auto-badge {
    background: #FFF8E1; /* Pale Orange Paper */
    color: #D35400;      /* Dark Orange Ink */
    border-color: #FAE5D3;
}

/* 5. Input Fields (Name/Seed) */
body.light-mode .seed-input {
    background: #FFFFFF;
    color: #222;
    border: 1px solid #AAA;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
}

body.light-mode .seed-input::placeholder {
    color: #999;
}

/* 6. Checkbox & Labels */
body.light-mode .checkbox-container {
    color: #444;
}

body.light-mode .checkmark {
    background-color: #FFF;
    border: 1px solid #999;
}

body.light-mode .subtitle {
    color: #555;
    font-weight: bold;
}

/* 7. Delete Button on the Save Card */
body.light-mode .save-delete-btn {
    border-color: #D00000;
    color: #D00000;
}
body.light-mode .save-delete-btn:hover {
    background: #D00000;
    color: #FFF;
}

body.light-mode .game-title {
    text-shadow: 0 4px 0 rgba(0,0,0,0.1); /* Clean drop shadow instead of glow */
    color: #007777; /* Dark Teal */
}

body.light-mode .save-list-header {
    color: #444;
    border-bottom-color: #BBB;
}

/* --- LIGHT MODE: SHARP HEADER TEXT --- */
body.light-mode .sector-title {
    color: var(--accent-color); /* Uses the Dark Teal */
    text-shadow: none;          /* Removes the "blurry" glow */
    font-weight: 900;           /* Extra bold for readability */
    letter-spacing: 1px;        /* Tighten it up slightly */
    
    /* Optional: A crisp hard shadow for a "printed" look */
    filter: drop-shadow(1px 1px 0px rgba(0,0,0,0.1));
}

/* Also sharpen the coordinates next to it */
body.light-mode .coords {
    color: #444;
    font-weight: bold;
    text-shadow: none;
}
/* --- ANIMATIONS & LIGHT MODE TITLE POLISH --- */

/* 1. Missing Blink Animation (Fixes "SYSTEM INITIALIZING..." not blinking) */
@keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
}

/* 2. Light Mode: Dynamic Background ("Paper Drift") */
/* Adds a very slow, subtle shifting gradient so the white isn't "dead" */
body.light-mode #titleOverlay {
    background: linear-gradient(120deg, #FFFFFF 0%, #F0F0F0 50%, #FFFFFF 100%);
    background-size: 200% 200%;
    animation: paper-drift 15s ease infinite;
}

@keyframes paper-drift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}

/* 3. Light Mode: Logo "Breathing" Effect */
/* Makes the logo pulse slightly in size and shadow, like ink settling on paper */
body.light-mode .game-title {
    animation: ink-pulse 4s ease-in-out infinite;
}

@keyframes ink-pulse {
    0% { 
        transform: scale(1); 
        text-shadow: none; 
        color: var(--accent-color);
    }
    50% { 
        transform: scale(1.02); 
        /* Subtle shadow pulse */
        text-shadow: 2px 4px 0px rgba(0, 119, 119, 0.1); 
    }
    100% { 
        transform: scale(1); 
        text-shadow: none; 
    }
}

/* 4. Light Mode: Loading Text Cursor Effect */
/* Adds a blinking cursor block next to "SYSTEM INITIALIZING..." */
body.light-mode #systemBoot {
    border-right: 3px solid var(--accent-color);
    padding-right: 5px;
    display: inline-block;
    animation: cursor-blink 1s step-end infinite;
}

@keyframes cursor-blink {
    0%, 100% { border-color: transparent; }
    50% { border-color: var(--accent-color); }
}

/* --- LIGHT MODE: TOAST NOTIFICATIONS --- */
body.light-mode .toast {
    background: #FFFFFF;          /* Pure White Card */
    color: #333333;               /* Dark Grey Text */
    border: 1px solid #E0E0E0;    /* Subtle grey border */
    border-left: 5px solid var(--accent-color); /* Thick Teal Indicator */
    box-shadow: 0 4px 12px rgba(0,0,0,0.1); /* Soft, clean shadow */
    font-weight: 600;
}

/* Success Toasts (Green) */
body.light-mode .toast.success {
    border-left-color: var(--success); /* Uses the Dark Green variable */
    color: var(--success);             /* Text matches border */
    background: #F4FFF4;               /* Very faint green tint */
}

/* Error Toasts (Red) */
body.light-mode .toast.error {
    border-left-color: var(--danger);  /* Uses the Dark Red variable */
    color: var(--danger);
    background: #FFF4F4;               /* Very faint red tint */
}

/* --- TOAST INTERIOR TEXT FIXES --- */
/* These rules target the specific <span> styles you use in JS (like Gold for credits)
   and forces them to be readable on the white background. */

/* Fix "Gold/Yellow" text (Credits) to be Dark Orange/Brown */
body.light-mode .toast span[style*="#FFD700"], 
body.light-mode .toast span[style*="#FFFF00"] {
    color: #B35900 !important; 
}

/* Fix "Bright Green" text (XP) to be Forest Green */
body.light-mode .toast span[style*="#00FF00"] {
    color: #007700 !important;
}

/* Fix "Cyan/Blue" text (Items) to be Dark Teal */
body.light-mode .toast span[style*="#00E0E0"] {
    color: #007777 !important;
}

/* --- LIGHT MODE: PLANET VIEW OVERRIDES --- */
body.light-mode .planet-view-content {
    background: #FFFFFF;          /* Clean White Card */
    border: 1px solid #CCC;       /* Subtle Border */
    border-left: 4px solid var(--accent-color); /* Keep the accent strip */
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);    /* Soft, modern shadow */
    color: #333;                  /* Dark Text */
}

/* Fix the Planet Title (Was White with Glow) */
body.light-mode .planet-title {
    color: var(--accent-color);   /* Dark Teal */
    text-shadow: none;            /* Remove neon glow */
    font-weight: 900;
}

/* Fix the Description Text (Was Grey/White) */
body.light-mode .planet-desc {
    color: #555;                  /* Readable Dark Grey */
    font-weight: 600;
}

/* Fix the Planet Image Container */
body.light-mode .planet-large-img {
    background: #F0F0F0;          /* Light grey backdrop for the icon */
    border-color: #CCC;
}

/* Fix the Separator Line */
body.light-mode .planet-header {
    border-bottom-color: #EEE;
}

/* --- LIGHT MODE: MODAL & COMBAT POLISH --- */

/* 1. TRADE WINDOW FIXES */
/* The header was dark teal, now light grey */
body.light-mode .trade-header {
    background: #E0E0E0;
    color: #111;
    border-bottom: 1px solid #BBB;
    text-shadow: none;
}

/* The "Math Area" was a black box, now off-white */
body.light-mode .trade-math-area {
    background: #F9F9F9;
    border: 1px solid #DDD;
    color: #333;
}

/* Input fields (Quantity) were black */
body.light-mode #tradeQtyInput {
    background: #FFFFFF;
    color: #000;
    border: 1px solid #CCC;
}

/* Quantity Buttons (+/-) */
body.light-mode .qty-btn {
    background: #F0F0F0;
    color: #333;
    border: 1px solid #CCC;
}
body.light-mode .qty-btn:hover {
    background: var(--accent-color);
    color: #FFF;
}

/* 2. COMBAT VIEW FIXES */
/* Combat Buttons were Dark Red background (#330000) -> Now Light Red Tint */
body.light-mode .combat-action-btn {
    background: #FFF0F0;      /* Very pale red */
    color: #CC0000;           /* Dark Red Text */
    border-color: #CC0000;
    box-shadow: 0 2px 0 #E0C0C0;
}

body.light-mode .combat-action-btn:hover:not(:disabled) {
    background: #CC0000;
    color: #FFF;
}

body.light-mode .combat-action-btn:disabled {
    background: #F0F0F0;
    color: #AAA;
    border-color: #DDD;
}

/* Ship Icons (Prevent black box behind pixel art) */
body.light-mode .combatant-icon {
    background: #F0F0F0;
    border-color: #CCC;
}

/* 3. CONFIRMATION MODAL (CRITICAL FIX) */
/* The body text was hardcoded to White (#FFF), making it invisible on white bg */
body.light-mode .confirm-window {
    background: #FFFFFF;
    border-color: var(--danger);
    color: #000; /* Force text black */
}

body.light-mode .confirm-body {
    color: #333; /* Ensure message text is visible */
}

/* 4. SYSTEM MENU BUTTONS */
/* These were hardcoded to #222 */
body.light-mode .sys-btn {
    background: #F8F8F8;
    color: #333;
    border: 1px solid #CCC;
}
body.light-mode .sys-btn:hover {
    background: #FFF;
    border-color: var(--accent-color);
    color: var(--accent-color);
}

/* 5. CONTEXT ACTION BUTTONS (Bottom Right) */
body.light-mode .control-button {
    background: #F8F8F8;
    color: var(--accent-color);
    border: 1px solid #CCC;
}
body.light-mode .control-button:hover {
    background: var(--accent-color);
    color: #FFF;
}

/* --- JUICE & FX --- */
@keyframes shake {
    0% { transform: translate(1px, 1px) rotate(0deg); }
    10% { transform: translate(-1px, -2px) rotate(-1deg); }
    20% { transform: translate(-3px, 0px) rotate(1deg); }
    30% { transform: translate(3px, 2px) rotate(0deg); }
    40% { transform: translate(1px, -1px) rotate(1deg); }
    50% { transform: translate(-1px, 2px) rotate(-1deg); }
    60% { transform: translate(-3px, 1px) rotate(0deg); }
    70% { transform: translate(3px, 1px) rotate(-1deg); }
    80% { transform: translate(-1px, -1px) rotate(1deg); }
    90% { transform: translate(1px, 2px) rotate(0deg); }
    100% { transform: translate(1px, -2px) rotate(-1deg); }
}

.shake-effect {
    animation: shake 0.5s;
    animation-iteration-count: 1;
}

.damage-flash {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(255, 0, 0, 0.3);
    pointer-events: none;
    z-index: 9000;
    opacity: 0;
    transition: opacity 0.1s;
}

/* --- LIGHT MODE: CODEX--- */

body.light-mode .codex-header {
    background: #E0E0E0;      /* Light Grey instead of Dark Teal */
    color: #111;              /* Dark Text */
    border-bottom: 1px solid #BBB;
}

body.light-mode #codexCategories, 
body.light-mode #codexEntries {
    border-right-color: #CCC; /* Soft Grey instead of Black */
}

body.light-mode .codex-list-item {
    color: #444; /* Dark Grey text */
}

/* Hover (No more black bar) */
body.light-mode .codex-list-item:hover {
    background: #F0F0F0;      /* Very Light Grey */
    color: var(--accent-color);
}

/* Active/Selected Item (No more black bar) */
body.light-mode .codex-list-item.active {
    background: #E0F7FA;      /* Pale Cyan/Teal Paper */
    color: #006064;           /* Deep Teal Text */
    border-left-color: #006064;
}

/* --- LIGHT MODE: TRADE LIST FIXES --- */

body.light-mode .trade-item-row {
    border-bottom-color: #EEE;
    color: #333;
}

/* Hover was invisible (White on White). Now it's Grey. */
body.light-mode .trade-item-row:hover {
    background: #F5F5F5; 
}

/* Selected Item Highlight */
body.light-mode .trade-item-row.selected {
    background: #E0F7FA;      /* Pale Cyan */
    color: #006064;           /* Deep Teal */
    border-left-color: #006064;
}

/* --- LEVEL UP MODAL STYLES --- */

/* The Dark Overlay Background */
#levelUpOverlay {
    display: none; 
    position: fixed; 
    top: 0; left: 0; right: 0; bottom: 0;
    /* Default Dark Mode Backdrop */
    background: rgba(0, 0, 0, 0.95); 
    z-index: 5000;
    flex-direction: column; 
    align-items: center; 
    justify-content: center;
}

/* The Perk Card Container */
.perk-card {
    width: 200px; 
    padding: 20px; 
    border-radius: 8px; 
    cursor: pointer; 
    transition: all 0.2s; 
    text-align: center;
    font-family: var(--main-font);
    
    /* Default Dark Mode Look */
    background: #111; 
    border: 1px solid #444;
    box-shadow: 0 4px 10px rgba(0,0,0,0.5);
}

.perk-card:hover {
    border-color: #FFD700; /* Gold Border */
    background: #222;
    transform: translateY(-5px); /* Pop up slightly */
}

.perk-icon { font-size: 40px; margin-bottom: 10px; }

.perk-title {
    color: var(--accent-color); 
    margin: 0 0 10px 0; 
    font-family: var(--title-font);
    font-size: 18px;
}

.perk-desc {
    color: #888; 
    font-size: 12px; 
    line-height: 1.4;
}

.perk-category {
    margin-top: 15px; 
    font-size: 10px; 
    color: #555; 
    text-transform: uppercase; 
    letter-spacing: 1px;
}

/* --- LIGHT MODE: LEVEL UP OVERRIDES --- */

body.light-mode #levelUpOverlay {
    background: rgba(255, 255, 255, 0.95); /* White fog backdrop */
}

body.light-mode .perk-card {
    background: #FFFFFF;
    border: 1px solid #CCC;
    box-shadow: 0 10px 20px rgba(0,0,0,0.1); /* Soft shadow */
}

body.light-mode .perk-card:hover {
    background: #F9F9F9;
    border-color: var(--accent-color); /* Teal border on hover */
}

body.light-mode .perk-title {
    color: var(--accent-color); /* Dark Teal */
    font-weight: 900;
}

body.light-mode .perk-desc {
    color: #444; /* Dark Grey text */
    font-weight: 600;
}

body.light-mode .perk-category {
    color: #888;
}

/* Fix the Header Text in the Modal */
body.light-mode #levelUpOverlay h1 {
    color: var(--accent-color) !important; /* Force Teal instead of Gold */
    text-shadow: none !important;
}

body.light-mode #levelUpOverlay p {
    color: #333 !important; /* Force Black text instead of White */
    font-weight: bold;
}

/* --- STATION HUB STYLES --- */
.station-body {
    display: flex;
    flex-direction: row;
    height: 500px;
    background: #050510;
}

.station-visual-panel {
    width: 35%;
    border-right: 1px solid var(--border-color);
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #080815;
}

#stationCanvas {
    width: 180px; height: 180px;
    border: 2px solid #333;
    border-radius: 8px;
    background: #000;
    margin-bottom: 15px;
    image-rendering: pixelated;
    box-shadow: 0 0 15px rgba(0, 224, 224, 0.1);
}

.station-badge {
    background: #222;
    color: var(--accent-color);
    padding: 5px 10px;
    border-radius: 4px;
    font-family: var(--title-font);
    font-size: 12px;
    margin-bottom: 15px;
    border: 1px solid var(--border-color);
}

.station-desc {
    font-size: 12px;
    color: #888;
    text-align: center;
    line-height: 1.5;
    font-style: italic;
}

.station-menu-grid {
    width: 65%;
    padding: 20px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    align-content: start;
    overflow-y: auto;
}

.station-action-btn {
    background: #111;
    border: 1px solid #333;
    border-left: 3px solid #333;
    padding: 15px;
    display: flex;
    align-items: center;
    gap: 15px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
}

.station-action-btn:hover {
    background: #1a1a25;
    border-color: var(--accent-color);
    transform: translateX(5px);
}

.btn-icon { font-size: 24px; }
.btn-label { 
    font-family: var(--title-font); 
    color: #FFF; 
    font-size: 14px; 
}
.btn-sub { 
    display: block; 
    font-family: var(--main-font); 
    font-size: 10px; 
    color: #666; 
    margin-top: 3px; 
}

/* Specific Button Colors */
.repair-btn:hover { border-color: var(--success); }
.leave-btn:hover { border-color: var(--danger); }

/* --- LIGHT MODE STATION OVERRIDES --- */
body.light-mode .station-body,
body.light-mode .station-badge {
    background: #F0F0F0;       /* Light Grey Background */
    color: var(--accent-color); /* Dark Teal Text */
    border-color: #CCC;        /* Subtle Border */
    font-weight: 900;          /* Make text bold and crisp */
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}
body.light-mode .station-visual-panel { background: #FFFFFF; }
body.light-mode #stationCanvas { border-color: #CCC; background: #F0F0F0; }
body.light-mode .station-action-btn { background: #FFF; border: 1px solid #CCC; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
body.light-mode .station-action-btn:hover { background: #F9F9F9; border-color: var(--accent-color); }
body.light-mode .btn-label { color: #222; }

/* Responsive Station View */
@media (max-width: 768px) {
    .station-body { flex-direction: column; height: auto; }
    .station-visual-panel { width: 100%; border-right: none; border-bottom: 1px solid #333; flex-direction: row; gap: 15px; padding: 10px; }
    #stationCanvas { width: 80px; height: 80px; margin-bottom: 0; }
    .station-menu-grid { width: 100%; grid-template-columns: 1fr; }
}

/* --- LIGHT MODE TEXT VISIBILITY FIXES --- */

/* Make the station flavor text dark and readable */
body.light-mode .station-desc {
    color: #333; 
    font-weight: 600;
}

/* Make the button subtitles (e.g. "Buy Commodities") darker */
body.light-mode .btn-sub {
    color: #555;
    font-weight: 500;
}

/* Ensure paragraph text in the generic sub-modals is also dark */
body.light-mode #genericDetailContent p {
    color: #333 !important;
}

.trade-list-header {
    font-family: var(--title-font);
    font-size: 10px;
    color: var(--accent-color);
    padding: 8px 15px;
    background: rgba(0, 0, 0, 0.2);
    border-bottom: 1px solid var(--border-color);
    letter-spacing: 1px;
}

body.light-mode .trade-list-header {
    background: #F0F0F0;
    color: #555;
    font-weight: 900;
}

/* --- MODAL INFO BAR (PLAYER STATS OVERLAY) --- */
.modal-info-bar {
    background: rgba(0, 0, 0, 0.4);
    border-bottom: 1px solid var(--border-color);
    padding: 8px 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: var(--main-font);
    font-size: 11px;
    color: #888;
    flex-shrink: 0; /* Prevent it from being crushed */
}

/* Light Mode Override */
body.light-mode .modal-info-bar {
    background: #F0F0F0;
    color: #555;
    border-bottom-color: #CCC;
}

/* Individual Data Points */
.info-bar-item {
    display: flex;
    align-items: center;
    gap: 6px;
}

.info-bar-label {
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 9px;
    opacity: 0.8;
}

.info-bar-value {
    color: var(--accent-color);
    font-weight: bold;
    font-size: 12px;
}

/* Specific Colors for specific stats */
.info-credits { color: var(--gold-text); }
.info-ship { color: #FFF; }
body.light-mode .info-ship { color: #222; }

/* --- DERELICT MODAL OVERRIDES --- */

/* 1. Fix the "Black Box" log area */
#derelictLog {
    /* Use a dark, semi-transparent red/black mix instead of pure black */
    background: rgba(30, 10, 10, 0.5) !important; 
    border-top: 1px solid #552222 !important;
    color: #AAA !important;
}

/* 2. Fix the "Green/Teal" hover on the Close (X) button */
/* We target the button specifically inside the derelict header */
#derelictOverlay .icon-btn:hover {
    background: #FF5555; /* Bright Red */
    color: #FFF;
    border-color: #FF5555;
}

/* 3. Light Mode Support for the Log */
body.light-mode #derelictLog {
    background: #FFF0F0 !important; /* Very faint red paper */
    color: #550000 !important; /* Dark red text */
    border-top: 1px solid #FFCCCC !important;
}

/* --- XERXES THEME --- */
.xerxes-btn {
    background: #150025;
    border: 1px solid #551188;
    color: #DDA0DD; /* Plum */
}
.xerxes-btn:hover {
    background: #2a0045;
    border-color: #9933FF;
    color: #FFF;
    box-shadow: 0 0 10px #9933FF;
}
.xerxes-spire-btn {
    border-left: 3px solid #9933FF;
}

/* --- LIGHT MODE XERXES THEME (Royal Lavender) --- */

/* 1. Main Window & Border */
body.light-mode #xerxesOverlay .trade-window {
    background-color: #FFFFFF !important;
    border-color: #9C27B0 !important; /* Rich Purple */
    box-shadow: 0 0 40px rgba(156, 39, 176, 0.25) !important;
}

/* 2. Header Area */
body.light-mode #xerxesOverlay .trade-header {
    background: #F3E5F5 !important; /* Very Light Lavender */
    border-bottom: 1px solid #E1BEE7 !important;
}

body.light-mode #xerxesOverlay .trade-header span {
    color: #4A148C !important; /* Deep Purple Text (High Contrast) */
    text-shadow: none !important;
}

body.light-mode #xerxesOverlay .icon-btn {
    color: #7B1FA2 !important;
    border-color: #CE93D8 !important;
}

/* 3. Info Bar Border */
body.light-mode #xerxesInfoBar {
    border-bottom-color: #F3E5F5 !important;
}

/* 4. Main Body Backgrounds */
body.light-mode #xerxesOverlay .station-body {
    background: #FFFFFF !important;
}

body.light-mode #xerxesOverlay .station-visual-panel {
    background: #FAFAFA !important; /* Slight off-white to separate visual area */
    border-right: 1px solid #F3E5F5 !important;
}

/* 5. The "Rogue World" Badge */
body.light-mode #xerxesOverlay .station-badge {
    background: #F3E5F5 !important;
    color: #7B1FA2 !important;
    border-color: #E1BEE7 !important;
    font-weight: 900;
}

body.light-mode #xerxesOverlay .station-desc {
    color: #555 !important; /* Readable Grey */
}

/* 6. Buttons (The "Xerxes Btn" class) */
body.light-mode .xerxes-btn {
    background: #FFFFFF !important;
    border: 1px solid #E1BEE7 !important;
    color: #6A1B9A !important; /* Deep Purple */
    box-shadow: 0 2px 0 #F3E5F5 !important;
}

body.light-mode .xerxes-btn:hover {
    background: #F3E5F5 !important;
    border-color: #9C27B0 !important;
    color: #4A148C !important;
    box-shadow: 0 0 10px rgba(156, 39, 176, 0.3) !important;
}

/* 7. The Special "Spire" Button Accent */
body.light-mode .xerxes-spire-btn {
    border-left: 4px solid #9C27B0 !important;
}

/* 8. The Log Box */
body.light-mode #xerxesLog {
    background: #F3E5F5 !important; /* Light Lavender Paper */
    color: #4A148C !important;      /* Deep Purple Ink */
    border-top: 1px solid #CE93D8 !important;
}

/* Fix specific colored text inside the log to be readable */
body.light-mode #xerxesLog div[style*="color:#DDA0DD"] { 
    color: #6A1B9A !important; /* Convert light plum to deep purple */ 
}

/* --- XERXES LOG TEXT FIXES (Light Mode) --- */

/* Turn #00FF00 (Neon Green) into Dark Forest Green */
body.light-mode #xerxesLog div[style*="color:#00FF00"] { 
    color: #006400 !important; 
}

/* Turn #FF5555 (Bright Red) into Dark Crimson */
body.light-mode #xerxesLog div[style*="color:#FF5555"] { 
    color: #8B0000 !important; 
}

/* Ensure the input field we are about to add looks good on white */
body.light-mode #spireInput {
    background: #FFFFFF;
    color: #000;
    border-color: #9C27B0;
}

/* --- XERXES INPUT BOX IN LIGHT MODE --- */
body.light-mode #spireInput {
    background-color: #FFFFFF !important;   /* Force White Background */
    color: #4A148C !important;              /* Deep Purple Text */
    border: 2px solid #9C27B0 !important;   /* Purple Border */
    box-shadow: inset 0 0 5px rgba(156, 39, 176, 0.2) !important;
}

/* Optional: Make the placeholder text ("TYPE ANSWER...") look nice too */
body.light-mode #spireInput::placeholder {
    color: #CE93D8; /* Light Purple */
    opacity: 1;
}

/* --- CUSTOM SCROLLBARS --- */
::-webkit-scrollbar {
    width: 8px; /* Slightly thinner, more elegant scrollbar */
}

::-webkit-scrollbar-track {
    background: var(--bg-color); 
    border-left: 1px solid var(--border-color);
}

::-webkit-scrollbar-thumb {
    background: #4A4A6A; /* A muted slate-blue, much darker than the neon cyan */
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: #6A6A8A; /* Highlights slightly when you hover over it */
}

/* Firefox compatibility */
* {
    scrollbar-width: thin;
    scrollbar-color: #4A4A6A var(--bg-color);
}

/* --- SYSTEM VIEW HEADER --- */
.system-header-panel {
    width: 100%;
    max-width: clamp(320px, 100vw, 1024px); 
    
    margin: 0 auto 20px auto;
    padding: 0 15px; /* Add padding so text doesn't touch the exact edge */
    z-index: var(--z-header);
    box-sizing: border-box;
    text-align: left;
    border-bottom: 1px solid #333;
    padding-bottom: 15px;
}

.sys-title-large {
    font-family: var(--title-font);
    font-size: 28px;
    color: #FFF;
    margin: 0;
    text-shadow: 0 0 10px rgba(0, 224, 224, 0.3);
}

.sys-meta-row {
    display: flex;
    gap: 20px;
    font-family: var(--main-font);
    font-size: 12px;
    color: var(--accent-color);
    margin-top: 5px;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.sys-flavor-text {
    font-family: var(--main-font);
    font-size: 13px;
    color: #888;
    font-style: italic;
    margin-top: 10px;
    max-width: 80%; /* Keep line length readable */
}

/* ==========================================
   --- SPECIAL LOCATION VIEWS ---
   ========================================== */

/* Loads the black market imageas a unique modal header */

.black-market-header {
    width: 100%;
    height: 250px; /* Adjust height as needed */
    background-image: url('assets/black_market.png');
    background-size: cover;
    background-position: center bottom; /* Shows the busy trading counter */
    
    /* Applies the new Navy/Aqua sci-fi theme borders */
    border-bottom: 2px solid var(--accent-color); 
    box-shadow: inset 0 -15px 30px rgba(0, 224, 224, 0.2);
    
    margin-bottom: 15px;
    border-radius: 4px 4px 0 0; /* Match modal corners */
}
