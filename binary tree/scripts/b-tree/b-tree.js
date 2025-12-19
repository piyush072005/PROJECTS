/**
 * B-Tree Implementation (Configurable Order)
 * A B-Tree of order m has:
 * - At most m children
 * - At least ⌈m/2⌉ children (except root)
 * - At most m-1 keys per node
 * - At least ⌈m/2⌉ - 1 keys per node (except root)
 */

class BTreeNode {
  constructor(isLeaf = true, maxKeys = 2) {
    this.keys = []; // Array of keys (values)
    this.children = []; // Array of child nodes
    this.isLeaf = isLeaf;
    this.parent = null;
    this.maxKeys = maxKeys; // Store max keys for this node
  }

  getKeyCount() {
    return this.keys.length;
  }

  isFull() {
    return this.keys.length >= this.maxKeys;
  }

  insertKey(key) {
    // Insert key in sorted order
    let i = 0;
    while (i < this.keys.length && this.keys[i] < key) {
      i++;
    }
    this.keys.splice(i, 0, key);
  }

  removeKey(key) {
    const index = this.keys.indexOf(key);
    if (index !== -1) {
      this.keys.splice(index, 1);
      return true;
    }
    return false;
  }
}

class BTree {
  constructor(order = 3) {
    if (order < 3) {
      throw new Error('B-Tree order must be at least 3');
    }
    this.root = null;
    this.order = order;
    this.minKeys = Math.ceil(order / 2) - 1;
    this.maxKeys = order - 1;
    this.operationHistory = [];
  }

  setOrder(newOrder) {
    if (newOrder < 3) {
      throw new Error('B-Tree order must be at least 3');
    }
    const oldOrder = this.order;
    this.order = newOrder;
    this.minKeys = Math.ceil(newOrder / 2) - 1;
    this.maxKeys = newOrder - 1;
    
    // If tree exists, we need to rebuild it with new order
    // For simplicity, we'll clear the tree when order changes
    // In a production system, you might want to rebuild the tree
    if (this.root) {
      this.clear();
    }
    
    return true;
  }

  search(key) {
    return this._search(this.root, key);
  }

  _search(node, key) {
    if (!node) return null;

    let i = 0;
    while (i < node.keys.length && key > node.keys[i]) {
      i++;
    }

    if (i < node.keys.length && key === node.keys[i]) {
      return { node, index: i };
    }

    if (node.isLeaf) {
      return null;
    }

    return this._search(node.children[i], key);
  }

  insert(key) {
    const beforeState = this.serialize();
    
    if (!this.root) {
      this.root = new BTreeNode(true, this.maxKeys);
      this.root.insertKey(key);
    } else {
      if (this.root.isFull()) {
        // Root is full, need to split
        const newRoot = new BTreeNode(false, this.maxKeys);
        newRoot.children.push(this.root);
        this.root.parent = newRoot;
        this.root = newRoot;
        this._splitChild(this.root, 0);
      }
      this._insertNonFull(this.root, key);
    }

    const afterState = this.serialize();
    this.operationHistory.push({
      type: 'insert',
      value: key,
      beforeState,
      afterState,
    });

    return this.root;
  }

  _insertNonFull(node, key) {
    let i = node.keys.length - 1;

    if (node.isLeaf) {
      // Insert into leaf
      node.insertKey(key);
    } else {
      // Find child to insert into
      while (i >= 0 && key < node.keys[i]) {
        i--;
      }
      i++;

      if (node.children[i].isFull()) {
        this._splitChild(node, i);
        if (key > node.keys[i]) {
          i++;
        }
      }
      this._insertNonFull(node.children[i], key);
    }
  }

  _createNode(isLeaf) {
    return new BTreeNode(isLeaf, this.maxKeys);
  }

  _splitChild(parent, childIndex) {
    const fullChild = parent.children[childIndex];
    const newChild = this._createNode(fullChild.isLeaf);
    newChild.parent = parent;

    // Calculate split point (middle key index)
    const middleIndex = Math.floor(fullChild.keys.length / 2);
    const middleKey = fullChild.keys[middleIndex];
    
    // Move middle key to parent
    parent.insertKey(middleKey);

    // Move keys after middle to new child
    newChild.keys = fullChild.keys.slice(middleIndex + 1);
    fullChild.keys = fullChild.keys.slice(0, middleIndex);

    // Move children if not leaf
    if (!fullChild.isLeaf) {
      const childSplitIndex = middleIndex + 1;
      newChild.children = fullChild.children.slice(childSplitIndex);
      fullChild.children = fullChild.children.slice(0, childSplitIndex);
      newChild.children.forEach(child => {
        if (child) child.parent = newChild;
      });
    }

    // Insert new child into parent
    parent.children.splice(childIndex + 1, 0, newChild);
  }

  delete(key) {
    const beforeState = this.serialize();
    const result = this._delete(this.root, key);
    const afterState = this.serialize();

    if (result) {
      this.operationHistory.push({
        type: 'delete',
        value: key,
        beforeState,
        afterState,
      });
    }

    // If root has no keys but has children, make first child the new root
    if (this.root && this.root.keys.length === 0 && this.root.children.length > 0) {
      this.root = this.root.children[0];
      this.root.parent = null;
    }

    return result;
  }

  _delete(node, key) {
    if (!node) return false;

    let i = 0;
    while (i < node.keys.length && key > node.keys[i]) {
      i++;
    }

    if (i < node.keys.length && key === node.keys[i]) {
      // Key found in this node
      if (node.isLeaf) {
        // Case 1: Key is in leaf
        node.removeKey(key);
        return true;
      } else {
        // Case 2: Key is in internal node
        // Replace with predecessor or successor
        const leftChild = node.children[i];
        const rightChild = node.children[i + 1];

        if (leftChild.keys.length > this.minKeys) {
          // Replace with predecessor
          const predecessor = this._getMaxKey(leftChild);
          node.keys[i] = predecessor;
          return this._delete(leftChild, predecessor);
        } else if (rightChild.keys.length > this.minKeys) {
          // Replace with successor
          const successor = this._getMinKey(rightChild);
          node.keys[i] = successor;
          return this._delete(rightChild, successor);
        } else {
          // Merge children
          this._mergeChildren(node, i);
          return this._delete(leftChild, key);
        }
      }
    } else {
      // Key not in this node, search in child
      if (node.isLeaf) {
        return false; // Key not found
      }

      let child = node.children[i];
      
      // Ensure child has at least minKeys + 1 keys before deletion
      if (child.keys.length <= this.minKeys) {
        // Borrow or merge
        if (i > 0 && node.children[i - 1].keys.length > this.minKeys) {
          // Borrow from left sibling
          this._borrowFromLeft(node, i);
        } else if (i < node.children.length - 1 && node.children[i + 1].keys.length > this.minKeys) {
          // Borrow from right sibling
          this._borrowFromRight(node, i);
        } else {
          // Merge with sibling
          if (i > 0) {
            this._mergeChildren(node, i - 1);
            child = node.children[i - 1];
          } else {
            this._mergeChildren(node, i);
          }
        }
      }

      return this._delete(child, key);
    }
  }

  _getMinKey(node) {
    while (!node.isLeaf) {
      node = node.children[0];
    }
    return node.keys[0];
  }

  _getMaxKey(node) {
    while (!node.isLeaf) {
      node = node.children[node.children.length - 1];
    }
    return node.keys[node.keys.length - 1];
  }

  _borrowFromLeft(parent, childIndex) {
    const child = parent.children[childIndex];
    const leftSibling = parent.children[childIndex - 1];

    // Move key from parent to child
    child.insertKey(parent.keys[childIndex - 1]);
    
    // Move key from left sibling to parent
    parent.keys[childIndex - 1] = leftSibling.keys[leftSibling.keys.length - 1];
    leftSibling.keys.pop();

    // Move child pointer if not leaf
    if (!child.isLeaf) {
      child.children.unshift(leftSibling.children[leftSibling.children.length - 1]);
      leftSibling.children.pop();
      child.children[0].parent = child;
    }
  }

  _borrowFromRight(parent, childIndex) {
    const child = parent.children[childIndex];
    const rightSibling = parent.children[childIndex + 1];

    // Move key from parent to child
    child.insertKey(parent.keys[childIndex]);
    
    // Move key from right sibling to parent
    parent.keys[childIndex] = rightSibling.keys[0];
    rightSibling.keys.shift();

    // Move child pointer if not leaf
    if (!child.isLeaf) {
      child.children.push(rightSibling.children[0]);
      rightSibling.children.shift();
      child.children[child.children.length - 1].parent = child;
    }
  }

  _mergeChildren(parent, childIndex) {
    const leftChild = parent.children[childIndex];
    const rightChild = parent.children[childIndex + 1];
    const keyFromParent = parent.keys[childIndex];

    // Move key from parent to left child
    leftChild.insertKey(keyFromParent);

    // Move all keys from right child to left child
    rightChild.keys.forEach(key => leftChild.insertKey(key));

    // Move all children from right child to left child
    if (!leftChild.isLeaf) {
      rightChild.children.forEach(child => {
        leftChild.children.push(child);
        child.parent = leftChild;
      });
    }

    // Remove key and right child from parent
    parent.removeKey(keyFromParent);
    parent.children.splice(childIndex + 1, 1);
  }

  serialize() {
    if (!this.root) return null;
    return this._serializeNode(this.root);
  }

  _serializeNode(node) {
    if (!node) return null;
    return {
      keys: [...node.keys],
      isLeaf: node.isLeaf,
      children: node.children.map(child => this._serializeNode(child))
    };
  }

  clear() {
    this.root = null;
    this.operationHistory = [];
  }

  undo() {
    if (this.operationHistory.length === 0) return false;
    
    const lastOp = this.operationHistory.pop();
    if (lastOp.beforeState === null) {
      this.root = null;
    } else {
      this.root = this._deserializeNode(lastOp.beforeState);
    }
    return true;
  }

  _deserializeNode(data) {
    if (!data) return null;
    const node = this._createNode(data.isLeaf);
    node.keys = [...data.keys];
    node.children = data.children.map(child => {
      const childNode = this._deserializeNode(child);
      if (childNode) childNode.parent = node;
      return childNode;
    });
    return node;
  }

  getTreeStructure() {
    return this.root;
  }
}

