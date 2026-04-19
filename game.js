// Game variables
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("score");
const timeDisplay = document.getElementById("time");
const objectsLeftDisplay = document.getElementById("objectsLeft");
const finalScoreDisplay = document.getElementById("finalScore");
const finalTimeDisplay = document.getElementById("finalTime");
const startScreen = document.getElementById("startScreen");
const gameUI = document.getElementById("gameUI");
const gameOverScreen = document.getElementById("gameOverScreen");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");

// Sound effects
const collectSound = document.getElementById("collectSound");
const obstacleSound = document.getElementById("obstacleSound");
const winSound = document.getElementById("winSound");

// Dino properties
const dino = {
    x: 400,
    y: 250,
    width: 40,
    height: 40,
    speed: 5,
    emoji: "🦖"
};

// Objects to collect
let objects = [];
const objectCount = 10;
const objectSize = 30;
const objectEmojis = ["🍎", "🍌", "🍒", "💎", "🪙"];

// Obstacles
let obstacles = [];
const obstacleCount = 8;
const obstacleSize = 30;
const obstacleEmojis = ["🪨", "🌳", "🔥"];

// Game state
let score = 0;
let time = 0;
let objectsCollected = 0;
let gameRunning = false;
let startTime = 0;
let gameLoopId = null;

// Initialize game
function initGame() {
    // Reset game state
    score = 0;
    time = 0;
    objectsCollected = 0;
    objects = [];
    obstacles = [];
    dino.x = 400;
    dino.y = 250;
    
    // Update UI
    scoreDisplay.textContent = score;
    timeDisplay.textContent = time;
    objectsLeftDisplay.textContent = objectCount;
    
    // Spawn objects
    for (let i = 0; i < objectCount; i++) {
        objects.push({
            x: Math.random() * (canvas.width - objectSize),
            y: Math.random() * (canvas.height - objectSize),
            width: objectSize,
            height: objectSize,
            emoji: objectEmojis[Math.floor(Math.random() * objectEmojis.length)]
        });
    }

    // Spawn obstacles
    for (let i = 0; i < obstacleCount; i++) {
        obstacles.push({
            x: Math.random() * (canvas.width - obstacleSize),
            y: Math.random() * (canvas.height - obstacleSize),
            width: obstacleSize,
            height: obstacleSize,
            emoji: obstacleEmojis[Math.floor(Math.random() * obstacleEmojis.length)]
        });
    }
}

// Draw dino
function drawDino() {
    ctx.font = "30px Arial";
    ctx.fillText(dino.emoji, dino.x, dino.y + 30);
}

// Draw objects
function drawObjects() {
    objects.forEach(obj => {
        ctx.font = "25px Arial";
        ctx.fillText(obj.emoji, obj.x, obj.y + 25);
    });
}

// Draw obstacles
function drawObstacles() {
    obstacles.forEach(obstacle => {
        ctx.font = "25px Arial";
        ctx.fillText(obstacle.emoji, obstacle.x, obstacle.y + 25);
    });
}

// Check collision
function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

// Update game state
function updateGame() {
    if (!gameRunning) return;

    // Move dino based on keyboard input
    if (keys.ArrowUp || keys.w) dino.y -= dino.speed;
    if (keys.ArrowDown || keys.s) dino.y += dino.speed;
    if (keys.ArrowLeft || keys.a) dino.x -= dino.speed;
    if (keys.ArrowRight || keys.d) dino.x += dino.speed;

    // Keep dino inside canvas
    dino.x = Math.max(0, Math.min(canvas.width - dino.width, dino.x));
    dino.y = Math.max(0, Math.min(canvas.height - dino.height, dino.y));

    // Check object collection
    objects.forEach((obj, index) => {
        if (checkCollision(dino, obj)) {
            objects.splice(index, 1);
            objectsCollected++;
            score += 10;
            objectsLeftDisplay.textContent = objectCount - objectsCollected;
            scoreDisplay.textContent = score;
            collectSound.play();
        }
    });

    // Check obstacle collision
    obstacles.forEach(obstacle => {
        if (checkCollision(dino, obstacle)) {
            gameRunning = false;
            obstacleSound.play();
            showGameOverScreen();
        }
    });

    // Check win condition
    if (objectsCollected === objectCount) {
        gameRunning = false;
        const endTime = Date.now();
        time = Math.floor((endTime - startTime) / 1000);
        timeDisplay.textContent = time;
        finalScoreDisplay.textContent = score - time;
        finalTimeDisplay.textContent = time;
        winSound.play();
        showGameOverScreen();
    }
}

// Show game over screen
function showGameOverScreen() {
    gameUI.style.display = "none";
    gameOverScreen.style.display = "flex";
    cancelAnimationFrame(gameLoopId);
}

// Show game UI
function showGameUI() {
    startScreen.style.display = "none";
    gameUI.style.display = "block";
    gameOverScreen.style.display = "none";
    canvas.style.display = "block";
    gameRunning = true;
    startTime = Date.now();
    gameLoop();
}

// Keyboard input
const keys = {};
window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
});

window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
});

// Touch controls for mobile
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: true });

canvas.addEventListener("touchmove", (e) => {
    if (!gameRunning) return;
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const diffX = touchX - touchStartX;
    const diffY = touchY - touchStartY;
    
    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 0) {
            dino.x += dino.speed;
        } else {
            dino.x -= dino.speed;
        }
    } else {
        if (diffY > 0) {
            dino.y += dino.speed;
        } else {
            dino.y -= dino.speed;
        }
    }
    
    touchStartX = touchX;
    touchStartY = touchY;
    e.preventDefault();
}, { passive: false });

// Game loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawDino();
    drawObjects();
    drawObstacles();
    updateGame();
    gameLoopId = requestAnimationFrame(gameLoop);
}

// Event listeners
startButton.addEventListener("click", () => {
    initGame();
    showGameUI();
});

restartButton.addEventListener("click", () => {
    initGame();
    showGameUI();
});