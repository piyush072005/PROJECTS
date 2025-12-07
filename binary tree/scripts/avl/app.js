const avlTree = new AVLTree();
const visualizer = new TreeVisualizer(document.getElementById('treeCanvas'));
const diagramGenerator = new TreeDiagramGenerator();

const nodeValueInput = document.getElementById('nodeValue');
const insertBtn = document.getElementById('insertBtn');
const deleteBtn = document.getElementById('deleteBtn');
const findBtn = document.getElementById('findBtn');
const replaceBtn = document.getElementById('replaceBtn');
const undoBtn = document.getElementById('undoBtn');
const clearBtn = document.getElementById('clearBtn');
const statusElement = document.getElementById('status');
const operationCountElement = document.getElementById('operationCount');
const historyList = document.getElementById('historyList');
const replaceGroup = document.getElementById('replaceGroup');
const replaceValueInput = document.getElementById('replaceValue');
const confirmReplaceBtn = document.getElementById('confirmReplaceBtn');
const cancelReplaceBtn = document.getElementById('cancelReplaceBtn');
const explanationModal = document.getElementById('explanationModal');
const explanationTitle = document.getElementById('explanationTitle');
const explanationContent = document.getElementById('explanationContent');
const closeModal = document.querySelector('.close-modal');

let replaceMode = false;
let valueToReplace = null;
let operationCount = 0;

updateDisplay();
if (nodeValueInput) {
  nodeValueInput.focus();
}

closeModal.addEventListener('click', () => {
  explanationModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
  if (e.target === explanationModal) {
    explanationModal.style.display = 'none';
  }
});

insertBtn.addEventListener('click', handleInsert);
deleteBtn.addEventListener('click', handleDelete);
findBtn.addEventListener('click', handleFind);
replaceBtn.addEventListener('click', handleReplace);
undoBtn.addEventListener('click', handleUndo);
clearBtn.addEventListener('click', handleClear);
confirmReplaceBtn.addEventListener('click', handleConfirmReplace);
cancelReplaceBtn.addEventListener('click', handleCancelReplace);

nodeValueInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    if (replaceMode) {
      handleConfirmReplace();
    } else {
      handleInsert();
    }
  }
});

replaceValueInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    handleConfirmReplace();
  }
});

function handleInsert() {
  const value = parseInt(nodeValueInput.value, 10);

  if (Number.isNaN(value)) {
    updateStatus('Please enter a valid number', 'error');
    return;
  }

  if (avlTree.find(value)) {
    updateStatus(`Value ${value} already exists in the tree`, 'warning');
    return;
  }

  avlTree.insert(value);
  operationCount += 1;

  const lastOp = avlTree.operationHistory[avlTree.operationHistory.length - 1];
  addToHistory(lastOp);

  updateDisplay();
  const statusMsg = `Inserted ${value}${
    lastOp.rotation ? ' (Rotation: ' + lastOp.rotation + ')' : ''
  }`;
  updateStatus(statusMsg, 'success');

  if (lastOp.rotation) {
    setTimeout(() => {
      showExplanation(lastOp);
    }, 500);
  }

  nodeValueInput.value = '';
  nodeValueInput.focus();
}

function handleDelete() {
  const value = parseInt(nodeValueInput.value, 10);

  if (Number.isNaN(value)) {
    updateStatus('Please enter a valid number', 'error');
    return;
  }

  if (!avlTree.find(value)) {
    updateStatus(`Value ${value} not found in the tree`, 'error');
    return;
  }

  avlTree.delete(value);
  operationCount += 1;

  const lastOp = avlTree.operationHistory[avlTree.operationHistory.length - 1];
  addToHistory(lastOp);

  updateDisplay();
  const statusMsg = `Deleted ${value}${
    lastOp.rotation ? ' (Rotation: ' + lastOp.rotation + ')' : ''
  }`;
  updateStatus(statusMsg, 'success');

  if (lastOp.rotation) {
    setTimeout(() => {
      showExplanation(lastOp);
    }, 500);
  }

  nodeValueInput.value = '';
  nodeValueInput.focus();
}

function handleFind() {
  const value = parseInt(nodeValueInput.value, 10);

  if (Number.isNaN(value)) {
    updateStatus('Please enter a valid number', 'error');
    return;
  }

  const node = avlTree.find(value);

  if (node) {
    visualizer.highlightFound(value);
    updateDisplay();
    updateStatus(`Found ${value} in the tree`, 'success');
    addToHistory({ type: 'find', value });
  } else {
    updateStatus(`Value ${value} not found in the tree`, 'error');
  }

  nodeValueInput.value = '';
  nodeValueInput.focus();
}

function handleReplace() {
  const value = parseInt(nodeValueInput.value, 10);

  if (Number.isNaN(value)) {
    updateStatus('Please enter a valid number to replace', 'error');
    return;
  }

  if (!avlTree.find(value)) {
    updateStatus(`Value ${value} not found in the tree`, 'error');
    return;
  }

  valueToReplace = value;
  replaceMode = true;
  replaceGroup.style.display = 'flex';
  replaceValueInput.value = '';
  replaceValueInput.focus();
  updateStatus(`Enter new value to replace ${value}`, 'info');
}

function handleConfirmReplace() {
  if (!replaceMode || valueToReplace === null) {
    return;
  }

  const newValue = parseInt(replaceValueInput.value, 10);

  if (Number.isNaN(newValue)) {
    updateStatus('Please enter a valid new value', 'error');
    return;
  }

  if (avlTree.find(newValue)) {
    updateStatus(`Value ${newValue} already exists in the tree`, 'error');
    return;
  }

  avlTree.replace(valueToReplace, newValue);
  operationCount += 1;

  const lastOp = avlTree.operationHistory[avlTree.operationHistory.length - 1];
  addToHistory(lastOp);

  updateDisplay();
  updateStatus(`Replaced ${valueToReplace} with ${newValue}`, 'success');

  setTimeout(() => {
    showExplanation(lastOp);
  }, 500);

  handleCancelReplace();
  nodeValueInput.focus();
}

function handleCancelReplace() {
  replaceMode = false;
  valueToReplace = null;
  replaceGroup.style.display = 'none';
  replaceValueInput.value = '';
  nodeValueInput.value = '';
}

function handleUndo() {
  if (avlTree.operationHistory.length === 0) {
    updateStatus('No operations to undo', 'warning');
    return;
  }

  const undone = avlTree.undo();

  if (undone) {
    operationCount = Math.max(0, operationCount - 1);
    updateDisplay();
    updateHistoryList();
    updateStatus('Last operation undone', 'success');
  }
}

function handleClear() {
  if (confirm('Are you sure you want to clear the entire tree?')) {
    avlTree.clear();
    operationCount = 0;
    updateDisplay();
    updateStatus('Tree cleared', 'info');
    historyList.innerHTML = '';
  }
}

function updateDisplay() {
  visualizer.updateSize(avlTree);
  visualizer.draw(avlTree);
  undoBtn.disabled = avlTree.operationHistory.length === 0;
  operationCountElement.textContent = operationCount;
}

function updateStatus(message, type = 'info') {
  statusElement.textContent = message;
  statusElement.className = type;
}

function addToHistory() {
  updateHistoryList();
}

function updateHistoryList() {
  historyList.innerHTML = '';

  const recentOps = avlTree.operationHistory.slice(-10).reverse();

  recentOps.forEach((op) => {
    const item = document.createElement('div');
    item.className = `history-item ${op.type}`;

    let text = '';
    if (op.type === 'insert') {
      text = `Inserted ${op.value}`;
    } else if (op.type === 'delete') {
      text = `Deleted ${op.value}`;
    } else if (op.type === 'find') {
      text = `Found ${op.value}`;
    } else if (op.type === 'replace') {
      text = `Replaced ${op.oldValue} with ${op.newValue}`;
    }

    if (op.rotation) {
      text += ` [${op.rotation}]`;
      item.classList.add('has-explanation');
    }

    item.addEventListener('click', () => {
      showExplanation(op);
    });

    const textSpan = document.createElement('span');
    textSpan.textContent = text;
    item.appendChild(textSpan);
    historyList.appendChild(item);
  });
}

function getExplanation(operation) {
  const explanationDiv = document.createElement('div');

  if (operation.beforeState && operation.afterState) {
    const treeComparison = diagramGenerator.generateFullTreeComparison(
      operation.beforeState,
      operation.afterState,
      operation
    );
    explanationDiv.appendChild(treeComparison);
  }

  if (operation.type === 'insert') {
    const section = document.createElement('div');
    section.className = 'explanation-section';
    section.innerHTML = `
      <h3>Insert Operation</h3>
      <p><strong>Action:</strong> Inserted value ${operation.value} into the AVL tree.</p>
      <p><strong>Process:</strong></p>
      <ul>
        <li>The value was inserted following Binary Search Tree (BST) rules.</li>
        <li>After insertion, the tree checked for balance violations.</li>
        <li>If the tree became unbalanced, a rotation was performed to restore balance.</li>
      </ul>
    `;

    if (operation.rotation) {
      const rotationDiv = getRotationExplanation(operation.rotation, operation.value, operation);
      section.appendChild(rotationDiv);
    } else {
      const resultP = document.createElement('p');
      resultP.innerHTML =
        '<strong>Result:</strong> The tree remained balanced after insertion. No rotation was needed.';
      section.appendChild(resultP);
    }

    explanationDiv.appendChild(section);
  } else if (operation.type === 'delete') {
    const section = document.createElement('div');
    section.className = 'explanation-section';
    section.innerHTML = `
      <h3>Delete Operation</h3>
      <p><strong>Action:</strong> Deleted value ${operation.value} from the AVL tree.</p>
      <p><strong>Process:</strong></p>
      <ul>
        <li>The node with value ${operation.value} was located and removed.</li>
        <li>If the node had children, it was replaced with its inorder successor.</li>
        <li>After deletion, the tree checked for balance violations.</li>
        <li>If the tree became unbalanced, a rotation was performed to restore balance.</li>
      </ul>
    `;

    if (operation.rotation) {
      const rotationDiv = getRotationExplanation(operation.rotation, operation.value, operation);
      section.appendChild(rotationDiv);
    } else {
      const resultP = document.createElement('p');
      resultP.innerHTML =
        '<strong>Result:</strong> The tree remained balanced after deletion. No rotation was needed.';
      section.appendChild(resultP);
    }

    explanationDiv.appendChild(section);
  } else if (operation.type === 'find') {
    const section = document.createElement('div');
    section.className = 'explanation-section';
    section.innerHTML = `
      <h3>Find Operation</h3>
      <p><strong>Action:</strong> Searched for value ${operation.value} in the AVL tree.</p>
      <p><strong>Process:</strong></p>
      <ul>
        <li>Started from the root node and compared the search value with the current node.</li>
        <li>If equal, the node was found; if smaller, searched in the left subtree; if larger, searched in the right subtree.</li>
        <li>Due to AVL tree balance, search time is O(log n).</li>
      </ul>
      <p><strong>Result:</strong> Value ${operation.value} was found in the tree.</p>
    `;
    explanationDiv.appendChild(section);
  } else if (operation.type === 'replace') {
    const section = document.createElement('div');
    section.className = 'explanation-section';
    section.innerHTML = `
      <h3>Replace Operation</h3>
      <p><strong>Action:</strong> Replaced value ${operation.oldValue} with ${operation.newValue}.</p>
      <p><strong>Process:</strong></p>
      <ul>
        <li>Deleted the old value ${operation.oldValue} from the tree.</li>
        <li>Inserted the new value ${operation.newValue} into the tree.</li>
        <li>Each step may have triggered rotations to maintain balance.</li>
      </ul>
      <p><strong>Result:</strong> The replacement was completed successfully.</p>
    `;
    explanationDiv.appendChild(section);
  }

  return explanationDiv;
}

function getRotationExplanation(rotationType, value, operation) {
  const rotationDiv = document.createElement('div');
  rotationDiv.className = 'rotation-steps';

  if (operation.beforeState && operation.afterState) {
    const beforeAfterDiagrams = diagramGenerator.generateBeforeAfterDiagrams(
      operation.beforeState,
      operation.afterState,
      rotationType,
      value
    );
    rotationDiv.appendChild(beforeAfterDiagrams);
  }

  let explanationHTML = '';
  switch (rotationType) {
    case 'Right Rotation':
      explanationHTML = `
        <h3>Right Rotation (Left-Left Case)</h3>
        <p><strong>Why this rotation?</strong> The left subtree was taller by more than 1 level.</p>
        <p><strong>Steps:</strong></p>
        <ol>
          <li>Identify the unbalanced node.</li>
          <li>Perform a right rotation where the left child becomes the new root.</li>
          <li>Update heights of the affected nodes.</li>
        </ol>
      `;
      break;
    case 'Left Rotation':
      explanationHTML = `
        <h3>Left Rotation (Right-Right Case)</h3>
        <p><strong>Why this rotation?</strong> The right subtree was taller by more than 1 level.</p>
        <p><strong>Steps:</strong></p>
        <ol>
          <li>Identify the unbalanced node.</li>
          <li>Perform a left rotation where the right child becomes the new root.</li>
          <li>Update heights of the affected nodes.</li>
        </ol>
      `;
      break;
    case 'Left-Right Rotation':
      explanationHTML = `
        <h3>Left-Right Rotation</h3>
        <p>This double rotation handles the zig-zag pattern in the left subtree.</p>
        <ol>
          <li>Perform a left rotation on the left child.</li>
          <li>Perform a right rotation on the unbalanced node.</li>
        </ol>
      `;
      break;
    case 'Right-Left Rotation':
      explanationHTML = `
        <h3>Right-Left Rotation</h3>
        <p>This double rotation handles the zig-zag pattern in the right subtree.</p>
        <ol>
          <li>Perform a right rotation on the right child.</li>
          <li>Perform a left rotation on the unbalanced node.</li>
        </ol>
      `;
      break;
  }

  rotationDiv.innerHTML += explanationHTML;
  return rotationDiv;
}

function showExplanation(operation) {
  explanationTitle.textContent = `${
    operation.type.charAt(0).toUpperCase() + operation.type.slice(1)
  } Operation Explanation`;
  explanationContent.innerHTML = '';

  const explanationElement = getExplanation(operation);
  explanationContent.appendChild(explanationElement);

  explanationModal.style.display = 'block';
}



