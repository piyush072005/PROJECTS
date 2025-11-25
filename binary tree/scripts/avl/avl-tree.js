class AVLNode {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
    this.height = 1;
  }
}

class AVLTree {
  constructor() {
    this.root = null;
    this.operationHistory = [];
  }

  getHeight(node) {
    if (!node) return 0;
    return node.height;
  }

  getBalance(node) {
    if (!node) return 0;
    return this.getHeight(node.left) - this.getHeight(node.right);
  }

  updateHeight(node) {
    if (!node) return;
    node.height = Math.max(this.getHeight(node.left), this.getHeight(node.right)) + 1;
  }

  rightRotate(y) {
    const x = y.left;
    const T2 = x.right;

    x.right = y;
    y.left = T2;

    this.updateHeight(y);
    this.updateHeight(x);

    return x;
  }

  leftRotate(x) {
    const y = x.right;
    const T2 = y.left;

    y.left = x;
    x.right = T2;

    this.updateHeight(x);
    this.updateHeight(y);

    return y;
  }

  insert(value) {
    const beforeState = this.serialize();
    this.root = this._insert(this.root, value);
    const rotation = this.getLastRotation();
    this.operationHistory.push({
      type: 'insert',
      value,
      rotation,
      beforeState,
      afterState: this.serialize(),
    });
    return this.root;
  }

  _insert(node, value) {
    if (!node) {
      return new AVLNode(value);
    }

    if (value < node.value) {
      node.left = this._insert(node.left, value);
    } else if (value > node.value) {
      node.right = this._insert(node.right, value);
    } else {
      return node;
    }

    this.updateHeight(node);

    const balance = this.getBalance(node);

    if (balance > 1 && value < node.left.value) {
      this.recordRotation('Right Rotation');
      return this.rightRotate(node);
    }

    if (balance < -1 && value > node.right.value) {
      this.recordRotation('Left Rotation');
      return this.leftRotate(node);
    }

    if (balance > 1 && value > node.left.value) {
      this.recordRotation('Left-Right Rotation');
      node.left = this.leftRotate(node.left);
      return this.rightRotate(node);
    }

    if (balance < -1 && value < node.right.value) {
      this.recordRotation('Right-Left Rotation');
      node.right = this.rightRotate(node.right);
      return this.leftRotate(node);
    }

    return node;
  }

  delete(value) {
    const beforeState = this.serialize();
    this.root = this._delete(this.root, value);
    const rotation = this.getLastRotation();
    this.operationHistory.push({
      type: 'delete',
      value,
      rotation,
      beforeState,
      afterState: this.serialize(),
    });
    return this.root;
  }

  _delete(node, value) {
    if (!node) {
      return null;
    }

    if (value < node.value) {
      node.left = this._delete(node.left, value);
    } else if (value > node.value) {
      node.right = this._delete(node.right, value);
    } else {
      if (!node.left) {
        return node.right;
      }
      if (!node.right) {
        return node.left;
      }

      const temp = this.getMinValueNode(node.right);
      node.value = temp.value;
      node.right = this._delete(node.right, temp.value);
    }

    this.updateHeight(node);
    const balance = this.getBalance(node);

    if (balance > 1 && this.getBalance(node.left) >= 0) {
      this.recordRotation('Right Rotation');
      return this.rightRotate(node);
    }

    if (balance > 1 && this.getBalance(node.left) < 0) {
      this.recordRotation('Left-Right Rotation');
      node.left = this.leftRotate(node.left);
      return this.rightRotate(node);
    }

    if (balance < -1 && this.getBalance(node.right) <= 0) {
      this.recordRotation('Left Rotation');
      return this.leftRotate(node);
    }

    if (balance < -1 && this.getBalance(node.right) > 0) {
      this.recordRotation('Right-Left Rotation');
      node.right = this.rightRotate(node.right);
      return this.leftRotate(node);
    }

    return node;
  }

  getMinValueNode(node) {
    let current = node;
    while (current.left) {
      current = current.left;
    }
    return current;
  }

  find(value) {
    return this._find(this.root, value);
  }

  _find(node, value) {
    if (!node) {
      return null;
    }

    if (value === node.value) {
      return node;
    }
    if (value < node.value) {
      return this._find(node.left, value);
    }
    return this._find(node.right, value);
  }

  replace(oldValue, newValue) {
    const beforeState = this.serialize();
    if (this.find(oldValue)) {
      this.root = this._delete(this.root, oldValue);
      this.root = this._insert(this.root, newValue);
      this.operationHistory.push({
        type: 'replace',
        oldValue,
        newValue,
        beforeState,
        afterState: this.serialize(),
      });
    }
    return this.root;
  }

  undo() {
    if (this.operationHistory.length === 0) {
      return false;
    }

    const lastOp = this.operationHistory.pop();
    this.root = this.deserialize(lastOp.beforeState);
    return true;
  }

  serialize() {
    return JSON.stringify(this._serializeNode(this.root));
  }

  _serializeNode(node) {
    if (!node) return null;
    return {
      value: node.value,
      height: node.height,
      left: this._serializeNode(node.left),
      right: this._serializeNode(node.right),
    };
  }

  deserialize(data) {
    const obj = JSON.parse(data);
    return this._deserializeNode(obj);
  }

  _deserializeNode(obj) {
    if (!obj) return null;
    const node = new AVLNode(obj.value);
    node.height = obj.height;
    node.left = this._deserializeNode(obj.left);
    node.right = this._deserializeNode(obj.right);
    return node;
  }

  lastRotation = null;

  recordRotation(type) {
    this.lastRotation = type;
  }

  getLastRotation() {
    const rotation = this.lastRotation;
    this.lastRotation = null;
    return rotation;
  }

  clear() {
    this.root = null;
    this.operationHistory = [];
  }

  getTreeStructure() {
    return this._getNodeStructure(this.root);
  }

  _getNodeStructure(node) {
    if (!node) return null;
    return {
      value: node.value,
      height: node.height,
      balance: this.getBalance(node),
      left: this._getNodeStructure(node.left),
      right: this._getNodeStructure(node.right),
    };
  }
}

