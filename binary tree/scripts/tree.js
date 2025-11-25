class TreeNode {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
  }
}

const form = document.getElementById('order-form');
const statusMessage = document.getElementById('status-message');
const missingOrderCard = document.getElementById('missing-order-card');
const missingOrderTitle = document.getElementById('missing-order-title');
const missingOrderValues = document.getElementById('missing-order-values');
const treeVisual = document.getElementById('tree-visual');
const treeExplanation = document.getElementById('tree-explanation');
const resetButton = document.getElementById('reset-btn');

form.addEventListener('submit', (event) => {
  event.preventDefault();
  clearOutputs();

  const inorder = parseSequence(
    document.getElementById('inorder-input').value.trim()
  );
  const preorder = parseSequence(
    document.getElementById('preorder-input').value.trim()
  );
  const postorder = parseSequence(
    document.getElementById('postorder-input').value.trim()
  );

  const provided = [
    inorder.length ? 'inorder' : null,
    preorder.length ? 'preorder' : null,
    postorder.length ? 'postorder' : null,
  ].filter(Boolean);

  if (provided.length !== 2) {
    showStatus(
      'Please fill exactly two traversal fields before building the tree.',
      true
    );
    return;
  }

  const inputs = { inorder, preorder, postorder };
  const missingOrder = ['inorder', 'preorder', 'postorder'].find(
    (order) => !provided.includes(order)
  );

  try {
    validateSequences(inputs, provided);
    const root = buildTree(inputs, provided);
    const traversals = {
      inorder: inorder.length ? inorder : getInorder(root),
      preorder: preorder.length ? preorder : getPreorder(root),
      postorder: postorder.length ? postorder : getPostorder(root),
    };

    displayMissingOrder(missingOrder, traversals[missingOrder]);
    renderTree(root);
    explainTree(root, missingOrder, traversals);
    showStatus('Tree generated successfully.', false);
  } catch (error) {
    showStatus(error.message, true);
    renderTree(null);
    treeExplanation.innerHTML =
      '<p class="placeholder">Fix the input to see the explanation.</p>';
  }
});

resetButton.addEventListener('click', () => {
  form.reset();
  clearOutputs();
  showStatus('Inputs cleared.', false);
});

function clearOutputs() {
  statusMessage.classList.remove('visible', 'error');
  missingOrderCard.hidden = true;
  treeVisual.innerHTML =
    '<p class="placeholder">Build a tree to see the visualization.</p>';
  treeExplanation.innerHTML =
    '<p class="placeholder">Once the tree is created, a structural walkthrough appears here.</p>';
}

function parseSequence(raw) {
  if (!raw) return [];
  return raw
    .split(/[\s,]+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function validateSequences(inputs, provided) {
  const [a, b] = provided;
  const seqA = inputs[a];
  const seqB = inputs[b];

  if (seqA.length !== seqB.length) {
    throw new Error('Provided traversals must contain the same number of nodes.');
  }

  if (!haveSameMultiset(seqA, seqB)) {
    throw new Error('Traversal inputs must reference the same node labels.');
  }

  const containsDuplicates =
    new Set(seqA).size !== seqA.length || new Set(seqB).size !== seqB.length;

  if (containsDuplicates) {
    throw new Error('Duplicate node labels detected. Please ensure labels are unique.');
  }
}

function haveSameMultiset(arrA, arrB) {
  const counts = new Map();
  arrA.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  for (const value of arrB) {
    if (!counts.has(value)) return false;
    const next = counts.get(value) - 1;
    if (next === 0) counts.delete(value);
    else counts.set(value, next);
  }
  return counts.size === 0;
}

function buildTree(inputs, provided) {
  const set = new Set(provided);

  if (set.has('preorder') && set.has('inorder')) {
    return buildFromPreIn(inputs.preorder, inputs.inorder);
  }
  if (set.has('postorder') && set.has('inorder')) {
    return buildFromPostIn(inputs.postorder, inputs.inorder);
  }
  if (set.has('preorder') && set.has('postorder')) {
    return buildFromPrePost(inputs.preorder, inputs.postorder);
  }
  throw new Error('Unsupported traversal combination.');
}

function buildFromPreIn(preorder, inorder) {
  const position = indexMap(inorder);
  let preIndex = 0;

  function helper(left, right) {
    if (left > right) return null;
    const rootValue = preorder[preIndex++];
    const pivot = position.get(rootValue);
    if (pivot === undefined) {
      throw new Error(
        'Traversal mismatch detected while processing preorder + inorder.'
      );
    }
    const node = new TreeNode(rootValue);
    node.left = helper(left, pivot - 1);
    node.right = helper(pivot + 1, right);
    return node;
  }

  return helper(0, inorder.length - 1);
}

function buildFromPostIn(postorder, inorder) {
  const position = indexMap(inorder);
  let postIndex = postorder.length - 1;

  function helper(left, right) {
    if (left > right) return null;
    const rootValue = postorder[postIndex--];
    const pivot = position.get(rootValue);
    if (pivot === undefined) {
      throw new Error(
        'Traversal mismatch detected while processing postorder + inorder.'
      );
    }
    const node = new TreeNode(rootValue);
    node.right = helper(pivot + 1, right);
    node.left = helper(left, pivot - 1);
    return node;
  }

  return helper(0, inorder.length - 1);
}

function buildFromPrePost(preorder, postorder) {
  if (preorder.length !== postorder.length) {
    throw new Error('Preorder and postorder traversals must be the same length.');
  }

  const position = indexMap(postorder);
  let preIndex = 0;

  function helper(left, right) {
    if (left > right) return null;
    const rootValue = preorder[preIndex++];
    const node = new TreeNode(rootValue);

    if (left === right) {
      return node;
    }

    const nextValue = preorder[preIndex];
    if (nextValue === undefined) {
      throw new Error(
        'Traversal mismatch detected while processing preorder + postorder.'
      );
    }
    const pivot = position.get(nextValue);
    if (pivot === undefined || pivot > right - 1) {
      throw new Error(
        'Invalid ordering: ensure the tree is a full binary tree when using preorder + postorder.'
      );
    }

    node.left = helper(left, pivot);
    node.right = helper(pivot + 1, right - 1);
    return node;
  }

  return helper(0, postorder.length - 1);
}

function indexMap(sequence) {
  return new Map(sequence.map((value, index) => [value, index]));
}

function getInorder(root) {
  const out = [];
  (function traverse(node) {
    if (!node) return;
    traverse(node.left);
    out.push(node.value);
    traverse(node.right);
  })(root);
  return out;
}

function getPreorder(root) {
  const out = [];
  (function traverse(node) {
    if (!node) return;
    out.push(node.value);
    traverse(node.left);
    traverse(node.right);
  })(root);
  return out;
}

function getPostorder(root) {
  const out = [];
  (function traverse(node) {
    if (!node) return;
    traverse(node.left);
    traverse(node.right);
    out.push(node.value);
  })(root);
  return out;
}

function displayMissingOrder(label, values) {
  missingOrderCard.hidden = false;
  missingOrderTitle.textContent = `Generated ${label} traversal`;
  missingOrderValues.textContent = values.join(', ');
}

function showStatus(message, isError) {
  statusMessage.textContent = message;
  statusMessage.classList.add('visible');
  statusMessage.classList.toggle('error', Boolean(isError));
}

function renderTree(root) {
  treeVisual.innerHTML = '';
  if (!root) {
    treeVisual.innerHTML =
      '<p class="placeholder">Unable to draw the tree. Please review the inputs.</p>';
    return;
  }

  const layout = buildLayout(root);
  const nodes = Array.from(layout.values());
  const nodeCount = nodes.length;
  const depth = Math.max(...nodes.map((meta) => meta.depth), 0);
  const gapX = 120;
  const gapY = 100;
  const width = Math.max(420, nodeCount * gapX);
  const height = Math.max(360, (depth + 1) * gapY + 80);

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('tree-svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

  layout.forEach((meta, node) => {
    if (node.left) {
      const child = layout.get(node.left);
      svg.appendChild(createLink(meta, child));
    }
    if (node.right) {
      const child = layout.get(node.right);
      svg.appendChild(createLink(meta, child));
    }
  });

  layout.forEach((meta) => {
    svg.appendChild(createNode(meta));
  });

  treeVisual.appendChild(svg);
}

function buildLayout(root) {
  const layout = new Map();
  let x = 0;
  let maxDepth = 0;

  (function assign(node, depth) {
    if (!node) return;
    assign(node.left, depth + 1);
    layout.set(node, {
      node,
      depth,
      x: x++,
    });
    maxDepth = Math.max(maxDepth, depth);
    assign(node.right, depth + 1);
  })(root, 0);

  const gapX = 120;
  const gapY = 100;

  layout.forEach((meta) => {
    meta.drawX = (meta.x + 1) * gapX;
    meta.drawY = (meta.depth + 1) * gapY;
  });

  layout.maxDepth = maxDepth;
  return layout;
}

function createLink(parentMeta, childMeta) {
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', parentMeta.drawX);
  line.setAttribute('y1', parentMeta.drawY);
  line.setAttribute('x2', childMeta.drawX);
  line.setAttribute('y2', childMeta.drawY);
  line.setAttribute('class', 'tree-link');
  return line;
}

function createNode(meta) {
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', meta.drawX);
  circle.setAttribute('cy', meta.drawY);
  circle.setAttribute('r', 28);
  circle.setAttribute('class', 'tree-node');

  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', meta.drawX);
  text.setAttribute('y', meta.drawY + 4);
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('class', 'tree-text');
  text.textContent = meta.node ? meta.node.value : meta.value;

  group.append(circle, text);
  return group;
}

function explainTree(root, missingOrder, traversals) {
  if (!root) {
    treeExplanation.innerHTML =
      '<p class="placeholder">Unable to explain an invalid tree.</p>';
    return;
  }

  const nodes = [];
  (function collect(node) {
    if (!node) return;
    nodes.push(node);
    collect(node.left);
    collect(node.right);
  })(root);

  const listItems = nodes
    .map((node) => {
      const left = node.left ? node.left.value : '—';
      const right = node.right ? node.right.value : '—';
      const classification = !node.left && !node.right ? 'Leaf' : 'Internal node';
      return `<li><span class="node-name">${node.value}</span> · left: ${left} · right: ${right} · ${classification}</li>`;
    })
    .join('');

  const note =
    missingOrder === 'inorder' && traversals.inorder.length === 0
      ? '<p><strong>Note:</strong> Preorder + postorder uniquely define a tree only if it is a full binary tree. Ensure every internal node has two children.</p>'
      : '';

  treeExplanation.innerHTML = `
    <p class="explain-intro">Tree recreated from the provided ${
      missingOrder === 'inorder' ? 'preorder & postorder' : 'traversal pair'
    }.</p>
    <p class="explain-root">Root node: <strong>${root.value}</strong></p>
    <p class="explain-order">Computed ${missingOrder} traversal: <strong>${traversals[
      missingOrder
    ].join(', ')}</strong></p>
    ${note}
    <ul class="node-list">${listItems}</ul>
  `;
}

