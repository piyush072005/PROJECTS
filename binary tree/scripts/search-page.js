const searchModes = {
  binary: {
    parseDataset: parseNumberSequence,
    parseTarget: parseSingleNumber,
    randomDataset: () =>
      Array.from({ length: 8 }, () => Math.floor(Math.random() * 80)).sort(
        (a, b) => a - b
      ),
    run: runBinarySearch,
    datasetFormatter: (values) => values.slice().sort((a, b) => a - b),
    allowsStrings: false,
  },
  linear: {
    parseDataset: parseGenericSequence,
    parseTarget: (raw) => (raw ? raw.trim() : ''),
    randomDataset: () => shuffleArray(sampleWords()).slice(0, 6),
    run: runLinearSearch,
    datasetFormatter: (values) => values,
    allowsStrings: true,
  },
};

const searchForm = document.getElementById('search-form');
const datasetInput = document.getElementById('dataset-input');
const targetInput = document.getElementById('target-input');
const statusBoxSearch = document.getElementById('search-status');
const summaryCardSearch = document.getElementById('search-summary');
const resultText = document.getElementById('search-result');
const comparisonText = document.getElementById('search-comparisons');
const checksText = document.getElementById('search-checks');
const stepsContainer = document.getElementById('search-steps');
const randomDatasetBtn = document.getElementById('random-btn');
const searchKey = document.body.dataset.search;

if (searchForm && searchModes[searchKey]) {
  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const mode = searchModes[searchKey];

    const dataset = mode.parseDataset(datasetInput.value);
    if (!dataset.length) {
      showSearchStatus('Please enter at least one value to search.', true);
      return;
    }

    const targetValue = mode.parseTarget(targetInput.value);
    if (
      (mode.allowsStrings && targetValue === '') ||
      (!mode.allowsStrings && targetValue === null)
    ) {
      showSearchStatus('Please enter a valid target value.', true);
      return;
    }

    const formattedDataset = mode.datasetFormatter(dataset);
    const outcome = mode.run(formattedDataset, targetValue);

    summaryCardSearch.hidden = false;
    resultText.textContent =
      outcome.index >= 0
        ? `Found "${targetValue}" at index ${outcome.index}.`
        : `"${targetValue}" was not found in the dataset.`;
    comparisonText.textContent = outcome.comparisons.toString();
    checksText.textContent = outcome.checkedIndices.join(', ') || '—';
    populateSearchSteps(outcome.steps);
    showSearchStatus('Search completed.', false);
  });
}

if (randomDatasetBtn && searchModes[searchKey]) {
  randomDatasetBtn.addEventListener('click', () => {
    const mode = searchModes[searchKey];
    const data = mode.randomDataset();
    datasetInput.value = data.join(', ');
    if (mode.allowsStrings) {
      targetInput.value = data[0] || '';
    } else {
      targetInput.value = data[Math.floor(data.length / 2)] ?? '';
    }
    summaryCardSearch.hidden = true;
    stepsContainer.innerHTML =
      '<li class="placeholder">Run the algorithm to populate steps.</li>';
    showSearchStatus('Random dataset generated.', false);
  });
}

function parseNumberSequence(raw) {
  if (!raw) return [];
  const parts = raw.split(/[\s,]+/).filter(Boolean);
  const numbers = [];
  for (const part of parts) {
    const value = Number(part);
    if (Number.isNaN(value)) {
      showSearchStatus(
        `Unable to convert "${part}" to a number. Please fix your dataset.`,
        true
      );
      return [];
    }
    numbers.push(value);
  }
  return numbers;
}

function parseSingleNumber(raw) {
  if (!raw) return null;
  const value = Number(raw);
  return Number.isNaN(value) ? null : value;
}

function parseGenericSequence(raw) {
  if (!raw) return [];
  return raw
    .split(/[\s,]+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function showSearchStatus(message, isError) {
  if (!statusBoxSearch) return;
  statusBoxSearch.textContent = message;
  statusBoxSearch.classList.add('visible');
  statusBoxSearch.classList.toggle('error', Boolean(isError));
}

function populateSearchSteps(steps) {
  if (!stepsContainer) return;
  stepsContainer.innerHTML = '';
  if (!steps.length) {
    stepsContainer.innerHTML =
      '<li class="placeholder">No steps recorded for this search.</li>';
    return;
  }
  steps.forEach((step) => {
    const li = document.createElement('li');
    li.textContent = step;
    stepsContainer.appendChild(li);
  });
}

function runBinarySearch(arr, target) {
  const steps = [];
  const checkedIndices = [];
  let comparisons = 0;
  let low = 0;
  let high = arr.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const value = arr[mid];
    comparisons += 1;
    checkedIndices.push(mid);
    steps.push(
      `Check mid index ${mid} (value ${value}). Range [${low}, ${high}].`
    );
    if (value === target) {
      steps.push(`Value found at index ${mid}.`);
      return { index: mid, steps, comparisons, checkedIndices };
    }
    if (value < target) {
      steps.push(`Target is greater than ${value} → search right half.`);
      low = mid + 1;
    } else {
      steps.push(`Target is less than ${value} → search left half.`);
      high = mid - 1;
    }
  }

  steps.push('Target not present in dataset.');
  return { index: -1, steps, comparisons, checkedIndices };
}

function runLinearSearch(arr, target) {
  const steps = [];
  const checkedIndices = [];
  let comparisons = 0;

  for (let i = 0; i < arr.length; i += 1) {
    comparisons += 1;
    checkedIndices.push(i);
    steps.push(`Compare index ${i}: ${arr[i]} === ${target}?`);
    if (String(arr[i]) === String(target)) {
      steps.push(`Match found at index ${i}.`);
      return { index: i, steps, comparisons, checkedIndices };
    }
  }

  steps.push('Reached end of array without a match.');
  return { index: -1, steps, comparisons, checkedIndices };
}

function shuffleArray(source) {
  const arr = [...source];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function sampleWords() {
  return [
    'apple',
    'banana',
    'cherry',
    'dates',
    'elderberry',
    'fig',
    'grape',
    'kiwi',
    'lemon',
    'mango',
  ];
}

