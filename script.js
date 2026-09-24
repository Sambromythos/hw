const MIN = 1;
const MAX = 100;
const BEST_KEY = 'guess-number-best';

let secretNumber = 0;
let attempts = 0;
let low = MIN;
let high = MAX;
let gameOver = false;

const $ = (id) => document.getElementById(id);
const card = $('card');
const form = $('guessForm');
const input = $('guessInput');
const submitBtn = $('submitBtn');
const feedback = $('feedback');
const historyList = $('historyList');

// ---------- 最佳紀錄（瀏覽器不能存也不影響遊戲） ----------
function loadBest() {
    try {
        return Number(localStorage.getItem(BEST_KEY)) || null;
    } catch {
        return null;
    }
}

function saveBest(value) {
    try {
        localStorage.setItem(BEST_KEY, String(value));
    } catch {
        /* 忽略 */
    }
}

// ---------- 畫面更新 ----------
function setFeedback(text, type = '') {
    feedback.textContent = text;
    feedback.className = `feedback ${type}`;
}

function bump(el, value) {
    el.textContent = value;
    el.classList.remove('bump');
    void el.offsetWidth; // 重新觸發動畫
    el.classList.add('bump');
}

function shake() {
    card.classList.remove('shake');
    void card.offsetWidth;
    card.classList.add('shake');
}

function toPercent(n) {
    return ((n - MIN) / (MAX - MIN)) * 100;
}

function updateRange() {
    $('rangeLow').textContent = low;
    $('rangeHigh').textContent = high;
    const fill = $('rangeFill');
    const start = toPercent(low);
    const end = toPercent(high);
    fill.style.left = `${start}%`;
    fill.style.width = `${Math.max(end - start, 1.5)}%`;
}

function addMarker(guess, isWin) {
    const marker = document.createElement('span');
    marker.className = `range-marker${isWin ? ' win' : ''}`;
    marker.style.left = `${toPercent(guess)}%`;
    $('rangeMarkers').appendChild(marker);
}

function addHistory(guess, kind) {
    const empty = historyList.querySelector('.history-empty');
    if (empty) empty.remove();

    const arrow = { low: '↑', high: '↓', hit: '✓' }[kind];
    const item = document.createElement('li');
    item.className = kind;
    item.textContent = `${guess} ${arrow}`;
    historyList.appendChild(item);
}

// 離答案多遠給一點溫度提示
function temperature(distance) {
    if (distance <= 3) return '🔥 超級燙！';
    if (distance <= 10) return '♨️ 很接近了';
    if (distance <= 25) return '🌤️ 有點溫度';
    return '🧊 還很遠';
}

// ---------- 遊戲流程 ----------
function initGame() {
    secretNumber = Math.floor(Math.random() * (MAX - MIN + 1)) + MIN;
    attempts = 0;
    low = MIN;
    high = MAX;
    gameOver = false;

    $('attempts').textContent = '0';
    $('lastGuess').textContent = '–';
    $('bestScore').textContent = loadBest() ?? '–';
    $('rangeMarkers').innerHTML = '';
    historyList.innerHTML = '<li class="history-empty">還沒有猜測</li>';

    card.classList.remove('win');
    input.disabled = false;
    submitBtn.disabled = false;
    input.value = '';
    updateRange();
    setFeedback(`輸入 ${MIN} 到 ${MAX} 的數字開始吧`);
    input.focus();
}

function makeGuess(event) {
    event.preventDefault();
    if (gameOver) return;

    const guess = Number(input.value);

    if (input.value.trim() === '' || !Number.isInteger(guess)) {
        setFeedback('請輸入一個整數！', 'error');
        shake();
        return;
    }

    if (guess < MIN || guess > MAX) {
        setFeedback(`請輸入 ${MIN} 到 ${MAX} 之間的數字！`, 'error');
        shake();
        return;
    }

    attempts++;
    bump($('attempts'), attempts);
    bump($('lastGuess'), guess);

    if (guess === secretNumber) {
        win();
    } else if (guess < secretNumber) {
        low = Math.max(low, guess + 1);
        addHistory(guess, 'low');
        addMarker(guess, false);
        setFeedback(`📈 太低了！${temperature(secretNumber - guess)}`, 'too-low');
        shake();
    } else {
        high = Math.min(high, guess - 1);
        addHistory(guess, 'high');
        addMarker(guess, false);
        setFeedback(`📉 太高了！${temperature(guess - secretNumber)}`, 'too-high');
        shake();
    }

    updateRange();
    input.value = '';
    input.focus();
}

function win() {
    gameOver = true;
    low = high = secretNumber;
    addHistory(secretNumber, 'hit');
    addMarker(secretNumber, true);

    const best = loadBest();
    const isNewBest = best === null || attempts < best;
    if (isNewBest) {
        saveBest(attempts);
        bump($('bestScore'), attempts);
    }

    setFeedback(
        `🎉 答對了！就是 ${secretNumber}，你用了 ${attempts} 次${isNewBest ? '，刷新最佳紀錄！' : ''}`,
        'correct'
    );
    card.classList.add('win');
    input.disabled = true;
    submitBtn.disabled = true;
    $('resetBtn').focus();
    launchConfetti();
}

// ---------- 彩帶 ----------
function launchConfetti() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = $('confetti');
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.scale(dpr, dpr);

    const colors = ['#7c5cff', '#ff6fb5', '#5fd3ff', '#1fbf75', '#ffc940'];
    const pieces = Array.from({ length: 160 }, () => ({
        x: innerWidth / 2,
        y: innerHeight / 2,
        vx: (Math.random() - 0.5) * 16,
        vy: Math.random() * -16 - 4,
        size: Math.random() * 8 + 4,
        rotation: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
    }));

    const start = performance.now();
    function frame(now) {
        ctx.clearRect(0, 0, innerWidth, innerHeight);
        for (const p of pieces) {
            p.vy += 0.4;
            p.vx *= 0.99;
            p.x += p.vx;
            p.y += p.vy;
            p.rotation += p.spin;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
            ctx.restore();
        }
        if (now - start < 3500) {
            requestAnimationFrame(frame);
        } else {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
    requestAnimationFrame(frame);
}

form.addEventListener('submit', makeGuess);
$('resetBtn').addEventListener('click', initGame);
card.addEventListener('animationend', () => card.classList.remove('shake'));

initGame();
