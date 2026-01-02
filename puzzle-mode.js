/**
 * Puzzle Mode - Chess Tactics Training
 * Integrates with Lichess API for puzzles
 */

class PuzzleMode {
    constructor() {
        this.currentPuzzle = null;
        this.startTime = null;
        this.hintsUsed = 0;
        this.moveIndex = 0;
        this.stats = storage.stats;

        // Embedded puzzles as fallback (offline mode)
        this.embeddedPuzzles = this.loadEmbeddedPuzzles();
        this.embeddedIndex = 0;
    }

    /**
     * Start puzzle mode
     */
    async start() {
        await this.loadNextPuzzle();
        this.render();
    }

    /**
     * Load next puzzle (tries daily puzzle first, then embedded)
     */
    async loadNextPuzzle() {
        this.startTime = Date.now();
        this.hintsUsed = 0;
        this.moveIndex = 0;

        // Try daily puzzle first
        const dailyPuzzle = await lichessAPI.getDailyPuzzle();

        if (!lichessAPI.hasError(dailyPuzzle)) {
            const parsed = this.parseLichessPuzzle(dailyPuzzle);
            if (parsed) {
                this.currentPuzzle = parsed;
                console.log('✅ Loaded daily puzzle:', parsed.id);
            } else {
                // Parse failed, use embedded
                console.warn('⚠️ Failed to parse daily puzzle, using embedded');
                this.currentPuzzle = this.embeddedPuzzles[this.embeddedIndex];
                this.embeddedIndex = (this.embeddedIndex + 1) % this.embeddedPuzzles.length;
            }
        } else {
            // API error, fallback to embedded puzzles
            console.warn('⚠️ API error, using embedded puzzle');
            this.currentPuzzle = this.embeddedPuzzles[this.embeddedIndex];
            this.embeddedIndex = (this.embeddedIndex + 1) % this.embeddedPuzzles.length;
        }

        this.setupBoard();
    }

    /**
     * Parse Lichess puzzle API response
     */
    parseLichessPuzzle(data) {
        // Extract FEN from game.fen or puzzle.fen
        const fen = data.game?.fen || data.puzzle?.fen || null;

        if (!fen) {
            console.error('No FEN found in puzzle data:', data);
            return null;
        }

        return {
            id: data.puzzle.id,
            fen: fen,
            rating: data.puzzle.rating,
            themes: data.puzzle.themes,
            solution: data.puzzle.solution, // Array of UCI moves
            initialPly: data.puzzle.initialPly
        };
    }

    /**
     * Setup board with puzzle position
     */
    setupBoard() {
        if (!this.currentPuzzle) {
            console.error('❌ No currentPuzzle available!');
            return;
        }

        console.log('🎯 Setting up board with FEN:', this.currentPuzzle.fen);

        // Create new chess engine instance for puzzle
        window.puzzleEngine = new ChessEngine();
        const loaded = puzzleEngine.loadFromFEN(this.currentPuzzle.fen);

        if (!loaded) {
            console.error('❌ Failed to load FEN:', this.currentPuzzle.fen);
            return;
        }

        console.log('✅ FEN loaded successfully');

        // Render board
        this.renderBoard();

        // Show puzzle info
        this.updatePuzzleInfo();

        console.log('✅ Board rendered and info updated');
    }

    /**
     * Render the chess board for puzzle
     */
    renderBoard() {
        const boardElement = document.getElementById('puzzle-board');
        if (!boardElement) return;

        boardElement.innerHTML = '';

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
                square.dataset.row = row;
                square.dataset.col = col;

                // Add piece if exists
                const piece = puzzleEngine.board[row][col];
                if (piece) {
                    const pieceElement = document.createElement('div');
                    pieceElement.className = `piece ${piece.color}`;
                    pieceElement.textContent = this.getPieceSymbol(piece);
                    pieceElement.dataset.piece = `${piece.color}_${piece.type}`;
                    square.appendChild(pieceElement);
                }

                square.addEventListener('click', (e) => this.handleSquareClick(row, col, e));
                boardElement.appendChild(square);
            }
        }
    }

    /**
     * Handle square click for move input
     */
    handleSquareClick(row, col, event) {
        if (!window.selectedSquare) {
            // Select piece
            const piece = puzzleEngine.board[row][col];
            if (piece && piece.color === puzzleEngine.currentPlayer) {
                window.selectedSquare = { row, col };
                this.highlightSquare(row, col, 'selected');
                this.showValidMoves(row, col);
            }
        } else {
            // Try to make move
            const from = window.selectedSquare;
            const to = { row, col };

            this.attemptMove(from, to);

            // Clear selection
            window.selectedSquare = null;
            this.clearHighlights();
        }
    }

    /**
     * Attempt to make a move
     */
    async attemptMove(from, to) {
        const moveUCI = this.squareToUCI(from) + this.squareToUCI(to);
        const expectedMove = this.currentPuzzle.solution[this.moveIndex];

        console.log('🎯 Move attempt:', {
            from: this.squareToAlgebraic(from),
            to: this.squareToAlgebraic(to),
            moveUCI: moveUCI,
            expectedMove: expectedMove,
            moveIndex: this.moveIndex
        });

        // Check if move matches expected solution
        if (this.movesMatch(moveUCI, expectedMove)) {
            // Correct move!
            console.log('✅ Correct move!');
            puzzleEngine.makeMove(from.row, from.col, to.row, to.col);
            this.renderBoard();
            this.moveIndex++;

            this.showFeedback('correct', '✅ Doğru hamle!');

            // Check if puzzle is solved
            if (this.moveIndex >= this.currentPuzzle.solution.length) {
                this.puzzleSolved();
            } else {
                // Make opponent's response after delay
                setTimeout(() => this.makeOpponentMove(), 500);
            }
        } else {
            // Wrong move
            console.log('❌ Wrong move');
            this.showFeedback('wrong', '❌ Yanlış hamle. Tekrar dene!');
        }
    }

    /**
     * Make opponent's move (from solution)
     */
    makeOpponentMove() {
        if (this.moveIndex >= this.currentPuzzle.solution.length) return;

        const moveUCI = this.currentPuzzle.solution[this.moveIndex];
        const { from, to } = this.uciToSquares(moveUCI);

        puzzleEngine.makeMove(from.row, from.col, to.row, to.col);
        this.renderBoard();
        this.moveIndex++;

        // Check if puzzle continues
        if (this.moveIndex >= this.currentPuzzle.solution.length) {
            this.puzzleSolved();
        }
    }

    /**
     * Puzzle solved successfully
     */
    puzzleSolved() {
        const timeMs = Date.now() - this.startTime;
        this.stats.savePuzzleSolve(this.currentPuzzle.id, true, timeMs);

        this.showFeedback('success', `🎉 Puzzle çözüldü! Süre: ${Math.round(timeMs / 1000)}s`);

        // Show next puzzle button
        setTimeout(() => {
            if (confirm('Puzzle çözüldü! Bir sonrakine geç?')) {
                this.loadNextPuzzle();
            }
        }, 1500);
    }

    /**
     * Show hint
     */
    showHint() {
        this.hintsUsed++;
        const nextMove = this.currentPuzzle.solution[this.moveIndex];
        const { from, to } = this.uciToSquares(nextMove);

        if (this.hintsUsed === 1) {
            // First hint: show piece to move
            this.highlightSquare(from.row, from.col, 'hint');
            this.showFeedback('hint', `💡 İpucu: ${this.squareToAlgebraic(from)} karesindeki taşı oyna`);
        } else if (this.hintsUsed === 2) {
            // Second hint: show destination
            this.highlightSquare(from.row, from.col, 'hint');
            this.highlightSquare(to.row, to.col, 'hint');
            this.showFeedback('hint', `💡 İpucu: ${this.squareToAlgebraic(from)} → ${this.squareToAlgebraic(to)}`);
        } else {
            // Third hint: show full move and auto-play
            this.showFeedback('hint', `💡 Çözüm gösteriliyor...`);
            setTimeout(() => {
                this.attemptMove(from, to);
            }, 1000);
        }
    }

    /**
     * Skip current puzzle
     */
    async skip() {
        const timeMs = Date.now() - this.startTime;
        this.stats.savePuzzleSolve(this.currentPuzzle.id, false, timeMs);
        await this.loadNextPuzzle();
    }

    /**
     * Show solution
     */
    showSolution() {
        const solutionText = this.currentPuzzle.solution
            .map((uci, i) => {
                const { from, to } = this.uciToSquares(uci);
                return `${Math.floor(i / 2) + 1}. ${this.squareToAlgebraic(from)}${this.squareToAlgebraic(to)}`;
            })
            .join(' ');

        this.showFeedback('solution', `📖 Çözüm: ${solutionText}`);
    }

    // ===== HELPER FUNCTIONS =====

    getPieceSymbol(piece) {
        const symbols = {
            'white_k': '♔', 'white_q': '♕', 'white_r': '♖',
            'white_b': '♗', 'white_n': '♘', 'white_p': '♙',
            'black_k': '♚', 'black_q': '♛', 'black_r': '♜',
            'black_b': '♝', 'black_n': '♞', 'black_p': '♟'
        };
        return symbols[`${piece.color}_${piece.type}`] || '';
    }

    /**
     * Convert square coordinates to UCI notation (single square)
     * @param {Object} square - {row, col}
     * @returns {string} UCI square notation (e.g., "e2")
     */
    squareToUCI(square) {
        const files = 'abcdefgh';
        const ranks = '87654321';
        return files[square.col] + ranks[square.row];
    }

    uciToSquares(uci) {
        const files = 'abcdefgh';
        const ranks = '87654321';

        const fromFile = uci[0];
        const fromRank = uci[1];
        const toFile = uci[2];
        const toRank = uci[3];

        return {
            from: {
                col: files.indexOf(fromFile),
                row: ranks.indexOf(fromRank)
            },
            to: {
                col: files.indexOf(toFile),
                row: ranks.indexOf(toRank)
            }
        };
    }

    squareToAlgebraic(square) {
        const files = 'abcdefgh';
        const ranks = '87654321';
        return files[square.col] + ranks[square.row];
    }

    movesMatch(move1, move2) {
        // Simple UCI comparison (could be enhanced for promotions)
        return move1.substring(0, 4) === move2.substring(0, 4);
    }

    highlightSquare(row, col, className) {
        const squares = document.querySelectorAll('#puzzle-board .square');
        const index = row * 8 + col;
        if (squares[index]) {
            squares[index].classList.add(className);
        }
    }

    clearHighlights() {
        const squares = document.querySelectorAll('#puzzle-board .square');
        squares.forEach(sq => {
            sq.classList.remove('selected', 'valid-move', 'hint');
        });
    }

    showValidMoves(row, col) {
        const moves = puzzleEngine.getValidMoves(row, col);
        moves.forEach(move => {
            this.highlightSquare(move.row, move.col, 'valid-move');
        });
    }

    showFeedback(type, message) {
        const feedbackEl = document.getElementById('puzzle-feedback');
        if (feedbackEl) {
            feedbackEl.className = `puzzle-feedback ${type}`;
            feedbackEl.textContent = message;
        }
    }

    updatePuzzleInfo() {
        const idEl = document.getElementById('puzzle-id');
        const ratingEl = document.getElementById('puzzle-rating');
        const themesEl = document.getElementById('puzzle-themes');

        if (idEl) idEl.textContent = this.currentPuzzle.id || 'Unknown';
        if (ratingEl) ratingEl.textContent = this.currentPuzzle.rating || '—';
        if (themesEl) themesEl.textContent = this.currentPuzzle.themes?.join(', ') || 'Tactics';
    }

    render() {
        // Update stats display
        const summary = this.stats.getPuzzleSummary();
        console.log('Puzzle Stats:', summary);
    }

    /**
     * Load embedded puzzles for offline use
     */
    loadEmbeddedPuzzles() {
        // Simple embedded puzzles as fallback
        return [
            {
                id: 'beginner_1',
                fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
                rating: 1200,
                themes: ['mateIn1', 'opening'],
                solution: ['h5f7'] // Scholar's mate
            },
            {
                id: 'beginner_2',
                fen: '5rk1/pppb1ppp/3p4/8/2BPQ3/8/PPP2PPP/5RK1 w - - 0 1',
                rating: 1300,
                themes: ['mateIn2', 'backRank'],
                solution: ['e4e8', 'f8e8', 'f1e1'] // Back rank mate
            }
        ];
    }
}

// Initialize puzzle mode globally
window.puzzleMode = new PuzzleMode();
