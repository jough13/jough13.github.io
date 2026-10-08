// expansions/SwarmDynamics.js
import { MathUtils, Structure } from '../game.js';

// ==========================================
// 1. SWARM PHYSICS CONFIGURATION
// ==========================================
// [EXPANDABILITY] Exported config so other mods can tweak the physics engine feel
export const SWARM_CONFIG = {
    separationForce: 0.4, // How bouncy/squishy the bugs feel when pushing each other
    structureMass: 1.0,   // Buildings don't move, so they push bugs away with 100% force
    unitMass: 0.5,        // Bugs push each other equally (50% force each)
    cellSize: 250,        // MUST match the CELL_SIZE in game.js spatialGrid!
    scrambleWobble: 0.05  // How much rotation gets disrupted when crammed together
};

export const SwarmDynamicsExpansion = {
    init: (game) => {
        // Expose to game object
        game.swarmConfig = SWARM_CONFIG;
        console.log("%c[Engine] Swarm Dynamics (Boids Separation) Online.", "color: #00ffcc;");
    },

    patch: (game) => {
        // We patch the main Game loop to run a global physics pass AFTER all units have moved.
        game.expansions.patchClass(game.constructor, 'update', function(original) {
            
            // 1. Run the normal game logic (Moves units, builds spatial grid, does combat)
            original.call(this);
            
            if (this.gameState !== 'playing') return;

            // [PERFORMANCE] Cache object properties locally for the massive loop
            const cellSize = SWARM_CONFIG.cellSize;
            const maxGridX = Math.ceil(this.world.width / cellSize);
            const maxGridY = Math.ceil(this.world.height / cellSize);

            // 2. THE SWARM PHYSICS PASS
            for (let i = 0; i < this.entities.length; i++) {
                let e = this.entities[i];
                
                // Fast Early Exits: 
                // Don't apply physics to dead things, buildings, projectiles, spells, or particles.
                // We only want to move living, physical units (Spiders, Queens, Bosses, Critters)
                if (e.hp === undefined || e.hp <= 0 || e instanceof Structure || e.isConstructing) continue;
                if (!e.size || (e.damage === undefined && !e.fleeMultiplier)) continue; 
                
                let repX = 0;
                let repY = 0;
                let pushCount = 0;

                // [PERFORMANCE] Clamped bitwise lookup
                const cx = MathUtils.clamp((e.x / cellSize) | 0, 0, maxGridX);
                const cy = MathUtils.clamp((e.y / cellSize) | 0, 0, maxGridY);

                // 9-Cell Grid Scan (Checks current cell + all 8 surrounding neighbors)
                for (let nx = cx - 1; nx <= cx + 1; nx++) {
                    if (nx < 0 || nx > maxGridX) continue;
                    for (let ny = cy - 1; ny <= cy + 1; ny++) {
                        if (ny < 0 || ny > maxGridY) continue;
                        
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
                            if (other.captureRadius !== undefined) continue; // Skips Control Points

                            let dx = e.x - other.x;
                            let dy = e.y - other.y;
                            
                            // Calculate exact touching distance
                            const desiredDist = e.size + other.size;
                            
                            // [PERFORMANCE] Fast AABB Check!
                            // Skips the expensive distance/sqrt math completely if they aren't even close
                            if (Math.abs(dx) > desiredDist || Math.abs(dy) > desiredDist) continue;

                            let distSq = (dx * dx) + (dy * dy);
                            const desiredDistSq = desiredDist * desiredDist;

                            // If overlapping, calculate the repulsive force!
                            if (distSq < desiredDistSq) {
                                
                                // PHYSICS POLISH (ANTI-STACKING): 
                                // If units spawn on the exact same pixel (distSq is 0), push them apart randomly!
                                if (distSq < 0.01) {
                                    dx = (Math.random() - 0.5) * 2;
                                    dy = (Math.random() - 0.5) * 2;
                                    distSq = (dx * dx) + (dy * dy);
                                }

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
                    
                    // [JUICE] The "Scramble" effect!
                    // If a spider is being crushed by multiple bugs around it, it visually scrambles/wobbles!
                    if (pushCount > 1 && e.angle !== undefined) {
                        e.angle += (Math.random() - 0.5) * SWARM_CONFIG.scrambleWobble * pushCount;
                        e.angle = MathUtils.angleWrap(e.angle);
                    }
                    
                    // Ensure physics explosions don't knock units off the edge of the world
                    const bnd = e.size * 2;
                    e.x = MathUtils.clamp(e.x, bnd, this.world.width - bnd);
                    e.y = MathUtils.clamp(e.y, bnd, this.world.height - bnd);
                }
            }
        });
    }
};
