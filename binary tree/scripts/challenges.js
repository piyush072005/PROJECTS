// Challenges & Quizzes
// Reuses existing visual bar styles from the AlgorithmVisualizer

(function () {
  function generateRandomArray(size) {
    return Array.from({ length: size }, () => Math.floor(Math.random() * 90) + 10);
  }

  function getFrameGenerator(key) {
    const mapping = {
      quick: window.generateQuickSortFrames,
      bubble: window.generateBubbleSortFrames,
      merge: window.generateMergeSortFrames,
      heap: window.generateHeapSortFrames,
      selection: window.generateSelectionSortFrames,
    };
    return mapping[key] || null;
  }

  function renderFrameIntoCanvas(frame, canvasEl) {
    if (!frame || !canvasEl) return;
    const maxValue = Math.max(...frame.array);
    const maxHeight = 200;
    canvasEl.innerHTML = frame.array
      .map((value, i) => {
        const height = (value / maxValue) * maxHeight;
        const classes = ['array-bar'];
        if (frame.comparing && frame.comparing.includes(i)) classes.push('comparing');
        if (frame.swapping && frame.swapping.includes(i)) classes.push('swapping');
        if (frame.pivot === i) classes.push('pivot');
        if (frame.sorted && frame.sorted.includes(i)) classes.push('sorted');
        if (frame.minimum === i) classes.push('minimum');
        if (frame.merging && frame.merging.includes(i)) classes.push('merging');
        if (frame.activeRange) {
          if (i >= frame.activeRange[0] && i <= frame.activeRange[1]) {
            classes.push('active-range');
          } else {
            classes.push('inactive-range');
          }
        }
        return `
          <div class="${classes.join(' ')}" style="height: ${height}px">
            <span class="bar-value">${value}</span>
            <span class="bar-index">${i}</span>
          </div>
        `;
      })
      .join('');
  }

  function describeNextAction(currentFrame, nextFrame) {
    if (!currentFrame || !nextFrame) return 'No action.';

    if (nextFrame.swapping && nextFrame.swapping.length === 2) {
      return `Swap elements at indices ${nextFrame.swapping[0]} and ${nextFrame.swapping[1]}.`;
    }
    if (nextFrame.pivot !== undefined && nextFrame.pivot !== null) {
      return `Select a pivot at index ${nextFrame.pivot}.`;
    }
    if (nextFrame.comparing && nextFrame.comparing.length === 2) {
      return `Compare elements at indices ${nextFrame.comparing[0]} and ${nextFrame.comparing[1]}.`;
    }
    if (nextFrame.action === 'merge') {
      return 'Merge two sorted segments into one.';
    }
    if (nextFrame.sorted && nextFrame.sorted.length === nextFrame.array.length) {
      return 'Mark the array as fully sorted.';
    }
    return 'Perform an intermediate step (no-op / bookkeeping).';
  }

  function createDistractors(trueDescription) {
    const pool = [
      'Swap two adjacent elements.',
      'Compare the first and last elements.',
      'Pick a new pivot at the middle index.',
      'Do nothing and move to the next pass.',
      'Mark the smallest element as sorted.',
      'Split the array into two halves.',
      'Insert the element into its correct position.',
    ];
    const distractors = [];
    for (const candidate of pool) {
      if (
        candidate !== trueDescription &&
        !distractors.includes(candidate) &&
        distractors.length < 2
      ) {
        distractors.push(candidate);
      }
    }
    return distractors;
  }

  function shuffle(array) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function showStatus(el, message, isError) {
    if (!el) return;
    el.textContent = message;
    el.classList.add('visible');
    el.classList.toggle('error', Boolean(isError));
  }

  function saveLeaderboardEntry(score) {
    try {
      const raw = localStorage.getItem('algo_leaderboard') || '[]';
      const list = JSON.parse(raw);
      const name = 'You';
      list.push({ name, score, ts: Date.now() });
      list.sort((a, b) => b.score - a.score || a.ts - b.ts);
      const trimmed = list.slice(0, 10);
      localStorage.setItem('algo_leaderboard', JSON.stringify(trimmed));
      return trimmed;
    } catch (e) {
      return [];
    }
  }

  function loadLeaderboard() {
    try {
      const raw = localStorage.getItem('algo_leaderboard') || '[]';
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }

  function renderLeaderboard() {
    const list = document.getElementById('leaderboard-list');
    if (!list) return;
    const entries = loadLeaderboard();
    list.innerHTML = '';
    if (!entries.length) {
      list.innerHTML =
        '<li class="placeholder">Solve challenges to appear on the leaderboard.</li>';
      return;
    }
    entries.forEach((entry, index) => {
      const li = document.createElement('li');
      li.textContent = `${index + 1}. ${entry.name} — ${entry.score} pts`;
      list.appendChild(li);
    });
  }

  const quizQuestions = [
    {
      question:
        'In an in-order traversal of a binary search tree, what sequence do you get?',
      options: [
        'Nodes in arbitrary order',
        'Nodes in descending order',
        'Nodes in sorted (ascending) order',
        'Only leaf nodes',
      ],
      answer: 2,
    },
    {
      question:
        'Which sorting algorithm always has O(n²) time complexity in the worst case?',
      options: ['Merge Sort', 'Quick Sort', 'Heap Sort', 'Bubble Sort'],
      answer: 3,
    },
    {
      question:
        'Breadth-first search (BFS) explores vertices in what general pattern?',
      options: [
        'Depth-first along one branch',
        'Layer by layer outward from the start node',
        'Randomly selected nodes',
        'Heaviest edges first',
      ],
      answer: 1,
    },
    {
      question:
        'Binary search requires which property on the array to work correctly?',
      options: [
        'All elements are distinct',
        'Array is sorted',
        'Array length is a power of two',
        'Elements are all positive',
      ],
      answer: 1,
    },
  ];

  function initQuiz() {
    const questionEl = document.getElementById('quiz-question');
    const optionsEl = document.getElementById('quiz-options');
    const statusEl = document.getElementById('quiz-status');
    const streakEl = document.getElementById('quiz-streak');
    const bestStreakEl = document.getElementById('quiz-best-streak');
    const nextBtn = document.getElementById('next-quiz-btn');

    if (!questionEl || !optionsEl || !streakEl || !bestStreakEl || !nextBtn) return;

    let currentIndex = 0;
    let streak = 0;
    let bestStreak = Number(localStorage.getItem('algo_quiz_best_streak') || '0');
    bestStreakEl.textContent = bestStreak.toString();

    function renderQuestion() {
      const q = quizQuestions[currentIndex];
      questionEl.textContent = q.question;
      optionsEl.innerHTML = '';
      statusEl.textContent = '';
      q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'chip-link';
        btn.textContent = opt;
        btn.addEventListener('click', () => {
          if (idx === q.answer) {
            streak += 1;
            statusEl.textContent = 'Correct! 🎯';
            statusEl.style.color = 'var(--text-accent)';
            if (streak > bestStreak) {
              bestStreak = streak;
              localStorage.setItem(
                'algo_quiz_best_streak',
                String(bestStreak)
              );
              bestStreakEl.textContent = bestStreak.toString();
            }
          } else {
            statusEl.textContent = `Incorrect. The correct answer was "${
              q.options[q.answer]
            }".`;
            statusEl.style.color = 'var(--text-error)';
            streak = 0;
          }
          streakEl.textContent = streak.toString();
        });
        optionsEl.appendChild(btn);
      });
    }

    nextBtn.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % quizQuestions.length;
      renderQuestion();
    });

    renderQuestion();
  }

  function initChallenges() {
    const algoSelect = document.getElementById('challenge-algorithm');
    const sizeInput = document.getElementById('challenge-size');
    const newBtn = document.getElementById('new-challenge-btn');
    const revealBtn = document.getElementById('reveal-step-btn');
    const statusEl = document.getElementById('challenge-status');
    const canvasEl = document.getElementById('challenge-canvas');
    const descEl = document.getElementById('challenge-description');
    const optionsEl = document.getElementById('challenge-options');
    const stepIndexEl = document.getElementById('challenge-step-index');
    const stepTotalEl = document.getElementById('challenge-step-total');

    if (
      !algoSelect ||
      !sizeInput ||
      !newBtn ||
      !revealBtn ||
      !canvasEl ||
      !descEl ||
      !optionsEl ||
      !stepIndexEl ||
      !stepTotalEl
    ) {
      return;
    }

    let currentFrames = [];
    let currentIdx = 0;
    let currentCorrectDescription = '';
    let currentScore = Number(localStorage.getItem('algo_challenge_score') || '0');

    function updateScore(delta) {
      currentScore = Math.max(0, currentScore + delta);
      localStorage.setItem('algo_challenge_score', String(currentScore));
      if (delta > 0) {
        saveLeaderboardEntry(currentScore);
        renderLeaderboard();
      }
    }

    function buildOptions(trueDescription) {
      const distractors = createDistractors(trueDescription);
      const all = shuffle([trueDescription, ...distractors]);
      optionsEl.innerHTML = '';
      all.forEach((text) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'chip-link';
        btn.textContent = text;
        btn.addEventListener('click', () => {
          if (text === trueDescription) {
            showStatus(
              statusEl,
              'Correct! +10 points. Try another puzzle.',
              false
            );
            updateScore(10);
          } else {
            showStatus(
              statusEl,
              'Not quite. That is not what happens next.',
              true
            );
            updateScore(-3);
          }
        });
        optionsEl.appendChild(btn);
      });
    }

    function createChallenge() {
      const key = algoSelect.value;
      const size = parseInt(sizeInput.value, 10) || 6;
      const generator = getFrameGenerator(key);
      if (!generator) {
        showStatus(statusEl, 'Frame generator not available.', true);
        return;
      }
      const clampedSize = Math.min(9, Math.max(4, size));
      const arr = generateRandomArray(clampedSize);
      const frames = generator(arr);
      if (!frames || frames.length < 3) {
        showStatus(statusEl, 'Not enough frames for a puzzle.', true);
        return;
      }
      let attempts = 0;
      let idx = 1;
      while (attempts < 20) {
        idx = 1 + Math.floor(Math.random() * (frames.length - 2));
        const next = frames[idx + 1];
        if (next && (next.action || next.swapping || next.comparing)) {
          break;
        }
        attempts += 1;
      }
      currentFrames = frames;
      currentIdx = idx;
      const current = frames[idx];
      const next = frames[idx + 1];
      stepIndexEl.textContent = String(idx + 1);
      stepTotalEl.textContent = String(frames.length);
      renderFrameIntoCanvas(current, canvasEl);
      const label = next ? describeNextAction(current, next) : 'No action.';
      currentCorrectDescription = label;
      descEl.textContent =
        current.description ||
        'This is an intermediate step of the algorithm.';
      buildOptions(label);
      showStatus(
        statusEl,
        'New puzzle generated. Choose the next step.',
        false
      );
    }

    newBtn.addEventListener('click', createChallenge);

    revealBtn.addEventListener('click', () => {
      if (!currentFrames.length) return;
      const next = currentFrames[currentIdx + 1];
      if (!next) return;
      renderFrameIntoCanvas(next, canvasEl);
      descEl.textContent =
        next.description ||
        'This is the actual next frame produced by the algorithm.';
      showStatus(
        statusEl,
        `Revealed answer: ${currentCorrectDescription}`,
        false
      );
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initChallenges();
    initQuiz();
    renderLeaderboard();
  });
})();


