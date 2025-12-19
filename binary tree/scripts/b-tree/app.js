let bTree = new BTree(3); // Start with order 3 B-Tree
const visualizer = new BTreeVisualizer(document.getElementById('treeCanvas'));

const nodeValueInput = document.getElementById('nodeValue');
const treeOrderInput = document.getElementById('treeOrder');
const setOrderBtn = document.getElementById('setOrderBtn');
const insertBtn = document.getElementById('insertBtn');
const deleteBtn = document.getElementById('deleteBtn');
const searchBtn = document.getElementById('searchBtn');
const undoBtn = document.getElementById('undoBtn');
const clearBtn = document.getElementById('clearBtn');
const statusElement = document.getElementById('status');
const operationCountElement = document.getElementById('operationCount');
const historyList = document.getElementById('historyList');
const currentOrderElement = document.getElementById('currentOrder');
const maxKeysElement = document.getElementById('maxKeys');
const maxChildrenElement = document.getElementById('maxChildren');

let operationCount = 0;

updateOrderInfo();
updateDisplay();
if (nodeValueInput) {
  nodeValueInput.focus();
}

setOrderBtn.addEventListener('click', handleSetOrder);
treeOrderInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    handleSetOrder();
  }
});

insertBtn.addEventListener('click', handleInsert);
deleteBtn.addEventListener('click', handleDelete);
searchBtn.addEventListener('click', handleSearch);
undoBtn.addEventListener('click', handleUndo);
clearBtn.addEventListener('click', handleClear);

nodeValueInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    handleInsert();
  }
});

function handleSetOrder() {
  const newOrder = parseInt(treeOrderInput.value, 10);

  if (Number.isNaN(newOrder) || newOrder < 3 || newOrder > 10) {
    updateStatus('Order must be a number between 3 and 10', 'error');
    return;
  }

  if (newOrder === bTree.order) {
    updateStatus(`Tree is already order ${newOrder}`, 'info');
    return;
  }

  // Warn if tree has data
  if (bTree.root) {
    if (!confirm(`Changing order will clear the current tree. Continue?`)) {
      return;
    }
  }

  try {
    bTree.setOrder(newOrder);
    operationCount = 0;
    updateOrderInfo();
    updateDisplay();
    updateStatus(`B-Tree order set to ${newOrder}`, 'success');
    historyList.innerHTML = '';
  } catch (error) {
    updateStatus(error.message, 'error');
  }
}

function updateOrderInfo() {
  currentOrderElement.textContent = bTree.order;
  maxKeysElement.textContent = bTree.maxKeys;
  maxChildrenElement.textContent = bTree.order;
}

function handleInsert() {
  const value = parseInt(nodeValueInput.value, 10);

  if (Number.isNaN(value)) {
    updateStatus('Please enter a valid number', 'error');
    return;
  }

  const existing = bTree.search(value);
  if (existing) {
    updateStatus(`Value ${value} already exists in the tree`, 'warning');
    return;
  }

  bTree.insert(value);
  operationCount += 1;

  const lastOp = bTree.operationHistory[bTree.operationHistory.length - 1];
  addToHistory(lastOp);

  updateDisplay();
  updateStatus(`Inserted ${value}`, 'success');

  nodeValueInput.value = '';
  nodeValueInput.focus();
}

function handleDelete() {
  const value = parseInt(nodeValueInput.value, 10);

  if (Number.isNaN(value)) {
    updateStatus('Please enter a valid number', 'error');
    return;
  }

  const existing = bTree.search(value);
  if (!existing) {
    updateStatus(`Value ${value} not found in the tree`, 'error');
    return;
  }

  const deleted = bTree.delete(value);
  if (deleted) {
    operationCount += 1;
    const lastOp = bTree.operationHistory[bTree.operationHistory.length - 1];
    addToHistory(lastOp);
    updateDisplay();
    updateStatus(`Deleted ${value}`, 'success');
  } else {
    updateStatus(`Failed to delete ${value}`, 'error');
  }

  nodeValueInput.value = '';
  nodeValueInput.focus();
}

function handleSearch() {
  const value = parseInt(nodeValueInput.value, 10);

  if (Number.isNaN(value)) {
    updateStatus('Please enter a valid number', 'error');
    return;
  }

  const result = bTree.search(value);

  if (result) {
    visualizer.highlightFound(value);
    updateDisplay();
    updateStatus(`Found ${value} in the tree`, 'success');
    addToHistory({ type: 'search', value });
    
    // Clear highlight after 2 seconds
    setTimeout(() => {
      visualizer.clearHighlights();
      updateDisplay();
    }, 2000);
  } else {
    updateStatus(`Value ${value} not found in the tree`, 'error');
  }

  nodeValueInput.value = '';
  nodeValueInput.focus();
}

function handleUndo() {
  if (bTree.operationHistory.length === 0) {
    updateStatus('No operations to undo', 'warning');
    return;
  }

  const undone = bTree.undo();

  if (undone) {
    operationCount = Math.max(0, operationCount - 1);
    updateDisplay();
    updateHistoryList();
    updateStatus('Last operation undone', 'success');
  }
}

function handleClear() {
  if (confirm('Are you sure you want to clear the entire tree?')) {
    bTree.clear();
    operationCount = 0;
    updateDisplay();
    updateStatus('Tree cleared', 'info');
    historyList.innerHTML = '';
  }
}

function updateDisplay() {
  visualizer.updateSize(bTree);
  visualizer.draw(bTree);
  undoBtn.disabled = bTree.operationHistory.length === 0;
  operationCountElement.textContent = operationCount;
  updateOrderInfo();
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

  const recentOps = bTree.operationHistory.slice(-10).reverse();

  recentOps.forEach((op) => {
    const item = document.createElement('div');
    item.className = `history-item ${op.type}`;

    let text = '';
    if (op.type === 'insert') {
      text = `Inserted ${op.value}`;
    } else if (op.type === 'delete') {
      text = `Deleted ${op.value}`;
    } else if (op.type === 'search') {
      text = `Searched for ${op.value}`;
    }

    const textSpan = document.createElement('span');
    textSpan.textContent = text;
    item.appendChild(textSpan);
    historyList.appendChild(item);
  });
}

