const sortAlgorithms = {
  quick: {
    run: quickSortWithSteps,
  },
  bubble: {
    run: bubbleSortWithSteps,
  },
  merge: {
    run: mergeSortWithSteps,
  },
  heap: {
    run: heapSortWithSteps,
  },
  selection: {
    run: selectionSortWithSteps,
  },
};

const sortForm = document.getElementById('sort-form');
const numbersInput = document.getElementById('numbers-input');
const statusBox = document.getElementById('sort-status');
const summaryCard = document.getElementById('sort-summary');
const sortedValues = document.getElementById('sorted-values');
const comparisonCount = document.getElementById('comparison-count');
const swapCount = document.getElementById('swap-count');
const stepsList = document.getElementById('sort-steps');
const randomBtn = document.getElementById('random-btn');
const algorithmKey = document.body.dataset.algorithm;

if (sortForm && sortAlgorithms[algorithmKey]) {
  sortForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const dataset = parseNumberSequence(numbersInput.value);

    if (!dataset.length) {
      showSortStatus('Please enter at least one numeric value.', true);
      return;
    }

    const { sorted, steps, comparisons, swaps } =
      sortAlgorithms[algorithmKey].run(dataset);

    summaryCard.hidden = false;
    sortedValues.textContent = sorted.join(', ');
    comparisonCount.textContent = comparisons;
    swapCount.textContent = swaps;
    populateSteps(steps);
    showSortStatus('Sort completed successfully.', false);
  });
}

if (randomBtn) {
  randomBtn.addEventListener('click', () => {
    const randomValues = Array.from(
      { length: 7 },
      () => Math.floor(Math.random() * 90) + 10
    );
    numbersInput.value = randomValues.join(', ');
    summaryCard.hidden = true;
    stepsList.innerHTML =
      '<li class="placeholder">Run the algorithm to populate steps.</li>';
    showSortStatus('Random dataset generated.', false);
  });
}

function parseNumberSequence(raw) {
  if (!raw) return [];
  const parts = raw.split(/[\s,]+/).filter(Boolean);
  const numbers = [];
  for (const part of parts) {
    const value = Number(part);
    if (Number.isNaN(value)) {
      showSortStatus(
        `Unable to convert "${part}" to a number. Please fix your input.`,
        true
      );
      return [];
    }
    numbers.push(value);
  }
  return numbers;
}

function showSortStatus(message, isError) {
  if (!statusBox) return;
  statusBox.textContent = message;
  statusBox.classList.add('visible');
  statusBox.classList.toggle('error', Boolean(isError));
}

function populateSteps(steps) {
  if (!stepsList) return;
  stepsList.innerHTML = '';
  if (!steps.length) {
    stepsList.innerHTML =
      '<li class="placeholder">No individual steps recorded for this run.</li>';
    return;
  }
  steps.forEach((description) => {
    const item = document.createElement('li');
    item.textContent = description;
    stepsList.appendChild(item);
  });
}

function quickSortWithSteps(data) {
  const arr = [...data];
  const steps = [];
  let comparisons = 0;
  let swaps = 0;

  function swap(i, j) {
    if (i === j) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    swaps += 1;
    steps.push(`Swap positions ${i} and ${j} → [${arr.join(', ')}]`);
  }

  function partition(low, high) {
    const pivot = arr[high];
    steps.push(`Pivot chosen (${pivot}) at index ${high}`);
    let i = low;
    for (let j = low; j < high; j += 1) {
      comparisons += 1;
      steps.push(`Compare ${arr[j]} ≤ ${pivot}?`);
      if (arr[j] <= pivot) {
        swap(i, j);
        i += 1;
      }
    }
    swap(i, high);
    steps.push(`Pivot (${pivot}) placed at index ${i}`);
    return i;
  }

  function quick(low, high) {
    if (low >= high) {
      return;
    }
    const pivotIndex = partition(low, high);
    quick(low, pivotIndex - 1);
    quick(pivotIndex + 1, high);
  }

  quick(0, arr.length - 1);
  return { sorted: arr, steps, comparisons, swaps };
}

function bubbleSortWithSteps(data) {
  const arr = [...data];
  const steps = [];
  let comparisons = 0;
  let swaps = 0;

  for (let i = 0; i < arr.length - 1; i += 1) {
    let swapped = false;
    for (let j = 0; j < arr.length - i - 1; j += 1) {
      comparisons += 1;
      steps.push(`Compare indices ${j} & ${j + 1} → ${arr[j]} vs ${arr[j + 1]}`);
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swaps += 1;
        swapped = true;
        steps.push(
          `Swap to maintain order → [${arr.join(', ')}] after pass ${i + 1}`
        );
      }
    }
    if (!swapped) {
      steps.push('No swaps this pass → array already sorted.');
      break;
    }
  }

  return { sorted: arr, steps, comparisons, swaps };
}

function mergeSortWithSteps(data) {
  const arr = [...data];
  const steps = [];
  let comparisons = 0;
  let merges = 0;

  function merge(left, mid, right) {
    const leftArr = arr.slice(left, mid + 1);
    const rightArr = arr.slice(mid + 1, right + 1);
    let i = 0;
    let j = 0;
    let k = left;
    merges += 1;
    steps.push(
      `Merge segments [${left}, ${mid}] and [${mid + 1}, ${right}] → ${leftArr.join(
        ', '
      )} + ${rightArr.join(', ')}`
    );

    while (i < leftArr.length && j < rightArr.length) {
      comparisons += 1;
      if (leftArr[i] <= rightArr[j]) {
        arr[k] = leftArr[i];
        i += 1;
      } else {
        arr[k] = rightArr[j];
        j += 1;
      }
      k += 1;
    }

    while (i < leftArr.length) {
      arr[k] = leftArr[i];
      i += 1;
      k += 1;
    }
    while (j < rightArr.length) {
      arr[k] = rightArr[j];
      j += 1;
      k += 1;
    }
    steps.push(`Combined → [${arr.slice(left, right + 1).join(', ')}]`);
  }

  function divide(left, right) {
    if (left >= right) return;
    const mid = Math.floor((left + right) / 2);
    divide(left, mid);
    divide(mid + 1, right);
    merge(left, mid, right);
  }

  divide(0, arr.length - 1);
  return { sorted: arr, steps, comparisons, swaps: merges };
}

function heapSortWithSteps(data) {
  const arr = [...data];
  const steps = [];
  let comparisons = 0;
  let swaps = 0;

  function swap(i, j) {
    if (i === j) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    swaps += 1;
    steps.push(`Swap indices ${i} & ${j} → [${arr.join(', ')}]`);
  }

  function heapify(index, size) {
    let largest = index;
    const left = 2 * index + 1;
    const right = 2 * index + 2;

    if (left < size) {
      comparisons += 1;
      if (arr[left] > arr[largest]) {
        largest = left;
      }
    }
    if (right < size) {
      comparisons += 1;
      if (arr[right] > arr[largest]) {
        largest = right;
      }
    }

    if (largest !== index) {
      swap(index, largest);
      heapify(largest, size);
    }
  }

  const size = arr.length;
  for (let i = Math.floor(size / 2) - 1; i >= 0; i -= 1) {
    steps.push(`Heapify node ${i}`);
    heapify(i, size);
  }

  for (let end = size - 1; end > 0; end -= 1) {
    swap(0, end);
    steps.push(`Extract max → position ${end} fixed.`);
    heapify(0, end);
  }

  return { sorted: arr, steps, comparisons, swaps };
}

function selectionSortWithSteps(data) {
  const arr = [...data];
  const steps = [];
  let comparisons = 0;
  let swaps = 0;

  for (let i = 0; i < arr.length - 1; i += 1) {
    let minIndex = i;
    steps.push(`Pass ${i + 1}: start with min at index ${i} (${arr[i]})`);
    for (let j = i + 1; j < arr.length; j += 1) {
      comparisons += 1;
      if (arr[j] < arr[minIndex]) {
        minIndex = j;
        steps.push(
          `  New minimum found at index ${j} (${arr[j]}) for current pass.`
        );
      }
    }
    if (minIndex !== i) {
      [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];
      swaps += 1;
      steps.push(
        `Swap index ${i} with ${minIndex} → [${arr.join(', ')}] after pass ${
          i + 1
        }`
      );
    } else {
      steps.push('  Element already in correct position.');
    }
  }

  return { sorted: arr, steps, comparisons, swaps };
}

