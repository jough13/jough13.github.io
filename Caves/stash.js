
window.handleStashTransfer = function (action, index) {
    const player = gameState.player;
    if (!player.bank) player.bank = [];

    if (action === 'deposit') {
        const item = player.inventory[index];

        // --- PREVENT DEPOSITING EQUIPPED GEAR ---
        if (item.isEquipped) {
            logMessage("You must unequip that item before stashing it.");
            return;
        }

        // Check if item exists in bank
        const bankItem = player.bank.find(i => i.name === item.name);
        if (bankItem) {
            bankItem.quantity += item.quantity;
        } else {
            player.bank.push(JSON.parse(JSON.stringify(item))); // Deep copy
        }
        player.inventory.splice(index, 1);
        logMessage(`Deposited ${item.name}.`);
    }
    else if (action === 'withdraw') {
        const item = player.bank[index];
        if (player.inventory.length >= MAX_INVENTORY_SLOTS) {
            logMessage("Your inventory is full!");
            return;
        }
        // Deep copy
        let withdrawnItem = JSON.parse(JSON.stringify(item));

        // RE-BIND EFFECT LOGIC
        const template = Object.values(ITEM_DATA).find(i => i.name === withdrawnItem.name);
        if (template && template.effect) {
            withdrawnItem.effect = template.effect;
        }

        // Check if item exists in inventory
        const invItem = player.inventory.find(i => i.name === item.name);
        if (invItem) {
            invItem.quantity += item.quantity;
        } else {
            player.inventory.push(withdrawnItem); // Push the re-bound item
        }
        player.bank.splice(index, 1);
        logMessage(`Withdrew ${item.name}.`);
    }

    // Save and Render
    playerRef.update({ inventory: player.inventory, bank: player.bank });
    renderStash();
    renderInventory();
};

function renderStash() {
    stashPlayerList.innerHTML = '';
    stashBankList.innerHTML = '';

    // Render Player Inventory (Deposit)
    gameState.player.inventory.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'shop-item';
        li.innerHTML = `
            <span>${item.name} (x${item.quantity})</span>
            <button class="text-xs bg-green-600 text-white px-2 py-1 rounded" onclick="handleStashTransfer('deposit', ${index})">Deposit</button>
        `;
        stashPlayerList.appendChild(li);
    });

    // Render Bank (Withdraw)
    const bank = gameState.player.bank || [];
    if (bank.length === 0) {
        stashBankList.innerHTML = '<li class="italic text-sm text-gray-500">Stash is empty.</li>';
    } else {
        bank.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'shop-item';
            li.innerHTML = `
                <span>${item.name} (x${item.quantity})</span>
                <button class="text-xs bg-blue-600 text-white px-2 py-1 rounded" onclick="handleStashTransfer('withdraw', ${index})">Withdraw</button>
            `;
            stashBankList.appendChild(li);
        });
    }
}

function openStashModal() {
    if (typeof inputQueue !== 'undefined') inputQueue.length = 0; 
    
    renderStash();
    stashModal.classList.remove('hidden');
}
