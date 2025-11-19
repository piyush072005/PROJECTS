// Initialize AVL Tree and Visualizer
const avlTree = new AVLTree();
const visualizer = new TreeVisualizer(document.getElementById('treeCanvas'));
const diagramGenerator = new TreeDiagramGenerator();

// DOM Elements
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

// State
let replaceMode = false;
let valueToReplace = null;
let operationCount = 0;

// Initialize
updateDisplay();
nodeValueInput.focus();

// Modal event listeners
closeModal.addEventListener('click', () => {
    explanationModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === explanationModal) {
        explanationModal.style.display = 'none';
    }
});

// Event Listeners
insertBtn.addEventListener('click', handleInsert);
deleteBtn.addEventListener('click', handleDelete);
findBtn.addEventListener('click', handleFind);
replaceBtn.addEventListener('click', handleReplace);
undoBtn.addEventListener('click', handleUndo);
clearBtn.addEventListener('click', handleClear);
confirmReplaceBtn.addEventListener('click', handleConfirmReplace);
cancelReplaceBtn.addEventListener('click', handleCancelReplace);

// Enter key support
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

// Insert handler
function handleInsert() {
    const value = parseInt(nodeValueInput.value);
    
    if (isNaN(value)) {
        updateStatus('Please enter a valid number', 'error');
        return;
    }

    if (avlTree.find(value)) {
        updateStatus(`Value ${value} already exists in the tree`, 'warning');
        return;
    }

    avlTree.insert(value);
    operationCount++;
    
    const lastOp = avlTree.operationHistory[avlTree.operationHistory.length - 1];
    addToHistory(lastOp);
    
    updateDisplay();
    const statusMsg = `Inserted ${value}${lastOp.rotation ? ' (Rotation: ' + lastOp.rotation + ')' : ''}`;
    updateStatus(statusMsg, 'success');
    
    // Show explanation if rotation occurred
    if (lastOp.rotation) {
        setTimeout(() => {
            showExplanation(lastOp);
        }, 500);
    }
    
    nodeValueInput.value = '';
    nodeValueInput.focus();
}

// Delete handler
function handleDelete() {
    const value = parseInt(nodeValueInput.value);
    
    if (isNaN(value)) {
        updateStatus('Please enter a valid number', 'error');
        return;
    }

    if (!avlTree.find(value)) {
        updateStatus(`Value ${value} not found in the tree`, 'error');
        return;
    }

    avlTree.delete(value);
    operationCount++;
    
    const lastOp = avlTree.operationHistory[avlTree.operationHistory.length - 1];
    addToHistory(lastOp);
    
    updateDisplay();
    const statusMsg = `Deleted ${value}${lastOp.rotation ? ' (Rotation: ' + lastOp.rotation + ')' : ''}`;
    updateStatus(statusMsg, 'success');
    
    // Show explanation if rotation occurred
    if (lastOp.rotation) {
        setTimeout(() => {
            showExplanation(lastOp);
        }, 500);
    }
    
    nodeValueInput.value = '';
    nodeValueInput.focus();
}

// Find handler
function handleFind() {
    const value = parseInt(nodeValueInput.value);
    
    if (isNaN(value)) {
        updateStatus('Please enter a valid number', 'error');
        return;
    }

    const node = avlTree.find(value);
    
    if (node) {
        visualizer.highlightFound(value);
        updateDisplay();
        updateStatus(`Found ${value} in the tree`, 'success');
        addToHistory({ type: 'find', value: value });
    } else {
        updateStatus(`Value ${value} not found in the tree`, 'error');
    }
    
    nodeValueInput.value = '';
    nodeValueInput.focus();
}

// Replace handler
function handleReplace() {
    const value = parseInt(nodeValueInput.value);
    
    if (isNaN(value)) {
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

// Confirm replace handler
function handleConfirmReplace() {
    if (!replaceMode || valueToReplace === null) {
        return;
    }

    const newValue = parseInt(replaceValueInput.value);
    
    if (isNaN(newValue)) {
        updateStatus('Please enter a valid new value', 'error');
        return;
    }

    if (avlTree.find(newValue)) {
        updateStatus(`Value ${newValue} already exists in the tree`, 'error');
        return;
    }

    avlTree.replace(valueToReplace, newValue);
    operationCount++;
    
    const lastOp = avlTree.operationHistory[avlTree.operationHistory.length - 1];
    addToHistory(lastOp);
    
    updateDisplay();
    updateStatus(`Replaced ${valueToReplace} with ${newValue}`, 'success');
    
    // Show explanation for replace operation
    setTimeout(() => {
        showExplanation(lastOp);
    }, 500);
    
    handleCancelReplace();
    nodeValueInput.focus();
}

// Cancel replace handler
function handleCancelReplace() {
    replaceMode = false;
    valueToReplace = null;
    replaceGroup.style.display = 'none';
    replaceValueInput.value = '';
    nodeValueInput.value = '';
}

// Undo handler
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

// Clear handler
function handleClear() {
    if (confirm('Are you sure you want to clear the entire tree?')) {
        avlTree.clear();
        operationCount = 0;
        updateDisplay();
        updateStatus('Tree cleared', 'info');
        historyList.innerHTML = '';
    }
}

// Update display
function updateDisplay() {
    visualizer.updateSize(avlTree);
    visualizer.draw(avlTree);
    undoBtn.disabled = avlTree.operationHistory.length === 0;
    operationCountElement.textContent = operationCount;
}

// Update status
function updateStatus(message, type = 'info') {
    statusElement.textContent = message;
    statusElement.className = type;
}

// Add to history
function addToHistory(operation) {
    updateHistoryList();
}

// Update history list
function updateHistoryList() {
    historyList.innerHTML = '';
    
    // Show last 10 operations
    const recentOps = avlTree.operationHistory.slice(-10).reverse();
    
    recentOps.forEach((op, index) => {
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
        
        // Make item clickable for explanation
        item.addEventListener('click', () => {
            showExplanation(op);
        });
        
        const textSpan = document.createElement('span');
        textSpan.textContent = text;
        item.appendChild(textSpan);
        
        historyList.appendChild(item);
    });
}

// Get explanation for an operation
function getExplanation(operation) {
    const explanationDiv = document.createElement('div');
    
    // Add full tree comparison at the top
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
                <li>The value was inserted following Binary Search Tree (BST) rules: smaller values go left, larger values go right.</li>
                <li>After insertion, the tree checked for balance violations.</li>
                <li>If the tree became unbalanced, a rotation was performed to restore balance.</li>
            </ul>
        `;
        
        if (operation.rotation) {
            const rotationDiv = getRotationExplanation(operation.rotation, operation.value, operation);
            section.appendChild(rotationDiv);
        } else {
            const resultP = document.createElement('p');
            resultP.innerHTML = `<strong>Result:</strong> The tree remained balanced after insertion. No rotation was needed.`;
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
            resultP.innerHTML = `<strong>Result:</strong> The tree remained balanced after deletion. No rotation was needed.`;
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
                <li>Started from the root node.</li>
                <li>Compared the search value with the current node.</li>
                <li>If equal, the node was found.</li>
                <li>If smaller, searched in the left subtree.</li>
                <li>If larger, searched in the right subtree.</li>
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
                <li>First, deleted the old value ${operation.oldValue} from the tree.</li>
                <li>Then, inserted the new value ${operation.newValue} into the tree.</li>
                <li>Each step may have triggered rotations to maintain balance.</li>
            </ul>
            <p><strong>Result:</strong> The replacement was completed successfully.</p>
        `;
        explanationDiv.appendChild(section);
    }
    
    return explanationDiv;
}

// Get detailed rotation explanation
function getRotationExplanation(rotationType, value, operation) {
    const rotationDiv = document.createElement('div');
    rotationDiv.className = 'rotation-steps';
    
    // Add before/after rotation diagrams
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
    switch(rotationType) {
        case 'Right Rotation':
            explanationHTML = `
                <h3>Right Rotation (Left-Left Case)</h3>
                <p><strong>Why this rotation?</strong> The tree became unbalanced with the left subtree being taller than the right subtree by more than 1 level.</p>
                <p><strong>When it happens:</strong> After inserting ${value}, the balance factor of a node became greater than 1, and the imbalance was in the left-left direction.</p>
                <p><strong>Steps:</strong></p>
                <ol>
                    <li><strong>Identify the unbalanced node:</strong> Found a node where left child's height - right child's height > 1</li>
                    <li><strong>Check the direction:</strong> The new node was inserted in the left child's left subtree</li>
                    <li><strong>Perform right rotation:</strong>
                        <ul>
                            <li>The left child becomes the new root</li>
                            <li>The original root becomes the right child of the new root</li>
                            <li>The new root's right subtree (if any) becomes the left subtree of the original root</li>
                        </ul>
                    </li>
                    <li><strong>Update heights:</strong> Recalculated heights of affected nodes</li>
                </ol>
                <p><strong>Result:</strong> The tree is now balanced, and the height is reduced by 1 level.</p>
            `;
            break;
            
        case 'Left Rotation':
            explanationHTML = `
                <h3>Left Rotation (Right-Right Case)</h3>
                <p><strong>Why this rotation?</strong> The tree became unbalanced with the right subtree being taller than the left subtree by more than 1 level.</p>
                <p><strong>When it happens:</strong> After inserting ${value}, the balance factor of a node became less than -1, and the imbalance was in the right-right direction.</p>
                <p><strong>Steps:</strong></p>
                <ol>
                    <li><strong>Identify the unbalanced node:</strong> Found a node where right child's height - left child's height > 1</li>
                    <li><strong>Check the direction:</strong> The new node was inserted in the right child's right subtree</li>
                    <li><strong>Perform left rotation:</strong>
                        <ul>
                            <li>The right child becomes the new root</li>
                            <li>The original root becomes the left child of the new root</li>
                            <li>The new root's left subtree (if any) becomes the right subtree of the original root</li>
                        </ul>
                    </li>
                    <li><strong>Update heights:</strong> Recalculated heights of affected nodes</li>
                </ol>
                <p><strong>Result:</strong> The tree is now balanced, and the height is reduced by 1 level.</p>
            `;
            break;
            
        case 'Left-Right Rotation':
            explanationHTML = `
                <h3>Left-Right Rotation (Left-Right Case)</h3>
                <p><strong>Why this rotation?</strong> The tree became unbalanced with the left subtree being taller, but the new node was inserted in the left child's right subtree.</p>
                <p><strong>When it happens:</strong> After inserting ${value}, the balance factor of a node became greater than 1, but the imbalance was in the left-right direction (not left-left).</p>
                <p><strong>Steps:</strong></p>
                <ol>
                    <li><strong>Identify the unbalanced node:</strong> Found a node where left child's height - right child's height > 1</li>
                    <li><strong>Check the direction:</strong> The new node was inserted in the left child's right subtree</li>
                    <li><strong>First rotation - Left:</strong>
                        <ul>
                            <li>Perform a left rotation on the left child</li>
                            <li>This converts the left-right case to a left-left case</li>
                        </ul>
                    </li>
                    <li><strong>Second rotation - Right:</strong>
                        <ul>
                            <li>Now perform a right rotation on the original unbalanced node</li>
                            <li>This restores balance to the tree</li>
                        </ul>
                    </li>
                    <li><strong>Update heights:</strong> Recalculated heights of all affected nodes</li>
                </ol>
                <p><strong>Result:</strong> The tree is now balanced. This is a double rotation that handles the zig-zag pattern.</p>
            `;
            break;
            
        case 'Right-Left Rotation':
            explanationHTML = `
                <h3>Right-Left Rotation (Right-Left Case)</h3>
                <p><strong>Why this rotation?</strong> The tree became unbalanced with the right subtree being taller, but the new node was inserted in the right child's left subtree.</p>
                <p><strong>When it happens:</strong> After inserting ${value}, the balance factor of a node became less than -1, but the imbalance was in the right-left direction (not right-right).</p>
                <p><strong>Steps:</strong></p>
                <ol>
                    <li><strong>Identify the unbalanced node:</strong> Found a node where right child's height - left child's height > 1</li>
                    <li><strong>Check the direction:</strong> The new node was inserted in the right child's left subtree</li>
                    <li><strong>First rotation - Right:</strong>
                        <ul>
                            <li>Perform a right rotation on the right child</li>
                            <li>This converts the right-left case to a right-right case</li>
                        </ul>
                    </li>
                    <li><strong>Second rotation - Left:</strong>
                        <ul>
                            <li>Now perform a left rotation on the original unbalanced node</li>
                            <li>This restores balance to the tree</li>
                        </ul>
                    </li>
                    <li><strong>Update heights:</strong> Recalculated heights of all affected nodes</li>
                </ol>
                <p><strong>Result:</strong> The tree is now balanced. This is a double rotation that handles the zig-zag pattern.</p>
            `;
            break;
    }
    
    rotationDiv.innerHTML += explanationHTML;
    return rotationDiv;
}

// Show explanation modal
function showExplanation(operation) {
    explanationTitle.textContent = `${operation.type.charAt(0).toUpperCase() + operation.type.slice(1)} Operation Explanation`;
    explanationContent.innerHTML = '';
    
    // Get explanation (returns a DOM element)
    const explanationElement = getExplanation(operation);
    explanationContent.appendChild(explanationElement);
    
    explanationModal.style.display = 'block';
}

