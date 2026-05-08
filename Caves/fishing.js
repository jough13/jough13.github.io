// ==========================================
// FISHING SYSTEM
// ==========================================

function executeFishing() {
    const currentTile = chunkManager.getTile(gameState.player.x, gameState.player.y);

    // Check if standing on water (Deep Water or Swamp)
    if (currentTile !== '~' && currentTile !== '≈') {
        logMessage("You need to be standing in water or sailing to fish.");
        return false;
    }

    // 1. Stamina Check
    if (gameState.player.stamina < 2) {
        logMessage("You are too tired to fish.");
        return false;
    }
    
    // Deduct stamina for casting
    gameState.player.stamina -= 2;
    triggerStatFlash(statDisplays.stamina, false);

    const isDeepSea = gameState.player.isSailing;
    
    // 2. Calculate Success
    // Base 40% + 2% per Dex + 2% per Luck. Deep sea adds 20% bonus because fish are plentiful!
    const chance = 0.40 + (gameState.player.dexterity * 0.02) + (gameState.player.luck * 0.02) + (isDeepSea ? 0.20 : 0);

    logMessage(isDeepSea ? "You cast your heavy line into the dark abyss..." : "You cast your line...");

    if (Math.random() < chance) {
        // 3. Loot Table
        const roll = Math.random();
        let catchName = 'Raw Fish';
        let catchTile = '🐟';

        if (isDeepSea) {
            // --- DEEP SEA LOOT ---
            if (roll > 0.90) { // 10% chance for Abyssal Treasure
                const treasures = [
                    { n: 'Kraken Ink Sac', t: '🐙' },
                    { n: 'Black Pearl', t: '💎b' },
                    { n: 'Rainbow Shell', t: '🐚' }
                ];
                const t = treasures[Math.floor(Math.random() * treasures.length)];
                catchName = t.n;
                catchTile = t.t;
                logMessage(`{gold:A massive tug! You hauled up a ${catchName}!}`);
                grantXp(50);
            } else if (roll < 0.15) {
                catchName = 'Rusted Anchor';
                catchTile = '⚓';
                logMessage("You snagged something heavy... a Rusted Anchor.");
            } else {
                logMessage("You caught a plump ocean fish!");
                grantXp(10);
            }
        } else {
            // --- SHALLOW WATER LOOT ---
            if (roll > 0.95) {
                const treasures = [
                    { n: 'Ring of Regeneration', t: '💍r' },
                    { n: 'Ancient Coin', t: '🪙' },
                    { n: 'Empty Bottle', t: '🫙' }
                ];
                const t = treasures[Math.floor(Math.random() * treasures.length)];
                catchName = t.n; catchTile = t.t;
                logMessage(`You pull up something heavy... It's a ${catchName}!`);
                grantXp(20);
            } else if (roll < 0.15) {
                catchName = 'Soggy Boot'; catchTile = '👢s';
                logMessage("Ugh, just an old boot.");
            } else {
                logMessage("You caught a fish!");
                grantXp(5);
            }
        }

        // Add to Inventory
        if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
            const template = Object.values(ITEM_DATA).find(i => i.name === catchName);
            gameState.player.inventory.push({
                name: catchName,
                type: template ? (template.type || 'junk') : 'junk',
                quantity: 1,
                tile: catchTile,
                defense: template ? template.defense : null,
                statBonuses: template ? template.statBonuses : null,
                effect: template ? template.effect : null
            });
        } else {
            logMessage("...but you have no room to keep it, so you throw it back.");
        }
    } else {
        logMessage("...not even a nibble.");
    }

    // Return true because the action took a turn (consumed stamina)
    return true; 
}
