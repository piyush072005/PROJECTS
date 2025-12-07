// Graph Algorithms Visualizer
// Supports: Prim's, Kruskal's, Dijkstra's, Floyd-Warshall

function parseGraphInput(input) {
  const lines = input.trim().split('\n').filter(line => line.trim());
  const edges = [];
  const nodes = new Set();
  
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 2) continue;
    
    const from = parts[0];
    const to = parts[1];
    const weight = parts.length >= 3 ? parseFloat(parts[2]) : 1;
    
    if (isNaN(weight)) continue;
    
    nodes.add(from);
    nodes.add(to);
    edges.push({ from, to, weight });
  }
  
  return { nodes: Array.from(nodes), edges };
}

function parseAdjacencyMatrix(input, nodeCount) {
  const lines = input.trim().split('\n').filter(line => line.trim());
  const matrix = [];
  const nodes = Array.from({ length: nodeCount }, (_, i) => String.fromCharCode(65 + i));
  
  for (let i = 0; i < nodeCount; i++) {
    const row = lines[i] ? lines[i].trim().split(/\s+/).map(x => {
      const lower = x.toLowerCase().trim();
      if (lower === 'inf' || lower === '∞' || lower === 'infinity') {
        return Infinity;
      }
      const val = parseFloat(x);
      return isNaN(val) ? Infinity : val;
    }) : [];
    while (row.length < nodeCount) row.push(Infinity);
    matrix.push(row);
  }
  
  return { nodes, matrix };
}

function showGraphStatus(message, isError) {
  const statusBox = document.getElementById('graph-status');
  if (!statusBox) return;
  statusBox.textContent = message;
  statusBox.classList.add('visible');
  statusBox.classList.toggle('error', Boolean(isError));
}

function populateGraphSteps(steps) {
  const container = document.getElementById('graph-steps');
  if (!container) return;
  container.innerHTML = '';
  if (!steps.length) {
    container.innerHTML = '<li class="placeholder">No steps recorded.</li>';
    return;
  }
  steps.forEach((step) => {
    const li = document.createElement('li');
    li.textContent = step;
    container.appendChild(li);
  });
}

// Prim's Algorithm - Minimum Spanning Tree
function runPrimsAlgorithm(nodes, edges) {
  const steps = [];
  const mst = [];
  const visited = new Set();
  const allEdges = [...edges];
  
  if (nodes.length === 0) {
    steps.push('No nodes in graph.');
    return { mst, steps, totalWeight: 0 };
  }
  
  // Start with first node
  visited.add(nodes[0]);
  steps.push(`Starting with node ${nodes[0]}.`);
  
  while (visited.size < nodes.length) {
    let minEdge = null;
    let minWeight = Infinity;
    
    // Find minimum edge connecting visited to unvisited
    for (const edge of allEdges) {
      const fromVisited = visited.has(edge.from);
      const toVisited = visited.has(edge.to);
      
      if ((fromVisited && !toVisited) || (!fromVisited && toVisited)) {
        if (edge.weight < minWeight) {
          minWeight = edge.weight;
          minEdge = edge;
        }
      }
    }
    
    if (!minEdge) {
      steps.push('No more edges available. Graph may be disconnected.');
      break;
    }
    
    mst.push(minEdge);
    visited.add(minEdge.from);
    visited.add(minEdge.to);
    steps.push(
      `Add edge ${minEdge.from}-${minEdge.to} (weight ${minEdge.weight}). ` +
      `Visited: ${Array.from(visited).sort().join(', ')}`
    );
  }
  
  const totalWeight = mst.reduce((sum, e) => sum + e.weight, 0);
  steps.push(`MST complete. Total weight: ${totalWeight}`);
  
  return { mst, steps, totalWeight };
}

// Kruskal's Algorithm - Minimum Spanning Tree
function findParent(parent, node) {
  if (parent[node] !== node) {
    parent[node] = findParent(parent, parent[node]);
  }
  return parent[node];
}

function union(parent, rank, x, y) {
  const rootX = findParent(parent, x);
  const rootY = findParent(parent, y);
  
  if (rank[rootX] < rank[rootY]) {
    parent[rootX] = rootY;
  } else if (rank[rootX] > rank[rootY]) {
    parent[rootY] = rootX;
  } else {
    parent[rootY] = rootX;
    rank[rootX]++;
  }
}

function runKruskalsAlgorithm(nodes, edges) {
  const steps = [];
  const mst = [];
  const sortedEdges = [...edges].sort((a, b) => a.weight - b.weight);
  const parent = {};
  const rank = {};
  
  // Initialize Union-Find
  for (const node of nodes) {
    parent[node] = node;
    rank[node] = 0;
  }
  
  steps.push(`Sorted edges by weight: ${sortedEdges.map(e => `${e.from}-${e.to}(${e.weight})`).join(', ')}`);
  
  for (const edge of sortedEdges) {
    const rootFrom = findParent(parent, edge.from);
    const rootTo = findParent(parent, edge.to);
    
    if (rootFrom !== rootTo) {
      mst.push(edge);
      union(parent, rank, rootFrom, rootTo);
      steps.push(
        `Add edge ${edge.from}-${edge.to} (weight ${edge.weight}). ` +
        `No cycle formed.`
      );
    } else {
      steps.push(
        `Skip edge ${edge.from}-${edge.to} (weight ${edge.weight}). ` +
        `Would form cycle.`
      );
    }
    
    if (mst.length === nodes.length - 1) break;
  }
  
  const totalWeight = mst.reduce((sum, e) => sum + e.weight, 0);
  steps.push(`MST complete. Total weight: ${totalWeight}`);
  
  return { mst, steps, totalWeight };
}

// Dijkstra's Algorithm - Shortest Path
function runDijkstrasAlgorithm(nodes, edges, startNode) {
  const steps = [];
  const distances = {};
  const previous = {};
  const unvisited = new Set(nodes);
  
  // Initialize distances
  for (const node of nodes) {
    distances[node] = node === startNode ? 0 : Infinity;
    previous[node] = null;
  }
  
  steps.push(`Initialize distances: ${startNode} = 0, others = ∞`);
  
  // Build adjacency list
  const graph = {};
  for (const node of nodes) {
    graph[node] = [];
  }
  for (const edge of edges) {
    graph[edge.from].push({ to: edge.to, weight: edge.weight });
    graph[edge.to].push({ to: edge.from, weight: edge.weight });
  }
  
  while (unvisited.size > 0) {
    // Find unvisited node with minimum distance
    let currentNode = null;
    let minDist = Infinity;
    
    for (const node of unvisited) {
      if (distances[node] < minDist) {
        minDist = distances[node];
        currentNode = node;
      }
    }
    
    if (!currentNode || minDist === Infinity) break;
    
    unvisited.delete(currentNode);
    steps.push(`Visit node ${currentNode} (distance: ${distances[currentNode]})`);
    
    // Update neighbors
    for (const neighbor of graph[currentNode] || []) {
      if (!unvisited.has(neighbor.to)) continue;
      
      const alt = distances[currentNode] + neighbor.weight;
      if (alt < distances[neighbor.to]) {
        distances[neighbor.to] = alt;
        previous[neighbor.to] = currentNode;
        steps.push(
          `  Update ${neighbor.to}: ${distances[neighbor.to]} ` +
          `(via ${currentNode})`
        );
      }
    }
  }
  
  // Build paths
  const paths = {};
  for (const node of nodes) {
    const path = [];
    let current = node;
    while (current !== null) {
      path.unshift(current);
      current = previous[current];
    }
    paths[node] = {
      distance: distances[node],
      path: distances[node] === Infinity ? null : path
    };
  }
  
  steps.push('Shortest paths computed.');
  
  return { distances, paths, steps };
}

// Floyd-Warshall Algorithm - All Pairs Shortest Path
function runFloydWarshall(nodes, matrix) {
  const steps = [];
  const n = nodes.length;
  const dist = matrix.map(row => [...row]);
  const next = [];
  
  // Initialize next matrix
  for (let i = 0; i < n; i++) {
    next[i] = [];
    for (let j = 0; j < n; j++) {
      next[i][j] = dist[i][j] !== Infinity ? j : null;
    }
  }
  
  steps.push('Initial distance matrix:');
  steps.push(formatMatrix(dist, nodes));
  
  // Floyd-Warshall main loop
  for (let k = 0; k < n; k++) {
    steps.push(`\nIteration k=${k} (via ${nodes[k]}):`);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (dist[i][k] !== Infinity && dist[k][j] !== Infinity) {
          const newDist = dist[i][k] + dist[k][j];
          if (newDist < dist[i][j]) {
            steps.push(
              `  Update dist[${nodes[i]}][${nodes[j]}]: ` +
              `${dist[i][j]} → ${newDist} (via ${nodes[k]})`
            );
            dist[i][j] = newDist;
            next[i][j] = next[i][k];
          }
        }
      }
    }
  }
  
  steps.push('\nFinal distance matrix:');
  steps.push(formatMatrix(dist, nodes));
  
  return { dist, next, steps };
}

function formatMatrix(matrix, nodes) {
  const n = nodes.length;
  let result = '    ' + nodes.map(n => n.padEnd(6)).join('') + '\n';
  for (let i = 0; i < n; i++) {
    result += nodes[i] + '  ';
    for (let j = 0; j < n; j++) {
      const val = matrix[i][j];
      result += (val === Infinity ? '∞' : val.toString()).padEnd(6);
    }
    result += '\n';
  }
  return result;
}

function getPathFloydWarshall(next, start, end, nodes) {
  if (next[start][end] === null) return null;
  
  const path = [nodes[start]];
  let current = start;
  
  while (current !== end) {
    current = next[current][end];
    path.push(nodes[current]);
  }
  
  return path;
}

// Export functions for use in HTML pages
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseGraphInput,
    parseAdjacencyMatrix,
    showGraphStatus,
    populateGraphSteps,
    runPrimsAlgorithm,
    runKruskalsAlgorithm,
    runDijkstrasAlgorithm,
    runFloydWarshall,
    getPathFloydWarshall,
    formatMatrix
  };
}

