/**
 * Complexity Analyzer
 * - Display time/space complexity
 * - Benchmark runtime at different scales
 * - Generate comparison charts
 */

// Algorithm complexity data
const ALGORITHM_COMPLEXITY = {
  quick: {
    name: 'Quick Sort',
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n²)',
    space: 'O(log n)',
    stable: false,
    description: 'Divide-and-conquer using pivots. Fast in practice but worst case is quadratic.',
    worstCase: 'Already sorted array with bad pivot selection'
  },
  bubble: {
    name: 'Bubble Sort',
    best: 'O(n)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
    stable: true,
    description: 'Simple comparison sort. Good for small or nearly sorted data.',
    worstCase: 'Reverse sorted array'
  },
  merge: {
    name: 'Merge Sort',
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n log n)',
    space: 'O(n)',
    stable: true,
    description: 'Divide-and-conquer with guaranteed O(n log n). Requires extra space.',
    worstCase: 'Same complexity for all cases'
  },
  heap: {
    name: 'Heap Sort',
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n log n)',
    space: 'O(1)',
    stable: false,
    description: 'In-place sort using heap data structure. Consistent performance.',
    worstCase: 'Same complexity for all cases'
  },
  selection: {
    name: 'Selection Sort',
    best: 'O(n²)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
    stable: false,
    description: 'Simple in-place sort. Always makes O(n²) comparisons.',
    worstCase: 'Same complexity for all cases'
  },
  linear: {
    name: 'Linear Search',
    best: 'O(1)',
    average: 'O(n)',
    worst: 'O(n)',
    space: 'O(1)',
    description: 'Sequential search through array. Works on unsorted data.'
  },
  binary: {
    name: 'Binary Search',
    best: 'O(1)',
    average: 'O(log n)',
    worst: 'O(log n)',
    space: 'O(1)',
    description: 'Halves search space each step. Requires sorted data.'
  },
  prim: {
    name: "Prim's Algorithm",
    best: 'O(E log V)',
    average: 'O(E log V)',
    worst: 'O(E log V)',
    space: 'O(V)',
    description: 'Greedy MST algorithm. Good for dense graphs.'
  },
  kruskal: {
    name: "Kruskal's Algorithm",
    best: 'O(E log E)',
    average: 'O(E log E)',
    worst: 'O(E log E)',
    space: 'O(V)',
    description: 'MST using Union-Find. Good for sparse graphs.'
  },
  dijkstra: {
    name: "Dijkstra's Algorithm",
    best: 'O((V+E) log V)',
    average: 'O((V+E) log V)',
    worst: 'O((V+E) log V)',
    space: 'O(V)',
    description: 'Single-source shortest path. Non-negative weights only.'
  },
  floydWarshall: {
    name: 'Floyd-Warshall',
    best: 'O(V³)',
    average: 'O(V³)',
    worst: 'O(V³)',
    space: 'O(V²)',
    description: 'All-pairs shortest path. Handles negative weights.'
  }
};

// Sorting implementations for benchmarking
const SORT_IMPLEMENTATIONS = {
  quick: (arr) => {
    const a = [...arr];
    const quickSort = (low, high) => {
      if (low >= high) return;
      const pivot = a[high];
      let i = low;
      for (let j = low; j < high; j++) {
        if (a[j] <= pivot) {
          [a[i], a[j]] = [a[j], a[i]];
          i++;
        }
      }
      [a[i], a[high]] = [a[high], a[i]];
      quickSort(low, i - 1);
      quickSort(i + 1, high);
    };
    quickSort(0, a.length - 1);
    return a;
  },
  
  bubble: (arr) => {
    const a = [...arr];
    for (let i = 0; i < a.length - 1; i++) {
      for (let j = 0; j < a.length - i - 1; j++) {
        if (a[j] > a[j + 1]) {
          [a[j], a[j + 1]] = [a[j + 1], a[j]];
        }
      }
    }
    return a;
  },
  
  merge: (arr) => {
    const a = [...arr];
    const merge = (left, mid, right) => {
      const L = a.slice(left, mid + 1);
      const R = a.slice(mid + 1, right + 1);
      let i = 0, j = 0, k = left;
      while (i < L.length && j < R.length) {
        a[k++] = L[i] <= R[j] ? L[i++] : R[j++];
      }
      while (i < L.length) a[k++] = L[i++];
      while (j < R.length) a[k++] = R[j++];
    };
    const sort = (l, r) => {
      if (l >= r) return;
      const m = Math.floor((l + r) / 2);
      sort(l, m);
      sort(m + 1, r);
      merge(l, m, r);
    };
    sort(0, a.length - 1);
    return a;
  },
  
  heap: (arr) => {
    const a = [...arr];
    const heapify = (n, i) => {
      let largest = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && a[l] > a[largest]) largest = l;
      if (r < n && a[r] > a[largest]) largest = r;
      if (largest !== i) {
        [a[i], a[largest]] = [a[largest], a[i]];
        heapify(n, largest);
      }
    };
    for (let i = Math.floor(a.length / 2) - 1; i >= 0; i--) heapify(a.length, i);
    for (let i = a.length - 1; i > 0; i--) {
      [a[0], a[i]] = [a[i], a[0]];
      heapify(i, 0);
    }
    return a;
  },
  
  selection: (arr) => {
    const a = [...arr];
    for (let i = 0; i < a.length - 1; i++) {
      let min = i;
      for (let j = i + 1; j < a.length; j++) {
        if (a[j] < a[min]) min = j;
      }
      if (min !== i) [a[i], a[min]] = [a[min], a[i]];
    }
    return a;
  }
};

// Generate random array
function generateRandomArray(size) {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 10000));
}

// Benchmark a single algorithm
function benchmarkAlgorithm(algo, size, iterations = 3) {
  const impl = SORT_IMPLEMENTATIONS[algo];
  if (!impl) return null;
  
  const times = [];
  for (let i = 0; i < iterations; i++) {
    const arr = generateRandomArray(size);
    const start = performance.now();
    impl(arr);
    const end = performance.now();
    times.push(end - start);
  }
  
  // Return average time
  return times.reduce((a, b) => a + b, 0) / times.length;
}

// Benchmark all algorithms at different sizes
function benchmarkAllAlgorithms(sizes = [100, 500, 1000, 2000, 5000]) {
  const results = {};
  
  for (const algo of Object.keys(SORT_IMPLEMENTATIONS)) {
    results[algo] = {};
    for (const size of sizes) {
      results[algo][size] = benchmarkAlgorithm(algo, size);
    }
  }
  
  return results;
}

// Format time for display
function formatTime(ms) {
  if (ms < 0.01) return '< 0.01 ms';
  if (ms < 1) return `${ms.toFixed(2)} ms`;
  if (ms < 1000) return `${ms.toFixed(1)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

// Get time class for styling
function getTimeClass(ms, size) {
  // Relative to expected O(n²) vs O(n log n)
  const nlogn = size * Math.log2(size) * 0.0001;
  const n2 = size * size * 0.000001;
  
  if (ms < nlogn * 2) return 'fast';
  if (ms < n2 * 0.5) return 'medium';
  return 'slow';
}

// Create complexity display HTML
function createComplexityDisplay(algo) {
  const data = ALGORITHM_COMPLEXITY[algo];
  if (!data) return '';
  
  return `
    <div class="complexity-panel">
      <div class="complexity-grid">
        <div class="complexity-card">
          <div class="label">Best Case</div>
          <div class="value best">${data.best}</div>
        </div>
        <div class="complexity-card">
          <div class="label">Average Case</div>
          <div class="value average">${data.average}</div>
        </div>
        <div class="complexity-card">
          <div class="label">Worst Case</div>
          <div class="value worst">${data.worst}</div>
          ${data.worstCase ? `<div class="subtext">${data.worstCase}</div>` : ''}
        </div>
        <div class="complexity-card">
          <div class="label">Space</div>
          <div class="value space">${data.space}</div>
        </div>
      </div>
      ${data.stable !== undefined ? `
        <div style="margin-top: 1rem; font-size: 0.9rem; color: var(--text-secondary);">
          <strong>Stable:</strong> ${data.stable ? 'Yes ✓' : 'No ✗'} 
          <span style="margin-left: 1rem;"><strong>In-place:</strong> ${data.space === 'O(1)' || data.space === 'O(log n)' ? 'Yes ✓' : 'No ✗'}</span>
        </div>
      ` : ''}
    </div>
  `;
}

// Create benchmark section HTML
function createBenchmarkSection(algo) {
  return `
    <div class="benchmark-section" id="benchmark-section">
      <h4>⏱️ Runtime Benchmark</h4>
      <div class="benchmark-controls">
        <div class="field">
          <label>Array sizes (comma-separated)</label>
          <input type="text" id="benchmark-sizes" value="100, 500, 1000, 2000, 5000" placeholder="100, 500, 1000">
        </div>
        <button id="run-benchmark" onclick="runBenchmark('${algo}')">Run Benchmark</button>
      </div>
      <div class="benchmark-results" id="benchmark-results">
        <p style="color: var(--text-muted); font-style: italic;">Click "Run Benchmark" to measure actual runtime.</p>
      </div>
    </div>
  `;
}

// Create scaling preview
function createScalingPreview(algo) {
  const data = ALGORITHM_COMPLEXITY[algo];
  if (!data) return '';
  
  // Calculate relative widths based on complexity
  const getWidth = (complexity, n) => {
    const complexities = {
      'O(1)': 1,
      'O(log n)': Math.log2(n),
      'O(n)': n,
      'O(n log n)': n * Math.log2(n),
      'O(n²)': n * n
    };
    return complexities[complexity] || n;
  };
  
  const sizes = [10, 100, 1000];
  const maxOps = Math.max(...sizes.map(n => getWidth(data.worst, n)));
  
  return `
    <div class="scaling-preview">
      <h5>📈 How Runtime Scales (${data.worst})</h5>
      <div class="scaling-bars">
        ${sizes.map(n => {
          const ops = getWidth(data.worst, n);
          const width = Math.min(100, (ops / maxOps) * 100);
          const formatted = ops >= 1000000 ? `${(ops/1000000).toFixed(1)}M` : 
                           ops >= 1000 ? `${(ops/1000).toFixed(1)}K` : ops.toFixed(0);
          return `
            <div class="scaling-row">
              <span class="label">n = ${n}</span>
              <div class="bar" style="width: ${Math.max(5, width)}%">
                <span>~${formatted} ops</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// Run benchmark and display results
function runBenchmark(algo) {
  const sizesInput = document.getElementById('benchmark-sizes');
  const resultsContainer = document.getElementById('benchmark-results');
  const button = document.getElementById('run-benchmark');
  
  if (!sizesInput || !resultsContainer) return;
  
  // Parse sizes
  const sizes = sizesInput.value
    .split(',')
    .map(s => parseInt(s.trim()))
    .filter(n => !isNaN(n) && n > 0 && n <= 50000);
  
  if (sizes.length === 0) {
    resultsContainer.innerHTML = '<p style="color: var(--text-error);">Please enter valid array sizes (max 50,000).</p>';
    return;
  }
  
  // Disable button during benchmark
  if (button) {
    button.disabled = true;
    button.textContent = 'Running...';
  }
  
  resultsContainer.innerHTML = '<p style="color: var(--text-muted);">Benchmarking...</p>';
  
  // Run benchmark asynchronously
  setTimeout(() => {
    const results = [];
    
    for (const size of sizes) {
      const time = benchmarkAlgorithm(algo, size);
      results.push({ size, time });
    }
    
    // Display results
    resultsContainer.innerHTML = results.map(r => `
      <div class="benchmark-result">
        <div class="size">n = ${r.size.toLocaleString()}</div>
        <div class="time ${getTimeClass(r.time, r.size)}">${formatTime(r.time)}</div>
      </div>
    `).join('');
    
    // Re-enable button
    if (button) {
      button.disabled = false;
      button.textContent = 'Run Benchmark';
    }
  }, 50);
}

// Create comparison chart
function createComparisonChart(algorithms, sizes = [100, 500, 1000, 2000]) {
  const results = {};
  const maxTime = {};
  
  // Benchmark each algorithm
  for (const algo of algorithms) {
    results[algo] = {};
    for (const size of sizes) {
      const time = benchmarkAlgorithm(algo, size);
      results[algo][size] = time;
      maxTime[size] = Math.max(maxTime[size] || 0, time);
    }
  }
  
  // Generate chart HTML
  const chartBars = sizes.map(size => `
    <div class="chart-bar-group">
      <div class="chart-bars">
        ${algorithms.map(algo => {
          const time = results[algo][size];
          const height = (time / maxTime[size]) * 100;
          return `
            <div class="chart-bar ${algo}" 
                 style="height: ${Math.max(5, height)}%" 
                 data-value="${formatTime(time)}"
                 title="${ALGORITHM_COMPLEXITY[algo]?.name}: ${formatTime(time)}">
            </div>
          `;
        }).join('')}
      </div>
      <div class="chart-label">n = ${size}</div>
    </div>
  `).join('');
  
  const legend = algorithms.map(algo => `
    <div class="chart-legend-item">
      <div class="chart-legend-color ${algo}"></div>
      <span>${ALGORITHM_COMPLEXITY[algo]?.name || algo}</span>
    </div>
  `).join('');
  
  return `
    <div class="chart-wrapper">
      ${chartBars}
    </div>
    <div class="chart-legend">
      ${legend}
    </div>
  `;
}

// Create comparison table
function createComparisonTable() {
  const algorithms = ['quick', 'merge', 'heap', 'bubble', 'selection'];
  
  const getComplexityClass = (complexity) => {
    if (complexity.includes('1')) return 'o-1';
    if (complexity.includes('log n') && !complexity.includes('n log')) return 'o-logn';
    if (complexity.includes('n log n')) return 'o-nlogn';
    if (complexity.includes('n²')) return 'o-n2';
    if (complexity === 'O(n)') return 'o-n';
    return '';
  };
  
  const rows = algorithms.map(algo => {
    const data = ALGORITHM_COMPLEXITY[algo];
    return `
      <tr>
        <td class="algo-name">${data.name}</td>
        <td><span class="complexity-badge ${getComplexityClass(data.best)}">${data.best}</span></td>
        <td><span class="complexity-badge ${getComplexityClass(data.average)}">${data.average}</span></td>
        <td><span class="complexity-badge ${getComplexityClass(data.worst)}">${data.worst}</span></td>
        <td><span class="complexity-badge ${getComplexityClass(data.space)}">${data.space}</span></td>
        <td>${data.stable ? '✓' : '✗'}</td>
      </tr>
    `;
  }).join('');
  
  return `
    <table class="complexity-table">
      <thead>
        <tr>
          <th>Algorithm</th>
          <th>Best</th>
          <th>Average</th>
          <th>Worst</th>
          <th>Space</th>
          <th>Stable</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

// Initialize complexity display for current algorithm page
function initComplexityAnalyzer() {
  const algo = document.body.dataset.algorithm;
  if (!algo || !ALGORITHM_COMPLEXITY[algo]) return;
  
  // Find or create complexity container
  let container = document.getElementById('complexity-container');
  if (!container) {
    // Insert after result card or at end of first panel
    const resultCard = document.getElementById('sort-summary') || document.getElementById('search-summary');
    if (resultCard) {
      container = document.createElement('div');
      container.id = 'complexity-container';
      resultCard.parentNode.insertBefore(container, resultCard.nextSibling);
    }
  }
  
  if (container) {
    container.innerHTML = `
      <div class="panel__header" style="margin-top: 1.5rem;">
        <h2>📊 Complexity Analysis</h2>
        <p>${ALGORITHM_COMPLEXITY[algo].description}</p>
      </div>
      ${createComplexityDisplay(algo)}
      ${createScalingPreview(algo)}
      ${createBenchmarkSection(algo)}
    `;
  }
}

// Export functions for global use
window.ALGORITHM_COMPLEXITY = ALGORITHM_COMPLEXITY;
window.runBenchmark = runBenchmark;
window.benchmarkAlgorithm = benchmarkAlgorithm;
window.benchmarkAllAlgorithms = benchmarkAllAlgorithms;
window.createComparisonChart = createComparisonChart;
window.createComparisonTable = createComparisonTable;
window.createComplexityDisplay = createComplexityDisplay;
window.initComplexityAnalyzer = initComplexityAnalyzer;
window.formatTime = formatTime;

// Auto-initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initComplexityAnalyzer);
} else {
  setTimeout(initComplexityAnalyzer, 100);
}




