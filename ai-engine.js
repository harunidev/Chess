/**
 * Star Chess - AI Engine
 * Minimax with Alpha-Beta Pruning
 */

class ChessAI {
    constructor(difficulty = 'medium') {
        this.setDifficulty(difficulty);

        // Piece values
        this.pieceValues = {
            p: 100,
            n: 320,
            b: 330,
            r: 500,
            q: 900,
            k: 20000
        };

        // Piece-square tables for positional evaluation
        this.pst = this.initPieceSquareTables();
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        switch (difficulty) {
            case 'easy':
                this.depth = 2;
                this.randomFactor = 0.3; // 30% chance of random move
                break;
            case 'medium':
                this.depth = 3;
                this.randomFactor = 0.05; // 5% chance of suboptimal move
                break;
            case 'hard':
                this.depth = 4;
                this.randomFactor = 0; // Always best move
                break;
            default:
                this.depth = 3;
                this.randomFactor = 0.05;
        }
    }

    initPieceSquareTables() {
        // Tables are from white's perspective, will be mirrored for black
        return {
            p: [
                [0, 0, 0, 0, 0, 0, 0, 0],
                [50, 50, 50, 50, 50, 50, 50, 50],
                [10, 10, 20, 30, 30, 20, 10, 10],
                [5, 5, 10, 25, 25, 10, 5, 5],
                [0, 0, 0, 20, 20, 0, 0, 0],
                [5, -5, -10, 0, 0, -10, -5, 5],
                [5, 10, 10, -20, -20, 10, 10, 5],
                [0, 0, 0, 0, 0, 0, 0, 0]
            ],
            n: [
                [-50, -40, -30, -30, -30, -30, -40, -50],
                [-40, -20, 0, 0, 0, 0, -20, -40],
                [-30, 0, 10, 15, 15, 10, 0, -30],
                [-30, 5, 15, 20, 20, 15, 5, -30],
                [-30, 0, 15, 20, 20, 15, 0, -30],
                [-30, 5, 10, 15, 15, 10, 5, -30],
                [-40, -20, 0, 5, 5, 0, -20, -40],
                [-50, -40, -30, -30, -30, -30, -40, -50]
            ],
            b: [
                [-20, -10, -10, -10, -10, -10, -10, -20],
                [-10, 0, 0, 0, 0, 0, 0, -10],
                [-10, 0, 5, 10, 10, 5, 0, -10],
                [-10, 5, 5, 10, 10, 5, 5, -10],
                [-10, 0, 10, 10, 10, 10, 0, -10],
                [-10, 10, 10, 10, 10, 10, 10, -10],
                [-10, 5, 0, 0, 0, 0, 5, -10],
                [-20, -10, -10, -10, -10, -10, -10, -20]
            ],
            r: [
                [0, 0, 0, 0, 0, 0, 0, 0],
                [5, 10, 10, 10, 10, 10, 10, 5],
                [-5, 0, 0, 0, 0, 0, 0, -5],
                [-5, 0, 0, 0, 0, 0, 0, -5],
                [-5, 0, 0, 0, 0, 0, 0, -5],
                [-5, 0, 0, 0, 0, 0, 0, -5],
                [-5, 0, 0, 0, 0, 0, 0, -5],
                [0, 0, 0, 5, 5, 0, 0, 0]
            ],
            q: [
                [-20, -10, -10, -5, -5, -10, -10, -20],
                [-10, 0, 0, 0, 0, 0, 0, -10],
                [-10, 0, 5, 5, 5, 5, 0, -10],
                [-5, 0, 5, 5, 5, 5, 0, -5],
                [0, 0, 5, 5, 5, 5, 0, -5],
                [-10, 5, 5, 5, 5, 5, 0, -10],
                [-10, 0, 5, 0, 0, 0, 0, -10],
                [-20, -10, -10, -5, -5, -10, -10, -20]
            ],
            k: {
                middlegame: [
                    [-30, -40, -40, -50, -50, -40, -40, -30],
                    [-30, -40, -40, -50, -50, -40, -40, -30],
                    [-30, -40, -40, -50, -50, -40, -40, -30],
                    [-30, -40, -40, -50, -50, -40, -40, -30],
                    [-20, -30, -30, -40, -40, -30, -30, -20],
                    [-10, -20, -20, -20, -20, -20, -20, -10],
                    [20, 20, 0, 0, 0, 0, 20, 20],
                    [20, 30, 10, 0, 0, 10, 30, 20]
                ],
                endgame: [
                    [-50, -40, -30, -20, -20, -30, -40, -50],
                    [-30, -20, -10, 0, 0, -10, -20, -30],
                    [-30, -10, 20, 30, 30, 20, -10, -30],
                    [-30, -10, 30, 40, 40, 30, -10, -30],
                    [-30, -10, 30, 40, 40, 30, -10, -30],
                    [-30, -10, 20, 30, 30, 20, -10, -30],
                    [-30, -30, 0, 0, 0, 0, -30, -30],
                    [-50, -30, -30, -30, -30, -30, -30, -50]
                ]
            }
        };
    }

    // Get the best move for the AI
    getBestMove(engine) {
        // Random move for easy mode sometimes
        if (this.difficulty === 'easy' && Math.random() < this.randomFactor) {
            const moves = engine.getAllLegalMoves();
            if (moves.length > 0) {
                return moves[Math.floor(Math.random() * moves.length)];
            }
        }

        const isMaximizing = engine.currentPlayer === 'white';
        let bestMove = null;
        let bestValue = isMaximizing ? -Infinity : Infinity;

        const moves = engine.getAllLegalMoves();

        // Order moves for better alpha-beta pruning
        const orderedMoves = this.orderMoves(moves, engine);

        for (const move of orderedMoves) {
            const clonedEngine = engine.clone();
            clonedEngine.makeMove(move.from.row, move.from.col, move.to.row, move.to.col, move.promotion || 'q');

            const value = this.minimax(
                clonedEngine,
                this.depth - 1,
                -Infinity,
                Infinity,
                !isMaximizing
            );

            // Add small random factor for medium difficulty
            const adjustedValue = value + (this.randomFactor > 0 ? (Math.random() - 0.5) * 20 : 0);

            if (isMaximizing) {
                if (adjustedValue > bestValue) {
                    bestValue = adjustedValue;
                    bestMove = move;
                }
            } else {
                if (adjustedValue < bestValue) {
                    bestValue = adjustedValue;
                    bestMove = move;
                }
            }
        }

        return bestMove;
    }

    // Minimax with alpha-beta pruning
    minimax(engine, depth, alpha, beta, isMaximizing) {
        // Terminal conditions
        if (depth === 0 || engine.gameState === 'checkmate' ||
            engine.gameState === 'stalemate' || engine.gameState === 'draw') {
            return this.evaluate(engine);
        }

        const moves = engine.getAllLegalMoves();

        if (moves.length === 0) {
            if (engine.isInCheck(engine.currentPlayer)) {
                // Checkmate
                return isMaximizing ? -100000 + (this.depth - depth) : 100000 - (this.depth - depth);
            }
            // Stalemate
            return 0;
        }

        // Order moves for better pruning
        const orderedMoves = this.orderMoves(moves, engine);

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const move of orderedMoves) {
                const clonedEngine = engine.clone();
                clonedEngine.makeMove(move.from.row, move.from.col, move.to.row, move.to.col, move.promotion || 'q');
                const evalScore = this.minimax(clonedEngine, depth - 1, alpha, beta, false);
                maxEval = Math.max(maxEval, evalScore);
                alpha = Math.max(alpha, evalScore);
                if (beta <= alpha) break; // Beta cutoff
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of orderedMoves) {
                const clonedEngine = engine.clone();
                clonedEngine.makeMove(move.from.row, move.from.col, move.to.row, move.to.col, move.promotion || 'q');
                const evalScore = this.minimax(clonedEngine, depth - 1, alpha, beta, true);
                minEval = Math.min(minEval, evalScore);
                beta = Math.min(beta, evalScore);
                if (beta <= alpha) break; // Alpha cutoff
            }
            return minEval;
        }
    }

    // Order moves for better alpha-beta pruning (captures first, then checks)
    orderMoves(moves, engine) {
        return moves.sort((a, b) => {
            let scoreA = 0;
            let scoreB = 0;

            // Prioritize captures
            if (a.capture) {
                const capturedPiece = engine.getPiece(a.to.row, a.to.col);
                if (capturedPiece) {
                    scoreA += this.pieceValues[capturedPiece.type] - this.pieceValues[a.piece.type] / 10;
                }
            }
            if (b.capture) {
                const capturedPiece = engine.getPiece(b.to.row, b.to.col);
                if (capturedPiece) {
                    scoreB += this.pieceValues[capturedPiece.type] - this.pieceValues[b.piece.type] / 10;
                }
            }

            // Prioritize promotions
            if (a.promotion) scoreA += 800;
            if (b.promotion) scoreB += 800;

            // Prioritize checks (simplified - would need to actually check)
            // Prioritize center control for pawns and knights
            if (a.piece.type === 'p' || a.piece.type === 'n') {
                if (a.to.col >= 2 && a.to.col <= 5 && a.to.row >= 2 && a.to.row <= 5) {
                    scoreA += 10;
                }
            }
            if (b.piece.type === 'p' || b.piece.type === 'n') {
                if (b.to.col >= 2 && b.to.col <= 5 && b.to.row >= 2 && b.to.row <= 5) {
                    scoreB += 10;
                }
            }

            return scoreB - scoreA;
        });
    }

    // Evaluate the board position
    evaluate(engine) {
        if (engine.gameState === 'checkmate') {
            // Whoever just moved won
            return engine.currentPlayer === 'white' ? -100000 : 100000;
        }
        if (engine.gameState === 'stalemate' || engine.gameState === 'draw') {
            return 0;
        }

        let score = 0;
        let whitePieceCount = 0;
        let blackPieceCount = 0;

        // Count material and position
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = engine.getPiece(row, col);
                if (!piece) continue;

                const pieceValue = this.pieceValues[piece.type];
                const positionValue = this.getPositionValue(piece, row, col, engine);

                if (piece.color === 'white') {
                    score += pieceValue + positionValue;
                    if (piece.type !== 'k') whitePieceCount++;
                } else {
                    score -= pieceValue + positionValue;
                    if (piece.type !== 'k') blackPieceCount++;
                }
            }
        }

        // Mobility bonus
        const originalPlayer = engine.currentPlayer;

        engine.currentPlayer = 'white';
        const whiteMoves = engine.getAllLegalMoves().length;

        engine.currentPlayer = 'black';
        const blackMoves = engine.getAllLegalMoves().length;

        engine.currentPlayer = originalPlayer;

        score += (whiteMoves - blackMoves) * 5;

        // Check bonus
        if (engine.isInCheck('black')) score += 50;
        if (engine.isInCheck('white')) score -= 50;

        // King safety - penalize exposed king in middlegame
        const totalPieces = whitePieceCount + blackPieceCount;
        if (totalPieces > 10) {
            score += this.evaluateKingSafety(engine, 'white');
            score -= this.evaluateKingSafety(engine, 'black');
        }

        return score;
    }

    // Get position value from piece-square tables
    getPositionValue(piece, row, col, engine) {
        let table;

        if (piece.type === 'k') {
            // Use endgame table if few pieces remain
            let pieceCount = 0;
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    if (engine.getPiece(r, c)) pieceCount++;
                }
            }
            table = pieceCount <= 10 ? this.pst.k.endgame : this.pst.k.middlegame;
        } else {
            table = this.pst[piece.type];
        }

        // Mirror table for black pieces
        const tableRow = piece.color === 'white' ? row : 7 - row;
        return table[tableRow][col];
    }

    // Evaluate king safety
    evaluateKingSafety(engine, color) {
        const king = engine.findKing(color);
        if (!king) return 0;

        let safety = 0;

        // Penalize if king is in center during middlegame
        if (king.col >= 2 && king.col <= 5) {
            safety -= 30;
        }

        // Bonus for castled position
        if (color === 'white') {
            if (king.row === 7 && (king.col <= 2 || king.col >= 6)) {
                safety += 40;
            }
        } else {
            if (king.row === 0 && (king.col <= 2 || king.col >= 6)) {
                safety += 40;
            }
        }

        // Check pawn shield
        const pawnShieldRow = color === 'white' ? king.row - 1 : king.row + 1;
        for (let dc = -1; dc <= 1; dc++) {
            const col = king.col + dc;
            if (col >= 0 && col < 8 && pawnShieldRow >= 0 && pawnShieldRow < 8) {
                const piece = engine.getPiece(pawnShieldRow, col);
                if (piece && piece.type === 'p' && piece.color === color) {
                    safety += 15;
                }
            }
        }

        return safety;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChessAI;
}
