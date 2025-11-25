class TreeVisualizer {
  constructor(svgElement) {
    this.svg = svgElement;
    this.nodeRadius = 25;
    this.horizontalSpacing = 80;
    this.verticalSpacing = 80;
    this.highlightedNode = null;
    this.foundNode = null;
  }

  draw(tree) {
    this.svg.innerHTML = '';
    if (!tree || !tree.root) {
      return;
    }
    const treeStructure = tree.getTreeStructure();
    const levels = this._calculateLevels(treeStructure);
    const maxWidth = Math.pow(2, levels) * this.horizontalSpacing;
    const startX = maxWidth / 2;
    const startY = 50;

    this._drawNode(treeStructure, startX, startY, maxWidth, 0, null, null);
  }

  _calculateLevels(node) {
    if (!node) return 0;
    return (
      1 + Math.max(this._calculateLevels(node.left), this._calculateLevels(node.right))
    );
  }

  _drawNode(node, x, y, width, level, parentX, parentY) {
    if (!node) return;

    if (parentX !== null && parentY !== null) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', parentX);
      line.setAttribute('y1', parentY + this.nodeRadius);
      line.setAttribute('x2', x);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', '#666');
      line.setAttribute('stroke-width', '2');
      this.svg.appendChild(line);
    }

    let fillColor = '#667eea';
    let strokeColor = '#5568d3';
    let strokeWidth = '2';

    if (this.highlightedNode === node.value) {
      fillColor = '#ffc107';
      strokeColor = '#ff9800';
      strokeWidth = '3';
    }

    if (this.foundNode === node.value) {
      fillColor = '#17a2b8';
      strokeColor = '#138496';
      strokeWidth = '3';
    }

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', this.nodeRadius);
    circle.setAttribute('fill', fillColor);
    circle.setAttribute('stroke', strokeColor);
    circle.setAttribute('stroke-width', strokeWidth);
    circle.setAttribute('class', this.foundNode === node.value ? 'node found' : 'node');
    this.svg.appendChild(circle);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', x);
    text.setAttribute('y', y + 5);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', 'white');
    text.setAttribute('font-size', '16');
    text.setAttribute('font-weight', 'bold');
    text.textContent = node.value;
    this.svg.appendChild(text);

    const heightText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    heightText.setAttribute('x', x);
    heightText.setAttribute('y', y + this.nodeRadius + 15);
    heightText.setAttribute('text-anchor', 'middle');
    heightText.setAttribute('fill', '#666');
    heightText.setAttribute('font-size', '12');
    heightText.textContent = `h:${node.height}`;
    this.svg.appendChild(heightText);

    const childWidth = width / 2;
    const nextY = y + this.verticalSpacing;

    if (node.left) {
      const leftX = x - childWidth / 2;
      this._drawNode(node.left, leftX, nextY, childWidth, level + 1, x, y);
    }

    if (node.right) {
      const rightX = x + childWidth / 2;
      this._drawNode(node.right, rightX, nextY, childWidth, level + 1, x, y);
    }
  }

  highlightNode(value) {
    this.highlightedNode = value;
  }

  clearHighlight() {
    this.highlightedNode = null;
  }

  highlightFound(value) {
    this.foundNode = value;
    setTimeout(() => {
      this.foundNode = null;
    }, 2000);
  }

  clearFound() {
    this.foundNode = null;
  }

  updateSize(tree) {
    if (!tree || !tree.root) {
      this.svg.setAttribute('viewBox', '0 0 800 600');
      return;
    }

    const treeStructure = tree.getTreeStructure();
    const levels = this._calculateLevels(treeStructure);
    const maxWidth = Math.pow(2, levels) * this.horizontalSpacing;
    const height = levels * this.verticalSpacing + 100;

    this.svg.setAttribute('viewBox', `0 0 ${maxWidth} ${height}`);
  }
}

