/**
 * Star Chess - Chess Engine
 * Complete chess rules implementation
 */

class ChessEngine {
    constructor() {
        this.reset();
    }

    reset() {
        this.board = this.createInitialBoard();
        this.currentPlayer = 'white';
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.castlingRights = {
            white: { kingSide: true, queenSide: true },
            black: { kingSide: true, queenSide: true }
        };
        this.enPassantTarget = null;
        this.halfMoveClock = 0;
        this.fullMoveNumber = 1;
        this.positionHistory = [];
        this.gameState = 'playing'; // playing, check, checkmate, stalemate, draw
    }

    createInitialBoard() {
        const board = Array(8).fill(null).map(() => Array(8).fill(null));

        // Black pieces (row 0 and 1)
        board[0] = [
            { type: 'r', color: 'black' },
            { type: 'n', color: 'black' },
            { type: 'b', color: 'black' },
            { type: 'q', color: 'black' },
            { type: 'k', color: 'black' },
            { type: 'b', color: 'black' },
            { type: 'n', color: 'black' },
            { type: 'r', color: 'black' }
        ];
        board[1] = Array(8).fill(null).map(() => ({ type: 'p', color: 'black' }));

        // White pieces (row 6 and 7)
        board[6] = Array(8).fill(null).map(() => ({ type: 'p', color: 'white' }));
        board[7] = [
            { type: 'r', color: 'white' },
            { type: 'n', color: 'white' },
            { type: 'b', color: 'white' },
            { type: 'q', color: 'white' },
            { type: 'k', color: 'white' },
            { type: 'b', color: 'white' },
            { type: 'n', color: 'white' },
            { type: 'r', color: 'white' }
        ];

        return board;
    }

    // Get piece at position
    getPiece(row, col) {
        if (row < 0 || row > 7 || col < 0 || col > 7) return null;
        return this.board[row][col];
    }

    // Set piece at position
    setPiece(row, col, piece) {
        this.board[row][col] = piece;
    }

    // Find king position
    findKing(color) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(row, col);
                if (piece && piece.type === 'k' && piece.color === color) {
                    return { row, col };
                }
            }
        }
        return null;
    }

    // Check if a square is under attack
    isSquareAttacked(row, col, attackerColor) {
        // Check pawn attacks
        const pawnDir = attackerColor === 'white' ? 1 : -1;
        const pawnAttacks = [
            { row: row + pawnDir, col: col - 1 },
            { row: row + pawnDir, col: col + 1 }
        ];
        for (const pos of pawnAttacks) {
            const piece = this.getPiece(pos.row, pos.col);
            if (piece && piece.type === 'p' && piece.color === attackerColor) {
                return true;
            }
        }

        // Check knight attacks
        const knightMoves = [
            { row: row - 2, col: col - 1 }, { row: row - 2, col: col + 1 },
            { row: row - 1, col: col - 2 }, { row: row - 1, col: col + 2 },
            { row: row + 1, col: col - 2 }, { row: row + 1, col: col + 2 },
            { row: row + 2, col: col - 1 }, { row: row + 2, col: col + 1 }
        ];
        for (const pos of knightMoves) {
            const piece = this.getPiece(pos.row, pos.col);
            if (piece && piece.type === 'n' && piece.color === attackerColor) {
                return true;
            }
        }

        // Check king attacks
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const piece = this.getPiece(row + dr, col + dc);
                if (piece && piece.type === 'k' && piece.color === attackerColor) {
                    return true;
                }
            }
        }

        // Check sliding pieces (rook, bishop, queen)
        const directions = {
            rook: [{ dr: -1, dc: 0 }, { dr: 1, dc: 0 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 }],
            bishop: [{ dr: -1, dc: -1 }, { dr: -1, dc: 1 }, { dr: 1, dc: -1 }, { dr: 1, dc: 1 }]
        };

        // Check rook/queen on straight lines
        for (const dir of directions.rook) {
            let r = row + dir.dr;
            let c = col + dir.dc;
            while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                const piece = this.getPiece(r, c);
                if (piece) {
                    if (piece.color === attackerColor && (piece.type === 'r' || piece.type === 'q')) {
                        return true;
                    }
                    break;
                }
                r += dir.dr;
                c += dir.dc;
            }
        }

        // Check bishop/queen on diagonals
        for (const dir of directions.bishop) {
            let r = row + dir.dr;
            let c = col + dir.dc;
            while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                const piece = this.getPiece(r, c);
                if (piece) {
                    if (piece.color === attackerColor && (piece.type === 'b' || piece.type === 'q')) {
                        return true;
                    }
                    break;
                }
                r += dir.dr;
                c += dir.dc;
            }
        }

        return false;
    }

    // Check if current player's king is in check
    isInCheck(color) {
        const king = this.findKing(color);
        if (!king) return false;
        const opponentColor = color === 'white' ? 'black' : 'white';
        return this.isSquareAttacked(king.row, king.col, opponentColor);
    }

    // Get all valid moves for a piece at given position
    getValidMoves(row, col) {
        const piece = this.getPiece(row, col);
        if (!piece || piece.color !== this.currentPlayer) {
            return [];
        }

        const pseudoLegalMoves = this.getPseudoLegalMoves(row, col, piece);
        const legalMoves = [];

        // Filter out moves that leave king in check
        for (const move of pseudoLegalMoves) {
            if (this.isMoveLegal(row, col, move.row, move.col, piece)) {
                legalMoves.push(move);
            }
        }

        return legalMoves;
    }

    // Get pseudo-legal moves (doesn't check for check)
    getPseudoLegalMoves(row, col, piece) {
        const moves = [];

        switch (piece.type) {
            case 'p':
                this.getPawnMoves(row, col, piece.color, moves);
                break;
            case 'n':
                this.getKnightMoves(row, col, piece.color, moves);
                break;
            case 'b':
                this.getBishopMoves(row, col, piece.color, moves);
                break;
            case 'r':
                this.getRookMoves(row, col, piece.color, moves);
                break;
            case 'q':
                this.getQueenMoves(row, col, piece.color, moves);
                break;
            case 'k':
                this.getKingMoves(row, col, piece.color, moves);
                break;
        }

        return moves;
    }

    // Pawn moves
    getPawnMoves(row, col, color, moves) {
        const direction = color === 'white' ? -1 : 1;
        const startRow = color === 'white' ? 6 : 1;
        const promotionRow = color === 'white' ? 0 : 7;

        // Forward move
        const newRow = row + direction;
        if (newRow >= 0 && newRow < 8 && !this.getPiece(newRow, col)) {
            if (newRow === promotionRow) {
                moves.push({ row: newRow, col, promotion: true });
            } else {
                moves.push({ row: newRow, col });
            }

            // Double move from starting position
            if (row === startRow) {
                const doubleRow = row + 2 * direction;
                if (!this.getPiece(doubleRow, col)) {
                    moves.push({ row: doubleRow, col, doublePush: true });
                }
            }
        }

        // Captures
        for (const dc of [-1, 1]) {
            const newCol = col + dc;
            if (newCol >= 0 && newCol < 8) {
                const targetPiece = this.getPiece(newRow, newCol);

                // Regular capture
                if (targetPiece && targetPiece.color !== color) {
                    if (newRow === promotionRow) {
                        moves.push({ row: newRow, col: newCol, capture: true, promotion: true });
                    } else {
                        moves.push({ row: newRow, col: newCol, capture: true });
                    }
                }

                // En passant
                if (this.enPassantTarget &&
                    this.enPassantTarget.row === newRow &&
                    this.enPassantTarget.col === newCol) {
                    moves.push({ row: newRow, col: newCol, enPassant: true, capture: true });
                }
            }
        }
    }

    // Knight moves
    getKnightMoves(row, col, color, moves) {
        const offsets = [
            { dr: -2, dc: -1 }, { dr: -2, dc: 1 },
            { dr: -1, dc: -2 }, { dr: -1, dc: 2 },
            { dr: 1, dc: -2 }, { dr: 1, dc: 2 },
            { dr: 2, dc: -1 }, { dr: 2, dc: 1 }
        ];

        for (const offset of offsets) {
            const newRow = row + offset.dr;
            const newCol = col + offset.dc;
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const targetPiece = this.getPiece(newRow, newCol);
                if (!targetPiece || targetPiece.color !== color) {
                    moves.push({
                        row: newRow,
                        col: newCol,
                        capture: targetPiece && targetPiece.color !== color
                    });
                }
            }
        }
    }

    // Sliding piece moves (bishop, rook, queen)
    getSlidingMoves(row, col, color, directions, moves) {
        for (const dir of directions) {
            let r = row + dir.dr;
            let c = col + dir.dc;
            while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                const targetPiece = this.getPiece(r, c);
                if (!targetPiece) {
                    moves.push({ row: r, col: c });
                } else {
                    if (targetPiece.color !== color) {
                        moves.push({ row: r, col: c, capture: true });
                    }
                    break;
                }
                r += dir.dr;
                c += dir.dc;
            }
        }
    }

    getBishopMoves(row, col, color, moves) {
        const directions = [
            { dr: -1, dc: -1 }, { dr: -1, dc: 1 },
            { dr: 1, dc: -1 }, { dr: 1, dc: 1 }
        ];
        this.getSlidingMoves(row, col, color, directions, moves);
    }

    getRookMoves(row, col, color, moves) {
        const directions = [
            { dr: -1, dc: 0 }, { dr: 1, dc: 0 },
            { dr: 0, dc: -1 }, { dr: 0, dc: 1 }
        ];
        this.getSlidingMoves(row, col, color, directions, moves);
    }

    getQueenMoves(row, col, color, moves) {
        this.getBishopMoves(row, col, color, moves);
        this.getRookMoves(row, col, color, moves);
    }

    // King moves
    getKingMoves(row, col, color, moves) {
        // Regular moves
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const newRow = row + dr;
                const newCol = col + dc;
                if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                    const targetPiece = this.getPiece(newRow, newCol);
                    if (!targetPiece || targetPiece.color !== color) {
                        moves.push({
                            row: newRow,
                            col: newCol,
                            capture: targetPiece && targetPiece.color !== color
                        });
                    }
                }
            }
        }

        // Castling
        if (!this.isInCheck(color)) {
            const baseRow = color === 'white' ? 7 : 0;
            const opponentColor = color === 'white' ? 'black' : 'white';

            // King side castling
            if (this.castlingRights[color].kingSide) {
                if (!this.getPiece(baseRow, 5) &&
                    !this.getPiece(baseRow, 6) &&
                    !this.isSquareAttacked(baseRow, 5, opponentColor) &&
                    !this.isSquareAttacked(baseRow, 6, opponentColor)) {
                    moves.push({ row: baseRow, col: 6, castling: 'kingSide' });
                }
            }

            // Queen side castling
            if (this.castlingRights[color].queenSide) {
                if (!this.getPiece(baseRow, 1) &&
                    !this.getPiece(baseRow, 2) &&
                    !this.getPiece(baseRow, 3) &&
                    !this.isSquareAttacked(baseRow, 2, opponentColor) &&
                    !this.isSquareAttacked(baseRow, 3, opponentColor)) {
                    moves.push({ row: baseRow, col: 2, castling: 'queenSide' });
                }
            }
        }
    }

    // Check if a move is legal (doesn't leave king in check)
    isMoveLegal(fromRow, fromCol, toRow, toCol, piece) {
        // Make the move temporarily
        const originalPiece = this.getPiece(toRow, toCol);
        const originalEnPassant = this.enPassantTarget;

        this.setPiece(toRow, toCol, piece);
        this.setPiece(fromRow, fromCol, null);

        // Handle en passant capture
        let capturedEnPassant = null;
        if (piece.type === 'p' && this.enPassantTarget &&
            toRow === this.enPassantTarget.row && toCol === this.enPassantTarget.col) {
            const capturedRow = piece.color === 'white' ? toRow + 1 : toRow - 1;
            capturedEnPassant = this.getPiece(capturedRow, toCol);
            this.setPiece(capturedRow, toCol, null);
        }

        // Check if king is in check after the move
        const inCheck = this.isInCheck(piece.color);

        // Undo the move
        this.setPiece(fromRow, fromCol, piece);
        this.setPiece(toRow, toCol, originalPiece);
        this.enPassantTarget = originalEnPassant;

        if (capturedEnPassant !== null) {
            const capturedRow = piece.color === 'white' ? toRow + 1 : toRow - 1;
            this.setPiece(capturedRow, toCol, capturedEnPassant);
        }

        return !inCheck;
    }

    // Make a move
    makeMove(fromRow, fromCol, toRow, toCol, promotionPiece = 'q') {
        const piece = this.getPiece(fromRow, fromCol);
        if (!piece) return null;

        const validMoves = this.getValidMoves(fromRow, fromCol);
        const move = validMoves.find(m => m.row === toRow && m.col === toCol);
        if (!move) return null;

        // Store move for history
        const moveRecord = {
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            piece: { ...piece },
            captured: null,
            castling: move.castling || null,
            enPassant: move.enPassant || false,
            promotion: move.promotion ? promotionPiece : null,
            check: false,
            checkmate: false
        };

        // Handle capture
        let capturedPiece = this.getPiece(toRow, toCol);
        if (move.enPassant) {
            const capturedRow = piece.color === 'white' ? toRow + 1 : toRow - 1;
            capturedPiece = this.getPiece(capturedRow, toCol);
            this.setPiece(capturedRow, toCol, null);
        }
        if (capturedPiece) {
            moveRecord.captured = { ...capturedPiece };
            this.capturedPieces[piece.color].push(capturedPiece);
        }

        // Handle castling
        if (move.castling) {
            const baseRow = piece.color === 'white' ? 7 : 0;
            if (move.castling === 'kingSide') {
                const rook = this.getPiece(baseRow, 7);
                this.setPiece(baseRow, 5, rook);
                this.setPiece(baseRow, 7, null);
            } else {
                const rook = this.getPiece(baseRow, 0);
                this.setPiece(baseRow, 3, rook);
                this.setPiece(baseRow, 0, null);
            }
        }

        // Move the piece
        if (move.promotion) {
            this.setPiece(toRow, toCol, { type: promotionPiece, color: piece.color });
        } else {
            this.setPiece(toRow, toCol, piece);
        }
        this.setPiece(fromRow, fromCol, null);

        // Update en passant target
        if (piece.type === 'p' && Math.abs(toRow - fromRow) === 2) {
            const epRow = piece.color === 'white' ? fromRow - 1 : fromRow + 1;
            this.enPassantTarget = { row: epRow, col: fromCol };
        } else {
            this.enPassantTarget = null;
        }

        // Update castling rights
        if (piece.type === 'k') {
            this.castlingRights[piece.color].kingSide = false;
            this.castlingRights[piece.color].queenSide = false;
        }
        if (piece.type === 'r') {
            if (fromCol === 0) this.castlingRights[piece.color].queenSide = false;
            if (fromCol === 7) this.castlingRights[piece.color].kingSide = false;
        }
        // If rook is captured
        if (capturedPiece && capturedPiece.type === 'r') {
            const capturedColor = capturedPiece.color;
            if (toCol === 0) this.castlingRights[capturedColor].queenSide = false;
            if (toCol === 7) this.castlingRights[capturedColor].kingSide = false;
        }

        // Update half move clock
        if (piece.type === 'p' || capturedPiece) {
            this.halfMoveClock = 0;
        } else {
            this.halfMoveClock++;
        }

        // Update full move number
        if (piece.color === 'black') {
            this.fullMoveNumber++;
        }

        // Switch player
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';

        // Store position for repetition detection
        this.positionHistory.push(this.getPositionKey());

        // Check game state
        const opponentColor = this.currentPlayer;
        if (this.isInCheck(opponentColor)) {
            moveRecord.check = true;
            if (this.isCheckmate(opponentColor)) {
                moveRecord.checkmate = true;
                this.gameState = 'checkmate';
            } else {
                this.gameState = 'check';
            }
        } else if (this.isStalemate(opponentColor)) {
            this.gameState = 'stalemate';
        } else if (this.isDraw()) {
            this.gameState = 'draw';
        } else {
            this.gameState = 'playing';
        }

        // Add to move history
        this.moveHistory.push(moveRecord);

        return moveRecord;
    }

    // Check for checkmate
    isCheckmate(color) {
        if (!this.isInCheck(color)) return false;
        return !this.hasLegalMoves(color);
    }

    // Check for stalemate
    isStalemate(color) {
        if (this.isInCheck(color)) return false;
        return !this.hasLegalMoves(color);
    }

    // Check if player has any legal moves
    hasLegalMoves(color) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(row, col);
                if (piece && piece.color === color) {
                    const originalPlayer = this.currentPlayer;
                    this.currentPlayer = color;
                    const moves = this.getValidMoves(row, col);
                    this.currentPlayer = originalPlayer;
                    if (moves.length > 0) return true;
                }
            }
        }
        return false;
    }

    // Check for draw conditions
    isDraw() {
        // 50 move rule
        if (this.halfMoveClock >= 100) return true;

        // Threefold repetition
        const currentPosition = this.getPositionKey();
        let repetitions = 0;
        for (const pos of this.positionHistory) {
            if (pos === currentPosition) repetitions++;
            if (repetitions >= 3) return true;
        }

        // Insufficient material
        if (this.isInsufficientMaterial()) return true;

        return false;
    }

    // Check for insufficient material
    isInsufficientMaterial() {
        const pieces = { white: [], black: [] };

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(row, col);
                if (piece && piece.type !== 'k') {
                    pieces[piece.color].push({ type: piece.type, row, col });
                }
            }
        }

        const whitePieces = pieces.white;
        const blackPieces = pieces.black;

        // King vs King
        if (whitePieces.length === 0 && blackPieces.length === 0) return true;

        // King + Bishop/Knight vs King
        if (whitePieces.length === 0 && blackPieces.length === 1 &&
            (blackPieces[0].type === 'b' || blackPieces[0].type === 'n')) return true;
        if (blackPieces.length === 0 && whitePieces.length === 1 &&
            (whitePieces[0].type === 'b' || whitePieces[0].type === 'n')) return true;

        // King + Bishop vs King + Bishop (same color bishops)
        if (whitePieces.length === 1 && blackPieces.length === 1 &&
            whitePieces[0].type === 'b' && blackPieces[0].type === 'b') {
            const whiteSquareColor = (whitePieces[0].row + whitePieces[0].col) % 2;
            const blackSquareColor = (blackPieces[0].row + blackPieces[0].col) % 2;
            if (whiteSquareColor === blackSquareColor) return true;
        }

        return false;
    }

    // Get position key for repetition detection
    getPositionKey() {
        let key = '';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(row, col);
                if (piece) {
                    key += piece.color[0] + piece.type;
                } else {
                    key += '--';
                }
            }
        }
        key += this.currentPlayer;
        key += this.castlingRights.white.kingSide ? 'K' : '';
        key += this.castlingRights.white.queenSide ? 'Q' : '';
        key += this.castlingRights.black.kingSide ? 'k' : '';
        key += this.castlingRights.black.queenSide ? 'q' : '';
        if (this.enPassantTarget) {
            key += this.enPassantTarget.row + '' + this.enPassantTarget.col;
        }
        return key;
    }

    // Undo last move
    undoMove() {
        if (this.moveHistory.length === 0) return null;

        const lastMove = this.moveHistory.pop();
        this.positionHistory.pop();

        // Restore piece to original position
        this.setPiece(lastMove.from.row, lastMove.from.col, lastMove.piece);

        // Handle promotion - restore original pawn
        if (lastMove.promotion) {
            this.setPiece(lastMove.from.row, lastMove.from.col, { type: 'p', color: lastMove.piece.color });
        }

        // Restore captured piece
        if (lastMove.enPassant) {
            const capturedRow = lastMove.piece.color === 'white' ? lastMove.to.row + 1 : lastMove.to.row - 1;
            this.setPiece(lastMove.to.row, lastMove.to.col, null);
            this.setPiece(capturedRow, lastMove.to.col, lastMove.captured);
        } else {
            this.setPiece(lastMove.to.row, lastMove.to.col, lastMove.captured);
        }

        // Handle castling undo
        if (lastMove.castling) {
            const baseRow = lastMove.piece.color === 'white' ? 7 : 0;
            if (lastMove.castling === 'kingSide') {
                const rook = this.getPiece(baseRow, 5);
                this.setPiece(baseRow, 7, rook);
                this.setPiece(baseRow, 5, null);
            } else {
                const rook = this.getPiece(baseRow, 3);
                this.setPiece(baseRow, 0, rook);
                this.setPiece(baseRow, 3, null);
            }
        }

        // Remove from captured pieces
        if (lastMove.captured) {
            const capturedList = this.capturedPieces[lastMove.piece.color];
            const index = capturedList.findIndex(p => p.type === lastMove.captured.type);
            if (index !== -1) capturedList.splice(index, 1);
        }

        // Switch back player
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';

        // Restore castling rights (simplified - may need more complex logic for perfect undo)
        // This is a simplified restoration
        if (lastMove.piece.type === 'k') {
            // Check if this was the first king move by looking at position
            if (this.moveHistory.every(m => !(m.piece.type === 'k' && m.piece.color === lastMove.piece.color))) {
                this.castlingRights[lastMove.piece.color].kingSide = true;
                this.castlingRights[lastMove.piece.color].queenSide = true;
            }
        }

        // Update game state
        if (this.isInCheck(this.currentPlayer)) {
            this.gameState = 'check';
        } else {
            this.gameState = 'playing';
        }

        // Restore en passant target from previous move
        if (this.moveHistory.length > 0) {
            const prevMove = this.moveHistory[this.moveHistory.length - 1];
            if (prevMove.piece.type === 'p' && Math.abs(prevMove.to.row - prevMove.from.row) === 2) {
                const epRow = prevMove.piece.color === 'white' ? prevMove.from.row - 1 : prevMove.from.row + 1;
                this.enPassantTarget = { row: epRow, col: prevMove.from.col };
            } else {
                this.enPassantTarget = null;
            }
        } else {
            this.enPassantTarget = null;
        }

        return lastMove;
    }

    // Get all legal moves for current player
    getAllLegalMoves() {
        const moves = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(row, col);
                if (piece && piece.color === this.currentPlayer) {
                    const pieceMoves = this.getValidMoves(row, col);
                    for (const move of pieceMoves) {
                        moves.push({
                            from: { row, col },
                            to: { row: move.row, col: move.col },
                            piece,
                            ...move
                        });
                    }
                }
            }
        }
        return moves;
    }

    // Convert move to algebraic notation
    moveToAlgebraic(moveRecord) {
        const files = 'abcdefgh';
        const ranks = '87654321';
        const pieceSymbols = { k: 'K', q: 'Q', r: 'R', b: 'B', n: 'N', p: '' };

        if (moveRecord.castling === 'kingSide') return 'O-O';
        if (moveRecord.castling === 'queenSide') return 'O-O-O';

        let notation = '';

        // Piece symbol (not for pawns)
        if (moveRecord.piece.type !== 'p') {
            notation += pieceSymbols[moveRecord.piece.type];
        }

        // Source file for pawns capturing
        if (moveRecord.piece.type === 'p' && moveRecord.captured) {
            notation += files[moveRecord.from.col];
        }

        // Capture symbol
        if (moveRecord.captured) {
            notation += 'x';
        }

        // Destination square
        notation += files[moveRecord.to.col] + ranks[moveRecord.to.row];

        // Promotion
        if (moveRecord.promotion) {
            notation += '=' + moveRecord.promotion.toUpperCase();
        }

        // Check/Checkmate
        if (moveRecord.checkmate) {
            notation += '#';
        } else if (moveRecord.check) {
            notation += '+';
        }

        return notation;
    }

    // Clone the engine state
    clone() {
        const clone = new ChessEngine();
        clone.board = this.board.map(row => row.map(piece => piece ? { ...piece } : null));
        clone.currentPlayer = this.currentPlayer;
        clone.castlingRights = JSON.parse(JSON.stringify(this.castlingRights));
        clone.enPassantTarget = this.enPassantTarget ? { ...this.enPassantTarget } : null;
        clone.halfMoveClock = this.halfMoveClock;
        clone.fullMoveNumber = this.fullMoveNumber;
        clone.gameState = this.gameState;
        // Don't clone history for performance
        clone.moveHistory = [];
        clone.positionHistory = [];
        clone.capturedPieces = { white: [], black: [] };
        return clone;
    }

    /**
     * Load position from FEN (Forsyth-Edwards Notation)
     * @param {string} fen - FEN string
     */
    loadFromFEN(fen) {
        const parts = fen.trim().split(/\s+/);
        if (parts.length < 4) {
            console.error('Invalid FEN: not enough parts');
            return false;
        }

        const [position, activeColor, castling, enPassant, halfmove, fullmove] = parts;

        // Clear board
        this.board = Array(8).fill(null).map(() => Array(8).fill(null));

        // Parse piece placement
        const rows = position.split('/');
        if (rows.length !== 8) {
            console.error('Invalid FEN: board must have 8 rows');
            return false;
        }

        const pieceMap = {
            'r': { type: 'r', color: 'black' },
            'n': { type: 'n', color: 'black' },
            'b': { type: 'b', color: 'black' },
            'q': { type: 'q', color: 'black' },
            'k': { type: 'k', color: 'black' },
            'p': { type: 'p', color: 'black' },
            'R': { type: 'r', color: 'white' },
            'N': { type: 'n', color: 'white' },
            'B': { type: 'b', color: 'white' },
            'Q': { type: 'q', color: 'white' },
            'K': { type: 'k', color: 'white' },
            'P': { type: 'p', color: 'white' }
        };

        for (let row = 0; row < 8; row++) {
            let col = 0;
            for (const char of rows[row]) {
                if (char >= '1' && char <= '8') {
                    // Empty squares
                    col += parseInt(char);
                } else if (pieceMap[char]) {
                    // Piece
                    if (col >= 8) {
                        console.error('Invalid FEN: too many pieces in row');
                        return false;
                    }
                    this.board[row][col] = { ...pieceMap[char] };
                    col++;
                } else {
                    console.error('Invalid FEN: unknown character in position');
                    return false;
                }
            }
            if (col !== 8) {
                console.error('Invalid FEN: row does not have 8 squares');
                return false;
            }
        }

        // Set active color
        this.currentPlayer = activeColor === 'w' ? 'white' : 'black';

        // Parse castling rights
        this.castlingRights = {
            white: { kingSide: false, queenSide: false },
            black: { kingSide: false, queenSide: false }
        };

        if (castling !== '-') {
            for (const char of castling) {
                if (char === 'K') this.castlingRights.white.kingSide = true;
                else if (char === 'Q') this.castlingRights.white.queenSide = true;
                else if (char === 'k') this.castlingRights.black.kingSide = true;
                else if (char === 'q') this.castlingRights.black.queenSide = true;
            }
        }

        // Parse en passant target
        this.enPassantTarget = null;
        if (enPassant && enPassant !== '-') {
            const file = enPassant.charCodeAt(0) - 'a'.charCodeAt(0);
            const rank = 8 - parseInt(enPassant[1]);
            if (file >= 0 && file < 8 && rank >= 0 && rank < 8) {
                this.enPassantTarget = { row: rank, col: file };
            }
        }

        // Parse move counters
        this.halfMoveClock = halfmove ? parseInt(halfmove) : 0;
        this.fullMoveNumber = fullmove ? parseInt(fullmove) : 1;

        // Reset other state
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.positionHistory = [];
        this.gameState = 'playing';

        // Check if currently in check
        if (this.isInCheck(this.currentPlayer)) {
            this.gameState = 'check';
        }

        return true;
    }

    /**
     * Export position to FEN notation
     * @returns {string} FEN string
     */
    toFEN() {
        const pieceMap = {
            'r_black': 'r', 'n_black': 'n', 'b_black': 'b',
            'q_black': 'q', 'k_black': 'k', 'p_black': 'p',
            'r_white': 'R', 'n_white': 'N', 'b_white': 'B',
            'q_white': 'Q', 'k_white': 'K', 'p_white': 'P'
        };

        let fen = '';

        // Position
        for (let row = 0; row < 8; row++) {
            let emptyCount = 0;
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece) {
                    if (emptyCount > 0) {
                        fen += emptyCount;
                        emptyCount = 0;
                    }
                    fen += pieceMap[`${piece.type}_${piece.color}`];
                } else {
                    emptyCount++;
                }
            }
            if (emptyCount > 0) fen += emptyCount;
            if (row < 7) fen += '/';
        }

        // Active color
        fen += ' ' + (this.currentPlayer === 'white' ? 'w' : 'b');

        // Castling
        let castling = '';
        if (this.castlingRights.white.kingSide) castling += 'K';
        if (this.castlingRights.white.queenSide) castling += 'Q';
        if (this.castlingRights.black.kingSide) castling += 'k';
        if (this.castlingRights.black.queenSide) castling += 'q';
        fen += ' ' + (castling || '-');

        // En passant
        if (this.enPassantTarget) {
            const file = String.fromCharCode('a'.charCodeAt(0) + this.enPassantTarget.col);
            const rank = 8 - this.enPassantTarget.row;
            fen += ' ' + file + rank;
        } else {
            fen += ' -';
        }

        // Move counters
        fen += ` ${this.halfMoveClock} ${this.fullMoveNumber}`;

        return fen;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChessEngine;
}
