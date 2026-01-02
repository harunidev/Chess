/**
 * Star Chess - Game Controller
 * Handles UI, user interactions, and game flow
 */

class ChessGame {
    constructor() {
        this.engine = new ChessEngine();
        this.ai = new ChessAI('medium');
        this.tutorial = new ChessTutorial();

        this.selectedSquare = null;
        this.validMoves = [];
        this.lastMove = null;
        this.isPlayerTurn = true;
        this.playerColor = 'white';
        this.gameMode = 'menu'; // menu, play, tutorial
        this.difficulty = 'medium';
        this.isThinking = false;

        this.pieceSymbols = {
            white: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
            black: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
        };

        this.init();
    }

    init() {
        this.bindEvents();
        this.showModeSelection();
    }

    bindEvents() {
        // Navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.handleNavigation(mode);
            });
        });

        // Difficulty buttons
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.difficulty = e.currentTarget.dataset.difficulty;
            });
        });

        // Play button - show color selection modal
        const playBtn = document.querySelector('.play-btn');
        if (playBtn) {
            playBtn.addEventListener('click', () => this.showColorSelection());
        }

        // Color selection buttons
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.currentTarget.dataset.color;
                this.hideModal('color-modal');
                this.startGame(color);
            });
        });

        // Opening buttons
        document.querySelectorAll('.opening-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const opening = e.currentTarget.dataset.opening;
                this.startTutorial(opening);
            });
        });

        // Logo click - go home
        document.getElementById('logo-home')?.addEventListener('click', () => this.goHome());

        // Game control buttons
        document.getElementById('btn-new-game')?.addEventListener('click', () => this.newGame());
        document.getElementById('btn-undo')?.addEventListener('click', () => this.undoMove());
        document.getElementById('btn-home')?.addEventListener('click', () => this.goHome());
        document.getElementById('btn-tutorial-home')?.addEventListener('click', () => this.goHome());
        document.getElementById('btn-puzzle-home')?.addEventListener('click', () => this.goHome());

        // Tutorial controls
        document.getElementById('btn-prev-step')?.addEventListener('click', () => this.tutorialPrevStep());
        document.getElementById('btn-next-step')?.addEventListener('click', () => this.tutorialNextStep());

        // Game over modal buttons
        document.getElementById('btn-rematch')?.addEventListener('click', () => this.newGame());
        document.getElementById('btn-gameover-home')?.addEventListener('click', () => {
            this.hideModal('gameover-modal');
            this.goHome();
        });

        // Promotion modal
        document.querySelectorAll('.promotion-piece').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const piece = e.currentTarget.dataset.piece;
                this.completePromotion(piece);
            });
        });
    }

    // Navigation
    handleNavigation(mode) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        if (mode === 'play') {
            this.showModeSelection();
        } else if (mode === 'tutorial') {
            this.showModeSelection();
        } else if (mode === 'puzzle') {
            this.startPuzzleMode();
        }
    }

    showModeSelection() {
        this.gameMode = 'menu';
        document.getElementById('mode-selection').classList.remove('hidden');
        document.getElementById('game-area').classList.add('hidden');
        document.getElementById('tutorial-area').classList.add('hidden');
        document.getElementById('puzzle-area')?.classList.add('hidden');
    }

    // Start puzzle mode
    async startPuzzleMode() {
        this.gameMode = 'puzzle';
        document.getElementById('mode-selection').classList.add('hidden');
        document.getElementById('game-area').classList.add('hidden');
        document.getElementById('tutorial-area').classList.add('hidden');
        document.getElementById('puzzle-area').classList.remove('hidden');

        // Start puzzle mode
        await puzzleMode.start();

        // Update statistics display
        this.updatePuzzleStats();
    }

    // Update puzzle statistics
    updatePuzzleStats() {
        const summary = storage.stats.getPuzzleSummary();
        document.getElementById('stat-total').textContent = summary.total;
        document.getElementById('stat-solved').textContent = summary.solved;
        document.getElementById('stat-rate').textContent = summary.solveRate + '%';
    }

    // Show color selection modal
    showColorSelection() {
        this.showModal('color-modal');
    }

    // Start a new game with selected color
    startGame(playerColor = 'white') {
        this.gameMode = 'play';
        this.playerColor = playerColor;
        this.engine.reset();
        this.ai.setDifficulty(this.difficulty);
        this.selectedSquare = null;
        this.validMoves = [];
        this.lastMove = null;

        // If playing as black, AI (white) moves first
        this.isPlayerTurn = (playerColor === 'white');

        document.getElementById('mode-selection').classList.add('hidden');
        document.getElementById('game-area').classList.remove('hidden');
        document.getElementById('tutorial-area').classList.add('hidden');

        // Update AI level display
        const levelDisplay = document.getElementById('ai-level');
        if (levelDisplay) {
            const levels = { easy: 'Kolay', medium: 'Orta', hard: 'Zor' };
            levelDisplay.textContent = levels[this.difficulty] || 'Orta';
        }

        // Update player info display
        const playerColorEl = document.querySelector('.player-color');
        if (playerColorEl) {
            playerColorEl.textContent = playerColor === 'white' ? 'Beyaz' : 'Siyah';
        }

        this.renderBoard('chess-board');
        this.updateGameStatus();
        this.updateMoveHistory();
        this.updateCapturedPieces();

        // If playing as black, AI makes first move
        if (playerColor === 'black') {
            setTimeout(() => this.makeAIMove(), 500);
        }
    }

    // New game (restart) - show color selection again
    newGame() {
        this.hideModal('gameover-modal');
        this.showColorSelection();
    }

    // Go back to home/menu
    goHome() {
        this.showModeSelection();
    }

    // Render the chess board
    renderBoard(boardId) {
        const boardElement = document.getElementById(boardId);
        if (!boardElement) return;

        boardElement.innerHTML = '';

        // Determine if board should be flipped (black at bottom when playing as black)
        const flipped = this.playerColor === 'black';

        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                // When flipped, iterate in reverse order
                const row = flipped ? (7 - i) : i;
                const col = flipped ? (7 - j) : j;

                const square = document.createElement('div');
                square.className = 'square';
                square.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
                square.dataset.row = row;
                square.dataset.col = col;

                // Check if this is the selected square
                if (this.selectedSquare &&
                    this.selectedSquare.row === row &&
                    this.selectedSquare.col === col) {
                    square.classList.add('selected');
                }

                // Check if this is a valid move
                const validMove = this.validMoves.find(m => m.row === row && m.col === col);
                if (validMove) {
                    if (validMove.capture) {
                        square.classList.add('valid-capture');
                    } else {
                        square.classList.add('valid-move');
                    }
                }

                // Check if this is the last move
                if (this.lastMove) {
                    if ((this.lastMove.from.row === row && this.lastMove.from.col === col) ||
                        (this.lastMove.to.row === row && this.lastMove.to.col === col)) {
                        square.classList.add('last-move');
                    }
                }

                // Check for check highlight
                const piece = this.engine.getPiece(row, col);
                if (piece && piece.type === 'k' &&
                    this.engine.isInCheck(piece.color) &&
                    this.engine.currentPlayer === piece.color) {
                    square.classList.add('check');
                }

                // Add piece if present
                if (piece) {
                    const pieceElement = document.createElement('span');
                    pieceElement.className = `piece ${piece.color}`;
                    pieceElement.textContent = this.pieceSymbols[piece.color][piece.type];
                    square.appendChild(pieceElement);
                }

                // Add click handler for game mode
                if (this.gameMode === 'play') {
                    square.addEventListener('click', () => this.handleSquareClick(row, col));
                }

                boardElement.appendChild(square);
            }
        }
    }

    // Handle square click
    handleSquareClick(row, col) {
        if (!this.isPlayerTurn || this.isThinking) return;
        if (this.engine.gameState === 'checkmate' ||
            this.engine.gameState === 'stalemate' ||
            this.engine.gameState === 'draw') return;

        const clickedPiece = this.engine.getPiece(row, col);

        // If a piece is already selected
        if (this.selectedSquare) {
            // Check if clicking on a valid move
            const validMove = this.validMoves.find(m => m.row === row && m.col === col);

            if (validMove) {
                // Check for promotion
                if (validMove.promotion) {
                    this.pendingPromotion = {
                        from: this.selectedSquare,
                        to: { row, col }
                    };
                    this.showPromotionModal();
                    return;
                }

                // Make the move
                this.makePlayerMove(this.selectedSquare.row, this.selectedSquare.col, row, col);
                return;
            }

            // If clicking on own piece, check if same piece (toggle) or select new one
            if (clickedPiece && clickedPiece.color === this.playerColor) {
                // If clicking the same piece, deselect it
                if (this.selectedSquare.row === row && this.selectedSquare.col === col) {
                    console.log('🔄 Deselecting piece at', row, col);
                    this.deselectSquare();
                    return;
                }
                // Otherwise select the new piece
                this.selectSquare(row, col);
                return;
            }

            // Otherwise deselect
            this.deselectSquare();
            return;
        }

        // If no piece is selected, try to select one
        if (clickedPiece && clickedPiece.color === this.playerColor) {
            this.selectSquare(row, col);
        }
    }

    // Select a square
    selectSquare(row, col) {
        this.selectedSquare = { row, col };
        this.validMoves = this.engine.getValidMoves(row, col);
        this.renderBoard('chess-board');
    }

    // Deselect the current selection
    deselectSquare() {
        this.selectedSquare = null;
        this.validMoves = [];
        this.renderBoard('chess-board');
    }

    // Make a player move
    makePlayerMove(fromRow, fromCol, toRow, toCol, promotion = 'q') {
        // Animate piece movement
        this.animateMove(fromRow, fromCol, toRow, toCol, () => {
            const moveRecord = this.engine.makeMove(fromRow, fromCol, toRow, toCol, promotion);

            if (moveRecord) {
                this.lastMove = moveRecord;
                this.deselectSquare();
                this.updateGameStatus();
                this.updateMoveHistory();
                this.updateCapturedPieces();

                // Mark landing square for animation
                setTimeout(() => {
                    const squares = document.querySelectorAll('#chess-board .square');
                    const targetIndex = toRow * 8 + toCol;
                    if (squares[targetIndex]) {
                        squares[targetIndex].classList.add('just-moved');
                        setTimeout(() => squares[targetIndex].classList.remove('just-moved'), 200);
                    }
                }, 10);

                // Check for game over
                if (this.engine.gameState === 'checkmate' ||
                    this.engine.gameState === 'stalemate' ||
                    this.engine.gameState === 'draw') {
                    this.showGameOver();
                    return;
                }

                // AI turn
                this.isPlayerTurn = false;
                setTimeout(() => this.makeAIMove(), 500);
            }
        });
    }

    // Animate piece movement
    animateMove(fromRow, fromCol, toRow, toCol, callback) {
        const board = document.getElementById('chess-board');
        const squares = board.querySelectorAll('.square');

        // Account for flipped board when finding visual square index
        const flipped = this.playerColor === 'black';
        let visualFromRow = flipped ? (7 - fromRow) : fromRow;
        let visualFromCol = flipped ? (7 - fromCol) : fromCol;
        let visualToRow = flipped ? (7 - toRow) : toRow;
        let visualToCol = flipped ? (7 - toCol) : toCol;

        const fromIndex = visualFromRow * 8 + visualFromCol;
        const fromSquare = squares[fromIndex];

        if (!fromSquare) {
            callback();
            return;
        }

        const piece = fromSquare.querySelector('.piece');

        if (!piece) {
            callback();
            return;
        }

        // Calculate movement in terms of visual squares
        const deltaCol = visualToCol - visualFromCol;
        const deltaRow = visualToRow - visualFromRow;

        // Get square size
        const squareSize = fromSquare.offsetWidth;

        // Calculate pixel movement
        const moveX = deltaCol * squareSize;
        const moveY = deltaRow * squareSize;

        // Apply transform animation
        piece.style.transition = 'transform 0.25s ease-out';
        piece.style.transform = `translate(${moveX}px, ${moveY}px)`;
        piece.style.zIndex = '100';
        piece.style.position = 'relative';

        // Cleanup after animation
        setTimeout(() => {
            piece.style.transition = '';
            piece.style.transform = '';
            piece.style.zIndex = '';
            piece.style.position = '';
            callback();
        }, 260);
    }

    // Make AI move
    async makeAIMove() {
        this.isThinking = true;
        this.updateGameStatus('Bilgisayar düşünüyor...');

        // Use setTimeout to allow UI to update
        await new Promise(resolve => setTimeout(resolve, 100));

        const bestMove = this.ai.getBestMove(this.engine);

        if (bestMove) {
            // Animate AI move
            this.animateMove(
                bestMove.from.row, bestMove.from.col,
                bestMove.to.row, bestMove.to.col,
                () => {
                    const moveRecord = this.engine.makeMove(
                        bestMove.from.row, bestMove.from.col,
                        bestMove.to.row, bestMove.to.col,
                        bestMove.promotion || 'q'
                    );

                    if (moveRecord) {
                        this.lastMove = moveRecord;
                        this.renderBoard('chess-board');
                        this.updateGameStatus();
                        this.updateMoveHistory();
                        this.updateCapturedPieces();

                        // Check for game over
                        if (this.engine.gameState === 'checkmate' ||
                            this.engine.gameState === 'stalemate' ||
                            this.engine.gameState === 'draw') {
                            this.showGameOver();
                            this.isThinking = false;
                            return;
                        }
                    }

                    this.isThinking = false;
                    this.isPlayerTurn = true;
                    this.updateGameStatus();
                }
            );
        } else {
            this.isThinking = false;
            this.isPlayerTurn = true;
            this.updateGameStatus();
        }
    }

    // Undo move (undo both player and AI move)
    undoMove() {
        if (this.isThinking) return;

        // Undo AI move
        this.engine.undoMove();
        // Undo player move
        const lastMove = this.engine.undoMove();

        if (lastMove) {
            // Update last move display
            if (this.engine.moveHistory.length > 0) {
                this.lastMove = this.engine.moveHistory[this.engine.moveHistory.length - 1];
            } else {
                this.lastMove = null;
            }
        }

        this.deselectSquare();
        this.isPlayerTurn = true;
        this.updateGameStatus();
        this.updateMoveHistory();
        this.updateCapturedPieces();
    }

    // Show promotion modal
    showPromotionModal() {
        const modal = document.getElementById('promotion-modal');
        if (modal) {
            modal.classList.remove('hidden');
            // Update piece colors based on player color
            const pieces = this.playerColor === 'white'
                ? { q: '♕', r: '♖', b: '♗', n: '♘' }
                : { q: '♛', r: '♜', b: '♝', n: '♞' };

            document.querySelectorAll('.promotion-piece').forEach(btn => {
                btn.textContent = pieces[btn.dataset.piece];
            });
        }
    }

    // Complete promotion
    completePromotion(piece) {
        this.hideModal('promotion-modal');

        if (this.pendingPromotion) {
            this.makePlayerMove(
                this.pendingPromotion.from.row,
                this.pendingPromotion.from.col,
                this.pendingPromotion.to.row,
                this.pendingPromotion.to.col,
                piece
            );
            this.pendingPromotion = null;
        }
    }

    // Update game status display
    updateGameStatus(customMessage = null) {
        const statusElement = document.getElementById('game-status');
        if (!statusElement) return;

        const statusText = statusElement.querySelector('.status-text');
        if (!statusText) return;

        statusElement.classList.remove('check');

        if (customMessage) {
            statusText.innerHTML = customMessage + '<span class="thinking-indicator"><span></span><span></span><span></span></span>';
            return;
        }

        let message = '';

        switch (this.engine.gameState) {
            case 'checkmate':
                const winner = this.engine.currentPlayer === 'white' ? 'Siyah' : 'Beyaz';
                message = `Şahmat! ${winner} kazandı`;
                break;
            case 'stalemate':
                message = 'Pat! Berabere';
                break;
            case 'draw':
                message = 'Berabere!';
                break;
            case 'check':
                statusElement.classList.add('check');
                message = this.engine.currentPlayer === this.playerColor
                    ? 'Şah! Senin sıran'
                    : 'Şah çektin!';
                break;
            default:
                message = this.isPlayerTurn ? 'Senin sıran' : 'Bilgisayar düşünüyor...';
        }

        statusText.textContent = message;
    }

    // Update move history
    updateMoveHistory() {
        const historyElement = document.getElementById('move-history');
        if (!historyElement) return;

        historyElement.innerHTML = '';

        const moves = this.engine.moveHistory;
        for (let i = 0; i < moves.length; i += 2) {
            const moveNumber = Math.floor(i / 2) + 1;
            const whiteMove = this.engine.moveToAlgebraic(moves[i]);
            const blackMove = moves[i + 1] ? this.engine.moveToAlgebraic(moves[i + 1]) : '';

            const row = document.createElement('div');
            row.className = 'move-row';
            row.innerHTML = `
                <span class="move-number">${moveNumber}.</span>
                <span class="move-white">${whiteMove}</span>
                <span class="move-black">${blackMove}</span>
            `;
            historyElement.appendChild(row);
        }

        // Scroll to bottom
        historyElement.scrollTop = historyElement.scrollHeight;
    }

    // Update captured pieces display
    updateCapturedPieces() {
        const whiteCaptured = document.getElementById('white-captured');
        const blackCaptured = document.getElementById('black-captured');

        if (whiteCaptured) {
            whiteCaptured.innerHTML = this.engine.capturedPieces.white
                .map(p => this.pieceSymbols.black[p.type])
                .join('');
        }

        if (blackCaptured) {
            blackCaptured.innerHTML = this.engine.capturedPieces.black
                .map(p => this.pieceSymbols.white[p.type])
                .join('');
        }
    }

    // Show game over modal
    showGameOver() {
        const modal = document.getElementById('gameover-modal');
        const iconEl = document.getElementById('gameover-icon');
        const titleEl = document.getElementById('gameover-title');
        const messageEl = document.getElementById('gameover-message');

        if (!modal || !iconEl || !titleEl || !messageEl) return;

        let icon = '🏆';
        let title = 'Oyun Bitti!';
        let message = '';

        switch (this.engine.gameState) {
            case 'checkmate':
                const playerWon = this.engine.currentPlayer !== this.playerColor;
                if (playerWon) {
                    icon = '🏆';
                    title = 'Tebrikler!';
                    message = 'Bilgisayarı yendin!';
                } else {
                    icon = '😔';
                    title = 'Kaybettin';
                    message = 'Bir dahaki sefere!';
                }
                break;
            case 'stalemate':
                icon = '🤝';
                title = 'Pat!';
                message = 'Oyun berabere bitti.';
                break;
            case 'draw':
                icon = '🤝';
                title = 'Berabere';
                message = 'Oyun berabere bitti.';
                break;
        }

        iconEl.textContent = icon;
        titleEl.textContent = title;
        messageEl.textContent = message;

        modal.classList.remove('hidden');
    }

    // Show modal
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    // Hide modal
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // ============= Tutorial Mode =============

    startTutorial(openingKey) {
        this.gameMode = 'tutorial';
        this.tutorial.startTutorial(openingKey);

        document.getElementById('mode-selection').classList.add('hidden');
        document.getElementById('game-area').classList.add('hidden');
        document.getElementById('tutorial-area').classList.remove('hidden');

        const opening = this.tutorial.getCurrentOpening();
        if (opening) {
            document.getElementById('tutorial-title').textContent = opening.name;
            document.getElementById('tutorial-description').textContent = opening.description;
        }

        this.engine.reset();
        this.selectedSquare = null;
        this.validMoves = [];
        this.lastMove = null;

        this.renderTutorialSteps();
        this.renderTutorialBoard();
        this.updateTutorialControls();
    }

    renderTutorialSteps() {
        const opening = this.tutorial.getCurrentOpening();
        if (!opening) return;

        const currentStep = this.tutorial.currentStep;
        const totalSteps = opening.moves.length;

        // Update current move notation
        const notationEl = document.getElementById('current-notation');
        const badgeEl = document.getElementById('move-color-badge');
        const explanationEl = document.getElementById('tutorial-explanation');
        const progressFill = document.getElementById('tutorial-progress-fill');
        const stepCounter = document.getElementById('step-counter');

        if (currentStep >= totalSteps) {
            // Tutorial complete
            if (notationEl) notationEl.textContent = '✓';
            if (badgeEl) {
                badgeEl.textContent = 'Tamamlandı';
                badgeEl.classList.remove('black-move');
            }
            if (explanationEl) {
                explanationEl.innerHTML = `<p>${opening.finalPosition}</p>`;
            }
            if (progressFill) progressFill.style.width = '100%';
            if (stepCounter) stepCounter.textContent = `${totalSteps}/${totalSteps}`;
        } else {
            const move = opening.moves[currentStep];
            const isBlackMove = !!move.black;

            if (notationEl) notationEl.textContent = move.notation;
            if (badgeEl) {
                badgeEl.textContent = isBlackMove ? 'Siyah oynar' : 'Beyaz oynar';
                if (isBlackMove) {
                    badgeEl.classList.add('black-move');
                } else {
                    badgeEl.classList.remove('black-move');
                }
            }
            if (explanationEl) {
                explanationEl.innerHTML = `<p>${move.explanation}</p>`;
            }
            if (progressFill) {
                const progress = (currentStep / totalSteps) * 100;
                progressFill.style.width = `${progress}%`;
            }
            if (stepCounter) stepCounter.textContent = `${currentStep + 1}/${totalSteps}`;
        }
    }

    renderTutorialBoard() {
        const boardElement = document.getElementById('tutorial-board');
        if (!boardElement) return;

        // Reset engine and apply moves up to current step
        this.engine.reset();
        const opening = this.tutorial.getCurrentOpening();

        if (opening) {
            for (let i = 0; i < this.tutorial.currentStep; i++) {
                const move = opening.moves[i];
                if (move.white) {
                    this.engine.makeMove(
                        move.white.from.row, move.white.from.col,
                        move.white.to.row, move.white.to.col
                    );
                }
                if (move.black) {
                    this.engine.makeMove(
                        move.black.from.row, move.black.from.col,
                        move.black.to.row, move.black.to.col
                    );
                }
            }

            // Get the current move for highlighting
            if (this.tutorial.currentStep > 0) {
                const prevMove = opening.moves[this.tutorial.currentStep - 1];
                const moveData = prevMove.black || prevMove.white;
                if (moveData) {
                    this.lastMove = {
                        from: moveData.from,
                        to: moveData.to
                    };
                }
            } else {
                this.lastMove = null;
            }
        }

        boardElement.innerHTML = '';

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = 'square';
                square.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');

                // Highlight last move
                if (this.lastMove) {
                    if ((this.lastMove.from.row === row && this.lastMove.from.col === col) ||
                        (this.lastMove.to.row === row && this.lastMove.to.col === col)) {
                        square.classList.add('last-move');
                    }
                }

                // Add piece if present
                const piece = this.engine.getPiece(row, col);
                if (piece) {
                    const pieceElement = document.createElement('span');
                    pieceElement.className = `piece ${piece.color}`;
                    pieceElement.textContent = this.pieceSymbols[piece.color][piece.type];
                    square.appendChild(pieceElement);
                }

                boardElement.appendChild(square);
            }
        }
    }

    updateTutorialControls() {
        const prevBtn = document.getElementById('btn-prev-step');
        const nextBtn = document.getElementById('btn-next-step');
        const counter = document.getElementById('step-counter');
        const opening = this.tutorial.getCurrentOpening();

        if (prevBtn) {
            prevBtn.disabled = this.tutorial.currentStep === 0;
        }

        if (nextBtn) {
            nextBtn.disabled = this.tutorial.currentStep >= opening.moves.length;
            nextBtn.innerHTML = this.tutorial.currentStep >= opening.moves.length
                ? 'Tamamlandı ✓'
                : 'Sonraki <span>▶</span>';
        }

        if (counter && opening) {
            counter.textContent = `${Math.min(this.tutorial.currentStep + 1, opening.moves.length)}/${opening.moves.length}`;
        }
    }

    tutorialNextStep() {
        this.tutorial.nextStep();
        this.renderTutorialSteps();
        this.renderTutorialBoard();
        this.updateTutorialControls();
    }

    tutorialPrevStep() {
        this.tutorial.prevStep();
        this.renderTutorialSteps();
        this.renderTutorialBoard();
        this.updateTutorialControls();
    }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chessGame = new ChessGame();
});
