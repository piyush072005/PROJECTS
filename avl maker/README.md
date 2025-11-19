# AVL Tree Visualizer

A beautiful, interactive web application for visualizing AVL (Adelson-Velsky and Landis) trees with full support for all operations and rotations.

## Features

- **Insert**: Add nodes one by one to the tree
- **Delete**: Remove nodes from the tree
- **Find**: Search for nodes in the tree
- **Replace**: Replace an existing node with a new value
- **Undo**: Go back to previous state if you made a mistake
- **Visualization**: Beautiful SVG-based tree visualization showing:
  - Node values
  - Node heights
  - Balance factors
  - All 4 rotation types (Left, Right, Left-Right, Right-Left)

## How to Use

1. Open `index.html` in a web browser
2. Enter a number in the input field
3. Click the desired operation button:
   - **Insert**: Adds the number to the tree
   - **Delete**: Removes the number from the tree
   - **Find**: Highlights the number if found
   - **Replace**: First enter the value to replace, then enter the new value
4. Use **Undo** to revert the last operation
5. Use **Clear** to remove all nodes from the tree

## AVL Tree Rotations

The application automatically performs rotations to maintain AVL tree balance:

- **Right Rotation**: For Left-Left imbalance
- **Left Rotation**: For Right-Right imbalance
- **Left-Right Rotation**: For Left-Right imbalance
- **Right-Left Rotation**: For Right-Left imbalance

All rotations are displayed in the operation history.

## Files

- `index.html` - Main HTML structure
- `styles.css` - Styling and layout
- `avl-tree.js` - AVL tree implementation with all rotations
- `visualizer.js` - Tree visualization using SVG
- `app.js` - Application logic and event handlers

## Browser Compatibility

Works in all modern browsers that support SVG and ES6 JavaScript features.

