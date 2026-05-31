cat > script.js << 'EOF'
let secretNumber = 0;
let attempts = 0;
let gameOver = false;

function initGame() {
    secretNumber = Math.floor(Math.random() * 100) + 1;
    attempts = 0;
    gameOver = false;
    document.getElementById('attempts').textContent = '0';
    document.getElementById('lastGuess').textContent = '-';
    document.getElementById('feedback').textContent = '';
    document.getElementById('feedback').className = 'feedback empty';
    document.getElementById('guessInput').value = '';
    document.getElementById('guessInput').focus();
}

function makeGuess() {
    if (gameOver) {
        alert('遊戲已結束！請點選「重新開始」開始新遊戲。');
        return;
    }

    const input = document.getElementById('guessInput');
    const guess = parseInt(input.value);

    if (isNaN(guess) || input.value === '') {
        alert('請輸入一個數字！');
        return;
    }

    if (guess < 1 || guess > 100) {
        alert('請輸入 1 到 100 之間的數字！');
        return;
    }

    attempts++;
    document.getElementById('attempts').textContent = attempts;
    document.getElementById('lastGuess').textContent = guess;

    const feedback = document.getElementById('feedback');

    if (guess === secretNumber) {
        feedback.textContent = `🎉 恭喜！你用了 ${attempts} 次猜對了！秘密數字是 ${secretNumber}`;
        feedback.className = 'feedback correct';
        gameOver = true;
    } else if (guess < secretNumber) {
        feedback.textContent = `📈 太低了！秘密數字更大。`;
        feedback.className = 'feedback too-low';
    } else {
        feedback.textContent = `📉 太高了！秘密數字更小。`;
        feedback.className = 'feedback too-high';
    }

    input.value = '';
    input.focus();
}

function resetGame() {
    initGame();
}

document.addEventListener('DOMContentLoaded', function() {
    initGame();
    document.getElementById('guessInput').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            makeGuess();
        }
    });
});
EOF