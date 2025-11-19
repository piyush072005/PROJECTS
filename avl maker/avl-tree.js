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

    // Get height of node
    getHeight(node) {
        if (!node) return 0;
        return node.height;
    }

    // Get balance factor
    getBalance(node) {
        if (!node) return 0;
        return this.getHeight(node.left) - this.getHeight(node.right);
    }

    // Update height of node
    updateHeight(node) {
        if (!node) return;
        node.height = Math.max(
            this.getHeight(node.left),
            this.getHeight(node.right)
        ) + 1;
    }

    // Right rotation
    rightRotate(y) {
        const x = y.left;
        const T2 = x.right;

        // Perform rotation
        x.right = y;
        y.left = T2;

        // Update heights
        this.updateHeight(y);
        this.updateHeight(x);

        return x;
    }

    // Left rotation
    leftRotate(x) {
        const y = x.right;
        const T2 = y.left;

        // Perform rotation
        y.left = x;
        x.right = T2;

        // Update heights
        this.updateHeight(x);
        this.updateHeight(y);

        return y;
    }

    // Insert a value
    insert(value) {
        const beforeState = this.serialize();
        this.root = this._insert(this.root, value);
        const rotation = this.getLastRotation();
        this.operationHistory.push({
            type: 'insert',
            value: value,
            rotation: rotation,
            beforeState: beforeState,
            afterState: this.serialize()
        });
        return this.root;
    }

    _insert(node, value) {
        // Perform normal BST insert
        if (!node) {
            return new AVLNode(value);
        }

        if (value < node.value) {
            node.left = this._insert(node.left, value);
        } else if (value > node.value) {
            node.right = this._insert(node.right, value);
        } else {
            // Duplicate values not allowed
            return node;
        }

        // Update height
        this.updateHeight(node);

        // Get balance factor
        const balance = this.getBalance(node);

        // Left Left Case (Right Rotation)
        if (balance > 1 && value < node.left.value) {
            this.recordRotation('Right Rotation');
            return this.rightRotate(node);
        }

        // Right Right Case (Left Rotation)
        if (balance < -1 && value > node.right.value) {
            this.recordRotation('Left Rotation');
            return this.leftRotate(node);
        }

        // Left Right Case (Left-Right Rotation)
        if (balance > 1 && value > node.left.value) {
            this.recordRotation('Left-Right Rotation');
            node.left = this.leftRotate(node.left);
            return this.rightRotate(node);
        }

        // Right Left Case (Right-Left Rotation)
        if (balance < -1 && value < node.right.value) {
            this.recordRotation('Right-Left Rotation');
            node.right = this.rightRotate(node.right);
            return this.leftRotate(node);
        }

        return node;
    }

    // Delete a value
    delete(value) {
        const beforeState = this.serialize();
        this.root = this._delete(this.root, value);
        const rotation = this.getLastRotation();
        this.operationHistory.push({
            type: 'delete',
            value: value,
            rotation: rotation,
            beforeState: beforeState,
            afterState: this.serialize()
        });
        return this.root;
    }

    _delete(node, value) {
        // Standard BST delete
        if (!node) {
            return null;
        }

        if (value < node.value) {
            node.left = this._delete(node.left, value);
        } else if (value > node.value) {
            node.right = this._delete(node.right, value);
        } else {
            // Node to be deleted found
            if (!node.left) {
                return node.right;
            } else if (!node.right) {
                return node.left;
            }

            // Node with two children: get inorder successor
            const temp = this.getMinValueNode(node.right);
            node.value = temp.value;
            node.right = this._delete(node.right, temp.value);
        }

        // Update height
        this.updateHeight(node);

        // Get balance factor
        const balance = this.getBalance(node);

        // Left Left Case (Right Rotation)
        if (balance > 1 && this.getBalance(node.left) >= 0) {
            this.recordRotation('Right Rotation');
            return this.rightRotate(node);
        }

        // Left Right Case (Left-Right Rotation)
        if (balance > 1 && this.getBalance(node.left) < 0) {
            this.recordRotation('Left-Right Rotation');
            node.left = this.leftRotate(node.left);
            return this.rightRotate(node);
        }

        // Right Right Case (Left Rotation)
        if (balance < -1 && this.getBalance(node.right) <= 0) {
            this.recordRotation('Left Rotation');
            return this.leftRotate(node);
        }

        // Right Left Case (Right-Left Rotation)
        if (balance < -1 && this.getBalance(node.right) > 0) {
            this.recordRotation('Right-Left Rotation');
            node.right = this.rightRotate(node.right);
            return this.leftRotate(node);
        }

        return node;
    }

    // Get minimum value node
    getMinValueNode(node) {
        let current = node;
        while (current.left) {
            current = current.left;
        }
        return current;
    }

    // Find a value
    find(value) {
        return this._find(this.root, value);
    }

    _find(node, value) {
        if (!node) {
            return null;
        }

        if (value === node.value) {
            return node;
        } else if (value < node.value) {
            return this._find(node.left, value);
        } else {
            return this._find(node.right, value);
        }
    }

    // Replace a value (delete old, insert new)
    replace(oldValue, newValue) {
        const beforeState = this.serialize();
        if (this.find(oldValue)) {
            this.root = this._delete(this.root, oldValue);
            this.root = this._insert(this.root, newValue);
            this.operationHistory.push({
                type: 'replace',
                oldValue: oldValue,
                newValue: newValue,
                beforeState: beforeState,
                afterState: this.serialize()
            });
        }
        return this.root;
    }

    // Undo last operation
    undo() {
        if (this.operationHistory.length === 0) {
            return false;
        }

        const lastOp = this.operationHistory.pop();
        this.root = this.deserialize(lastOp.beforeState);
        return true;
    }

    // Serialize tree for history
    serialize() {
        return JSON.stringify(this._serializeNode(this.root));
    }

    _serializeNode(node) {
        if (!node) return null;
        return {
            value: node.value,
            height: node.height,
            left: this._serializeNode(node.left),
            right: this._serializeNode(node.right)
        };
    }

    // Deserialize tree from history
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

    // Rotation tracking
    lastRotation = null;

    recordRotation(type) {
        this.lastRotation = type;
    }

    getLastRotation() {
        const rotation = this.lastRotation;
        this.lastRotation = null;
        return rotation;
    }

    // Clear tree
    clear() {
        this.root = null;
        this.operationHistory = [];
    }

    // Get tree structure for visualization
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
            right: this._getNodeStructure(node.right)
        };
    }
}

