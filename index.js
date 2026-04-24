const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/bfhl", (req, res) => {
  const data = req.body.data || [];

  const invalid_entries = [];
  const duplicate_edges = [];
  const seen = new Set();

  const childParent = {};
  const graph = {};
  const allNodes = new Set();
  const childNodes = new Set();

  // 🔹 Step 1: Validate + Duplicates + Multi-parent
  for (let raw of data) {
    let entry = raw.trim();

    if (!/^[A-Z]->[A-Z]$/.test(entry)) {
      invalid_entries.push(raw);
      continue;
    }

    const [parent, child] = entry.split("->");

    if (parent === child) {
      invalid_entries.push(raw);
      continue;
    }

    if (seen.has(entry)) {
      if (!duplicate_edges.includes(entry)) {
        duplicate_edges.push(entry);
      }
      continue;
    }
    seen.add(entry);

    if (childParent[child]) continue;
    childParent[child] = parent;

    if (!graph[parent]) graph[parent] = [];
    graph[parent].push(child);

    allNodes.add(parent);
    allNodes.add(child);
    childNodes.add(child);
  }

  // 🔹 Find roots
  const roots = [...allNodes].filter(n => !childNodes.has(n));

  const visitedGlobal = new Set();
  const hierarchies = [];

  let total_trees = 0;
  let total_cycles = 0;
  let maxDepth = 0;
  let largest_tree_root = "";

  // 🔹 DFS
  function dfs(node, visited, stack) {
    if (stack.has(node)) return { cycle: true };
    if (visited.has(node)) return { tree: {}, depth: 0 };

    visited.add(node);
    stack.add(node);

    let children = graph[node] || [];
    let subtree = {};
    let depth = 1;

    for (let child of children) {
      let res = dfs(child, visited, stack);
      if (res.cycle) return { cycle: true };
      subtree[child] = res.tree;
      depth = Math.max(depth, 1 + res.depth);
    }

    stack.delete(node);
    return { tree: subtree, depth };
  }

  // 🔹 Process each root
  for (let root of roots) {
    let visited = new Set();
    let stack = new Set();

    let res = dfs(root, visited, stack);

    if (res.cycle) {
      total_cycles++;
      hierarchies.push({
        root,
        tree: {},
        has_cycle: true
      });
    } else {
      total_trees++;
      if (
        res.depth > maxDepth ||
        (res.depth === maxDepth && root < largest_tree_root)
      ) {
        maxDepth = res.depth;
        largest_tree_root = root;
      }

      hierarchies.push({
        root,
        tree: { [root]: res.tree },
        depth: res.depth
      });
    }

    visited.forEach(v => visitedGlobal.add(v));
  }

  // 🔹 Handle remaining unvisited nodes (group cycles properly)
const remaining = new Set([...allNodes].filter(n => !visitedGlobal.has(n)));

while (remaining.size > 0) {
  const start = [...remaining][0];

  let visited = new Set();
  let stack = new Set();

  let res = dfs(start, visited, stack);

  visited.forEach(v => {
    visitedGlobal.add(v);
    remaining.delete(v);
  });

  total_cycles++;

  hierarchies.push({
    root: start,
    tree: {},
    has_cycle: true
  });
}

  res.json({
    user_id: "Divyashree_15072006",
    email_id: "gm8043@srmist.edu.in",
    college_roll_number: "RA2311008020016",
    hierarchies,
    invalid_entries,
    duplicate_edges,
    summary: {
      total_trees,
      total_cycles,
      largest_tree_root
    }
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});