/**
 * Algorithm Visualizer
 * Step-by-step animations for sorting algorithms
 */

class AlgorithmVisualizer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.frames = [];
    this.currentFrame = 0;
    this.isPlaying = false;
    this.playInterval = null;
    this.speed = 500; // ms per frame
    this.onFrameChange = null;
    
    if (this.container) {
      this.init();
    }
  }
  
  init() {
    this.container.innerHTML = `
      <div class="visualizer-container">
        <div class="visualizer-header">
          <h3>Algorithm Animation</h3>
          <div class="visualizer-step-info">
            <span class="step-counter">Step <span id="viz-current-step">0</span> of <span id="viz-total-steps">0</span></span>
          </div>
          <div class="visualizer-controls">
            <button id="viz-first" title="First step" aria-label="First step">
              <svg viewBox="0 0 24 24"><path d="M18 17.17V6.83L12.83 12 18 17.17zM5 18h2V6H5v12z"/></svg>
            </button>
            <button id="viz-prev" title="Previous step" aria-label="Previous step">
              <svg viewBox="0 0 24 24"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/></svg>
            </button>
            <button id="viz-play" title="Play/Pause" aria-label="Play/Pause">
              <svg class="play-icon" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              <svg class="pause-icon" viewBox="0 0 24 24" style="display:none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            </button>
            <button id="viz-next" title="Next step" aria-label="Next step">
              <svg viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>
            </button>
            <button id="viz-last" title="Last step" aria-label="Last step">
              <svg viewBox="0 0 24 24"><path d="M6 6.83v10.34L11.17 12 6 6.83zM17 6h2v12h-2V6z"/></svg>
            </button>
            <div class="speed-control">
              <label for="viz-speed">Speed:</label>
              <input type="range" id="viz-speed" min="100" max="1500" value="500" step="100">
            </div>
          </div>
        </div>
        <div class="visualizer-canvas" id="viz-canvas"></div>
        <div class="visualizer-description">
          <p id="viz-description">Run the algorithm to start visualization.</p>
        </div>
        <div class="visualizer-legend">
          <div class="legend-item"><div class="legend-color default"></div> Default</div>
          <div class="legend-item"><div class="legend-color comparing"></div> Comparing</div>
          <div class="legend-item"><div class="legend-color swapping"></div> Swapping</div>
          <div class="legend-item"><div class="legend-color pivot"></div> Pivot</div>
          <div class="legend-item"><div class="legend-color sorted"></div> Sorted</div>
        </div>
      </div>
    `;
    
    this.bindControls();
  }
  
  bindControls() {
    const firstBtn = document.getElementById('viz-first');
    const prevBtn = document.getElementById('viz-prev');
    const playBtn = document.getElementById('viz-play');
    const nextBtn = document.getElementById('viz-next');
    const lastBtn = document.getElementById('viz-last');
    const speedSlider = document.getElementById('viz-speed');
    
    if (firstBtn) firstBtn.addEventListener('click', () => this.goToFrame(0));
    if (prevBtn) prevBtn.addEventListener('click', () => this.prevFrame());
    if (playBtn) playBtn.addEventListener('click', () => this.togglePlay());
    if (nextBtn) nextBtn.addEventListener('click', () => this.nextFrame());
    if (lastBtn) lastBtn.addEventListener('click', () => this.goToFrame(this.frames.length - 1));
    if (speedSlider) {
      speedSlider.addEventListener('input', (e) => {
        this.speed = 1600 - parseInt(e.target.value); // Invert so higher = faster
        if (this.isPlaying) {
          this.pause();
          this.play();
        }
      });
    }
  }
  
  setFrames(frames) {
    this.frames = frames;
    this.currentFrame = 0;
    this.updateStepCounter();
    if (frames.length > 0) {
      this.renderFrame(0);
    }
  }
  
  renderFrame(index) {
    if (index < 0 || index >= this.frames.length) return;
    
    const frame = this.frames[index];
    const canvas = document.getElementById('viz-canvas');
    const description = document.getElementById('viz-description');
    
    if (!canvas || !frame) return;
    
    // Calculate bar dimensions
    const maxValue = Math.max(...frame.array);
    const maxHeight = 200;
    
    // Render bars
    canvas.innerHTML = frame.array.map((value, i) => {
      const height = (value / maxValue) * maxHeight;
      const classes = ['array-bar'];
      
      // Add state classes
      if (frame.comparing && frame.comparing.includes(i)) {
        classes.push('comparing');
      }
      if (frame.swapping && frame.swapping.includes(i)) {
        classes.push('swapping');
      }
      if (frame.pivot === i) {
        classes.push('pivot');
      }
      if (frame.sorted && frame.sorted.includes(i)) {
        classes.push('sorted');
      }
      if (frame.minimum === i) {
        classes.push('minimum');
      }
      if (frame.merging && frame.merging.includes(i)) {
        classes.push('merging');
      }
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
    }).join('');
    
    // Update description
    if (description) {
      const actionClass = frame.action || 'info';
      const actionLabel = this.getActionLabel(frame.action);
      description.innerHTML = `
        ${actionLabel ? `<span class="action-type ${actionClass}">${actionLabel}</span>` : ''}
        ${frame.description || ''}
      `;
    }
    
    this.currentFrame = index;
    this.updateStepCounter();
    this.updateButtonStates();
    
    if (this.onFrameChange) {
      this.onFrameChange(index, frame);
    }
  }
  
  getActionLabel(action) {
    const labels = {
      'compare': 'Compare',
      'swap': 'Swap',
      'pivot': 'Pivot',
      'merge': 'Merge',
      'done': 'Done',
      'init': 'Initial',
      'heapify': 'Heapify',
      'extract': 'Extract',
      'select': 'Select'
    };
    return labels[action] || '';
  }
  
  updateStepCounter() {
    const currentEl = document.getElementById('viz-current-step');
    const totalEl = document.getElementById('viz-total-steps');
    
    if (currentEl) currentEl.textContent = this.currentFrame + 1;
    if (totalEl) totalEl.textContent = this.frames.length;
  }
  
  updateButtonStates() {
    const firstBtn = document.getElementById('viz-first');
    const prevBtn = document.getElementById('viz-prev');
    const nextBtn = document.getElementById('viz-next');
    const lastBtn = document.getElementById('viz-last');
    
    const atStart = this.currentFrame === 0;
    const atEnd = this.currentFrame >= this.frames.length - 1;
    
    if (firstBtn) firstBtn.disabled = atStart;
    if (prevBtn) prevBtn.disabled = atStart;
    if (nextBtn) nextBtn.disabled = atEnd;
    if (lastBtn) lastBtn.disabled = atEnd;
    
    // Update play button if at end
    if (atEnd && this.isPlaying) {
      this.pause();
    }
  }
  
  nextFrame() {
    if (this.currentFrame < this.frames.length - 1) {
      this.renderFrame(this.currentFrame + 1);
    }
  }
  
  prevFrame() {
    if (this.currentFrame > 0) {
      this.renderFrame(this.currentFrame - 1);
    }
  }
  
  goToFrame(index) {
    if (index >= 0 && index < this.frames.length) {
      this.renderFrame(index);
    }
  }
  
  play() {
    if (this.isPlaying) return;
    if (this.currentFrame >= this.frames.length - 1) {
      this.goToFrame(0);
    }
    
    this.isPlaying = true;
    this.updatePlayButton();
    
    this.playInterval = setInterval(() => {
      if (this.currentFrame < this.frames.length - 1) {
        this.nextFrame();
      } else {
        this.pause();
      }
    }, this.speed);
  }
  
  pause() {
    this.isPlaying = false;
    this.updatePlayButton();
    
    if (this.playInterval) {
      clearInterval(this.playInterval);
      this.playInterval = null;
    }
  }
  
  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }
  
  updatePlayButton() {
    const playIcon = document.querySelector('#viz-play .play-icon');
    const pauseIcon = document.querySelector('#viz-play .pause-icon');
    
    if (playIcon && pauseIcon) {
      playIcon.style.display = this.isPlaying ? 'none' : 'block';
      pauseIcon.style.display = this.isPlaying ? 'block' : 'none';
    }
  }
  
  reset() {
    this.pause();
    this.frames = [];
    this.currentFrame = 0;
    this.updateStepCounter();
    
    const canvas = document.getElementById('viz-canvas');
    const description = document.getElementById('viz-description');
    
    if (canvas) canvas.innerHTML = '';
    if (description) description.innerHTML = 'Run the algorithm to start visualization.';
  }
}

// =============================================
// FRAME GENERATORS FOR EACH ALGORITHM
// =============================================

function generateQuickSortFrames(data) {
  const arr = [...data];
  const frames = [];
  const sorted = new Set();
  
  // Initial frame
  frames.push({
    array: [...arr],
    action: 'init',
    description: `Initial array: [${arr.join(', ')}]`
  });
  
  function swap(i, j) {
    if (i === j) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    frames.push({
      array: [...arr],
      swapping: [i, j],
      action: 'swap',
      description: `Swap elements at indices ${i} and ${j}: ${arr[j]} ↔ ${arr[i]}`
    });
  }
  
  function partition(low, high) {
    const pivot = arr[high];
    frames.push({
      array: [...arr],
      pivot: high,
      activeRange: [low, high],
      action: 'pivot',
      description: `Choose pivot: ${pivot} at index ${high}. Partition range [${low}, ${high}]`
    });
    
    let i = low;
    for (let j = low; j < high; j++) {
      frames.push({
        array: [...arr],
        comparing: [j, high],
        pivot: high,
        activeRange: [low, high],
        action: 'compare',
        description: `Compare ${arr[j]} ≤ ${pivot}? ${arr[j] <= pivot ? 'Yes, move to left partition' : 'No, stay in right partition'}`
      });
      
      if (arr[j] <= pivot) {
        swap(i, j);
        i++;
      }
    }
    
    swap(i, high);
    sorted.add(i);
    
    frames.push({
      array: [...arr],
      pivot: i,
      sorted: [...sorted],
      activeRange: [low, high],
      action: 'done',
      description: `Pivot ${pivot} placed at final position ${i}`
    });
    
    return i;
  }
  
  function quickSort(low, high) {
    if (low >= high) {
      if (low === high) sorted.add(low);
      return;
    }
    
    const pivotIndex = partition(low, high);
    quickSort(low, pivotIndex - 1);
    quickSort(pivotIndex + 1, high);
  }
  
  quickSort(0, arr.length - 1);
  
  // Final sorted frame
  frames.push({
    array: [...arr],
    sorted: arr.map((_, i) => i),
    action: 'done',
    description: `Sorting complete! Final array: [${arr.join(', ')}]`
  });
  
  return frames;
}

function generateBubbleSortFrames(data) {
  const arr = [...data];
  const frames = [];
  const sorted = [];
  
  frames.push({
    array: [...arr],
    action: 'init',
    description: `Initial array: [${arr.join(', ')}]`
  });
  
  for (let i = 0; i < arr.length - 1; i++) {
    let swapped = false;
    
    for (let j = 0; j < arr.length - i - 1; j++) {
      frames.push({
        array: [...arr],
        comparing: [j, j + 1],
        sorted: [...sorted],
        action: 'compare',
        description: `Pass ${i + 1}: Compare ${arr[j]} and ${arr[j + 1]} at indices ${j} and ${j + 1}`
      });
      
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swapped = true;
        
        frames.push({
          array: [...arr],
          swapping: [j, j + 1],
          sorted: [...sorted],
          action: 'swap',
          description: `Swap! ${arr[j + 1]} > ${arr[j]}, so swap them`
        });
      }
    }
    
    sorted.unshift(arr.length - i - 1);
    
    if (!swapped) {
      frames.push({
        array: [...arr],
        sorted: arr.map((_, idx) => idx),
        action: 'done',
        description: 'No swaps this pass - array is sorted!'
      });
      break;
    }
  }
  
  frames.push({
    array: [...arr],
    sorted: arr.map((_, i) => i),
    action: 'done',
    description: `Sorting complete! Final array: [${arr.join(', ')}]`
  });
  
  return frames;
}

function generateSelectionSortFrames(data) {
  const arr = [...data];
  const frames = [];
  const sorted = [];
  
  frames.push({
    array: [...arr],
    action: 'init',
    description: `Initial array: [${arr.join(', ')}]`
  });
  
  for (let i = 0; i < arr.length - 1; i++) {
    let minIndex = i;
    
    frames.push({
      array: [...arr],
      minimum: i,
      sorted: [...sorted],
      action: 'select',
      description: `Pass ${i + 1}: Start with minimum at index ${i} (value: ${arr[i]})`
    });
    
    for (let j = i + 1; j < arr.length; j++) {
      frames.push({
        array: [...arr],
        comparing: [minIndex, j],
        minimum: minIndex,
        sorted: [...sorted],
        action: 'compare',
        description: `Compare current minimum ${arr[minIndex]} with ${arr[j]}`
      });
      
      if (arr[j] < arr[minIndex]) {
        minIndex = j;
        frames.push({
          array: [...arr],
          minimum: minIndex,
          sorted: [...sorted],
          action: 'select',
          description: `New minimum found: ${arr[minIndex]} at index ${minIndex}`
        });
      }
    }
    
    if (minIndex !== i) {
      [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];
      frames.push({
        array: [...arr],
        swapping: [i, minIndex],
        sorted: [...sorted],
        action: 'swap',
        description: `Swap ${arr[minIndex]} from index ${minIndex} to position ${i}`
      });
    }
    
    sorted.push(i);
  }
  
  sorted.push(arr.length - 1);
  
  frames.push({
    array: [...arr],
    sorted: arr.map((_, i) => i),
    action: 'done',
    description: `Sorting complete! Final array: [${arr.join(', ')}]`
  });
  
  return frames;
}

function generateMergeSortFrames(data) {
  const arr = [...data];
  const frames = [];
  const sorted = new Set();
  
  frames.push({
    array: [...arr],
    action: 'init',
    description: `Initial array: [${arr.join(', ')}]`
  });
  
  function merge(left, mid, right) {
    const leftArr = arr.slice(left, mid + 1);
    const rightArr = arr.slice(mid + 1, right + 1);
    
    frames.push({
      array: [...arr],
      activeRange: [left, right],
      merging: Array.from({length: right - left + 1}, (_, i) => left + i),
      action: 'merge',
      description: `Merge [${leftArr.join(', ')}] and [${rightArr.join(', ')}]`
    });
    
    let i = 0, j = 0, k = left;
    
    while (i < leftArr.length && j < rightArr.length) {
      frames.push({
        array: [...arr],
        comparing: [left + i, mid + 1 + j],
        activeRange: [left, right],
        action: 'compare',
        description: `Compare ${leftArr[i]} and ${rightArr[j]}`
      });
      
      if (leftArr[i] <= rightArr[j]) {
        arr[k] = leftArr[i];
        i++;
      } else {
        arr[k] = rightArr[j];
        j++;
      }
      k++;
      
      frames.push({
        array: [...arr],
        merging: Array.from({length: right - left + 1}, (_, idx) => left + idx),
        activeRange: [left, right],
        action: 'merge',
        description: `Place ${arr[k - 1]} at position ${k - 1}`
      });
    }
    
    while (i < leftArr.length) {
      arr[k] = leftArr[i];
      i++;
      k++;
    }
    
    while (j < rightArr.length) {
      arr[k] = rightArr[j];
      j++;
      k++;
    }
    
    frames.push({
      array: [...arr],
      sorted: Array.from({length: right - left + 1}, (_, idx) => left + idx),
      activeRange: [left, right],
      action: 'done',
      description: `Merged segment: [${arr.slice(left, right + 1).join(', ')}]`
    });
  }
  
  function mergeSort(left, right) {
    if (left >= right) return;
    
    const mid = Math.floor((left + right) / 2);
    
    frames.push({
      array: [...arr],
      activeRange: [left, right],
      action: 'divide',
      description: `Divide array at index ${mid}: [${left}..${mid}] and [${mid + 1}..${right}]`
    });
    
    mergeSort(left, mid);
    mergeSort(mid + 1, right);
    merge(left, mid, right);
  }
  
  mergeSort(0, arr.length - 1);
  
  frames.push({
    array: [...arr],
    sorted: arr.map((_, i) => i),
    action: 'done',
    description: `Sorting complete! Final array: [${arr.join(', ')}]`
  });
  
  return frames;
}

function generateHeapSortFrames(data) {
  const arr = [...data];
  const frames = [];
  const sorted = [];
  
  frames.push({
    array: [...arr],
    action: 'init',
    description: `Initial array: [${arr.join(', ')}]. Building max heap...`
  });
  
  function swap(i, j) {
    if (i === j) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    frames.push({
      array: [...arr],
      swapping: [i, j],
      sorted: [...sorted],
      action: 'swap',
      description: `Swap ${arr[j]} and ${arr[i]} at indices ${i} and ${j}`
    });
  }
  
  function heapify(index, size) {
    let largest = index;
    const left = 2 * index + 1;
    const right = 2 * index + 2;
    
    if (left < size) {
      frames.push({
        array: [...arr],
        comparing: [largest, left],
        sorted: [...sorted],
        action: 'compare',
        description: `Heapify: Compare ${arr[largest]} (index ${largest}) with left child ${arr[left]} (index ${left})`
      });
      
      if (arr[left] > arr[largest]) {
        largest = left;
      }
    }
    
    if (right < size) {
      frames.push({
        array: [...arr],
        comparing: [largest, right],
        sorted: [...sorted],
        action: 'compare',
        description: `Heapify: Compare ${arr[largest]} (index ${largest}) with right child ${arr[right]} (index ${right})`
      });
      
      if (arr[right] > arr[largest]) {
        largest = right;
      }
    }
    
    if (largest !== index) {
      swap(index, largest);
      heapify(largest, size);
    }
  }
  
  // Build max heap
  const size = arr.length;
  for (let i = Math.floor(size / 2) - 1; i >= 0; i--) {
    frames.push({
      array: [...arr],
      pivot: i,
      action: 'heapify',
      description: `Heapify subtree rooted at index ${i}`
    });
    heapify(i, size);
  }
  
  frames.push({
    array: [...arr],
    action: 'done',
    description: `Max heap built: [${arr.join(', ')}]. Now extracting...`
  });
  
  // Extract elements
  for (let end = size - 1; end > 0; end--) {
    frames.push({
      array: [...arr],
      comparing: [0, end],
      sorted: [...sorted],
      action: 'extract',
      description: `Extract max ${arr[0]} to position ${end}`
    });
    
    swap(0, end);
    sorted.unshift(end);
    
    heapify(0, end);
  }
  
  sorted.unshift(0);
  
  frames.push({
    array: [...arr],
    sorted: arr.map((_, i) => i),
    action: 'done',
    description: `Sorting complete! Final array: [${arr.join(', ')}]`
  });
  
  return frames;
}

// Export for global use
window.AlgorithmVisualizer = AlgorithmVisualizer;
window.generateQuickSortFrames = generateQuickSortFrames;
window.generateBubbleSortFrames = generateBubbleSortFrames;
window.generateSelectionSortFrames = generateSelectionSortFrames;
window.generateMergeSortFrames = generateMergeSortFrames;
window.generateHeapSortFrames = generateHeapSortFrames;




