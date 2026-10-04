// expansions/SwarmDynamics.js
import { MathUtils, Structure } from '../game.js';

// ==========================================
// 1. SWARM PHYSICS CONFIGURATION
// ==========================================
const SWARM_CONFIG = {
    separationForce: 0.4, // How bouncy/squishy the bugs feel when pushing each other
    structureMass: 1.0,   // Buildings don't move, so they push bugs away with 100% force
    unitMass: 0.5,        // Bugs push each other equally (50% force each)
    cellSize: 250         // MUST match the CELL_SIZE in game.js spatialGrid!
};

export const SwarmDynamicsExpansion = {
    init: (game) => {
        console.log("%c[Engine] Swarm Dynamics (Boids Separation) Online.", "color: #00ffcc;");
    },

    patch: (game) => {
        // We patch the main Game loop to run a global physics pass AFTER all units have moved.
        game.expansions.patchClass(game.constructor, 'update', function(original) {
            
            // 1. Run the normal game logic (Moves units, builds spatial grid, does combat)
            original.call(this);
            
            if (this.gameState !== 'playing') return;

            // 2. THE SWARM PHYSICS PASS
            for (let i = 0; i < this.entities.length; i++) {
                let e = this.entities[i];
                
                // Fast Early Exits: 
                // Don't apply physics to dead things, buildings, projectiles, spells, or particles.
                // We only want to move living, physical units (Spiders, Queens, Bosses, Critters)
                if (!e.hp || e.hp <= 0 || e instanceof Structure || e.isConstructing) continue;
                if (!e.size || e.damage === undefined && !e.fleeMultiplier) continue; 
                
                let repX = 0;
                let repY = 0;
                let pushCount = 0;

                // Find which spatial cell this unit is currently in
                const cx = Math.max(0, Math.floor(e.x / SWARM_CONFIG.cellSize));
                const cy = Math.max(0, Math.floor(e.y / SWARM_CONFIG.cellSize));

                // 9-Cell Grid Scan (Checks current cell + all 8 surrounding neighbors)
                for (let nx = cx - 1; nx <= cx + 1; nx++) {
                    if (nx < 0) continue;
                    for (let ny = cy - 1; ny <= cy + 1; ny++) {
                        if (ny < 0) continue;
                        
                        // ZERO-ALLOCATION BITWISE LOOKUP
                        const key = (nx << 16) | ny;
                        const cell = this.spatialGrid.get(key);
                        if (!cell) continue;

                        // Check collisions against everything in this cell
                        for (let j = 0; j < cell.length; j++) {
                            let other = cell[j];
                            
                            // Don't collide with self, dead things, or non-physical spells/projectiles
                            if (other === e || !other.size || other.hp <= 0) continue;
                            if (other.active !== undefined && other.speed && !other.role) continue; // Skips projectiles
                            if (other.captureRadius) continue; // Skips Control Points

                            const dx = e.x - other.x;
                            const dy = e.y - other.y;
                            const distSq = (dx * dx) + (dy * dy);
                            
                            // Calculate exact touching distance
                            const desiredDist = e.size + other.size;
                            const desiredDistSq = desiredDist * desiredDist;

                            // If overlapping, calculate the repulsive force!
                            if (distSq < desiredDistSq && distSq > 0.01) {
                                const dist = Math.sqrt(distSq);
                                const overlap = desiredDist - dist;
                                
                                // Heavier things push harder. Buildings don't move, so they shove bugs out of the way.
                                const massFactor = (other instanceof Structure) ? SWARM_CONFIG.structureMass : SWARM_CONFIG.unitMass;
                                
                                repX += (dx / dist) * overlap * massFactor;
                                repY += (dy / dist) * overlap * massFactor;
                                pushCount++;
                            }
                        }
                    }
                }

                // 3. APPLY PHYSICS VECTOR
                if (pushCount > 0) {
                    e.x += repX * SWARM_CONFIG.separationForce;
                    e.y += repY * SWARM_CONFIG.separationForce;
                    
                    // Ensure physics explosions don't knock units off the edge of the world
                    const bnd = e.size * 2;
                    e.x = MathUtils.clamp(e.x, bnd, this.world.width - bnd);
                    e.y = MathUtils.clamp(e.y, bnd, this.world.height - bnd);
                }
            }
        });
    }
};
