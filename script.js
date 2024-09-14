let gridSize = 5;
let flyPosition = { x: 0, y: 0 };
let moveCount = 0;
let maxMoves = 10;
let gameOver = false;
let traps = [];
let trapsEnabled = false;
let flyHasExitedOrTrapped = false;

const gameContainer = document.getElementById('game-container');
const gridSizeInput = document.getElementById('grid-size');
const gridSizeValue = document.getElementById('grid-size-value');
const startButton = document.getElementById('start-button');
const nextMoveButton = document.getElementById('next-move-button');
const flyExitedButton = document.getElementById('fly-exited-button');
const restartButton = document.getElementById('restart-button');
const currentMoveDisplay = document.getElementById('current-move');
const flyDirectionDisplay = document.getElementById('fly-direction');
const showFlyCheckbox = document.getElementById('show-fly-checkbox');
const enableTrapsCheckbox = document.getElementById('enable-traps-checkbox');
const gameStatusDisplay = document.getElementById('game-status');

gridSizeInput.addEventListener('input', () => {
    gridSize = parseInt(gridSizeInput.value);
    gridSizeValue.textContent = `${gridSize} x ${gridSize}`;
    document.documentElement.style.setProperty('--grid-size', gridSize);
    createGrid();
});

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', restartGame);
nextMoveButton.addEventListener('click', moveFly);
flyExitedButton.addEventListener('click', checkFlyExited);
showFlyCheckbox.addEventListener('change', updateFlyVisibility);

function createGrid() {
    gameContainer.innerHTML = '';
    document.documentElement.style.setProperty('--grid-size', gridSize);

    for (let i = 0; i < gridSize * gridSize; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        gameContainer.appendChild(cell);
    }
}

function placeFly() {
    const cells = document.querySelectorAll('.cell');
    let randomIndex;

    do {
        randomIndex = Math.floor(Math.random() * cells.length);
    } while (traps.includes(randomIndex)); // Муха не должна появляться на ловушке

    cells[randomIndex].classList.add('fly');
    flyPosition.x = randomIndex % gridSize;
    flyPosition.y = Math.floor(randomIndex / gridSize);
}

function placeTraps() {
    traps = [];
    const cells = document.querySelectorAll('.cell');
    let numberOfTraps;

    // Определяем количество ловушек в зависимости от размера поля
    if (gridSize === 5) {
        numberOfTraps = 2;
    } else if (gridSize === 10) {
        numberOfTraps = 10;
    } else {
        // Пропорционально размеру поля
        numberOfTraps = Math.floor((gridSize * gridSize) / 25 * 2);
    }

    while (traps.length < numberOfTraps) {
        let randomIndex = Math.floor(Math.random() * cells.length);
        // Ловушка не должна быть там, где муха
        if (!traps.includes(randomIndex) && !(flyPosition.x === randomIndex % gridSize && flyPosition.y === Math.floor(randomIndex / gridSize))) {
            traps.push(randomIndex);
            cells[randomIndex].classList.add('trap');
        }
    }
}

function moveFly() {
    if (gameOver) return;

    // Если муха уже вышла за пределы или попала в ловушку
    if (flyHasExitedOrTrapped) {
        gameOver = true;
        gameStatusDisplay.textContent = `Вы проиграли! Муха уже вышла за пределы или попала в ловушку, а вы продолжили ходить.`;
        nextMoveButton.disabled = true;
        flyExitedButton.disabled = true;
        playLoseAnimation();
        return;
    }

    const directions = [
    { x: -1, y: 0, name: 'влево⬅️'},
    { x: 1, y: 0, name: 'вправо➡️'},
    { x: 0, y: -1, name: 'вверх⬆️'},
    { x: 0, y: 1, name: 'вниз⬇️' },
    ];

    let possibleDirections = directions.slice();

    // В первые 10 ходов муха не может выйти за пределы поля
    if (moveCount < maxMoves) {
        possibleDirections = possibleDirections.filter(direction => {
            const newX = flyPosition.x + direction.x;
            const newY = flyPosition.y + direction.y;
            return newX >= 0 && newX < gridSize && newY >= 0 && newY < gridSize;
        });
    }

    if (possibleDirections.length === 0) {
        // Муха не может двигаться
        flyDirectionDisplay.textContent = 'нет доступных ходов';
        moveCount++;
        currentMoveDisplay.textContent = moveCount;
        return;
    }

    const randomDirection = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
    moveCount++;
    currentMoveDisplay.textContent = moveCount;
    flyDirectionDisplay.textContent = randomDirection.name;

    flyPosition.x += randomDirection.x;
    flyPosition.y += randomDirection.y;

    updateFlyVisibility();

    // Проверяем, вышла ли муха за пределы после хода
    if (
        flyPosition.x < 0 ||
        flyPosition.x >= gridSize ||
        flyPosition.y < 0 ||
        flyPosition.y >= gridSize
    ) {
        // Муха вышла за пределы
        flyHasExitedOrTrapped = true;
        //gameStatusDisplay.textContent = 'Муха могла выйти за пределы или попасть в ловушку.';
        return;
    }

    // Проверяем, наступила ли муха на ловушку после движения
    if (trapsEnabled) {
        const flyIndex = flyPosition.y * gridSize + flyPosition.x;
        if (traps.includes(flyIndex)) {
            // Муха попала в ловушку
            flyHasExitedOrTrapped = true;
            gameStatusDisplay.textContent = 'Муха могла выйти за пределы или попасть в ловушку.';
            return;
        }
    }

    // Условие победы (если игрок продержался 50 ходов, и муха не вышла)
    if (moveCount >= 50 && !gameOver) {
        gameOver = true;
        gameStatusDisplay.textContent = `Вы выиграли! Муха осталась на поле после ${moveCount} ходов.`;
        nextMoveButton.disabled = true;
        flyExitedButton.disabled = true;
        playWinAnimation();
    }
}

function checkFlyExited() {
    if (gameOver) return;

    if (flyHasExitedOrTrapped) {
        // Муха действительно вышла за пределы или попала в ловушку
        gameOver = true;
        gameStatusDisplay.textContent = `Вы выиграли! Вы правильно определили, что муха вышла за пределы или попала в ловушку на ходу ${moveCount}.`;
        nextMoveButton.disabled = true;
        flyExitedButton.disabled = true;
        playWinAnimation();
    } else {
        // Муха еще на поле, игрок ошибся
        gameOver = true;
        gameStatusDisplay.textContent = `Вы проиграли! Муха еще на поле, а вы думали, что она вышла или попала в ловушку.`;
        nextMoveButton.disabled = true;
        flyExitedButton.disabled = true;
        playLoseAnimation();
    }
}

function updateFlyVisibility() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.classList.remove('fly');
        cell.classList.remove('trap');
    });

    if (!gameOver) {
        // Отображаем муху
        if (
            flyPosition.x >= 0 &&
            flyPosition.x < gridSize &&
            flyPosition.y >= 0 &&
            flyPosition.y < gridSize
        ) {
            const index = flyPosition.y * gridSize + flyPosition.x;
            if (moveCount === 0 || showFlyCheckbox.checked) {
                cells[index].classList.add('fly');
            }
        }

        // Отображаем ловушки
        if (trapsEnabled) {
            traps.forEach(trapIndex => {
                if (moveCount === 0 || showFlyCheckbox.checked) {
                    cells[trapIndex].classList.add('trap');
                }
            });
        }
    }
}

function startGame() {
    moveCount = 0;
    maxMoves = 10; // В первые 10 ходов муха не может выйти за пределы
    gameOver = false;
    flyHasExitedOrTrapped = false;
    trapsEnabled = enableTrapsCheckbox.checked;
    currentMoveDisplay.textContent = moveCount;
    flyDirectionDisplay.textContent = '-';
    gameStatusDisplay.textContent = '';
    nextMoveButton.disabled = false;
    flyExitedButton.disabled = false;
    gameContainer.classList.remove('win-animation', 'lose-animation');
    createGrid();
    if (trapsEnabled) {
        placeTraps();
    }
    placeFly();
    updateFlyVisibility();
}

function restartGame() {
    startGame();
}

function playWinAnimation() {
    gameContainer.classList.add('win-animation');
}

function playLoseAnimation() {
    gameContainer.classList.add('lose-animation');
}

// Инициализация
document.documentElement.style.setProperty('--grid-size', gridSize);
createGrid();
