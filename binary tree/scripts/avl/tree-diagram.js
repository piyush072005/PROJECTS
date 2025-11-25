class TreeDiagramGenerator {
  constructor() {
    this.nodeRadius = 20;
    this.horizontalSpacing = 50;
    this.verticalSpacing = 60;
  }

  generateDiagram(treeData, highlightedNodes = [], title = '') {
    if (!treeData) {
      return this.generateEmptyDiagram(title);
    }

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'tree-diagram');

    const levels = this._calculateLevels(treeData);
    const maxWidth = Math.pow(2, levels) * this.horizontalSpacing;
    const height = levels * this.verticalSpacing + 80;

    svg.setAttribute('viewBox', `0 0 ${maxWidth} ${height}`);
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', 'auto');

    if (title) {
      const titleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      titleText.setAttribute('x', maxWidth / 2);
      titleText.setAttribute('y', 20);
      titleText.setAttribute('text-anchor', 'middle');
      titleText.setAttribute('font-size', '14');
      titleText.setAttribute('font-weight', 'bold');
      titleText.setAttribute('fill', '#667eea');
      titleText.textContent = title;
      svg.appendChild(titleText);
    }

    const startX = maxWidth / 2;
    const startY = title ? 50 : 30;
    this._drawNode(svg, treeData, startX, startY, maxWidth, 0, null, null, highlightedNodes);

    return svg;
  }

  generateEmptyDiagram(title = '') {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'tree-diagram');
    svg.setAttribute('viewBox', '0 0 200 100');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', 'auto');

    if (title) {
      const titleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      titleText.setAttribute('x', 100);
      titleText.setAttribute('y', 30);
      titleText.setAttribute('text-anchor', 'middle');
      titleText.setAttribute('font-size', '14');
      titleText.setAttribute('font-weight', 'bold');
      titleText.setAttribute('fill', '#667eea');
      titleText.textContent = title;
      svg.appendChild(titleText);
    }

    const emptyText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    emptyText.setAttribute('x', 100);
    emptyText.setAttribute('y', 60);
    emptyText.setAttribute('text-anchor', 'middle');
    emptyText.setAttribute('font-size', '12');
    emptyText.setAttribute('fill', '#999');
    emptyText.textContent = 'Empty Tree';
    svg.appendChild(emptyText);

    return svg;
  }

  _calculateLevels(node) {
    if (!node) return 0;
    return (
      1 + Math.max(this._calculateLevels(node.left), this._calculateLevels(node.right))
    );
  }

  _drawNode(svg, node, x, y, width, level, parentX, parentY, highlightedNodes) {
    if (!node) return;

    const isHighlighted = highlightedNodes.includes(node.value);

    if (parentX !== null && parentY !== null) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', parentX);
      line.setAttribute('y1', parentY + this.nodeRadius);
      line.setAttribute('x2', x);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', isHighlighted ? '#ffc107' : '#666');
      line.setAttribute('stroke-width', isHighlighted ? '3' : '2');
      svg.appendChild(line);
    }

    const fillColor = isHighlighted ? '#ffc107' : '#667eea';
    const strokeColor = isHighlighted ? '#ff9800' : '#5568d3';
    const strokeWidth = isHighlighted ? '3' : '2';

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', this.nodeRadius);
    circle.setAttribute('fill', fillColor);
    circle.setAttribute('stroke', strokeColor);
    circle.setAttribute('stroke-width', strokeWidth);
    svg.appendChild(circle);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', x);
    text.setAttribute('y', y + 4);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', 'white');
    text.setAttribute('font-size', '12');
    text.setAttribute('font-weight', 'bold');
    text.textContent = node.value;
    svg.appendChild(text);

    const childWidth = width / 2;
    const nextY = y + this.verticalSpacing;

    if (node.left) {
      const leftX = x - childWidth / 2;
      this._drawNode(svg, node.left, leftX, nextY, childWidth, level + 1, x, y, highlightedNodes);
    }

    if (node.right) {
      const rightX = x + childWidth / 2;
      this._drawNode(svg, node.right, rightX, nextY, childWidth, level + 1, x, y, highlightedNodes);
    }
  }

  generateBeforeAfterDiagrams(beforeState, afterState, rotationType, operationValue) {
    const container = document.createElement('div');
    container.className = 'before-after-container';

    const beforeTree = beforeState ? JSON.parse(beforeState) : null;
    const afterTree = afterState ? JSON.parse(afterState) : null;

    const highlightedNodes = this._getRotationNodes(
      beforeTree,
      afterTree,
      rotationType,
      operationValue
    );

    const beforeContainer = document.createElement('div');
    beforeContainer.className = 'diagram-container before-diagram';
    const beforeDiagram = this.generateDiagram(
      beforeTree,
      highlightedNodes.before,
      'Before Rotation'
    );
    beforeContainer.appendChild(beforeDiagram);
    container.appendChild(beforeContainer);

    const arrow = document.createElement('div');
    arrow.className = 'rotation-arrow';
    arrow.innerHTML = '→';
    container.appendChild(arrow);

    const afterContainer = document.createElement('div');
    afterContainer.className = 'diagram-container after-diagram';
    const afterDiagram = this.generateDiagram(
      afterTree,
      highlightedNodes.after,
      'After Rotation'
    );
    afterContainer.appendChild(afterDiagram);
    container.appendChild(afterContainer);

    return container;
  }

  _getRotationNodes(beforeTree, afterTree, rotationType, operationValue) {
    const beforeNodes = [];
    const afterNodes = [];

    if (!beforeTree || !afterTree) {
      return { before: beforeNodes, after: afterNodes };
    }

    if (operationValue !== undefined) {
      beforeNodes.push(operationValue);
      afterNodes.push(operationValue);
    }

    const findChangedNodes = (before, after, nodes) => {
      if (!before || !after) return;

      if (before.value === after.value) {
        const beforeLeft = before.left ? before.left.value : null;
        const afterLeft = after.left ? after.left.value : null;
        const beforeRight = before.right ? before.right.value : null;
        const afterRight = after.right ? after.right.value : null;

        if (beforeLeft !== afterLeft || beforeRight !== afterRight) {
          nodes.push(before.value);
          if (beforeLeft && afterLeft) nodes.push(beforeLeft);
          if (beforeRight && afterRight) nodes.push(beforeRight);
        }
      }

      if (before.left && after.left) {
        findChangedNodes(before.left, after.left, nodes);
      }
      if (before.right && after.right) {
        findChangedNodes(before.right, after.right, nodes);
      }
    };

    findChangedNodes(beforeTree, afterTree, beforeNodes);
    findChangedNodes(beforeTree, afterTree, afterNodes);

    return {
      before: [...new Set(beforeNodes)],
      after: [...new Set(afterNodes)],
    };
  }

  generateFullTreeComparison(beforeState, afterState) {
    const container = document.createElement('div');
    container.className = 'full-tree-comparison';

    const beforeTree = beforeState ? JSON.parse(beforeState) : null;
    const afterTree = afterState ? JSON.parse(afterState) : null;

    const beforeSection = document.createElement('div');
    beforeSection.className = 'tree-section';
    const beforeTitle = document.createElement('h4');
    beforeTitle.textContent = 'Tree Before Operation';
    beforeTitle.className = 'tree-section-title';
    beforeSection.appendChild(beforeTitle);
    const beforeDiagram = this.generateDiagram(beforeTree, [], '');
    beforeSection.appendChild(beforeDiagram);
    container.appendChild(beforeSection);

    const afterSection = document.createElement('div');
    afterSection.className = 'tree-section';
    const afterTitle = document.createElement('h4');
    afterTitle.textContent = 'Tree After Operation';
    afterTitle.className = 'tree-section-title';
    afterSection.appendChild(afterTitle);
    const afterDiagram = this.generateDiagram(afterTree, [], '');
    afterSection.appendChild(afterDiagram);
    container.appendChild(afterSection);

    return container;
  }
}

