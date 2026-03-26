function openStationView() {
    const location = chunkManager.getTile(playerX, playerY);
    if (!location) return;

    // --- 1. XERXES REDIRECT (UPDATED) ---
    // If Xerxes is a Black Market, we bypass the old custom view 
    // and let this updated station view handle it beautifully!
    if (location.name === 'Planet Xerxes' && !location.isBlackMarket) {
        if (typeof openXerxesView === 'function') {
            openXerxesView();
            return;
        }
    }

    // If we are returning to the concourse from a sub-menu (Missions, Cantina, Job Board),
    // we must close the Generic Modal so it doesn't trap us!
    if (typeof closeGenericModal === 'function') closeGenericModal();

    // --- 2. SETUP UI TEXT ---
    document.getElementById('stationOverlay').style.display = 'flex';
    document.getElementById('stationNameTitle').textContent = location.name.toUpperCase();
    
    const faction = location.faction || getFactionAt(playerX, playerY);
    const badgeEl = document.getElementById('stationFactionBadge');
    badgeEl.textContent = faction;
    
    // Inject Black Market flavor text
    let descText = location.scanFlavor || "A frontier outpost on the edge of civilized space.";
    if (location.isBlackMarket) {
        descText = "⚠️ SHADOW NETWORK SECURE NODE. ALL TRANSACTIONS ENCRYPTED.\n\n" + descText;
        badgeEl.style.color = '#9C27B0'; // Give the badge a cool purple/illicit color
        badgeEl.style.borderColor = '#9C27B0';
    } else {
        badgeEl.style.color = ''; // Reset to default
        badgeEl.style.borderColor = '';
    }
    
    document.getElementById('stationDescText').textContent = descText;
    
    // --- 3. SETUP STATION IMAGE ---
    const canvas = document.getElementById('stationCanvas');
    let img = document.getElementById('stationStaticImg');

    if (canvas) {
        if (!img) {
            img = document.createElement('img');
            img.id = 'stationStaticImg';
            Object.assign(img.style, {
                width: '100%',
                height: 'auto',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                display: 'none', 
                margin: '0 auto 15px auto',
                boxShadow: '0 0 20px rgba(0,224,224,0.2)',
                background: 'rgba(0,0,0,0.3)'
            });
            canvas.parentNode.insertBefore(img, canvas);
        }
        
        // --- ASSET RESOLUTION ---
        let targetSrc = 'assets/outpost.png'; 
        
        // Reset styles before applying
        img.style.maxWidth = '240px'; 
        img.style.borderColor = 'var(--border-color)'; 
        img.style.boxShadow = '0 0 20px rgba(0,224,224,0.2)';

        // 1. Specific Unique Locations
        if (location.name === 'The Rusty Anchor') {
            targetSrc = 'assets/rusty_anchor.png'; 
            img.style.maxWidth = '240px'; 
            img.style.borderColor = '#9C27B0'; 
            img.style.boxShadow = '0 0 30px rgba(156, 39, 176, 0.4)';
        } else if (location.name === 'Aegis Dyson Sphere') {
            targetSrc = 'assets/dyson_sphere.png'; 
        } 
        
        // 2. Generic Category Fallbacks 
        else if (location.isBlackMarket) {
            targetSrc = 'assets/black_market.png'; 
            img.style.maxWidth = '100%'; 
            img.style.borderColor = '#9C27B0'; 
            img.style.boxShadow = '0 0 30px rgba(156, 39, 176, 0.4)';
        } else if (location.isMajorHub) {
            targetSrc = 'assets/starbase_alpha.png'; 
        }

        // Logic to ensure the image actually shows up
        img.onload = () => {
            canvas.style.display = 'none';
            img.style.display = 'block';
            if (typeof soundManager !== 'undefined' && typeof soundManager.playUIRefresh === 'function') {
                soundManager.playUIRefresh();
            }
        };

        // Bulletproof Fallback
        img.onerror = () => {
            console.warn(`Failed to load ${targetSrc}, falling back to default outpost.`);
            img.onerror = null; // Prevent infinite loops
            img.src = 'assets/outpost.png'; 
        };

        // Load the image WITHOUT the ?t= parameter so local files work!
        img.src = targetSrc;
    }
    
    // 4. Render Dynamic Menu
    if (typeof renderStationMenu === 'function') renderStationMenu(location, faction);
    
    // 5. Borders
    if (typeof updateSideBorderVisibility === 'function') updateSideBorderVisibility();
}

function closeStationView() {
    document.getElementById('stationOverlay').style.display = 'none';
    updateSideBorderVisibility();
}

// --- STATION MAINTENANCE ACTIONS ---

function renderStationMenu(location, faction) {
    const menuGrid = document.getElementById('dynamicStationMenu');
    let html = '';

    // --- SAVE FILE COMPATIBILITY PATCH (UNIVERSAL) ---
    // If the location's trade arrays were stripped during a save/load cycle to save space,
    // we safely restore them from the master LOCATIONS_DATA database right here!
    if (typeof LOCATIONS_DATA !== 'undefined' && LOCATIONS_DATA[location.name]) {
        const baseData = LOCATIONS_DATA[location.name];
        if (!location.sells || location.sells.length === 0) {
            location.sells = JSON.parse(JSON.stringify(baseData.sells || []));
        }
        if (!location.buys || location.buys.length === 0) {
            location.buys = JSON.parse(JSON.stringify(baseData.buys || []));
        }
        if (location.isBlackMarket === undefined) {
            location.isBlackMarket = baseData.isBlackMarket || false;
        }
    }

    const isBlackMarketNode = location.isBlackMarket || location.name === 'Planet Xerxes' || location.name === 'Xerxes Prime';

    // Helper for generating buttons
    const createBtn = (icon, title, sub, action, extraStyle="", extraClass="") => `
        <button class="station-action-btn ${extraClass}" style="${extraStyle}" onclick="${action}">
            <div class="btn-icon">${icon}</div>
            <div>
                <div class="btn-label">${title}</div>
                <span class="btn-sub">${sub}</span>
            </div>
        </button>
    `;

    // --- 1. TRADE & COMMERCE ---
    if (isBlackMarketNode) {
        html += createBtn('💀', 'Shadow Network: Buy', 'Acquire illicit goods', "openTradeModal('buy')", "", "xerxes-btn xerxes-spire-btn");
        html += createBtn('💰', 'Shadow Network: Sell', 'Fence contraband', "openTradeModal('sell')", "", "xerxes-btn xerxes-spire-btn");
    } else {
        // Now this will correctly fire because the arrays are guaranteed to be restored!
        if ((location.sells && location.sells.length > 0) || (location.buys && location.buys.length > 0)) {
            html += createBtn('🛒', 'Marketplace', 'Buy Commodities', "openTradeModal('buy')");
            html += createBtn('💰', 'Sell Cargo', 'Offload Goods', "openTradeModal('sell')");
        }
    }

    // --- 2. STANDARD SERVICES ---
    html += createBtn('📜', 'Mission Board', 'Contracts & Deliveries', "displayMissionBoard()");
    html += createBtn('🎯', 'Bounty Board', 'Hunt Cartel Targets', "openBountyBoard()", "border-left: 3px solid var(--danger);");
    html += createBtn('⚙️', 'Outfitting', 'Upgrades & Parts', "displayOutfittingScreen()");
    html += createBtn('🍸', 'Cantina', 'Rumors & Rest (10c)', "visitCantina()");

    // --- 3. MAJOR HUB ONLY SERVICES ---
    let cryptarchRendered = false; 
    if (location.isMajorHub) {
        html += createBtn('🚀', 'Shipyard', 'Buy New Hulls', "displayShipyard()");
        
        if (location.name !== 'The Rusty Anchor') {
            html += createBtn('👁️', 'Cryptarch', 'Decrypt Engrams', "visitCryptarch()");
            cryptarchRendered = true;
        }
    }

    // --- 4. LOCATION SPECIFIC SERVICES ---
    if (!cryptarchRendered && isBlackMarketNode && location.name !== 'The Rusty Anchor') { 
        html += createBtn('👁️', 'The Cryptarch', 'Decrypt Data', "visitCryptarch()", "border-left: 3px solid #9C27B0;");
    }

    // --- 5. FACTION SPECIFIC SERVICES ---
    if (faction === 'CONCORD') {
        html += createBtn('⚖️', 'Security Office', 'Clear Bounties', "clearConcordBounty()", "border-left: 3px solid var(--accent-color);");
        html += createBtn('🛡️', 'Aegis Armory', 'Concord Gear', "openConcordArmory()", "border-left: 3px solid var(--accent-color);");
        html += createBtn('📡', 'Naval Command', 'Hire Escort', "requestConcordEscort()", "border-left: 3px solid var(--accent-color);");
        
        // 🔮 FUTURE EXPANSION (v1.1): MARINE BARRACKS
        // LLM NOTE: Activate this button to open a UI where the player can spend Credits to buy "MERCENARY_PLATOON" 
        // to supply their ground forces array.
        // html += createBtn('🪖', 'Marine Barracks', 'Recruit Ground Forces', "openBarracksUI()", "border-left: 3px solid var(--accent-color);");

    } else if (faction === 'KTHARR') {
        html += createBtn('⚔️', 'Proving Grounds', 'Arena Betting', "openKtharrProvingGrounds()", "border-left: 3px solid var(--danger);");
        html += createBtn('🍖', 'The Blood Pits', 'Bio-Trade', "openBloodPitsTrade()", "border-left: 3px solid var(--danger);");
        html += createBtn('💀', 'Rite of Combat', 'Challenge Warlord', "challengeKtharrWarlord()", "border-left: 3px solid var(--danger);");
    } else if (faction === 'ECLIPSE') {
        html += createBtn('🎲', 'Shadow Broker', 'Fence Contraband', "fenceEclipseContraband()", "border-left: 3px solid #9933FF;");
        html += createBtn('🪪', 'The Forger', 'Buy Fake ID', "buyFakeID()", "border-left: 3px solid #9933FF;");
        html += createBtn('🗡️', 'Mercenary Den', 'Hire Shady Crew', "hireEclipseMercenary()", "border-left: 3px solid #9933FF;");
    }

    // --- 6. MAINTENANCE & LEAVE ---
    const missingFuel = Math.floor(MAX_FUEL - playerFuel);
    const refuelLabel = missingFuel > 0 ? `${missingFuel}c` : "Tanks Full";
    html += createBtn('⛽', 'Refuel', refuelLabel, "refuelShip()", "background: rgba(0, 224, 224, 0.05);");

    const repairCost = Math.ceil((MAX_PLAYER_HULL - playerHull) * HULL_REPAIR_COST_PER_POINT);
    const repairLabel = repairCost > 0 ? `${repairCost}c` : "Hull 100%";
    html += createBtn('🔧', 'Repair Hull', repairLabel, "repairShip()", "background: rgba(255, 170, 0, 0.05);");
    
    html += createBtn('👋', 'Undock', 'Return to Space', "closeStationView()", "background: rgba(255, 85, 85, 0.05);");

    menuGrid.innerHTML = html;
}

// --- CANTINA & RUMOR SYSTEM ---

function visitCantina() {
    openGenericModal("STATION CANTINA");

    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    const location = chunkManager.getTile(playerX, playerY);

    let randomFlavor = [
        "The air is thick with smoke and the hum of a failing ventilation unit.",
        "A K'tharr mercenary eyes you suspiciously from the corner.",
        "Techno-jazz blares from speakers that have seen better days.",
        "The bartender polishes a glass with a rag that looks grease-stained."
    ][Math.floor(Math.random() * 4)];

    // Reduced height to 130px to prevent the bottom from getting cut off!
    let headerArt = `<img src="assets/outpost_cantina.png" style="width:100%; height: 130px; object-fit: cover; object-position: center; border-radius:6px; border:1px solid var(--border-color); box-shadow: 0 0 15px rgba(0, 224, 224, 0.1); margin-bottom: 15px;">`;

    if (location && location.name === 'The Rusty Anchor') {
        headerArt = `<img src="assets/rusty_cantina.png" style="width:100%; height: 130px; object-fit: cover; object-position: center; border-radius:6px; border:1px solid #9C27B0; box-shadow: 0 0 15px rgba(156, 39, 176, 0.3); margin-bottom: 15px;">`;
        randomFlavor = "The air is thick with the smell of ozone, illegal stims, and danger.";
    }

    listEl.innerHTML = `
        <div style="padding:15px; text-align:center;">
            ${headerArt}
            <p style="color:var(--text-color); font-style:italic; font-size: 13px; margin: 0;">"${randomFlavor}"</p>
        </div>
        <div class="generic-list-item" onclick="buyDrink()" style="cursor: pointer;">
            <strong style="color:var(--accent-color);">Buy a Drink (10c)</strong>
            <div style="font-size:11px; color:var(--item-desc-color); margin-top:4px;">Restores 15 Hull.</div>
        </div>
        <div class="generic-list-item" onclick="listenToRumors()" style="cursor: pointer;">
            <strong style="color:var(--accent-color);">Eavesdrop on Rumors</strong>
            <div style="font-size:11px; color:var(--item-desc-color); margin-top:4px;">Listen to local chatter for clues.</div>
        </div>
        <div class="generic-list-item" onclick="openRecruitmentBoard()" style="cursor: pointer;">
            <strong style="color:var(--accent-color);">Crew Recruitment</strong>
            <div style="font-size:11px; color:var(--item-desc-color); margin-top:4px;">Hire specialized crew members for your ship.</div>
        </div>
        <div class="generic-list-item" onclick="openLegendaryBounties()" style="cursor: pointer;">
            <strong style="color:var(--danger);">Most Wanted (Bounties)</strong>
            <div style="font-size:11px; color:var(--item-desc-color); margin-top:4px;">Hunt down legendary targets for exotic weapons.</div>
        </div>
    `;

    detailEl.innerHTML = `
        <div style="padding:40px 20px; text-align:center; color:var(--item-desc-color);">
            Select an option from the menu.
        </div>
    `;

    // --- Route the exit button back to the station ---
    actionsEl.innerHTML = `
        <button class="action-button" onclick="openStationView()">BACK TO CONCOURSE</button>
    `;
}

// ==========================================
// --- CANTINA ACTIONS ---
// ==========================================

function buyDrink() {
    const detailEl = document.getElementById('genericDetailContent');
    
    if (playerCredits >= 10) {
        playerCredits -= 10;
        
        const healAmount = 15;
        const previousHull = playerHull;
        playerHull = Math.min(MAX_PLAYER_HULL, playerHull + healAmount);
        const actualHeal = playerHull - previousHull;
        
        if (typeof soundManager !== 'undefined' && soundManager.playBuy) soundManager.playBuy();
        if (typeof renderUIStats === 'function') renderUIStats();
        
        if (detailEl) {
            detailEl.innerHTML = `
                <div style="text-align:center; padding: 20px;">
                    <div style="font-size:48px; margin-bottom:10px;">🍺</div>
                    <h3 style="color:var(--success); margin: 0 0 5px 0; font-size:22px;">REFRESHED</h3>
                    <div style="color:var(--text-color); font-weight:bold; margin-bottom:20px;">
                        -10c | +${actualHeal} Hull Restored
                    </div>
                    <p style="font-size:13px; color:var(--item-desc-color); font-style:italic;">
                        The synth-ale burns going down, but you feel ready to face the void again.
                    </p>
                </div>
            `;
        }
    } else {
        if (typeof showToast === 'function') showToast("INSUFFICIENT FUNDS", "error");
        if (detailEl) {
            detailEl.innerHTML = `
                <div style="text-align:center; padding: 40px 20px;">
                    <div style="font-size:40px; margin-bottom:10px;">🚫</div>
                    <h3 style="color:var(--danger); margin-bottom:10px;">BAR TAB DECLINED</h3>
                    <p style="color:var(--item-desc-color);">You need at least 10 credits to buy a drink here, space cowboy.</p>
                </div>
            `;
        }
    }
}

function listenToRumors() {
    const detailEl = document.getElementById('genericDetailContent');
    if (typeof soundManager !== 'undefined' && soundManager.playUIHover) soundManager.playUIHover();

    // You can expand this array later to hint at actual in-game locations!
    const rumors = [
        "I heard the K'tharr are massing ships near the border...",
        "Don't trust the Cryptarchs on Xerxes. They skim off the top.",
        "Some say there's a Dyson Sphere hidden in the deep sectors...",
        "Cartel activity is way up. Keep your shields double-charged.",
        "Precursor artifacts have been flooding the Black Market lately.",
        "If you find a pristine Nav-Core, don't sell it cheap. The Concord pays top credit.",
        "Watch out for O-Class stars. The glare is blinding but the plasma is rich."
    ];
    
    const randomRumor = rumors[Math.floor(Math.random() * rumors.length)];

    if (detailEl) {
        detailEl.innerHTML = `
            <div style="text-align:center; padding: 20px;">
                <div style="font-size:48px; margin-bottom:10px;">🗣️</div>
                <h3 style="color:var(--accent-color); margin: 0 0 15px 0; font-size:22px;">LOCAL CHATTER</h3>
                
                <div style="text-align:left; background: var(--bg-color); border: 1px dashed var(--border-color); padding: 20px; border-radius: 4px;">
                    <p style="font-size:14px; color:var(--text-color); font-style:italic; margin:0; line-height:1.6;">
                        You sit quietly in a dark corner booths and tune your cybernetics to filter out the baseline noise.
                        <br><br>
                        <span style="color:var(--warning);">"...${randomRumor}"</span>
                    </p>
                </div>
            </div>
        `;
    }
}

function cantinaAction(action) {
    if (action === 'DRINK') {
        if (playerCredits < 15) { showToast("Not enough credits!", "error"); return; }
        if (playerHull >= MAX_PLAYER_HULL) { showToast("Hull integrity already maxed.", "info"); return; }
        
        playerCredits -= 15;
        playerHull = Math.min(MAX_PLAYER_HULL, playerHull + 10);
        
        if (typeof soundManager !== 'undefined') soundManager.playUIHover();
        
        // Styled log for the drink
        logMessage(`<span style="color:var(--success);">[ REFRESHED ] You down the Synth-Ale. +10 Hull restored.</span>`);
        showToast("Refreshing! Hull repaired +10.", "success");
        renderUIStats();
    }
else if (action === 'RUMOR') {
        if (playerCredits < 50) { showToast("Bartender ignores you. (Need 50c)", "error"); return; }
        
        playerCredits -= 50;
        
        // Safety: Generate a trend right now if one doesn't exist yet
        if (!activeMarketTrend || currentGameDate > activeMarketTrend.expiry) {
            if (typeof generateMarketTrend === 'function') generateMarketTrend();
        }
        
        const trend = activeMarketTrend;
        const itemName = COMMODITIES[trend.item].name;
        
        logMessage(`<span style="color:var(--accent-color); font-weight:bold;">[ INTEL ACQUIRED ]</span>`);
        
        if (trend.isBoom) {
            logMessage(`<span style="color:var(--text-color);">"Heard folks at <span style="color:var(--accent-color);">${trend.station}</span> are desperate for <span style="color:var(--warning);">${itemName}</span>. Paying top credit right now."</span>`);
        } else {
            logMessage(`<span style="color:var(--text-color);">"A massive freighter just dumped <span style="color:var(--success);">${itemName}</span> at <span style="color:var(--accent-color);">${trend.station}</span>. Prices have completely crashed if you're looking to buy."</span>`);
        }
        
        showToast("TRADE INTEL ACQUIRED", "success");
        renderUIStats();
        closeGenericModal();
    }
    else if (action === 'RECRUIT') {
        openRecruitmentBoard();
    }
    else if (action === 'GAMBLE') {
        if (playerCredits < 100) { showToast("House limit is 100c.", "error"); return; }
        
        playerCredits -= 100;
        
        // 45% Win Chance (House Edge)
        if (Math.random() > 0.55) { 
            const win = 200;
            playerCredits += win;
            if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate(); 
            
            logMessage(`<span style="color:var(--gold-text); font-weight:bold;">[ PAZAAK WIN ] You cleared the table! +${win}c</span>`);
            showToast(`YOU WON! (+${win}c)`, "success");
        } else {
            if (typeof soundManager !== 'undefined') soundManager.playError();
            
            logMessage(`<span style="color:var(--danger);">[ PAZAAK LOSS ] The dealer takes your credits with a smirk.</span>`);
            showToast("You lost.", "error");
        }
        renderUIStats();
    }
}

function performCustomsScan() {
    // 1. Check for Contraband
    let contrabandFound = [];
    let hiddenCapacity = 0;
    
    // Check if the player has the Cartel module installed
    if (typeof playerShip !== 'undefined' && playerShip.components) {
        const util = COMPONENTS_DATABASE[playerShip.components.utility || "UTIL_NONE"];
        if (util && util.stats && util.stats.isSmuggler) {
            hiddenCapacity = 5; // The shielded bay hides 5 units of contraband!
        }
    }

    // Tally up illegal goods and attempt to hide them
    for (const itemID in playerCargo) {
        const itemDef = COMMODITIES[itemID];
        
        // SAFETY CHECK: Ensure the item exists and is illegal
        if (playerCargo[itemID] > 0 && itemDef && itemDef.illegal) {
            let exposedQty = playerCargo[itemID];
            
            // Hide items in the shielded compartment first
            if (hiddenCapacity > 0) {
                const amountToHide = Math.min(exposedQty, hiddenCapacity);
                hiddenCapacity -= amountToHide;
                exposedQty -= amountToHide;
            }
            
            // If they still have illegal goods spilling out of the hidden compartment, flag them!
            if (exposedQty > 0) {
                // Push an object with the exact exposed quantity
                contrabandFound.push({ id: itemID, exposedQty: exposedQty });
            }
        }
    }

    if (contrabandFound.length === 0) return true; // Clean scan, proceed

    // 2. Risk Calculation (Base 30% chance + 10% per illegal item type)
    let catchChance = 0.30 + (contrabandFound.length * 0.10);

    // 🚨 SMUGGLING: Multiply by the ship's overall radar signature size!
    catchChance *= (window.PLAYER_SIGNATURE || 1.0);
    
    logMessage("Scanning vessel signature...", true);

    if (Math.random() < catchChance) {
        // --- CAUGHT! ---
        if (typeof soundManager !== 'undefined') soundManager.playError();
        if (typeof triggerHaptic === 'function') triggerHaptic([200, 100, 200]);
        
        let fine = 0;
        
        // 🚨 Update the loop to use the new object properties (c.id and c.exposedQty)
        contrabandFound.forEach(c => {
            const val = COMMODITIES[c.id].basePrice || 0;
            // The fine is exactly 50% of the base value of the EXPOSED goods
            fine += (c.exposedQty * val * 0.5); 
            
            // Confiscate the exposed goods (leaving the hidden ones safely in the hold!)
            playerCargo[c.id] -= c.exposedQty;
            if (playerCargo[c.id] <= 0) delete playerCargo[c.id];
        });
        
        fine = Math.floor(fine);

        // --- SMOOTH TALKER & LORE UNLOCK ---
        // Safely check if playerPerks is an Array or a Set
        const hasSmoothTalker = typeof playerPerks !== 'undefined' && 
            ((playerPerks.has && playerPerks.has('SMOOTH_TALKER')) || 
             (playerPerks.includes && playerPerks.includes('SMOOTH_TALKER')));

        if (hasSmoothTalker) {
            fine = Math.floor(fine / 2);
            logMessage("<span style='color:var(--accent-color)'>[ PERK ] Smooth Talker activated! You talked the fine down by 50%.</span>");
            
            // Earned Knowledge: Unlock the lore entry!
            if (typeof unlockLoreEntry === 'function') unlockLoreEntry('TACTIC_CUSTOMS_EVASION');
        }
        
        playerCredits = Math.max(0, playerCredits - fine);
        if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
        
        // Huge Notoriety Hit (You are now a criminal)
        if (typeof updatePlayerNotoriety === 'function') updatePlayerNotoriety(5); 

        // Alert Modal
        if (typeof showConfirmationModal === 'function') {
            showConfirmationModal(
                `CUSTOMS ALERT: Contraband detected! Cargo confiscated. Fined ${fine} credits.`,
                () => { /* Just close */ }
            );
        }
        
        logMessage(`<span style="color:#FF4444">CUSTOMS VIOLATION:</span> ${fine}c fine assessed. Contraband seized.`);
        if (typeof renderUIStats === 'function') renderUIStats();
        return false; // Docking denied/interrupted
    } else {
        // --- EVADED ---
        logMessage(`<span style="color:#FFFF00">Scan Complete.</span> Sensors failed to detect concealed cargo.`);
        return true;
    }
}

// ==========================================
// --- CONCORD FACTION SERVICES ---
// ==========================================

function clearConcordBounty() {
    if (playerNotoriety <= 0) {
        showToast("Record Clean. Have a safe flight.", "info");
        return;
    }
    const fine = playerNotoriety * 500;
    if (playerCredits >= fine) {
        playerCredits -= fine;
        playerNotoriety = 0;
        
        if (typeof updateNotorietyTitle === 'function') updateNotorietyTitle();
        if (typeof soundManager !== 'undefined') soundManager.playUIHover();
        showToast(`CLEARED: Paid ${fine}c fine.`, "success");
        if (typeof renderUIStats === 'function') renderUIStats();
        
        // Refresh the station menu so the button updates
        const location = chunkManager.getTile(playerX, playerY);
        if (location && typeof renderStationMenu === 'function') {
            renderStationMenu(location, 'CONCORD');
        }
    } else {
        showToast(`INSUFFICIENT FUNDS (${fine}c required)`, "error");
    }
}

// ==========================================
// --- CONCORD ARMORY (Military Surplus) ---
// ==========================================

function openConcordArmory() {
    openGenericModal("AEGIS ARMORY");
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    // How much reputation is required to shop here?
    const reqRep = 20; 
    const concordRep = playerFactionStanding["CONCORD"] || 0;
    const hasClearance = concordRep >= reqRep;

    // 1. Render the Quartermaster Intro
    detailEl.innerHTML = `
        <div style="text-align:center; padding: 20px;">
            <div style="font-size:60px; margin-bottom:15px; filter: hue-rotate(180deg);">🛡️</div>
            <h3 style="color:var(--accent-color); margin-bottom:10px;">CONCORD MUNITIONS</h3>
            <p style="color:var(--item-desc-color); font-size:13px; line-height:1.5; font-style:italic;">"Authorized personnel only. All equipment is strictly regulated under Concord Martial Law Section 4."</p>
            
            <div style="margin-top: 20px; padding: 15px; background: rgba(0,224,224,0.05); border: 1px solid var(--accent-color); border-radius: 4px;">
                <div style="font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Security Clearance</div>
                <div style="font-size: 18px; font-weight: bold; font-family: var(--title-font); letter-spacing: 2px; color: ${hasClearance ? 'var(--success)' : 'var(--danger)'};">
                    ${hasClearance ? 'AUTHORIZED' : 'DENIED'}
                </div>
                <div style="font-size: 12px; color: var(--text-color); margin-top: 5px;">
                    Reputation: ${concordRep} / ${reqRep}
                </div>
            </div>
        </div>
    `;
    actionsEl.innerHTML = '';
    listEl.innerHTML = '';

    // 2. Fetch Concord Gear from your database
    let concordItems = [];
    for (const compId in COMPONENTS_DATABASE) {
        const comp = COMPONENTS_DATABASE[compId];
        // We look for items specifically branded as Concord
        if (comp.manufacturer === 'CONCORD' || comp.reqFaction === 'CONCORD') {
            concordItems.push({ id: compId, ...comp });
        }
    }

    if (concordItems.length === 0) {
         listEl.innerHTML = `<div style="padding:15px; color:var(--item-desc-color); text-align:center; line-height:1.5;">Shipment delayed. The Armory is currently awaiting new stock.</div>`;
         return;
    }

    // 3. Render the Gear List
    concordItems.forEach(comp => {
        const row = document.createElement('div');
        row.className = 'trade-item-row';
        
        // If they don't have the rep, make the list look locked and ominous
        if (!hasClearance) {
            row.style.opacity = '0.4';
            row.innerHTML = `<span style="color:var(--danger); font-weight:bold;">🔒 RESTRICTED ITEM</span> <span style="color:var(--text-color); font-size:10px;">${comp.slot.toUpperCase()}</span>`;
            row.onclick = () => {
                actionsEl.innerHTML = `<button class="action-button danger-btn" disabled>CLEARANCE LEVEL TOO LOW</button>`;
                if (typeof soundManager !== 'undefined') soundManager.playError();
            };
        } else {
            // Authorized view
            row.innerHTML = `<span style="color:var(--accent-color); font-weight:bold;">${comp.name}</span> <span style="color:var(--gold-text)">${formatNumber(comp.cost)}c</span>`;
            row.onclick = () => showConcordArmoryDetails(comp.id);
        }
        listEl.appendChild(row);
    });
}

function showConcordArmoryDetails(compId) {
    const comp = COMPONENTS_DATABASE[compId];
    
    // We calculate trade-in value just like standard outfitting
    const currentCompId = playerShip.components[comp.slot];
    const currentComp = COMPONENTS_DATABASE[currentCompId];
    
    const tradeInValue = currentComp ? Math.floor(currentComp.cost * 0.5) : 0;
    const netCost = comp.cost - tradeInValue;

    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    detailEl.innerHTML = `
        <div style="padding: 15px; text-align: center;">
            <div style="font-size: 40px; margin-bottom: 10px;">📦</div>
            <h3 style="color:var(--accent-color); margin-top:0; margin-bottom: 5px;">${comp.name.toUpperCase()}</h3>
            
            <div style="background: rgba(0,224,224,0.1); border: 1px solid var(--accent-color); display: inline-block; padding: 4px 8px; border-radius: 2px; font-size: 10px; color: var(--accent-color); margin-bottom: 15px; letter-spacing: 1px;">
                MIL-SPEC ${comp.slot.toUpperCase()}
            </div>
            
            <p style="font-size:13px; color:var(--item-desc-color); margin-bottom: 20px; line-height: 1.5;">${comp.description}</p>
            
            <div class="trade-math-area">
                <div class="trade-stat-row"><span>Requisition Fee:</span> <span>${formatNumber(comp.cost)}c</span></div>
                <div class="trade-stat-row" style="color:#888"><span>Trade-In (${currentComp ? currentComp.name : 'None'}):</span> <span>-${formatNumber(tradeInValue)}c</span></div>
                <div class="trade-stat-row" style="margin-top:10px; border-top:1px dashed var(--border-color); padding-top:10px; font-weight:bold;">
                    <span style="color:var(--text-color);">NET COST:</span> <span style="color:var(--gold-text)">${formatNumber(netCost)}c</span>
                </div>
            </div>
        </div>
    `;

    // Re-use your perfectly working Outfitting logic for the actual purchase!
    if (playerShip.components[comp.slot] === compId) {
        actionsEl.innerHTML = `<button class="action-button" disabled>ALREADY EQUIPPED</button>`;
    } else if (playerCredits < netCost) {
        actionsEl.innerHTML = `<button class="action-button" disabled>INSUFFICIENT FUNDS (${formatNumber(netCost)}c)</button>`;
    } else {
        actionsEl.innerHTML = `
            <button class="action-button" style="border-color:var(--accent-color); color:var(--accent-color); box-shadow: 0 0 15px rgba(0,224,224,0.2);" onclick="confirmBuyComponent('${compId}')">
                AUTHORIZE REQUISITION
            </button>
        `;
    }
}

function requestConcordEscort() {
    openGenericModal("NAVAL COMMAND : ESCORT WING");
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    document.getElementById('genericModalList').innerHTML = ''; // Hide list pane for a focused view

    const cost = 1500;
    const duration = 10;

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 20px;">
            <div style="font-size:60px; margin-bottom:15px; filter: hue-rotate(180deg);">🛡️</div>
            <h3 style="color:var(--accent-color); margin-bottom:10px;">AEGIS ESCORT WING</h3>
            <p style="color:var(--item-desc-color); font-size:13px; line-height:1.5;">
                "Space is dangerous, Commander. For a fee, we can assign a heavy gunship to shadow your vessel and provide covering fire during combat encounters."
            </p>
            <div style="margin-top: 20px; padding: 15px; background: rgba(0, 224, 224, 0.05); border: 1px dashed var(--accent-color); border-radius: 4px;">
                <div style="color: var(--text-color); font-size: 14px; margin-bottom: 8px;">
                    <strong>Contract Duration:</strong> ${duration} Sector Jumps
                </div>
                <div style="color: var(--text-color); font-size: 14px;">
                    <strong>Service Fee:</strong> <span style="color:var(--gold-text)">${cost}c</span>
                </div>
            </div>
        </div>
    `;

    const canAfford = playerCredits >= cost;
    const isAlreadyHired = window.concordEscortJumps && window.concordEscortJumps > 0;

    if (isAlreadyHired) {
        actionsEl.innerHTML = `
            <button class="action-button" disabled>ESCORT ACTIVE (${window.concordEscortJumps} JUMPS LEFT)</button>
            <button class="action-button" onclick="openStationView()">RETURN TO CONCOURSE</button>
        `;
    } else {
        actionsEl.innerHTML = `
            <button class="action-button" style="border-color:var(--accent-color); color:var(--accent-color); box-shadow: 0 0 10px rgba(0,224,224,0.2);" 
                ${!canAfford ? 'disabled' : ''} onclick="executeConcordEscort(${cost}, ${duration})">
                AUTHORIZE CONTRACT
            </button>
            <button class="action-button" onclick="openStationView()">CANCEL</button>
        `;
    }
}

function executeConcordEscort(cost, duration) {
    if (playerCredits < cost) return;
    playerCredits -= cost;
    window.concordEscortJumps = duration; // Global tracker you can hook into script.js!
    
    if (typeof soundManager !== 'undefined') soundManager.playBuy();
    logMessage(`<span style='color:var(--accent-color); font-weight:bold;'>[ AEGIS COMMAND ]</span> Escort wing assigned. They will shadow you for ${duration} jumps.`);
    if (typeof showToast === 'function') showToast("ESCORT WING HIRED", "success");
    
    if (typeof renderUIStats === 'function') renderUIStats();
    openStationView(); // Return to station menu
}

// ==========================================
// --- K'THARR FACTION SERVICES ---
// ==========================================

function openBloodPitsTrade() {
    openGenericModal("THE BLOOD PITS : BIOMATERIALS");
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    document.getElementById('genericModalList').innerHTML = '';

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 20px;">
            <div style="font-size:60px; margin-bottom:15px; color:var(--danger); animation: pulse-danger-subtle 3s infinite;">🧬</div>
            <h3 style="color:var(--danger); margin-bottom:10px;">THE FLESH MARKET</h3>
            <p style="color:var(--item-desc-color); font-size:13px; line-height:1.5;">
                "We don't deal in metal and fuel here. We trade in life, bone, and genetic sequences. Are you looking to buy, outlander?"
            </p>
            <div style="margin-top: 20px; color: var(--text-color); font-size: 14px;">
                <strong>Living Hull Tissue:</strong> <span style="color:var(--gold-text)">2,500c</span>
            </div>
        </div>
    `;

    const canAfford = playerCredits >= 2500;
    
    actionsEl.innerHTML = `
        <button class="action-button" style="border-color:var(--danger); color:var(--danger);" 
            ${!canAfford ? 'disabled' : ''} onclick="executeBloodPitTrade()">
            PURCHASE LIVING HULL TISSUE
        </button>
        <button class="action-button" onclick="openStationView()">LEAVE</button>
    `;
}

function executeBloodPitTrade() {
    if (playerCredits < 2500) return;
    
    // Check if hold is full
    if (typeof currentCargoLoad !== 'undefined' && currentCargoLoad >= PLAYER_CARGO_CAPACITY) {
        if (typeof showToast === 'function') showToast("Cargo Hold Full!", "error");
        return;
    }

    playerCredits -= 2500;
    playerCargo["LIVING_HULL_TISSUE"] = (playerCargo["LIVING_HULL_TISSUE"] || 0) + 1;
    
    if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
    if (typeof soundManager !== 'undefined') soundManager.playGain();
    
    logMessage("<span style='color:var(--danger)'>[ BLOOD PITS ] You purchased a pulsating mass of Living Hull Tissue.</span>");
    if (typeof showToast === 'function') showToast("ACQUIRED LIVING TISSUE", "success");
    
    if (typeof renderUIStats === 'function') renderUIStats();
    openStationView();
}

function challengeKtharrWarlord() {
    openGenericModal("RITE OF COMBAT");
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    document.getElementById('genericModalList').innerHTML = ''; 

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 20px;">
            <div style="font-size:60px; margin-bottom:15px; color:var(--danger);">💀</div>
            <h3 style="color:var(--danger); margin-bottom:10px;">WARLORD CHALLENGE</h3>
            <p style="color:var(--item-desc-color); font-size:13px; line-height:1.5;">
                "You dare challenge the Warlord of Karak-Tor? If you undock now, it is a fight to the death. There is no retreat. No hailing. Only blood."
            </p>
            <div style="margin-top:15px; padding: 10px; background: rgba(255,0,0,0.1); border: 1px solid var(--danger);">
                <p style="color:var(--warning); font-weight:bold; margin:0;">
                    WARNING: THIS IS A DEADLY BOSS ENCOUNTER.
                </p>
            </div>
        </div>
    `;

    actionsEl.innerHTML = `
        <button class="action-button danger-btn" style="box-shadow: 0 0 15px rgba(255,0,0,0.3);" onclick="executeWarlordChallenge()">ACCEPT THE RITE (UNDOCK)</button>
        <button class="action-button" onclick="openStationView()">COWER IN FEAR (Cancel)</button>
    `;
}

function executeWarlordChallenge() {
    closeGenericModal();
    closeStationView();
    
    logMessage("<span style='color:var(--danger); font-weight:bold;'>[ RITE OF COMBAT ] The station alarms blare as you undock. The Warlord's Dreadnought drops into real-space right on top of you!</span>");
    
    // Create a custom Boss Entity overriding standard generation
    const warlord = {
        shipClassKey: "KTHARR_DESTROYER",
        isBoss: true,
        name: "Kaelen's Wrath (Warlord)"
    };
    
    if (typeof startCombat === 'function') {
        setTimeout(() => { startCombat(warlord); }, 1000);
    }
}

function hireEclipseMercenary() {
    openGenericModal("MERCENARY DEN");
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    document.getElementById('genericModalList').innerHTML = '';

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 20px;">
            <div style="font-size:60px; margin-bottom:15px; filter: grayscale(100%);">🗡️</div>
            <h3 style="color:#9933FF; margin-bottom:10px;">SHADOW OPERATIVES</h3>
            <p style="color:var(--item-desc-color); font-size:13px; line-height:1.5;">
                "Need someone who doesn't ask questions? Our operatives increase your ship's combat lethality, but they have... sticky fingers. Expect cargo to go missing occasionally."
            </p>
            <div style="margin-top: 20px; color: var(--text-color); font-size: 14px;">
                <strong>Signing Bonus:</strong> <span style="color:var(--gold-text)">3,000c</span>
            </div>
        </div>
    `;
    
    const hasMerc = window.hasEclipseMerc; // Simple global boolean flag
    const canAfford = playerCredits >= 3000;

    if (hasMerc) {
        actionsEl.innerHTML = `
            <button class="action-button" disabled>OPERATIVE ALREADY HIRED</button>
            <button class="action-button" onclick="openStationView()">RETURN TO CONCOURSE</button>
        `;
    } else {
        actionsEl.innerHTML = `
            <button class="action-button" style="border-color:#9933FF; color:#DDA0DD; box-shadow: 0 0 10px rgba(153, 51, 255, 0.2);" 
                ${!canAfford ? 'disabled' : ''} onclick="executeEclipseMercenary()">
                HIRE OPERATIVE
            </button>
            <button class="action-button" onclick="openStationView()">LEAVE</button>
        `;
    }
}

function executeEclipseMercenary() {
    if (playerCredits < 3000) return;
    playerCredits -= 3000;
    window.hasEclipseMerc = true; // Global tracker
    
    if (typeof soundManager !== 'undefined') soundManager.playBuy();
    logMessage("<span style='color:#9933FF; font-weight:bold;'>[ CARTEL ]</span> A shadow operative has boarded your ship. Combat damage increased, but watch your cargo hold.");
    if (typeof showToast === 'function') showToast("MERCENARY HIRED", "success");
    
    if (typeof renderUIStats === 'function') renderUIStats();
    openStationView();
}

// ==========================================
// --- K'THARR PROVING GROUNDS UI ---
// ==========================================

function openProvingGrounds() {
    openGenericModal("THE BLOOD PITS : ARENA BETTING");
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    // 1. Setup the Gladiators
    const gladiators = [
        { name: "Kaelen's Wrath", species: "K'tharr Warlord", odds: 1.5, winChance: 0.65, icon: "🪓", color: "var(--danger)" },
        { name: "Unit-77", species: "Hacked Loader Mech", odds: 3.0, winChance: 0.35, icon: "🤖", color: "var(--warning)" },
        { name: "The Void-Stalker", species: "Captured Xenomorph", odds: 5.0, winChance: 0.15, icon: "🕷️", color: "#9933FF" }
    ];

    listEl.innerHTML = `<div style="padding:15px; color:var(--danger); font-family:var(--title-font); border-bottom:2px solid var(--danger); text-align:center; letter-spacing:2px;">TODAY'S MATCHES</div>`;
    
    gladiators.forEach((glad, index) => {
        const row = document.createElement('div');
        row.className = 'trade-item-row';
        row.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:24px;">${glad.icon}</span>
                <div>
                    <div style="color:${glad.color}; font-weight:bold; font-size:14px;">${glad.name.toUpperCase()}</div>
                    <div style="color:var(--item-desc-color); font-size:10px;">${glad.species}</div>
                </div>
            </div>
            <div style="color:var(--gold-text); font-weight:bold; font-size:14px;">${glad.odds}x Payout</div>
        `;
        row.onclick = () => showGladiatorDetails(glad);
        listEl.appendChild(row);
    });

    // 2. Default Welcome Screen
    detailEl.innerHTML = `
        <div style="text-align:center; padding: 30px;">
            <div style="font-size:60px; margin-bottom:15px; filter: drop-shadow(0 0 10px rgba(255,0,0,0.5));">⚔️</div>
            <h3 style="color:var(--danger); margin-bottom:10px;">THE RITE OF COMBAT</h3>
            <p style="color:var(--item-desc-color); font-size:13px; line-height:1.5;">
                "Place your credits, outlander. Blood waters the sands of Karak-Tor, and fortune favors the bold."
            </p>
        </div>
    `;
    actionsEl.innerHTML = `<button class="action-button" onclick="openStationView()">LEAVE ARENA</button>`;
}

function showGladiatorDetails(glad) {
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 20px;">
            <div style="font-size:50px; margin-bottom:10px;">${glad.icon}</div>
            <h3 style="color:${glad.color}; margin:0 0 5px 0;">${glad.name.toUpperCase()}</h3>
            
            <div class="trade-math-area" style="border-color:var(--danger); background:rgba(50,0,0,0.2);">
                <div class="trade-stat-row"><span>Current Odds:</span> <span style="color:var(--gold-text); font-weight:bold;">${glad.odds}x Payout</span></div>
                <div class="trade-stat-row"><span>House Take:</span> <span style="color:#888;">10%</span></div>
            </div>
            
            <p style="font-size:12px; color:var(--text-color); margin-top:20px;">Select your wager amount below. All bets are final once the gates open.</p>
        </div>
    `;

    const canBet100 = playerCredits >= 100;
    const canBet500 = playerCredits >= 500;

    actionsEl.innerHTML = `
        <div style="display:flex; gap:10px; width:100%;">
            <button class="action-button" style="flex:1; border-color:var(--danger); color:var(--danger);" ${!canBet100 ? 'disabled' : ''} onclick="processArenaBet(${glad.winChance}, ${glad.odds}, 100)">WAGER 100c</button>
            <button class="action-button" style="flex:1; border-color:var(--danger); color:var(--danger);" ${!canBet500 ? 'disabled' : ''} onclick="processArenaBet(${glad.winChance}, ${glad.odds}, 500)">WAGER 500c</button>
        </div>
        <button class="action-button" style="margin-top:10px;" onclick="openStationView()">CANCEL</button>
    `;
}

function processArenaBet(winChance, odds, betAmount) {
    playerCredits -= betAmount;
    
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    
    // Animate the fight
    detailEl.innerHTML = `
        <div style="text-align:center; padding: 40px;">
            <div style="font-size:50px; animation: shake-effect 0.5s infinite;">💥</div>
            <h3 style="color:var(--warning); margin-top:20px;">COMBAT IN PROGRESS...</h3>
        </div>
    `;
    actionsEl.innerHTML = '';
    if (typeof soundManager !== 'undefined') soundManager.playLaser();

    setTimeout(() => {
        const won = Math.random() < winChance;
        
        if (won) {
            const payout = Math.floor(betAmount * odds);
            playerCredits += payout;
            
            if (typeof soundManager !== 'undefined') soundManager.playGain();
            
            detailEl.innerHTML = `
                <div style="text-align:center; padding: 30px;">
                    <div style="font-size:60px; margin-bottom:15px; color:var(--success);">🏆</div>
                    <h3 style="color:var(--success); margin:0 0 10px 0;">VICTORY!</h3>
                    <p style="color:var(--text-color);">Your champion stands over their defeated foe.</p>
                    <div style="color:var(--gold-text); font-size:24px; font-weight:bold; margin-top:20px;">+${formatNumber(payout)}c</div>
                </div>
            `;
            logMessage(`<span style="color:var(--success)">[ ARENA ] Won wager! Paid out ${formatNumber(payout)} credits.</span>`);
        } else {
            if (typeof soundManager !== 'undefined') soundManager.playError();
            if (typeof triggerHaptic === 'function') triggerHaptic(150);
            
            detailEl.innerHTML = `
                <div style="text-align:center; padding: 30px;">
                    <div style="font-size:60px; margin-bottom:15px; color:var(--danger);">💀</div>
                    <h3 style="color:var(--danger); margin:0 0 10px 0;">DEFEAT.</h3>
                    <p style="color:var(--text-color);">Your champion was brutally executed. The house takes your wager.</p>
                    <div style="color:var(--danger); font-size:20px; font-weight:bold; margin-top:20px;">-${betAmount}c</div>
                </div>
            `;
            logMessage(`<span style="color:var(--danger)">[ ARENA ] Champion defeated. Lost ${betAmount} credits.</span>`);
        }
        
        renderUIStats();
        autoSaveGame();
        
        actionsEl.innerHTML = `<button class="action-button" onclick="openProvingGrounds()">PLACE ANOTHER WAGER</button>`;
    }, 1500);
}

// ==========================================
// --- CREW RECRUITMENT SYSTEM ---
// ==========================================

// Global helper so your Combat and Trade engines can instantly detect your crew's perks!
window.hasCrewPerk = function(perkId) {
    if (!window.playerCrew) return false;
    return window.playerCrew.some(crew => crew.perk === perkId);
};

function openRecruitmentBoard() {
    openGenericModal("CREW RECRUITMENT");
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    // Ensure global arrays exist 
    if (typeof window.playerCrew === 'undefined') window.playerCrew = [];
    
    // Generate new recruits if the station pool is empty
    if (typeof currentStationRecruits === 'undefined' || currentStationRecruits.length === 0) {
        currentStationRecruits = generateStationRecruits();
    }

    listEl.innerHTML = `<div class="trade-list-header" style="color:var(--accent-color); font-size:10px; letter-spacing:2px; margin-bottom:10px; border-bottom:1px solid #333;">AVAILABLE FREELANCERS</div>`;
    
    if (currentStationRecruits.length === 0) {
        listEl.innerHTML += `<div style="padding:15px; color:#888;">No capable spacers are looking for work here today. Try another station.</div>`;
    } else {
        currentStationRecruits.forEach((recruit, index) => {
            const row = document.createElement('div');
            row.className = 'trade-item-row';
            row.style.cursor = 'pointer';
            row.innerHTML = `
                <div style="display:flex; flex-direction:column; gap: 4px;">
                    <span style="color:var(--accent-color); font-weight:bold;">${recruit.name}</span> 
                    <span style="color:var(--item-desc-color); font-size:10px;">${recruit.role}</span>
                </div>
            `;
            row.onclick = () => showRecruitDetails(index);
            listEl.appendChild(row);
        });
    }

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 20px;">
            <div style="font-size:60px; margin-bottom:15px; opacity:0.5;">👨‍🚀</div>
            <h3 style="color:var(--accent-color); margin-bottom:10px;">LOCAL FREELANCERS</h3>
            <p style="color:var(--item-desc-color); font-size:13px; line-height:1.5;">
                Review the dossiers of spacers looking for a bunk on a decent ship. They charge an upfront signing bonus, but their passive perks are permanent.
            </p>
            <div style="margin-top: 20px; font-size: 13px; font-weight: bold; color: var(--gold-text);">
                Current Crew Size: ${window.playerCrew.length} / 3
            </div>
        </div>
    `;
    actionsEl.innerHTML = `<button class="action-button" onclick="visitCantina()">BACK TO CANTINA</button>`;
}

function generateStationRecruits() {
    const recruits = [];
    const count = Math.floor(Math.random() * 3) + 1; // 1 to 3 recruits

    const names = ["Jax Vane", "Elara Vance", "Kaelen Tor", "Voss", "Nyx", "Garrick", "Tali Sol", "Soren", "Rya Cort"];
    const roles = [
        { role: "Gunnery Chief", perk: "COMBAT_DAMAGE", desc: "Increases all ship weapon damage by 15%.", cost: 1500, icon: "🎯" },
        { role: "Quartermaster", perk: "TRADE_BONUS", desc: "Negotiates 10% better prices at all stations.", cost: 2000, icon: "⚖️" },
        { role: "Chief Engineer", perk: "SHIELD_BOOST", desc: "Increases maximum shield capacity by 25%.", cost: 1800, icon: "🔧" },
        { role: "Astrogator", perk: "FUEL_EFFICIENCY", desc: "Reduces fuel consumption for sector jumps.", cost: 1200, icon: "🗺️" }
    ];

    // Shuffle names array to ensure we don't get duplicates at the same station
    names.sort(() => 0.5 - Math.random());

    for (let i = 0; i < count; i++) {
        const roleData = roles[Math.floor(Math.random() * roles.length)];
        recruits.push({
            name: names[i],
            role: roleData.role,
            perk: roleData.perk,
            desc: roleData.desc,
            cost: roleData.cost,
            icon: roleData.icon
        });
    }
    return recruits;
}

function showRecruitDetails(index) {
    const recruit = currentStationRecruits[index];
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 20px;">
            <div style="font-size:50px; margin-bottom:10px;">${recruit.icon}</div>
            <h3 style="color:var(--accent-color); margin:0 0 5px 0;">${recruit.name.toUpperCase()}</h3>
            
            <div style="background: rgba(0,224,224,0.1); border: 1px solid var(--accent-color); display: inline-block; padding: 4px 8px; border-radius: 2px; font-size: 10px; color: var(--accent-color); margin-bottom: 15px; letter-spacing: 1px;">
                ${recruit.role.toUpperCase()}
            </div>
            
            <p style="font-size:13px; color:var(--text-color); margin-bottom: 20px; line-height: 1.5;">"${recruit.desc}"</p>
            
            <div class="trade-math-area" style="text-align:left;">
                <div class="trade-stat-row"><span>Signing Bonus:</span> <span style="color:var(--gold-text); font-weight:bold;">${formatNumber(recruit.cost)}c</span></div>
                <div class="trade-stat-row"><span>Granted Perk:</span> <span style="color:var(--success);">${recruit.perk}</span></div>
            </div>
        </div>
    `;

    const canAfford = playerCredits >= recruit.cost;
    const hasSpace = window.playerCrew.length < 3; // Hard limit of 3 crew members

    if (!hasSpace) {
        actionsEl.innerHTML = `<button class="action-button" disabled>CREW QUARTERS FULL</button>`;
    } else if (!canAfford) {
        actionsEl.innerHTML = `<button class="action-button" disabled>INSUFFICIENT FUNDS (${formatNumber(recruit.cost)}c)</button>`;
    } else {
        actionsEl.innerHTML = `
            <button class="action-button" style="border-color:var(--accent-color); color:var(--accent-color); box-shadow: 0 0 10px rgba(0,224,224,0.2);" onclick="hireRecruit(${index})">
                HIRE CREW MEMBER
            </button>
        `;
    }
    actionsEl.innerHTML += `<button class="action-button" onclick="openRecruitmentBoard()">CANCEL</button>`;
}

function hireRecruit(index) {
    const recruit = currentStationRecruits[index];
    if (playerCredits < recruit.cost || window.playerCrew.length >= 3) return;

    // 1. Process the Transaction
    playerCredits -= recruit.cost;
    window.playerCrew.push(recruit); // Add to your ship's roster
    
    // 2. Remove them from the local station pool so you can't hire them twice
    currentStationRecruits.splice(index, 1);
    
    // 3. Audio & Visual Feedback
    if (typeof soundManager !== 'undefined') soundManager.playBuy();
    logMessage(`<span style="color:var(--success); font-weight:bold;">[ RECRUITMENT ]</span> ${recruit.name} (${recruit.role}) has joined your crew!`);
    if (typeof showToast === 'function') showToast("CREW HIRED", "success");
    
    // 4. Update the HUD and Force the Menu to Redraw
    if (typeof applyPlayerShipStats === 'function') applyPlayerShipStats(); // Re-calculate stats in case they have a passive buff!
    if (typeof renderUIStats === 'function') renderUIStats();
    
    openRecruitmentBoard(); // Refresh the board so the buttons match the new array!
}
