const board = document.getElementById('board');
const cells = document.querySelectorAll('.cell');
const message = document.getElementById('message');
const resetButton = document.getElementById('reset');
const xWinsEl = document.getElementById('xWins');
const oWinsEl = document.getElementById('oWins');
const drawsEl = document.getElementById('draws');
const modeSwitch = document.getElementById('checkbox');
const modeSwitchSound = document.getElementById('sound');

let gameBoard = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'x';
let gameActive = true;
let aiMode = modeSwitch.checked;

// Kaydinta xogta score-ka
const getScores = () => {
    if (aiMode) {
        return {
            xWins: parseInt(localStorage.getItem('aiWins')) || 0,
            oWins: parseInt(localStorage.getItem('aiLosses')) || 0,
            draws: parseInt(localStorage.getItem('aiDraws')) || 0
        };
    } else {
        return {
            xWins: parseInt(localStorage.getItem('xWins')) || 0,
            oWins: parseInt(localStorage.getItem('oWins')) || 0,
            draws: parseInt(localStorage.getItem('draws')) || 0
        };
    }
};

let { xWins, oWins, draws } = getScores();
xWinsEl.innerText = xWins;
oWinsEl.innerText = oWins;
drawsEl.innerText = draws;

const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

const clickSound = new Audio('/click.mp3');
const winSound = new Audio('/celebration.mp3');
clickSound.volume = 1;
winSound.volume = 1;
const handleClick = (e) => {
    const index = parseInt(e.target.dataset.index);
    if (gameBoard[index] === '' && gameActive) {
        playMove(index);
        if (gameActive && aiMode && currentPlayer === 'o') {
            setTimeout(aiMove, 500);
        }
    }
};


const playMove = (index) => {
    if (gameBoard[index] === '') {
        clickSound.currentTime = 0;
        clickSound.play();
        gameBoard[index] = currentPlayer;
        cells[index].classList.add(currentPlayer);
        cells[index].innerText = currentPlayer.toUpperCase();

        if (checkWin()) {
            highlightWinningCells();
            winSound.play();
            message.innerText = currentPlayer.toUpperCase() + ' Wins!';
            currentPlayer === 'x' ? xWins++ : oWins++;
            updateScore();
            saveScore();
            gameActive = false;
        } else if (checkDraw()) {
            message.innerText = "It's a Draw!";
            draws++;
            updateScore();
            saveScore();
        } else {
            currentPlayer = currentPlayer === 'x' ? 'o' : 'x';
            message.innerText = 'Turn: ' + currentPlayer.toUpperCase();
        }
    }
};

const checkWin = () => winningCombinations.some(combination => 
    combination.every(index => gameBoard[index] === currentPlayer));

const checkDraw = () => gameBoard.every(cell => cell !== '');

const highlightWinningCells = () => {
    winningCombinations.forEach(combination => {
        if (combination.every(index => gameBoard[index] === currentPlayer)) {
            combination.forEach(index => {
                cells[index].classList.add('winner');
            });
        }
    });
};

const updateScore = () => {
    xWinsEl.innerText = xWins;
    oWinsEl.innerText = oWins;
    drawsEl.innerText = draws;
};

const saveScore = () => {
    if (aiMode) {
        localStorage.setItem('aiWins', xWins);
        localStorage.setItem('aiLosses', oWins);
        localStorage.setItem('aiDraws', draws);
    } else {
        localStorage.setItem('xWins', xWins);
        localStorage.setItem('oWins', oWins);
        localStorage.setItem('draws', draws);
    }
};

// Update the resetGame function to handle AI turn more clearly
const resetGame = () => {
    gameBoard.fill('');
    gameActive = true;
    currentPlayer = currentPlayer === 'x' ? 'o' : 'x';
    message.innerText = 'Turn: ' + currentPlayer.toUpperCase();

    cells.forEach(cell => {
        cell.classList.remove('x', 'o', 'winner');
        cell.innerText = '';
        cell.style.pointerEvents = 'auto'; // Re-enable clicking for all cells
    });

    // Disable clicking during AI's turn
    if (aiMode && currentPlayer === 'o') {
        cells.forEach(cell => {
            cell.style.pointerEvents = 'none'; // Disable clicking during AI's turn
        });
        setTimeout(aiMove, 500);
    }
};

const aiMove = () => {
    let bestMove = minimax(gameBoard, 'o').index;
    if (bestMove !== undefined) {
        playMove(bestMove);
        // Re-enable clicks after AI makes its move
        if (gameActive) {
            setTimeout(() => {
                cells.forEach(cell => {
                    cell.style.pointerEvents = 'auto'; // Re-enable clicking after AI move
                });
            }, 500); // You can adjust the timeout delay as needed
        }
    }
};

const minimax = (board, player) => {
    let availableMoves = board.map((cell, index) => (cell === '' ? index : null)).filter(v => v !== null);

    if (checkWinState(board, 'x')) return { score: -10 };
    if (checkWinState(board, 'o')) return { score: 10 };
    if (availableMoves.length === 0) return { score: 0 };

    let moves = [];
    for (let i = 0; i < availableMoves.length; i++) {
        let move = {};
        move.index = availableMoves[i];
        board[availableMoves[i]] = player;

        if (player === 'o') {
            let result = minimax(board, 'x');
            move.score = result.score;
        } else {
            let result = minimax(board, 'o');
            move.score = result.score;
        }

        board[availableMoves[i]] = '';
        moves.push(move);
    }

    let bestMove;
    if (player === 'o') {
        let highestScore = -Infinity;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score > highestScore) {
                highestScore = moves[i].score;
                bestMove = i;
            }
        }
    } else {
        let lowestScore = Infinity;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score < lowestScore) {
                lowestScore = moves[i].score;
                bestMove = i;
            }
        }
    }

    return moves[bestMove];
};

const checkWinState = (board, player) => 
    winningCombinations.some(combination => 
        combination.every(index => board[index] === player));

modeSwitch.addEventListener('change', () => {
    aiMode = modeSwitch.checked;
    if(modeSwitch.checked) {
      document.querySelectorAll('#mode span').forEach(a => a.classList.remove('active'));
      document.getElementById('ai').classList.add('active')
    } else {
      document.querySelectorAll('#mode span').forEach(a => a.classList.remove('active'));
      document.getElementById('player').classList.add('active')
    } 
    ({ xWins, oWins, draws } = getScores());
    updateScore();
    resetGame();
});

cells.forEach(cell => cell.addEventListener('click', handleClick));
resetButton.addEventListener('click', resetGame);
modeSwitchSound.addEventListener('change', function () {
    if (modeSwitchSound.checked === true) {
        winSound.muted = false;
        clickSound.muted = false;
        clickSound.volume = 1;
        winSound.volume = 1;
        // Update the UI to show muted state
        document.querySelectorAll('#sound-mode span').forEach(a => a.classList.remove('active'));
        document.getElementById('on').classList.add('active');
    } else {
        winSound.muted = true;
        clickSound.muted = true;
        clickSound.volume = 0;
        winSound.volume = 0;
        // Update the UI to show unmuted state
        document.querySelectorAll('#sound-mode span').forEach(a => a.classList.remove('active'));
        document.getElementById('off').classList.add('active');
    }
});