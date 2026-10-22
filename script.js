let currentQuestions = [], currentIndex = 0, score = 0, timer = null, timeLeft = 15, missedQuestions = [], isAnswering = false;

const screenSetup = document.getElementById('screen-setup');
const screenLoading = document.getElementById('screen-loading');
const screenQuiz = document.getElementById('screen-quiz');
const screenResults = document.getElementById('screen-results');

const categorySelect = document.getElementById('category');
const difficultySelect = document.getElementById('difficulty');
const numQuestionsSelect = document.getElementById('num-questions');
const startBtn = document.getElementById('start-btn');

const questionTracker = document.getElementById('question-tracker');
const timerDisplay = document.getElementById('timer-display');
const questionText = document.getElementById('question-text');1
const optionsGrid = document.getElementById('options-grid');

const scoreText = document.getElementById('score-text');
const missedList = document.getElementById('missed-list');
const restartBtn = document.getElementById('restart-btn');

startBtn.addEventListener('click', startQuiz);
restartBtn.addEventListener('click', () => showScreen(screenSetup));

function showScreen(screen) {
  [screenSetup, screenLoading, screenQuiz, screenResults].forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
}

function decodeHTML(html) {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}

async function startQuiz() {
  showScreen(screenLoading);
  try {
    const res = await fetch(`https://opentdb.com/api.php?amount=${numQuestionsSelect.value}&category=${categorySelect.value}&difficulty=${difficultySelect.value}&type=multiple`);
    const data = await res.json();

    if (data.results?.length) {
      currentQuestions = data.results.map(item => {
        const options = [...item.incorrect_answers, item.correct_answer].sort(() => Math.random() - 0.5);
        return {
          q: decodeHTML(item.question),
          options: options.map(decodeHTML),
          answer: options.indexOf(item.correct_answer)
        };
      });
      currentIndex = 0; score = 0; missedQuestions = [];
      showScreen(screenQuiz);
      loadQuestion();
    } else {
      alert('Not enough questions found. Try different options.');
      showScreen(screenSetup);
    }
  } catch (err) {
    alert('Network error. Please try again.');
    showScreen(screenSetup);
  }
}

function loadQuestion() {
  isAnswering = true;
  clearInterval(timer);
  timeLeft = 15;
  updateTimerDisplay();

  const currentQ = currentQuestions[currentIndex];
  questionTracker.textContent = `Question ${currentIndex + 1} of ${currentQuestions.length}`;
  questionText.textContent = currentQ.q;

  optionsGrid.innerHTML = '';
  currentQ.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = `[ Option ${String.fromCharCode(65 + idx)} ] ${opt}`;
    btn.onclick = () => handleAnswer(idx);
    optionsGrid.appendChild(btn);
  });

  timer = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) { clearInterval(timer); handleAnswer(-1); }
  }, 1000);
}

function updateTimerDisplay() {
  timerDisplay.textContent = `00:${timeLeft < 10 ? '0' : ''}${timeLeft}`;
}

function handleAnswer(selectedIndex) {
  if (!isAnswering) return;
  isAnswering = false;
  clearInterval(timer);

  const currentQ = currentQuestions[currentIndex];
  const buttons = optionsGrid.querySelectorAll('.option-btn');

  if (selectedIndex === currentQ.answer) {
    score++;
    buttons[selectedIndex]?.classList.add('correct');
  } else {
    if (selectedIndex !== -1) buttons[selectedIndex]?.classList.add('incorrect');
    buttons[currentQ.answer]?.classList.add('correct');
    missedQuestions.push({
      question: currentQ.q,
      userAnswer: selectedIndex === -1 ? 'Time Expired' : currentQ.options[selectedIndex],
      correctAnswer: currentQ.options[currentQ.answer]
    });
  }

  setTimeout(() => {
    currentIndex++;
    currentIndex < currentQuestions.length ? loadQuestion() : showResults();
  }, 1200);
}

function showResults() {
  showScreen(screenResults);
  const total = currentQuestions.length;
  scoreText.textContent = `Your Score: ${score} / ${total} (${Math.round((score / total) * 100)}%)`;

  missedList.innerHTML = missedQuestions.length ? '' : `<div class="no-missed">🎉 Perfect Score!</div>`;
  missedQuestions.forEach(item => {
    const div = document.createElement('div');
    div.className = 'missed-item';
    div.innerHTML = `<div class="q-text">${item.question}</div><div class="ans-details">Your answer: <span class="user-ans">${item.userAnswer}</span> | Correct: <span class="correct-ans">${item.correctAnswer}</span></div>`;
    missedList.appendChild(div);
  });
}