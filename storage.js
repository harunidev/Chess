/**
 * Storage Manager
 * Handles localStorage-based caching and user progress tracking
 */

class Storage {
    constructor() {
        this.cache = new CacheManager();
        this.stats = new StatsManager();
    }
}

/**
 * Cache Manager for API responses
 */
class CacheManager {
    /**
     * Get cached data
     * @param {string} key - Cache key
     * @returns {any|null} Cached data or null if expired/not found
     */
    get(key) {
        try {
            const item = localStorage.getItem(`cache_${key}`);
            if (!item) return null;

            const { data, expiry } = JSON.parse(item);

            // Check if expired
            if (Date.now() > expiry) {
                localStorage.removeItem(`cache_${key}`);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }

    /**
     * Set cache data
     * @param {string} key - Cache key
     * @param {any} data - Data to cache
     * @param {number} ttl - Time to live in milliseconds (default: 1 hour)
     */
    set(key, data, ttl = 3600000) {
        try {
            const item = {
                data,
                expiry: Date.now() + ttl
            };
            localStorage.setItem(`cache_${key}`, JSON.stringify(item));
        } catch (error) {
            console.error('Cache set error:', error);
            // If quota exceeded, clear old cache
            if (error.name === 'QuotaExceededError') {
                this.clearOldest();
                // Try again
                try {
                    const item = {
                        data,
                        expiry: Date.now() + ttl
                    };
                    localStorage.setItem(`cache_${key}`, JSON.stringify(item));
                } catch (e) {
                    console.error('Failed to cache after clearing:', e);
                }
            }
        }
    }

    /**
     * Clear all cached data
     */
    clear() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('cache_')) {
                localStorage.removeItem(key);
            }
        });
    }

    /**
     * Clear oldest cache entries (when quota exceeded)
     */
    clearOldest() {
        const cacheKeys = Object.keys(localStorage)
            .filter(key => key.startsWith('cache_'))
            .map(key => {
                try {
                    const item = JSON.parse(localStorage.getItem(key));
                    return { key, expiry: item.expiry };
                } catch {
                    return { key, expiry: 0 };
                }
            })
            .sort((a, b) => a.expiry - b.expiry);

        // Remove oldest 10 entries
        const toRemove = cacheKeys.slice(0, 10);
        toRemove.forEach(({ key }) => localStorage.removeItem(key));
    }

    /**
     * Get cache size info
     * @returns {Object} Cache statistics
     */
    getInfo() {
        const keys = Object.keys(localStorage).filter(key => key.startsWith('cache_'));
        let totalSize = 0;

        keys.forEach(key => {
            const item = localStorage.getItem(key);
            if (item) {
                totalSize += item.length * 2; // UTF-16 characters = 2 bytes each
            }
        });

        return {
            count: keys.length,
            sizeKB: (totalSize / 1024).toFixed(2)
        };
    }
}

/**
 * Statistics Manager for user progress
 */
class StatsManager {
    /**
     * Get all puzzle statistics
     * @returns {Object} Puzzle stats
     */
    getPuzzleStats() {
        try {
            const stats = localStorage.getItem('puzzle_stats');
            return stats ? JSON.parse(stats) : {};
        } catch (error) {
            console.error('Error loading puzzle stats:', error);
            return {};
        }
    }

    /**
     * Save puzzle solve result
     * @param {string} puzzleId - Puzzle ID
     * @param {boolean} solved - Whether puzzle was solved correctly
     * @param {number} timeMs - Time taken in milliseconds
     */
    savePuzzleSolve(puzzleId, solved, timeMs) {
        try {
            const stats = this.getPuzzleStats();
            stats[puzzleId] = {
                solved,
                timeMs,
                date: Date.now()
            };
            localStorage.setItem('puzzle_stats', JSON.stringify(stats));
        } catch (error) {
            console.error('Error saving puzzle stats:', error);
        }
    }

    /**
     * Get puzzle statistics summary
     * @returns {Object} Summary statistics
     */
    getPuzzleSummary() {
        const stats = this.getPuzzleStats();
        const entries = Object.values(stats);

        if (entries.length === 0) {
            return {
                total: 0,
                solved: 0,
                failed: 0,
                solveRate: 0,
                avgTime: 0
            };
        }

        const solved = entries.filter(e => e.solved).length;
        const failed = entries.length - solved;
        const totalTime = entries.reduce((sum, e) => sum + e.timeMs, 0);

        return {
            total: entries.length,
            solved,
            failed,
            solveRate: ((solved / entries.length) * 100).toFixed(1),
            avgTime: Math.round(totalTime / entries.length / 1000) // seconds
        };
    }

    /**
     * Get tutorial progress
     * @returns {Object} Tutorial completion state
     */
    getTutorialProgress() {
        try {
            const progress = localStorage.getItem('tutorial_progress');
            return progress ? JSON.parse(progress) : {};
        } catch (error) {
            console.error('Error loading tutorial progress:', error);
            return {};
        }
    }

    /**
     * Save tutorial completion
     * @param {string} openingName - Opening name
     * @param {boolean} completed - Whether completed successfully
     */
    saveTutorialProgress(openingName, completed) {
        try {
            const progress = this.getTutorialProgress();
            progress[openingName] = {
                completed,
                date: Date.now()
            };
            localStorage.setItem('tutorial_progress', JSON.stringify(progress));
        } catch (error) {
            console.error('Error saving tutorial progress:', error);
        }
    }

    /**
     * Clear all statistics
     */
    clearAll() {
        localStorage.removeItem('puzzle_stats');
        localStorage.removeItem('tutorial_progress');
    }

    /**
     * Export statistics as JSON
     * @returns {string} JSON string of all stats
     */
    exportStats() {
        return JSON.stringify({
            puzzles: this.getPuzzleStats(),
            tutorials: this.getTutorialProgress(),
            exportDate: new Date().toISOString()
        }, null, 2);
    }

    /**
     * Import statistics from JSON
     * @param {string} jsonString - JSON string to import
     */
    importStats(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data.puzzles) {
                localStorage.setItem('puzzle_stats', JSON.stringify(data.puzzles));
            }
            if (data.tutorials) {
                localStorage.setItem('tutorial_progress', JSON.stringify(data.tutorials));
            }
            return true;
        } catch (error) {
            console.error('Error importing stats:', error);
            return false;
        }
    }
}

// Create global instance
const storage = new Storage();
