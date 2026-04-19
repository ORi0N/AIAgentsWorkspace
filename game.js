const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("score");
const timeDisplay = document.getElementById("time");
const objectsLeftDisplay = document.getElementById("objectsLeft");
const finalScoreDisplay = document.getElementById("finalScore");
const finalTimeDisplay = document.getElementById("finalTime");
const resultTitle = document.getElementById("resultTitle");
const resultMessage = document.getElementById("resultMessage");
const startScreen = document.getElementById("startScreen");
const gameUI = document.getElementById("gameUI");
const gameOverScreen = document.getElementById("gameOverScreen");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");

const collectSound = document.getElementById("collectSound");
const obstacleSound = document.getElementById("obstacleSound");
const winSound = document.getElementById("winSound");

const dino = {
    x: 120,
    y: 280,
    width: 44,
    height: 44,
    speed: 4.6,
    emoji: "🦖",
    hitboxInset: 10
};

let objects = [];
let obstacles = [];
let sparkles = [];

const objectCount = 10;
const objectSize = 28;
const objectEmojis = ["🍎", "🍌", "🍒", "💎", "🪙", "⭐", "🎁"];

const obstacleCount = 8;
const obstacleEmojis = ["🪨", "🌳", "🔥"];
const safeMargin = 80;

let score = 0;
let elapsedTime = 0;
let objectsCollected = 0;
let gameRunning = false;
let startTime = 0;
let gameLoopId = null;
let lastTimestamp = 0;
let gameState = "idle";

const keys = {};

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function createBounds(entity, inset = 0) {
    return {
        x: entity.x + inset,
        y: entity.y + inset,
        width: entity.width - inset * 2,
        height: entity.height - inset * 2
    };
}

function intersects(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

function distance(ax, ay, bx, by) {
    return Math.hypot(ax - bx, ay - by);
}

function canPlace(candidate, placed, minDistance) {
    return placed.every(item => distance(candidate.x, candidate.y, item.x, item.y) > minDistance);
}

function spawnItems(count, kind) {
    const placed = [];
    const isObstacle = kind === "obstacle";
    const minDistance = isObstacle ? 84 : 62;

    for (let i = 0; i < count; i++) {
        let candidate;
        let attempts = 0;
        do {
            candidate = {
                x: random(safeMargin, canvas.width - safeMargin),
                y: random(safeMargin, canvas.height - safeMargin),
                width: isObstacle ? 38 : objectSize,
                height: isObstacle ? 38 : objectSize,
                emoji: isObstacle
                    ? obstacleEmojis[Math.floor(Math.random() * obstacleEmojis.length)]
                    : objectEmojis[Math.floor(Math.random() * objectEmojis.length)]
            };
            attempts++;
        } while (
            attempts < 300 &&
            (!canPlace(candidate, placed, minDistance) ||
            distance(candidate.x, candidate.y, dino.x, dino.y) < 120)
        );
        placed.push(candidate);
    }

    return placed;
}

function resetUI() {
    scoreDisplay.textContent = score;
    timeDisplay.textContent = elapsedTime.toFixed(1);
    objectsLeftDisplay.textContent = objectCount - objectsCollected;
}

function initGame() {
    score = 0;
    elapsedTime = 0;
    objectsCollected = 0;
    objects = [];
    obstacles = [];
    sparkles = [];
    dino.x = 120;
    dino.y = canvas.height / 2;
    gameState = "playing";

    objects = spawnItems(objectCount, "object");
    obstacles = spawnItems(obstacleCount, "obstacle");
    resetUI();
}

function drawBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, "#8ee3ff");
    sky.addColorStop(0.55, "#a9f0ba");
    sky.addColorStop(1, "#ffd782");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.beginPath();
    ctx.arc(110, 100, 48, 0, Math.PI * 2);
    ctx.arc(150, 100, 38, 0, Math.PI * 2);
    ctx.arc(80, 115, 34, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(730, 88, 36, 0, Math.PI * 2);
    ctx.arc(770, 88, 28, 0, Math.PI * 2);
    ctx.arc(700, 98, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.22)";
    for (let i = 0; i < 18; i++) {
        const x = (i * 67 + elapsedTime * 18) % (canvas.width + 40) - 20;
        const y = 30 + (i % 4) * 28;
        ctx.fillRect(x, y, 20, 6);
    }

    ctx.fillStyle = "#7ed957";
    ctx.fillRect(0, canvas.height - 68, canvas.width, 68);

    ctx.fillStyle = "rgba(255,255,255,0.25)";
    for (let i = 0; i < canvas.width; i += 48) {
        ctx.fillRect(i, canvas.height - 70, 22, 10);
    }

    ctx.font = "26px Arial";
    ctx.fillText("🎈", 46, 58);
    ctx.fillText("🎊", 830, 62);
    ctx.fillText("✨", 460, 70);
}

function drawDino() {
    ctx.font = "34px Arial";
    ctx.fillText(dino.emoji, dino.x, dino.y + 30);
}

function drawObjects() {
    objects.forEach(obj => {
        ctx.font = "28px Arial";
        ctx.fillText(obj.emoji, obj.x, obj.y + 24);
    });
}

function drawObstacles() {
    obstacles.forEach(obstacle => {
        ctx.font = obstacle.emoji === "🌳" ? "34px Arial" : "30px Arial";
        ctx.fillText(obstacle.emoji, obstacle.x, obstacle.y + 28);
    });
}

function createSparkles(x, y) {
    for (let i = 0; i < 12; i++) {
        sparkles.push({
            x,
            y,
            vx: random(-2.6, 2.6),
            vy: random(-2.8, 1.2),
            life: random(20, 34),
            emoji: ["✨", "🌟", "💫"][Math.floor(Math.random() * 3)]
        });
    }
}

function drawSparkles() {
    sparkles = sparkles.filter(p => p.life > 0);
    sparkles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;
        ctx.globalAlpha = Math.max(p.life / 34, 0);
        ctx.font = "18px Arial";
        ctx.fillText(p.emoji, p.x, p.y);
    });
    ctx.globalAlpha = 1;
}

function finishGame(won) {
    gameRunning = false;
    gameState = won ? "won" : "lost";
    elapsedTime = (Date.now() - startTime) / 1000;
    timeDisplay.textContent = elapsedTime.toFixed(1);
    finalScoreDisplay.textContent = score;
    finalTimeDisplay.textContent = elapsedTime.toFixed(1);

    if (won) {
        resultTitle.textContent = "🎉 Congratulations, you did it!";
        resultMessage.textContent = `You collected everything in ${elapsedTime.toFixed(1)} seconds.`;
        winSound.currentTime = 0;
        winSound.play().catch(() => {});
    } else {
        resultTitle.textContent = "Oops, watch out!";
        resultMessage.textContent = "You bumped into an obstacle. Try a cleaner run.";
        obstacleSound.currentTime = 0;
        obstacleSound.play().catch(() => {});
    }

    showGameOverScreen();
}

function updateGame(deltaTime) {
    if (!gameRunning) return;

    const moveAmount = dino.speed * (deltaTime / 16.6667);
    if (keys.ArrowUp || keys.w || keys.W) dino.y -= moveAmount;
    if (keys.ArrowDown || keys.s || keys.S) dino.y += moveAmount;
    if (keys.ArrowLeft || keys.a || keys.A) dino.x -= moveAmount;
    if (keys.ArrowRight || keys.d || keys.D) dino.x += moveAmount;

    dino.x = clamp(dino.x, 0, canvas.width - dino.width);
    dino.y = clamp(dino.y, 0, canvas.height - dino.height);

    const dinoBox = createBounds(dino, dino.hitboxInset);

    objects = objects.filter(obj => {
        if (intersects(dinoBox, createBounds(obj, 7))) {
            score += 10;
            objectsCollected += 1;
            scoreDisplay.textContent = score;
            objectsLeftDisplay.textContent = objectCount - objectsCollected;
            createSparkles(obj.x + 8, obj.y + 8);
            collectSound.currentTime = 0;
            collectSound.play().catch(() => {});
            return false;
        }
        return true;
    });

    const hitObstacle = obstacles.some(obstacle => intersects(dinoBox, createBounds(obstacle, 13)));
    if (hitObstacle) {
        finishGame(false);
        return;
    }

    elapsedTime = (Date.now() - startTime) / 1000;
    timeDisplay.textContent = elapsedTime.toFixed(1);

    if (objectsCollected >= objectCount) {
        finishGame(true);
    }
}

function showGameOverScreen() {
    gameUI.style.display = "none";
    gameOverScreen.style.display = "flex";
    cancelAnimationFrame(gameLoopId);
}

function showGameUI() {
    startScreen.style.display = "none";
    gameOverScreen.style.display = "none";
    gameUI.style.display = "block";
    canvas.style.display = "block";
    gameRunning = true;
    startTime = Date.now();
    lastTimestamp = performance.now();
    gameLoop(lastTimestamp);
}

function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTimestamp || 16.6667;
    lastTimestamp = timestamp;

    drawBackground();
    drawObjects();
    drawObstacles();
    drawDino();
    drawSparkles();
    updateGame(deltaTime);

    if (gameRunning) {
        gameLoopId = requestAnimationFrame(gameLoop);
    }
}

window.addEventListener("keydown", event => {
    keys[event.key] = true;
});

window.addEventListener("keyup", event => {
    keys[event.key] = false;
});

let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener("touchstart", event => {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
}, { passive: true });

canvas.addEventListener("touchmove", event => {
    if (!gameRunning) return;
    const touchX = event.touches[0].clientX;
    const touchY = event.touches[0].clientY;
    const diffX = touchX - touchStartX;
    const diffY = touchY - touchStartY;
    const scaleX = canvas.width / canvas.getBoundingClientRect().width;
    const scaleY = canvas.height / canvas.getBoundingClientRect().height;

    dino.x += clamp(diffX * scaleX, -18, 18);
    dino.y += clamp(diffY * scaleY, -18, 18);
    dino.x = clamp(dino.x, 0, canvas.width - dino.width);
    dino.y = clamp(dino.y, 0, canvas.height - dino.height);

    touchStartX = touchX;
    touchStartY = touchY;
    event.preventDefault();
}, { passive: false });

startButton.addEventListener("click", () => {
    initGame();
    showGameUI();
});

restartButton.addEventListener("click", () => {
    initGame();
    showGameUI();
});
