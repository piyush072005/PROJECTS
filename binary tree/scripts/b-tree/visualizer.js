/**
 * B-Tree Visualizer
 * Renders B-Tree nodes as rectangles with multiple keys
 */

class BTreeVisualizer {
  constructor(svgElement) {
    this.svg = svgElement;
    this.nodeWidth = 80;
    this.nodeHeight = 50;
    this.horizontalSpacing = 120;
    this.verticalSpacing = 100;
    this.highlightedKeys = new Set();
    this.foundKeys = new Set();
  }

  updateSize(tree) {
    if (!tree || !tree.root) {
      this.svg.setAttribute('viewBox', '0 0 1200 600');
      this.svg.setAttribute('width', '100%');
      this.svg.setAttribute('height', '600');
      return;
    }

    const levels = this._calculateLevels(tree.root);
    // Calculate actual tree width by traversing the tree
    const treeWidth = this._calculateTreeWidth(tree.root);
    const width = Math.max(1200, Math.min(treeWidth * 1.2, 3000)); // Cap at 3000 to prevent too large
    const height = Math.max(600, levels * this.verticalSpacing + 150);
    
    this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    this.svg.setAttribute('width', '100%');
    this.svg.setAttribute('height', height.toString());
  }
  
  _calculateTreeWidth(node) {
    if (!node) return 0;
    if (node.isLeaf) {
      return this.nodeWidth + 40;
    }
    
    let totalWidth = 0;
    for (const child of node.children) {
      totalWidth += this._calculateTreeWidth(child);
    }
    return Math.max(this.nodeWidth + 40, totalWidth + (node.children.length - 1) * this.horizontalSpacing);
  }

  _calculateLevels(node) {
    if (!node) return 0;
    if (node.isLeaf) return 1;
    
    let maxChildLevel = 0;
    for (const child of node.children) {
      maxChildLevel = Math.max(maxChildLevel, this._calculateLevels(child));
    }
    return 1 + maxChildLevel;
  }

  draw(tree) {
    this.svg.innerHTML = '';
    if (!tree || !tree.root) {
      return;
    }

    // Get the actual viewBox dimensions
    const viewBox = this.svg.getAttribute('viewBox');
    const [, , viewWidth, viewHeight] = viewBox ? viewBox.split(' ').map(Number) : [0, 0, 1200, 600];
    
    const startY = 80;
    const centerX = viewWidth / 2;

    this._drawNode(tree.root, centerX, startY, null, 0, null);
  }

  _calculateLevelWidths(node, totalLevels) {
    const widths = [];
    
    const calculateWidth = (n, level) => {
      if (!n) return 0;
      if (n.isLeaf) {
        return this.nodeWidth + 20;
      }
      
      let width = 0;
      for (const child of n.children) {
        width += calculateWidth(child, level + 1);
      }
      return Math.max(this.nodeWidth + 20, width);
    };

    const getLevelNodes = (n, targetLevel, currentLevel = 0) => {
      if (currentLevel === targetLevel) {
        return [n];
      }
      if (n.isLeaf) return [];
      
      const nodes = [];
      for (const child of n.children) {
        nodes.push(...getLevelNodes(child, targetLevel, currentLevel + 1));
      }
      return nodes;
    };

    for (let level = 0; level < totalLevels; level++) {
      const levelNodes = getLevelNodes(node, level);
      let levelWidth = 0;
      levelNodes.forEach(n => {
        levelWidth += this.nodeWidth + this.horizontalSpacing;
      });
      widths.push(Math.max(400, levelWidth));
    }

    return widths;
  }

  _drawNode(node, x, y, levelWidths, level, parentX) {
    if (!node) return;

    // Draw connection to parent
    if (parentX !== null) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', parentX);
      line.setAttribute('y1', y - this.verticalSpacing + this.nodeHeight / 2);
      line.setAttribute('x2', x);
      line.setAttribute('y2', y - this.nodeHeight / 2);
      line.setAttribute('stroke', '#c7d2fe');
      line.setAttribute('stroke-width', '2');
      line.setAttribute('class', 'b-tree-link');
      this.svg.appendChild(line);
    }

    // Adjust node width based on number of keys
    const nodeWidth = Math.max(this.nodeWidth, node.keys.length * 30 + 20);

    // Draw node rectangle
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x - nodeWidth / 2);
    rect.setAttribute('y', y - this.nodeHeight / 2);
    rect.setAttribute('width', nodeWidth);
    rect.setAttribute('height', this.nodeHeight);
    rect.setAttribute('rx', '8');
    
    let fillColor = '#fff';
    let strokeColor = '#4c1d95';
    
    if (this.highlightedKeys.size > 0 && node.keys.some(k => this.highlightedKeys.has(k))) {
      fillColor = '#ffc107';
      strokeColor = '#ff9800';
    } else if (this.foundKeys.size > 0 && node.keys.some(k => this.foundKeys.has(k))) {
      fillColor = '#17a2b8';
      strokeColor = '#138496';
    } else {
      fillColor = '#fff';
      strokeColor = '#4c1d95';
    }
    
    rect.setAttribute('fill', fillColor);
    rect.setAttribute('stroke', strokeColor);
    rect.setAttribute('stroke-width', '2');
    rect.setAttribute('class', 'b-tree-node');
    this.svg.appendChild(rect);

    // Draw keys
    const keySpacing = nodeWidth / (node.keys.length + 1);
    node.keys.forEach((key, index) => {
      const keyX = x - nodeWidth / 2 + keySpacing * (index + 1);
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', keyX);
      text.setAttribute('y', y + 5);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', '#1d2939');
      text.setAttribute('font-size', '14');
      text.setAttribute('font-weight', '600');
      text.textContent = key;
      text.setAttribute('class', 'b-tree-text');
      this.svg.appendChild(text);
    });

    // Draw children
    if (!node.isLeaf && node.children.length > 0) {
      // Calculate positions for children
      const childPositions = this._calculateChildPositions(node, x);
      
      node.children.forEach((child, index) => {
        if (child) {
          this._drawNode(child, childPositions[index], y + this.verticalSpacing, levelWidths, level + 1, x);
        }
      });
    }
  }

  _calculateChildPositions(node, parentX) {
    const childCount = node.children.length;
    if (childCount === 0) return [];
    
    // Calculate the width needed for all children
    let totalChildWidth = 0;
    const childWidths = [];
    for (const child of node.children) {
      const width = this._getSubtreeWidth(child);
      childWidths.push(width);
      totalChildWidth += width;
    }
    
    // Add spacing between children
    const totalSpacing = (childCount - 1) * this.horizontalSpacing;
    const totalNeeded = totalChildWidth + totalSpacing;
    
    // Start from the leftmost position
    const startX = parentX - totalNeeded / 2;
    
    const positions = [];
    let currentX = startX;
    for (let i = 0; i < childCount; i++) {
      // Position child at the center of its subtree
      positions.push(currentX + childWidths[i] / 2);
      currentX += childWidths[i] + this.horizontalSpacing;
    }
    
    return positions;
  }
  
  _getSubtreeWidth(node) {
    if (!node) return this.nodeWidth + 40;
    if (node.isLeaf) {
      const nodeWidth = Math.max(this.nodeWidth, node.keys.length * 30 + 20);
      return nodeWidth + 40;
    }
    
    let totalWidth = 0;
    for (const child of node.children) {
      totalWidth += this._getSubtreeWidth(child);
    }
    const spacing = (node.children.length - 1) * this.horizontalSpacing;
    const nodeWidth = Math.max(this.nodeWidth, node.keys.length * 30 + 20);
    return Math.max(nodeWidth + 40, totalWidth + spacing);
  }

  highlightKey(key) {
    this.highlightedKeys.add(key);
    this.foundKeys.delete(key);
  }

  highlightFound(key) {
    this.foundKeys.add(key);
    this.highlightedKeys.delete(key);
  }

  clearHighlights() {
    this.highlightedKeys.clear();
    this.foundKeys.clear();
  }
}

