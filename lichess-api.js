/**
 * Lichess API Client
 * Handles all interactions with Lichess REST API
 * No authentication required for read-only endpoints
 */

class LichessAPI {
    constructor() {
        this.explorerBaseUrl = 'https://explorer.lichess.ovh';
        this.apiBaseUrl = 'https://lichess.org/api';
        this.storage = new Storage();
    }

    /**
     * Get master games for a position
     * @param {string} fen - Position in FEN notation
     * @returns {Promise<Object>} Master games data
     */
    async getMasterGames(fen) {
        const cacheKey = `master_${fen}`;
        const cached = this.storage.cache.get(cacheKey);
        if (cached) {
            console.log('Cache hit for master games:', fen);
            return cached;
        }

        try {
            const cleanFen = this.cleanFEN(fen);
            const url = `${this.explorerBaseUrl}/masters?fen=${encodeURIComponent(cleanFen)}`;
            const response = await fetch(url);

            if (response.status === 429) {
                return { error: 'too_many_requests', moves: [], topGames: [] };
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            // Cache for 1 hour
            this.storage.cache.set(cacheKey, data, 3600000);

            return data;
        } catch (error) {
            console.error('Error fetching master games:', error);
            return { error: 'network_error', moves: [], topGames: [] };
        }
    }

    /**
     * Get Lichess games for a position
     * @param {string} fen - Position in FEN notation
     * @param {Array<string>} ratings - Rating groups to filter
     * @param {Array<string>} speeds - Game speeds to include
     * @returns {Promise<Object>} Lichess games data
     */
    async getLichessGames(fen, ratings = ['2000', '2200', '2500'], speeds = ['blitz', 'rapid', 'classical']) {
        const cacheKey = `lichess_${fen}_${ratings.join(',')}_${speeds.join(',')}`;
        const cached = this.storage.cache.get(cacheKey);
        if (cached) {
            console.log('Cache hit for Lichess games:', fen);
            return cached;
        }

        try {
            const cleanFen = this.cleanFEN(fen);
            const ratingsParam = ratings.join(',');
            const speedsParam = speeds.join(',');
            const url = `${this.explorerBaseUrl}/lichess?fen=${encodeURIComponent(cleanFen)}&ratings=${ratingsParam}&speeds=${speedsParam}`;

            const response = await fetch(url);

            if (response.status === 429) {
                return { error: 'too_many_requests', moves: [], recentGames: [] };
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            // Cache for 1 hour
            this.storage.cache.set(cacheKey, data, 3600000);

            return data;
        } catch (error) {
            console.error('Error fetching Lichess games:', error);
            return { error: 'network_error', moves: [], recentGames: [] };
        }
    }

    /**
     * Get daily puzzle
     * @returns {Promise<Object>} Daily puzzle data
     */
    async getDailyPuzzle() {
        const cacheKey = 'daily_puzzle';
        const cached = this.storage.cache.get(cacheKey);
        if (cached) {
            console.log('Cache hit for daily puzzle');
            return cached;
        }

        try {
            const url = `${this.apiBaseUrl}/puzzle/daily`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            // Cache for 24 hours
            this.storage.cache.set(cacheKey, data, 86400000);

            return data;
        } catch (error) {
            console.error('Error fetching daily puzzle:', error);
            return { error: 'network_error' };
        }
    }

    /**
     * Get a specific game in PGN format
     * @param {string} gameId - Lichess game ID
     * @returns {Promise<string>} PGN string
     */
    async getGame(gameId) {
        const cacheKey = `game_${gameId}`;
        const cached = this.storage.cache.get(cacheKey);
        if (cached) {
            console.log('Cache hit for game:', gameId);
            return cached;
        }

        try {
            const url = `https://lichess.org/game/export/${gameId}?literate=true`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const pgn = await response.text();

            // Cache for 1 week (games don't change)
            this.storage.cache.set(cacheKey, pgn, 604800000);

            return pgn;
        } catch (error) {
            console.error('Error fetching game:', error);
            return '';
        }
    }

    /**
     * Clean FEN string for API queries
     * Remove move counters as they're not needed for position matching
     * @param {string} fen - Full FEN string
     * @returns {string} Cleaned FEN
     */
    cleanFEN(fen) {
        // FEN format: position active_color castling en_passant halfmove fullmove
        // We only need: position active_color castling en_passant
        const parts = fen.split(' ');
        if (parts.length >= 4) {
            return parts.slice(0, 4).join(' ');
        }
        return fen;
    }

    /**
     * Get user-friendly error message
     * @param {string} errorType - Error type from API response
     * @returns {string} Localized error message
     */
    getErrorMessage(errorType) {
        const messages = {
            'too_many_requests': 'Çok fazla istek gönderildi. Lütfen bir süre bekleyin...',
            'network_error': 'Bağlantı hatası. İnternet bağlantınızı kontrol edin.',
            'not_found': 'Veri bulunamadı.',
            'default': 'Bir hata oluştu. Lütfen tekrar deneyin.'
        };

        return messages[errorType] || messages['default'];
    }

    /**
     * Check if response has error
     * @param {Object} response - API response
     * @returns {boolean} True if error exists
     */
    hasError(response) {
        return response && response.error !== undefined;
    }
}

// Create global instance
const lichessAPI = new LichessAPI();
